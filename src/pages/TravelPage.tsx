import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plane } from 'lucide-react'
import { TripOptionCards } from '../components/assist/TripOptionCards'
import { TravelResultCard } from '../components/providers/TravelResultCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Empty } from '../components/ui/Empty'
import { SpeakButton } from '../components/a11y/SpeakButton'
import { useI18n } from '../lib/i18n'
import { TRAVEL_DISCLAIMER_DE, TRAVEL_DISCLAIMER_EN, TRAVEL_KIND_META, type TravelKind } from '../lib/travel'
import { buyBoost, CREDITS_COSTS, hasTravelDeepScan, subscribeCredits } from '../lib/credits'
import { isFlagOn } from '../lib/flags'
import { LaneBadge } from '../components/credits/LaneBadge'
import { KidsBlocked } from '../components/kids/KidsBlocked'
import { emitParentalRequired, kidsHideTravel, subscribeKids } from '../lib/kids'
import { detectTripIntent, proposeTripOptions } from '../lib/trip'
import { searchTravelProviders, type TravelSearchHit } from '../lib/providers/travelProviders'
import { cn } from '../lib/utils'

const TAB_KINDS: TravelKind[] = ['rail', 'flight', 'hotel']

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; hits: TravelSearchHit[] }
  | { status: 'error' }

