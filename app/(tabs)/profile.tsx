
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const BACKEND_URL = "https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev";
const REGISTER_URL = `${BACKEND_URL}/api/members/register`;

interface FormErrors {
  fullName?: string;
  phone?: string;
}

export default function MembershipScreen() {
  const router = useRouter();

  // Required fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Optional fields
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [commune, setCommune] = useState("");
  const [profession, setProfession] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [errorBanner, setErrorBanner] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!fullName.trim()) newErrors.fullName = "Le nom complet est requis";
    if (!phone.trim()) newErrors.phone = "Le numéro de téléphone est requis";
    else if (phone.trim().length < 8) newErrors.phone = "Le numéro doit contenir au moins 8 caractères";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log("[Profile] Bouton 'Envoyer ma demande' appuyé");
    setErrorBanner("");

    if (!validate()) {
      console.log("[Profile] Validation échouée", errors);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);

    const payload: Record<string, string> = {
      full_name: fullName.trim(),
      phone: phone.trim(),
    };
    if (email.trim()) payload.email = email.trim();
    if (region.trim()) payload.region = region.trim();
    if (commune.trim()) payload.commune = commune.trim();
    if (profession.trim()) payload.profession = profession.trim();

    console.log("[Profile] POST /api/members/register", JSON.stringify(payload));

    try {
      const response = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.log("[Profile] Erreur HTTP", response.status, text);

        if (response.status === 409) {
          setErrorBanner("Un membre avec ce numéro de téléphone existe déjà.");
          return;
        }

        let message = `Erreur ${response.status}. Veuillez réessayer.`;
        try {
          const json = JSON.parse(text);
          message = json.error || json.message || message;
        } catch {
          message = text || message;
        }
        setErrorBanner(message);
        return;
      }

      const data = await response.json();
      const membershipNumber = data.membership_number ?? data.membershipNumber ?? "";
      const returnedName = data.full_name ?? fullName.trim();
      console.log("[Profile] Inscription réussie:", membershipNumber);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      router.push({
        pathname: "/member/success",
        params: {
          membership_number: membershipNumber,
          full_name: returnedName,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Profile] Erreur réseau:", message);
      setErrorBanner("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string, hasError?: boolean) => [
    styles.input,
    focusedField === field && styles.inputFocused,
    hasError && styles.inputError,
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>ARM</Text>
        </View>
        <Text style={styles.title}>Adhésion ARM</Text>
        <Text style={styles.subtitle}>
          Rejoignez l'Alliance pour le Rassemblement Malien
        </Text>
      </View>

      {/* Error Banner */}
      {errorBanner ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.errorBannerText}>{errorBanner}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <Text style={styles.sectionLabel}>Informations requises</Text>

        {/* Nom complet */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Nom complet <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={inputStyle("fullName", !!errors.fullName)}
            value={fullName}
            onChangeText={(t) => {
              setFullName(t);
              if (errors.fullName) setErrors((e) => ({ ...e, fullName: undefined }));
            }}
            placeholder="Prénom et nom de famille"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            editable={!loading}
            onFocus={() => setFocusedField("fullName")}
            onBlur={() => setFocusedField(null)}
          />
          {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
        </View>

        {/* Téléphone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Téléphone <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={inputStyle("phone", !!errors.phone)}
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
            }}
            placeholder="+223 XX XX XX XX"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
            editable={!loading}
            onFocus={() => setFocusedField("phone")}
            onBlur={() => setFocusedField(null)}
          />
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>Informations optionnelles</Text>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={inputStyle("email")}
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* Région */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Région</Text>
          <TextInput
            style={inputStyle("region")}
            value={region}
            onChangeText={setRegion}
            placeholder="Votre région"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            editable={!loading}
            onFocus={() => setFocusedField("region")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* Commune */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Commune</Text>
          <TextInput
            style={inputStyle("commune")}
            value={commune}
            onChangeText={setCommune}
            placeholder="Votre commune"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            editable={!loading}
            onFocus={() => setFocusedField("commune")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* Profession */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Profession</Text>
          <TextInput
            style={inputStyle("profession")}
            value={profession}
            onChangeText={setProfession}
            placeholder="Votre profession"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            editable={!loading}
            onFocus={() => setFocusedField("profession")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10, marginTop: 1 }} />
          <Text style={styles.infoText}>
            Votre numéro d'adhérent sera généré automatiquement après soumission.
          </Text>
        </View>

        <AnimatedPressable
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Inscription en cours...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Adhérer maintenant</Text>
            </>
          )}
        </AnimatedPressable>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingTop: Platform.OS === "android" ? 48 : 0,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
  },
  headerBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerBadgeText: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.danger,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBannerText: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.danger,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: "#FFF5F5",
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    fontWeight: "500",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bottomSpacer: {
    height: 20,
  },
});
