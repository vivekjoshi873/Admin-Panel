/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** When "true", browser calls the API host directly instead of same-origin `/api` proxy. */
  readonly VITE_API_DIRECT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
