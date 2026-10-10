/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_USE_MOCK?: string
  readonly VITE_APP_URL?: string
  readonly VITE_APP_MODE?: string
  readonly VITE_ORBIT_MODE?: string
  readonly VITE_LLM_API_KEY?: string
  readonly VITE_LLM_URL?: string
  readonly VITE_LLM_MODEL?: string
  /** Comma-separated: duckduckgo, google, bing — query link providers (default duckduckgo). */
  readonly VITE_ORBIT_WEB_SEARCH_PROVIDERS?: string
  /** Extra providers for the primary query (e.g. google,bing). */
  readonly VITE_ORBIT_WEB_SEARCH_ALSO?: string
  readonly VITE_FLAG_CREDITS?: string
  readonly VITE_FLAG_KIDS?: string
  readonly VITE_FLAG_CHANNELS?: string
  readonly VITE_FLAG_IDEAS?: string
  readonly VITE_FLAG_INTEGRATIONS?: string
  readonly VITE_FLAG_KABINE?: string
  readonly VITE_FLAG_CAMPUS?: string
  readonly VITE_FLAG_PHOTO_JOBS?: string
  readonly VITE_FLAG_VERIFY_ID?: string
  readonly VITE_FLAG_ENTDECKER?: string
  readonly VITE_FLAG_INTERVIEW?: string
  readonly VITE_FLAG_PUBLISH_LISTINGS?: string
  /** Sell-by-photo vision endpoint (FormData image). Falls back to demo stub when unset. */
  readonly VITE_VISION_API_URL?: string
  readonly VITE_SELL_VISION_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