export function TravelPage() {
  const { t, resolved } = useI18n()
  const [params, setParams] = useSearchParams()
  const kindParam = (params.get('kind') as TravelKind | 'all') || 'all'
  const committedFrom = params.get('from') || ''
  const committedTo = params.get('to') || ''
  const committedDate = params.get('date') || ''
  const committedQ = params.get('q') || ''
  const [to, setTo] = useState(committedTo)
  const [from, setFrom] = useState(committedFrom)
  const [date, setDate] = useState(committedDate)
  const [q, setQ] = useState(committedQ)
  const [scanTick, setScanTick] = useState(0)
  const [kids, setKids] = useState(kidsHideTravel)
  const [search, setSearch] = useState<SearchState>({ status: 'idle' })
  useEffect(() => subscribeCredits(() => setScanTick((n) => n + 1)), [])
  useEffect(() => subscribeKids(() => setKids(kidsHideTravel())), [])
  const scanOn = hasTravelDeepScan()

  const tripCards = useMemo(() => {
    const intent = detectTripIntent([from, to, q].filter(Boolean).join(' '))
    return intent.matched ? proposeTripOptions(intent).slice(0, 3) : []
  }, [from, to, q])

  const ready = Boolean(committedFrom && committedTo)

  useEffect(() => {
    if (kids || !ready) {
      setSearch({ status: 'idle' })
      return
    }
    const ac = new AbortController()
    setSearch({ status: 'loading' })
    void searchTravelProviders({
      kind: kindParam === 'all' ? 'all' : kindParam,
      from: committedFrom,
      to: committedTo,
      dateIso: committedDate || undefined,
      q: committedQ || undefined,
      locale: resolved,
      deepScan: scanOn,
      signal: ac.signal,
    })
      .then((hits) => {
        if (ac.signal.aborted) return
        setSearch({ status: 'ready', hits })
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setSearch({ status: 'error' })
      })
    return () => ac.abort()
  }, [kids, ready, kindParam, committedFrom, committedTo, committedDate, committedQ, resolved, scanOn, scanTick])

  const visibleHits = useMemo(() => {
    if (search.status !== 'ready') return []
    return search.hits.filter((h) => kindParam === 'all' || h.kind === kindParam)
  }, [search, kindParam])

  const setKind = (next: TravelKind | 'all') => {
    const p = new URLSearchParams(params)
    if (next === 'all') p.delete('kind')
    else p.set('kind', next)
    setParams(p)
  }

  const disclaimer = resolved === 'de' ? TRAVEL_DISCLAIMER_DE : TRAVEL_DISCLAIMER_EN

  return (
    <div className="space-y-5 pb-scroll-chrome">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--theme-accent)]">
              {t('travel.kicker')}
            </p>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Plane size={22} /> {t('travel.title')}
            </h1>
            <p className="mt-1 max-w-lg text-sm text-muted">{t('travel.lead')}</p>
          </div>
          <SpeakButton compact text={`${t('travel.title')}. ${t('travel.lead')}`} />
        </div>
      </header>

      {kids ? (
        <KidsBlocked title={t('kids.travelBlocked')} onAskParent={() => emitParentalRequired('leave_kids')} />
      ) : (
        <>
          <p className="rounded-2xl border border-border bg-surface-2/80 px-3 py-2 text-xs text-muted">{disclaimer}</p>
          <p className="text-xs text-neutral-500">{t('providers.transportRestNote')}</p>

          {tripCards.length > 0 && <TripOptionCards options={tripCards} />}

          {isFlagOn('credits') && (
            <div className="flex flex-wrap items-center gap-2">
              {scanOn ? (
                <span className="inline-flex items-center gap-2 text-xs text-[var(--theme-accent)]">
                  <LaneBadge lane="credits" /> {t('travel.deepScanOn')}
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void buyBoost('travel_scan').then(() => setScanTick((n) => n + 1))
                  }}
                >
                  {t('travel.deepScan')} · {CREDITS_COSTS.travel_scan.credits} Credits
                </Button>
              )}
              <p className="text-xs text-muted">{t('travel.deepScanHint')}</p>
            </div>
          )}

          <form
            className="grid gap-2 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              const p = new URLSearchParams(params)
              if (to) p.set('to', to)
              else p.delete('to')
              if (from) p.set('from', from)
              else p.delete('from')
              if (date) p.set('date', date)
              else p.delete('date')
              if (q) p.set('q', q)
              else p.delete('q')
              setParams(p)
            }}
          >
            <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder={t('travel.from')} />
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder={t('travel.to')} />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('travel.q')} />
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full sm:w-auto">
                {t('travel.search')}
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t('travel.lanes')}>
            <button
              type="button"
              onClick={() => setKind('all')}
              className={cn(
                'min-h-10 rounded-full border px-3 text-xs font-medium',
                kindParam === 'all'
                  ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15'
                  : 'border-border',
              )}
            >
              {t('travel.all')}
            </button>
            {TAB_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  'min-h-10 rounded-full border px-3 text-xs font-medium',
                  kindParam === k
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15'
                    : 'border-border',
                )}
              >
                {TRAVEL_KIND_META[k].emoji} {resolved === 'de' ? TRAVEL_KIND_META[k].de : TRAVEL_KIND_META[k].en}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted">{t('travel.sort')}</p>

          {!ready && (
            <Empty emoji="✈️" title={t('travel.railNeed')} hint={t('travel.emptyHint')} className="py-6" />
          )}

          {ready && search.status === 'loading' && <p className="text-sm text-muted">{t('travel.loading')}</p>}

          {ready && search.status === 'error' && (
            <Empty emoji="⚠️" title={t('travel.railFail')} hint={t('travel.emptyHint')} className="py-6" />
          )}

          {ready && search.status === 'ready' && visibleHits.length === 0 && (
            <Empty emoji="🔍" title={t('travel.empty')} hint={t('travel.emptyHint')} className="py-6" />
          )}

          {ready && search.status === 'ready' && visibleHits.length > 0 && (
            <ul className="space-y-2" data-travel-results="1">
              {visibleHits.map((hit) => (
                <li key={hit.id}>
                  <TravelResultCard hit={hit} />
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-muted">
            {t('travel.also')}{' '}
            <Link to="/marktplatz" className="text-[var(--theme-accent)] hover:underline">
              {t('market.nav')}
            </Link>
            {' · '}
            <Link to="/match" className="text-[var(--theme-accent)] hover:underline">
              {t('nav.match')}
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
