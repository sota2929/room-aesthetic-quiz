/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PINTEREST_TAG_ID?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
