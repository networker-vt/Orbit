import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Briefcase, Heart, Pin, PinOff, Settings } from 'lucide-react'
import { FavoriteButton } from '../components/favorites/FavoriteButton'
import { ListingCard } from '../components/listings/ListingCard'
import { Badge } from '../components/ui/Badge'
import { Empty } from '../components/ui/Empty'
import { CATALOG_KIND_LABEL, catalogSectionPath, resolveCatalogEntry } from '../data/catalog/lookup'
import { useFavorites } from '../hooks/useFavorites'
import { store } from '../lib/store'
import { useI18n } from '../lib/i18n'
import { hubCtx } from '../lib/hubTiles'
import {
  getHomePins,
  HOME_PINS_MAX,
  isHomePinned,
  subscribeHomePins,
  toggleHomePin,
  type HomePin,
} from '../lib/homePins'
import { toHomePin, visibleMeinPinOptions, type MeinPinOption } from '../lib/meinPinCatalog'
import { useAuth } from '../lib/auth'
import { cn } from '../lib/utils'

const SETTINGS_HASHES = new Set([
  'sprache',
  'radius',
  'seeker',
  'employer',
  'skills',
  'docs',
  'verify',
  'erinnerungen',
  'rolle',
  'profil',
  'kalender',
])

export function MeinPage() {
  const { t } = useI18n()
  const { items } = useFavorites()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { hash } = useLocation()
  const [pins, setPins] = useState<HomePin[]>(getHomePins)
  const [pinFlash, setPinFlash] = useState<string | null>(null)
  const ctx = hubCtx()
  const catalog = visibleMeinPinOptions(ctx)

  useEffect(() => subscribeHomePins(() => setPins(getHomePins())), [])

  useEffect(() => {
    if (!hash) return
    const id = decodeURIComponent(hash.replace(/^#/, ''))
    if (SETTINGS_HASHES.has(id)) {
      navigate(`/einstellung#${id}`, { replace: true })
      return
    }
    if (id === 'schnellzugriffe') {
      const el = document.getElementById('schnellzugriffe')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [hash, navigate])

  const listingFavs = items.filter((f) => f.type === 'listing')
  const catalogFavs = items.filter((f) => f.type === 'catalog')
  const jobListings = listingFavs
    .map((f) => store.getListing(f.id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l && l.vertical === 'job'))
  const otherListings = listingFavs
    .map((f) => store.getListing(f.id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l && l.vertical !== 'job'))
  const catalogRows = catalogFavs.map((f) => ({
    fav: f,
    entry: resolveCatalogEntry(f.kind, f.id),
  }))

  const onToggle = (opt: MeinPinOption) => {
    const pinned = isHomePinned(opt.id)
    if (!pinned && getHomePins().length >= HOME_PINS_MAX) {
      setPinFlash(`${t('pin.limit')} (${HOME_PINS_MAX})`)
      window.setTimeout(() => setPinFlash(null), 1600)
      return
    }
    const { pins: next, pinned: nowPinned } = toggleHomePin(toHomePin(opt, t))
    setPins(next)
    setPinFlash(nowPinned ? t('pin.added') : t('pin.removed'))
    window.setTimeout(() => setPinFlash(null), 1600)
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-scroll-chrome" data-mein-orbit="1">
      <header className="space-y-2 pt-1">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--theme-accent)]">
          {t('mein.kicker')}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{t('mein.title')}</h1>
        <p className="max-w-md text-sm text-muted">{t('mein.lead')}</p>
        {user?.name && (
          <p className="text-xs text-muted">
            {user.name.split(' ')[0]} ·{' '}
            <Link to="/profile" className="underline-offset-2 hover:underline">
              {t('pin.profile')}
            </Link>
          </p>
        )}
      </header>

      <section
        id="schnellzugriffe"
        className="space-y-3"
        aria-labelledby="schnellzugriffe-heading"
        data-schnellzugriffe="1"
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="schnellzugriffe-heading" className="text-lg font-semibold">
              {t('pin.section')}
            </h2>
            <p className="mt-0.5 text-xs text-muted">{t('pin.hint')}</p>
          </div>
          {pins.length > 0 && (
            <Badge tone="teal">
              {pins.length}/{HOME_PINS_MAX}
            </Badge>
          )}
        </div>

        {pinFlash && (
          <p className="text-xs text-[var(--theme-accent)]" role="status" data-pin-flash="1">
            {pinFlash}
          </p>
        )}

        {pins.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label={t('pin.onHome')} data-pins-on-home={pins.length}>
            {pins.map((p) => (
              <li key={p.id}>
                <Link
                  to={p.to}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[var(--theme-accent)]/35 bg-[var(--theme-accent)]/10 px-3 py-1.5 text-sm text-ink transition-colors"
                >
                  {p.emoji ? <span aria-hidden>{p.emoji}</span> : null}
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border bg-surface-2">
          {catalog.map((def) => {
            const pinned = pins.some((p) => p.id === def.id)
            return (
              <li key={def.id} className="flex items-stretch">
                <Link
                  to={def.to}
                  data-pin-row={def.id}
                  className="flex min-h-14 flex-1 items-center gap-3 px-3 py-2 text-sm text-ink hover:bg-black/15"
                >
                  <span className="text-xl leading-none" aria-hidden>
                    {def.emoji}
                  </span>
                  <span className="font-medium">{t(def.labelKey)}</span>
                </Link>
                <button
                  type="button"
                  data-pin-toggle={def.id}
                  aria-pressed={pinned}
                  aria-label={
                    pinned
                      ? `${t('pin.unpin')} ${t(def.labelKey)}`
                      : `${t('pin.pin')} ${t(def.labelKey)}`
                  }
                  onClick={() => onToggle(def)}
                  className={cn(
                    'flex min-h-14 w-14 shrink-0 items-center justify-center border-l border-border/70 transition-colors',
                    pinned
                      ? 'bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]'
                      : 'text-muted hover:text-ink',
                  )}
                >
                  {pinned ? <Pin size={18} /> : <PinOff size={18} className="opacity-70" />}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <Link
          to="/einstellung"
          data-einstellung-entry="1"
          className="btn-press flex min-h-[4.5rem] items-center gap-4 rounded-2xl border-2 border-[var(--theme-accent)]/30 bg-[var(--theme-accent)]/10 px-4 py-3 transition-transform"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface/80 text-[var(--theme-accent)] shadow-sm">
            <Settings size={22} aria-hidden />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-sm font-semibold text-ink">{t('einstellung.title')}</span>
            <span className="mt-0.5 block text-xs text-muted">{t('einstellung.entryHint')}</span>
          </span>
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Briefcase size={18} className="text-[var(--theme-accent)]" /> {t('mein.favorites')}
        </h2>
        {jobListings.length === 0 ? (
          <Empty
            emoji="💼"
            title="Noch keine Job-Favoriten"
            hint="Herz auf einer Jobkarte tippen."
            actionLabel={t('home.ctaMatch')}
            onAction={() => navigate('/match')}
          />
        ) : (
          <div className="stagger-in grid gap-3 sm:grid-cols-2">
            {jobListings.map((l) => (
              <ListingCard key={l.id} listing={l} highlightRate />
            ))}
          </div>
        )}
      </section>

      {otherListings.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Heart size={18} /> Marktplatz
          </h2>
          <div className="stagger-in grid gap-3 sm:grid-cols-2">
            {otherListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      {catalogRows.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Katalog (Event-Modul)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {catalogRows.map(({ fav, entry }) => (
              <article
                key={`${fav.kind}-${fav.id}`}
                className="card-elevated flex items-start gap-3 rounded-2xl border border-border p-4"
              >
                <div className="min-w-0 flex-1">
                  <Badge tone="teal">{CATALOG_KIND_LABEL[fav.kind]}</Badge>
                  <Link to={catalogSectionPath(fav.kind)} className="mt-1 block text-sm font-semibold">
                    {entry?.name ?? 'Eintrag nicht mehr vorhanden'}
                  </Link>
                </div>
                <FavoriteButton catalog={{ kind: fav.kind, id: fav.id }} />
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
