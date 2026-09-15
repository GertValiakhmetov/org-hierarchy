/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `false` removes the debug panel from the UI. Enabled by default. */
  readonly VITE_DEBUG_PANEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
