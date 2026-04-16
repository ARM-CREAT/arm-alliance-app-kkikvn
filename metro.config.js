// @refresh reset
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

// IMPORTANT: Do NOT enable unstable_enablePackageExports.
// When enabled, packages like better-auth resolve their Node.js-only
// "exports" entry points on web, crashing the bundle at eval time.
// config.resolver.unstable_enablePackageExports = true;  // <-- REMOVED

// Web platform: stub out Node.js built-ins that don't exist in the browser.
// Use a Proxy so ANY unknown built-in is also stubbed automatically.
const emptyModule = path.join(__dirname, 'lib', 'empty-module.js');

config.resolver.extraNodeModules = new Proxy(
  {
    // Explicit stubs for known Node.js built-ins
    crypto: emptyModule,
    stream: emptyModule,
    buffer: emptyModule,
    http: emptyModule,
    https: emptyModule,
    net: emptyModule,
    tls: emptyModule,
    fs: emptyModule,
    path: emptyModule,
    os: emptyModule,
    zlib: emptyModule,
    events: emptyModule,
    util: emptyModule,
    url: emptyModule,
    querystring: emptyModule,
    assert: emptyModule,
    constants: emptyModule,
    domain: emptyModule,
    dns: emptyModule,
    dgram: emptyModule,
    child_process: emptyModule,
    cluster: emptyModule,
    module: emptyModule,
    readline: emptyModule,
    repl: emptyModule,
    string_decoder: emptyModule,
    timers: emptyModule,
    tty: emptyModule,
    vm: emptyModule,
    worker_threads: emptyModule,
    perf_hooks: emptyModule,
    async_hooks: emptyModule,
    inspector: emptyModule,
    v8: emptyModule,
  },
  {
    // Catch-all: any unknown built-in also resolves to the empty stub
    get: (target, name) => {
      if (name in target) return target[name];
      return emptyModule;
    },
  }
);

// Block better-auth and @better-auth/* from being bundled — they are ESM-only
// Node.js packages that crash Metro. Our lib/auth.ts and lib/auth.native.ts
// replace them with plain fetch calls, so these packages are never needed at runtime.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'better-auth' ||
    moduleName.startsWith('better-auth/') ||
    moduleName === '@better-auth/expo' ||
    moduleName.startsWith('@better-auth/')
  ) {
    return { type: 'empty' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

module.exports = config;
