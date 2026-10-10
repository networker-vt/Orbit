import { Capacitor } from '@capacitor/core'

/**
 * Open partner booking / listing URLs in the system browser on native, new tab on web.
 */
export async function openPartnerUrl(href: string): Promise<void> {
  const url = href.trim()
  if (!url.startsWith('https://')) return
  if (Capacitor.isNativePlatform()) {
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url })
      return
    } catch {
      /* plugin missing — fall through */
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
