import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  dismissBetaBannerForSession,
  shouldShowBetaBanner,
  subscribeBetaNotice,
} from '../../lib/betaNotice'
import { ORBIT_GITHUB_REPO } from '../../lib/improvements'
import { useI18n } from '../../lib/i18n'

/**
 * TestFlight-style pre-release notice (DE primary). Session-dismissible;
 * reappears next session unless disabled in Einstellungen.
 */
export function PreReleaseBetaBanner() {
  const { t } = useI18n()
  const [visible, setVisible] = useState(shouldShowBetaBanner)

  useEffect(() => subscribeBetaNotice(() => setVisible(shouldShowBetaBanner())), [])

  const dismiss = () => {
    dismissBetaBannerForSession()
    setVisible(false)
  }

  // Always reserve banner height so dismiss / first paint does not shift /willkommen (CLS).
  return (
    <div
      data-beta-prerelease-slot="1"
      className="min-h-[4.75rem] border-b border-transparent"
      aria-hidden={!visible}
    >
      {visible ? (
        <div
          role="status"
          data-beta-prerelease-banner="1"
          className="border-b border-sky-500/30 bg-sky-950/90 px-3 py-2 text-xs text-sky-50"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 leading-snug">
              <span className="font-semibold text-sky-100">{t('beta.bannerTitle')}</span>
              <span className="text-sky-100/90"> — {t('beta.bannerBody')}</span>
            </p>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                to="/mitentwickeln"
                className="rounded-lg bg-sky-500/25 px-2.5 py-1.5 font-medium text-sky-50 hover:bg-sky-500/40"
              >
                {t('beta.bannerCta')}
              </Link>
              <a
                href={ORBIT_GITHUB_REPO}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-sky-400/40 px-2.5 py-1.5 text-sky-100/90 hover:text-white"
              >
                {t('beta.bannerGithub')}
              </a>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg px-2 py-1.5 text-sky-200/80 hover:bg-sky-500/20"
                aria-label={t('beta.bannerDismiss')}
              >
                {t('beta.bannerDismiss')}
              </button>
            </div>
          </div>
          <p className="mx-auto mt-1 max-w-6xl text-[11px] text-sky-200/70">{t('beta.bannerMergeRule')}</p>
        </div>
      ) : null}
    </div>
  )
}
