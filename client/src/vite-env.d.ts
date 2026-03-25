/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional API origin when frontend is hosted separately (e.g. Vercel + Render). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
