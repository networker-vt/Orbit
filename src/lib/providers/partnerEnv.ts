/** Partner credentials — Vite env only, never hardcoded secrets. */

function env(key: string): string | undefined {
  const v = import.meta.env[key as keyof ImportMetaEnv]
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t.length ? t : undefined
}

export function bookingAffiliateId(): string | undefined {
  return env('VITE_BOOKING_AID')
}

export function skyscannerMediaPartnerId(): string | undefined {
  return env('VITE_SKYSCANNER_MEDIA_PARTNER_ID')
}

export function dbTimetableApiUrl(): string | undefined {
  return env('VITE_DB_TIMETABLE_API_URL')
}

export function dbTimetableApiKey(): string | undefined {
  return env('VITE_DB_TIMETABLE_API_KEY')
}

export function jobFeedUrl(): string | undefined {
  return env('VITE_JOB_FEED_URL')
}

export function jobFeedApiKey(): string | undefined {
  return env('VITE_JOB_FEED_API_KEY')
}

export function adzunaAppId(): string | undefined {
  return env('VITE_ADZUNA_APP_ID')
}

export function adzunaAppKey(): string | undefined {
  return env('VITE_ADZUNA_APP_KEY')
}

export function ebayCampaignId(): string | undefined {
  return env('VITE_EBAY_CAMPAIGN_ID')
}

/** Show labeled demo prices in Abflug (off by default). */
export function travelDemoCatalogEnabled(): boolean {
  return env('VITE_TRAVEL_DEMO_CATALOG') === '1'
}

/** Open-data HAFAS proxy (transport.rest). Default on; set `VITE_TRANSPORT_REST=0` to disable. */
export function transportRestEnabled(): boolean {
  return env('VITE_TRANSPORT_REST') !== '0'
}

export function transportRestBaseUrl(): string {
  return env('VITE_TRANSPORT_REST_BASE') || 'https://v6.db.transport.rest'
}
