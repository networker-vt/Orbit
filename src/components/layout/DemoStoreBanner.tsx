import { useState } from 'react'
import { Link } from 'react-router-dom'
import { isDemoMode } from '../../lib/flags'
import { useI18n } from '../../lib/i18n'

const DISMISS_KEY = 'orbit_demo_banner_dismissed_v1'

/**
 * Persistent honesty strip for App Review and first-run users.
 * Session-dismissible; only shows in demo mode (default public build).
 */
export function DemoStoreBanner() {
  const { t } = useI18n()
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* private mode */
    }
    setHidden(true)
  }

  // Reserve height so first paint / dismiss does not shove the footer (CLS).
  if (!isDemoMode()) return null

  return (
    <div
      data-demo-store-banner-slot="1"
      className="min-h-[2.75rem] border-b border-transparent"
      aria-hidden={hidden}
    >
      {!hidden ? (
        <div
          role="status"
          data-demo-store-banner="1"
          className="flex items-start gap-2 border-b border-amber-500/35 bg-amber-500/12 px-3 py-2 text-xs text-amber-50 sm:items-center sm:justify-center sm:text-center"
        >
          <p className="min-w-0 flex-1 leading-snug">
            <span className="font-semibold text-amber-100">{t('demo.bannerTitle')}</span>
            <span className="text-amber-100/90"> — {t('demo.bannerBody')} </span>
            <Link to="/support" className="font-medium text-amber-50 underline underline-offset-2 hover:text-white">
              {t('footer.support')}
            </Link>
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg px-2 py-1 text-amber-100/80 hover:bg-amber-500/20 hover:text-amber-50"
            aria-label={t('demo.bannerDismiss')}
          >
            {t('demo.bannerDismiss')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
