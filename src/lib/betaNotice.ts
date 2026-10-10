import { isDemoMode } from './flags'

const PREF_KEY = 'orbit_beta_notice_enabled_v1'
const SESSION_DISMISS = 'orbit_beta_banner_dismissed_session_v1'
const EVT = 'orbit-beta-notice-changed'

/** User wants the beta strip (Einstellungen). Default: on. */
export function isBetaNoticeEnabled(): boolean {
  try {
    const v = localStorage.getItem(PREF_KEY)
    if (v === '0' || v === 'false') return false
    return true
  } catch {
    return true
  }
}

export function setBetaNoticeEnabled(on: boolean) {
  try {
    localStorage.setItem(PREF_KEY, on ? '1' : '0')
    window.dispatchEvent(new CustomEvent(EVT))
  } catch {
    /* ignore */
  }
}

export function subscribeBetaNotice(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function isBetaBannerDismissedThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_DISMISS) === '1'
  } catch {
    return false
  }
}

export function dismissBetaBannerForSession() {
  try {
    sessionStorage.setItem(SESSION_DISMISS, '1')
  } catch {
    /* ignore */
  }
}

/** TestFlight-style strip on demo/pre-release builds. */
export function shouldShowBetaBanner(): boolean {
  if (!isDemoMode()) return false
  if (!isBetaNoticeEnabled()) return false
  if (isBetaBannerDismissedThisSession()) return false
  return true
}

export function __resetBetaNoticeForTests() {
  try {
    localStorage.removeItem(PREF_KEY)
    sessionStorage.removeItem(SESSION_DISMISS)
  } catch {
    /* ignore */
  }
}
