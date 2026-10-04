import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { TileGrid } from '../components/ui/TileGrid'
import { mehrDiscoverTiles } from '../lib/hubTiles'
import { useI18n } from '../lib/i18n'
import { isKidsMode, kidsHideTravel, kidsHideWallet } from '../lib/kids'

export function MehrPage() {
  const { t } = useI18n()
  const { hash } = useLocation()
  const kids = isKidsMode()
  useEffect(() => {
    if (!hash) return
    const id = hash.replace(/^#/, '')
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  const tiles = mehrDiscoverTiles(t, {
    kids,
    hideTravel: kidsHideTravel(),
    hideWallet: kidsHideWallet(),
  })

  return (
    <div className="space-y-6 pb-scroll-chrome">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t('mehr.title')}</h1>
        <p className="text-sm text-muted">{t('mehr.lead')}</p>
      </header>

      <TileGrid tiles={tiles} label={t('mehr.tiles')} />

      <section className="space-y-1" aria-label="Parkmerke">
        <Link
          to="/parkmerke"
          data-parkmerke-entry="1"
          className="inline-flex min-h-11 items-center text-sm font-medium text-ink hover:underline"
        >
          Parkmerke
        </Link>
        <p className="max-w-sm text-sm text-muted">
          Merkt sich auf diesem Gerät, wo das Auto steht und wann die Zeit endet.
        </p>
      </section>

      <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted" aria-label={t('mehr.legal')}>
        <Link to="/impressum" className="hover:text-ink">
          {t('footer.impressum')}
        </Link>
        <Link to="/privacy" className="hover:text-ink">
          {t('footer.privacy')}
        </Link>
        <Link to="/support" className="hover:text-ink">
          {t('footer.support')}
        </Link>
        <Link to="/agb" className="hover:text-ink">
          {t('footer.terms')}
        </Link>
        <Link to="/ranking" className="hover:text-ink">
          Ranking
        </Link>
      </nav>
    </div>
  )
}
