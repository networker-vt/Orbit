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
  readonly VITE_BOOKING_AID?: string
  readonly VITE_SKYSCANNER_MEDIA_PARTNER_ID?: string
  readonly VITE_DB_TIMETABLE_API_URL?: string
  readonly VITE_DB_TIMETABLE_API_KEY?: string
  readonly VITE_TRANSPORT_REST?: string
  readonly VITE_TRANSPORT_REST_BASE?: string
  readonly VITE_TRAVEL_DEMO_CATALOG?: string
  readonly VITE_JOB_FEED_URL?: string
  readonly VITE_JOB_FEED_API_KEY?: string
  readonly VITE_ADZUNA_APP_ID?: string
  readonly VITE_ADZUNA_APP_KEY?: string
  readonly VITE_EBAY_CAMPAIGN_ID?: string
  /** LibreTranslate-compatible base URL (e.g. https://libretranslate.com) */
  readonly VITE_TRANSLATE_URL?: string
  readonly VITE_TRANSLATE_API_KEY?: string
  /** DeepL API key (optional; `:fx` suffix uses free endpoint) */
  readonly VITE_TRANSLATE_DEEPL_KEY?: string
  /** libretranslate | mymemory | deepl | auto | none */
  readonly VITE_TRANSLATE_PROVIDER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
