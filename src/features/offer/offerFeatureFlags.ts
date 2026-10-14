/** Offer-scoped flags (mirrors `lib/flags` without cross-feature imports). */

function parseFlagEnv(raw: string | undefined): boolean | null {
  if (raw == null || raw === '') return null
  const value = raw.toString().trim().toLowerCase()
  if (value === '1' || value === 'true' || value === 'on') return true
  if (value === '0' || value === 'false' || value === 'off') return false
  return null
}

/** Browser speech → provider; default off in Beta. */
export function isOfferDictationOn(): boolean {
  const fromEnv = parseFlagEnv(import.meta.env.VITE_FLAG_OFFER_DICTATION)
  if (fromEnv != null) return fromEnv
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    try {
      const stored = localStorage.getItem('orbit_flag_offerDictation')
      if (stored === '1' || stored === 'true') return true
      if (stored === '0' || stored === 'false') return false
    } catch {
      /* ignore */
    }
  }
  return false
}
