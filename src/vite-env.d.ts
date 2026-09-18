/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** owner/repo that the in-app "Report a problem" fallback link points at. */
  readonly VITE_GITHUB_REPO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Injected by vite.config.ts from package.json and the CI commit. */
declare const __APP_VERSION__: string;
declare const __BUILD_SHA__: string;
