/**
 * Web-safe stub for better-auth/client, better-auth/react, @better-auth/expo,
 * and the top-level better-auth package.
 *
 * All exports are no-ops so the web bundler never evaluates the real package
 * (which pulls in Node.js crypto/fs and crashes the web module graph).
 */

const noopClient = {
  getSession: async () => ({ data: null, error: null }),
  signIn: {
    email: async () => ({ data: null, error: null }),
    social: async () => ({ data: null, error: null }),
  },
  signOut: async () => ({ data: null, error: null }),
  signUp: {
    email: async () => ({ data: null, error: null }),
  },
  useSession: () => ({ data: null, isPending: false, error: null }),
  $fetch: async () => ({ data: null, error: null }),
  $store: { subscribe: () => () => {}, get: () => null },
};

function createAuthClient() {
  return noopClient;
}

const expoClient = () => ({});
const inferAdditionalFields = () => ({});
const emailClient = () => ({});
const passkeyClient = () => ({});
const twoFactorClient = () => ({});

// Named exports used by better-auth server-side (stubbed to prevent crashes)
const auth = { handler: async () => new Response('', { status: 200 }) };

module.exports = noopClient;
module.exports.default = noopClient;
module.exports.createAuthClient = createAuthClient;
module.exports.expoClient = expoClient;
module.exports.inferAdditionalFields = inferAdditionalFields;
module.exports.emailClient = emailClient;
module.exports.passkeyClient = passkeyClient;
module.exports.twoFactorClient = twoFactorClient;
module.exports.auth = auth;
module.exports.betterAuth = () => auth;
