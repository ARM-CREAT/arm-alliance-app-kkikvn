import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { authClient, setBearerToken, clearAuthTokens } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // window is only available on web
    if (typeof window === 'undefined') {
      reject(new Error("OAuth popup not available on this platform."));
      return;
    }
    const popupUrl = `${window.location.origin}/auth-popup?provider=${provider}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      popupUrl,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error("Failed to open popup. Please allow popups."));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success" && event.data?.token) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        resolve(event.data.token);
      } else if (event.data?.type === "oauth-error") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        reject(new Error(event.data.error || "OAuth failed"));
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Authentication cancelled"));
      }
    }, 500);
  });
}

// Wraps a promise with a timeout — rejects after `ms` milliseconds
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Prevent re-entrant calls to fetchUser from setting loading=true again
  const isFetchingRef = React.useRef(false);
  const isMountedRef = React.useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Hard safety net: no matter what, unblock after 3s
    const safetyTimer = setTimeout(() => {
      console.warn("[AuthContext] Safety timer fired — forcing loading=false");
      if (isMountedRef.current) setLoading(false);
    }, 3000);

    initAuth().finally(() => {
      clearTimeout(safetyTimer);
    });

    // Listen for deep links (e.g. from social auth redirects)
    const subscription = Linking.addEventListener("url", (_event) => {
      console.log("Deep link received, refreshing user session");
      setTimeout(() => fetchUserSilent(), 500);
    });

    // POLLING: Refresh session every 5 minutes to keep SecureStore token in sync
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing user session to sync token...");
      fetchUserSilent();
    }, 5 * 60 * 1000);

    return () => {
      isMountedRef.current = false;
      subscription.remove();
      clearInterval(intervalId);
      clearTimeout(safetyTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial auth load — only called once at mount
  const initAuth = async () => {
    console.log("[AuthContext] initAuth started");
    try {
      const session = await withTimeout(authClient.getSession(), 2500);
      if (!isMountedRef.current) return;
      if (session?.data?.user) {
        setUser(session.data.user as User);
        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }
      } else {
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error("[AuthContext] initAuth failed:", error);
      if (isMountedRef.current) setUser(null);
    } finally {
      console.log("[AuthContext] initAuth complete — setting loading=false");
      if (isMountedRef.current) setLoading(false);
    }
  };

  // Silent refresh — never touches loading state (used for polling & deep links)
  const fetchUserSilent = async () => {
    try {
      const session = await withTimeout(authClient.getSession(), 5000);
      if (!isMountedRef.current) return;
      if (session?.data?.user) {
        setUser(session.data.user as User);
        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }
      } else {
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error("Silent session refresh failed:", error);
    }
  };

  const fetchUser = async () => {
    // Guard against re-entrant calls that would flip loading=true again
    if (isFetchingRef.current) {
      console.log("[AuthContext] fetchUser skipped — already in progress");
      return;
    }
    isFetchingRef.current = true;
    console.log("[AuthContext] fetchUser called");

    const safetyTimer = setTimeout(() => {
      console.warn("[AuthContext] fetchUser safety timer — forcing loading=false");
      if (isMountedRef.current) setLoading(false);
      isFetchingRef.current = false;
    }, 3000);

    try {
      setLoading(true);
      const session = await withTimeout(authClient.getSession(), 2500);
      if (!isMountedRef.current) return;
      if (session?.data?.user) {
        setUser(session.data.user as User);
        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }
      } else {
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      if (isMountedRef.current) setUser(null);
    } finally {
      clearTimeout(safetyTimer);
      isFetchingRef.current = false;
      if (isMountedRef.current) setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    console.log("[AuthContext] signInWithEmail called for:", email);
    const result = await authClient.signIn.email({ email, password });
    console.log("[AuthContext] signIn.email result:", JSON.stringify(result));
    if (result?.error) {
      const msg = result.error.message || result.error.code || "Échec de la connexion";
      console.error("[AuthContext] signIn.email error:", msg);
      throw new Error(msg);
    }
    await fetchUser();
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    console.log("[AuthContext] signUpWithEmail called for:", email);
    const result = await authClient.signUp.email({ email, password, name });
    console.log("[AuthContext] signUp.email result:", JSON.stringify(result));
    if (result?.error) {
      const msg = result.error.message || result.error.code || "Échec de la création du compte";
      console.error("[AuthContext] signUp.email error:", msg);
      throw new Error(msg);
    }
    await fetchUser();
  };

  const signInWithSocial = async (provider: "google" | "apple" | "github") => {
    try {
      if (Platform.OS === "web") {
        const token = await openOAuthPopup(provider);
        await setBearerToken(token);
        await fetchUser();
      } else {
        // Native: Use expo-linking to generate a proper deep link
        const callbackURL = Linking.createURL("/admin/dashboard");
        await authClient.signIn.social({
          provider,
          callbackURL,
        });
        // Note: The redirect will reload the app or be handled by deep linking.
        // fetchUser will be called on mount or via event listener if needed.
        // For simple flow, we might need to listen to URL events.
        // But better-auth expo client handles the redirect and session storage?
        // We typically need to wait or rely on fetchUser on next app load.
        // For now, call fetchUser just in case.
        await fetchUser();
      }
    } catch (error) {
      console.error(`${provider} sign in failed:`, error);
      throw error;
    }
  };

  const signInWithGoogle = () => signInWithSocial("google");
  const signInWithApple = () => signInWithSocial("apple");
  const signInWithGitHub = () => signInWithSocial("github");

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error("Sign out failed (API):", error);
    } finally {
       // Always clear local state
       setUser(null);
       await clearAuthTokens();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
