import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ListingCard } from '../components/listings/ListingCard'
import { AnschreibenButton } from '../components/chat/AnschreibenButton'
import { Button } from '../components/ui/Button'
import { chatHref } from '../lib/chatPath'
import { Empty } from '../components/ui/Empty'
import { SpeakButton } from '../components/a11y/SpeakButton'
import { useListings } from '../hooks/useStore'
import { useI18n } from '../lib/i18n'
import { filledMarketTypes } from '../lib/categories'
import { deriveMarketType } from '../lib/market'
import { filterMarketplaceByPrefs, getPrefs, isCompanySide, subscribePrefs } from '../lib/prefs'
import { rankForCompanyWorld, rankForWorld } from '../lib/behavior'
import { cn } from '../lib/utils'
import type { MarketType } from '../types'

export function MarketplacePage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const typeParam = (params.get('type') as MarketType | 'all') || 'all'
  const [prefs, setPrefs] = useState(getPrefs)
  const { listings: raw } = useListings({})

  useEffect(() => subscribePrefs(() => setPrefs(getPrefs())), [])

  const items = useMemo(() => {
    const filtered = filterMarketplaceByPrefs(raw, prefs, typeParam === 'all' ? 'all' : typeParam)
    const ranked = isCompanySide(prefs.side) ? rankForCompanyWorld(filtered, prefs) : rankForWorld(filtered, prefs)
    return ranked
  }, [raw, prefs, typeParam])

  const setType = (next: MarketType | 'all') => {
    const p = new URLSearchParams(params)
    if (next === 'all') p.delete('type')
    else p.set('type', next)
    setParams(p)
  }

  return (
    <div className="space-y-5 pb-scroll-chrome">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--theme-accent)]">
              {t('market.kicker')}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{t('market.title')}</h1>
            <p className="mt-1 max-w-lg text-sm text-muted">{t('market.lead')}</p>
          </div>
          <SpeakButton compact text={`${t('market.title')}. ${t('market.lead')}`} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate('/listings/new')}>
            {t('nav.create')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/match')}>
            {t('nav.match')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(chatHref())}>
            {t('chat.brand')}
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t('market.lanes')}>
        <button
          type="button"
          onClick={() => setType('all')}
          className={cn(
            'min-h-10 rounded-full border px-3 text-xs font-medium',
            typeParam === 'all'
              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15'
              : 'border-border',
          )}
        >
          {t('market.all')}
        </button>
        {filledMarketTypes(raw).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setType(m)}
            className={cn(
              'min-h-10 rounded-full border px-3 text-xs font-medium',
              typeParam === m
                ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15'
                : 'border-border',
            )}
          >
            {t(`market.${m}`)}
          </button>
        ))}
      </div>

      {!prefs.completed ? (
        <p className="rounded-2xl border border-border bg-surface-2 p-4 text-sm text-muted">
          {t('market.needPrefs')}{' '}
          <Link to="/prefs" className="text-[var(--theme-accent)] hover:underline">
            {t('match.openPrefs')}
          </Link>
        </p>
      ) : null}

      {items.length === 0 ? (
        <Empty
          title={t('market.empty')}
          hint={t('market.needPrefs')}
          actionLabel={prefs.completed ? t('nav.create') : t('home.ctaPrefs')}
          onAction={() => navigate(prefs.completed ? '/listings/new' : '/prefs')}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.slice(0, 24).map((l) => (
            <div key={l.id} className="space-y-2">
              <ListingCard
                listing={l}
                highlightRate={deriveMarketType(l) === 'job' || deriveMarketType(l) === 'minijob'}
              />
              <AnschreibenButton
                listing={l}
                source={
                  deriveMarketType(l) === 'job' || deriveMarketType(l) === 'minijob' ? 'job' : 'market'
                }
                variant="secondary"
                size="sm"
                fullWidth
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
