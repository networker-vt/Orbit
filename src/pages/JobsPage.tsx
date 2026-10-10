import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Briefcase,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Scale,
  Search,
  Users,
  Zap,
} from 'lucide-react'
import { FilterBar } from '../components/listings/FilterBar'
import { ListingCard } from '../components/listings/ListingCard'
import { MarketRateHint } from '../components/listings/MarketRateHint'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Empty } from '../components/ui/Empty'
import { BOOKING_STATUS_LABELS } from '../data/constants'
import { useListings, useStoreVersion } from '../hooks/useStore'
import { useAuth } from '../lib/auth'
import { chatHref } from '../lib/chatPath'
import { store } from '../lib/store'
import { formatPrice } from '../lib/utils'
import type { ListingFilters } from '../types'
import { rankForWorld } from '../lib/behavior'

type Side = 'seek' | 'hire'

export function JobsPage() {
  const [params, setParams] = useSearchParams()
  const side = (params.get('side') as Side) || 'seek'
  const { user, loginDemo } = useAuth()
  useStoreVersion()
  const navigate = useNavigate()

  const [filters, setFilters] = useState<ListingFilters>({
    vertical: 'job',
    kind: side === 'seek' ? 'offer' : 'all',
  })

  const { listings: rawListings } = useListings({ ...filters, vertical: 'job' })
  const listings = useMemo(
    () => (side === 'seek' ? rankForWorld(rawListings) : rawListings),
    [rawListings, side],
  )

  const myJobBookings = useMemo(() => {
    if (!user) return []
    return store.listBookingsForUser(user.id).filter((b) => b.vertical === 'job')
  }, [user])

  const postedJobs = useMemo(() => {
    if (!user) return []
    return store.listListings({ vertical: 'job' }).filter((l) => l.ownerId === user.id)
  }, [user, listings])

  const setSide = (next: Side) => {
    setParams({ side: next })
    setFilters((f) => ({
      ...f,
      vertical: 'job',
      kind: next === 'seek' ? 'offer' : next === 'hire' ? 'all' : f.kind,
    }))
  }

  return (
    <div className="space-y-5 pb-scroll-chrome">
      <div className="relative overflow-hidden rounded-3xl border border-border surface-shine p-5 motion-fade-up">
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-cyan/20 blur-3xl motion-orb" />
        <div className="pointer-events-none absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-teal/15 blur-3xl motion-orb-delay" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />

        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan">
          <Zap size={14} /> Jobs Desk · Pro-Modus
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          {side === 'seek' ? (
            <>
              Jobs finden — <span className="text-shimmer">Rate zuerst</span>
            </>
          ) : (
            <>
              Besetzen — <span className="text-shimmer">Pipeline & Compare</span>
            </>
          )}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-300">
          {side === 'seek'
            ? 'Prefs und Deine Welt zuerst. Rate, Ort und Typ stehen im Inserat — 1-Tap Interesse statt CV-Spam.'
            : 'Job posten: Branche, Typ, Remote, Gehalt. Danach Pipeline, Chat, Interview-Stub.'}
        </p>

        <div className="mt-4 flex rounded-xl border border-border bg-black/40 p-1 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setSide('seek')}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition ${
              side === 'seek'
                ? 'bg-cyan text-black shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Search size={16} /> Jobs finden
          </button>
          <button
            type="button"
            onClick={() => setSide('hire')}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition ${
              side === 'hire'
                ? 'bg-teal text-black shadow-[0_0_20px_rgba(20,184,166,0.25)]'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Users size={16} /> Jobs / Crew
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {side === 'hire' ? (
            <Button onClick={() => navigate('/listings/new?vertical=job&kind=offer')}>
              <Plus size={16} /> Job posten
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => navigate('/listings/new?vertical=job&kind=request')}
            >
              Verfügbarkeit posten (Gesuch)
            </Button>
          )}
          {!user && (
            <Button variant="ghost" onClick={() => loginDemo()}>
              Demo starten
            </Button>
          )}
        </div>
      </div>

      {side === 'seek' && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: CheckCircle2, label: 'Rate + Spesen', sub: 'transparent' },
              { icon: MapPin, label: 'Ort & Zeitraum', sub: 'klar' },
              { icon: Clock, label: '1-Tap Apply', sub: 'schnell' },
            ].map((x) => (
              <div
                key={x.label}
                className="card-elevated flex flex-col items-center gap-1 rounded-xl border border-border px-2 py-3 text-center"
              >
                <x.icon size={16} className="text-cyan" />
                <span className="text-xs font-medium text-neutral-200">{x.label}</span>
                <span className="text-xs uppercase tracking-wider text-muted">{x.sub}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-cyan/20 bg-cyan/5 px-4 py-3">
            <MarketRateHint />
          </div>

          <div className="sticky-filters -mx-4 bg-surface/95 px-4 py-2 backdrop-blur md:mx-0 md:bg-transparent md:px-0 md:py-0">
            <FilterBar
              value={filters}
              onChange={(f) => setFilters({ ...f, vertical: 'job' })}
              showVertical={false}
              showRate
              sticky
            />
          </div>

          {listings.length === 0 ? (
            <Empty
              emoji="🎯"
              title="Noch kein Match in diesem Filter"
              hint="Ort, Beruf oder Gehalt anpassen — oder selbst ein Angebot schreiben."
              actionLabel="Filter zurücksetzen"
              onAction={() => setFilters({ vertical: 'job', kind: 'offer' })}
            />
          ) : (
            <div className="stagger-in grid gap-4 sm:grid-cols-2">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} highlightRate />
              ))}
            </div>
          )}

          {user && myJobBookings.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-semibold">
                <Briefcase size={16} className="text-cyan" /> Meine Bewerbungen
              </h2>
              <div className="space-y-2">
                {myJobBookings
                  .filter((b) => b.requesterId === user.id)
                  .map((b) => (
                    <Link
                      key={b.id}
                      to={`/bookings/${b.id}`}
                      className="card-hover flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{b.listingTitle}</div>
                        <div className="text-xs text-muted">
                          {b.offerAmount != null ? formatPrice(b.offerAmount) : 'Rate offen'} ·{' '}
                          {BOOKING_STATUS_LABELS[b.status]}
                        </div>
                      </div>
                      <Badge
                        tone={
                          b.status === 'booked' ? 'green' : b.status === 'offer' ? 'cyan' : 'amber'
                        }
                      >
                        {BOOKING_STATUS_LABELS[b.status]}
                      </Badge>
                    </Link>
                  ))}
              </div>
            </section>
          )}
        </>
      )}

      {side === 'hire' && (
        <>
          <div className="rounded-2xl border border-teal/35 bg-gradient-to-br from-teal/10 to-transparent p-4 text-sm text-neutral-300">
            <div className="mb-1 flex items-center gap-2 font-semibold text-teal">
              <Briefcase size={18} /> Structured Post · unter 2 Minuten
            </div>
            Job posten: Branche · Typ · Remote · Gehalt. Danach Pipeline, Compare, Chat, Interview.
            <div className="mt-3 rounded-xl border border-border/60 bg-black/25 px-3 py-2">
              <MarketRateHint />
            </div>
          </div>

          <div className="sticky-filters -mx-4 bg-surface/95 px-4 py-2 backdrop-blur md:mx-0 md:bg-transparent md:px-0 md:py-0">
            <FilterBar
              value={filters}
              onChange={(f) => setFilters({ ...f, vertical: 'job' })}
              showVertical={false}
              showRate
              sticky
            />
          </div>

          <div className="stagger-in grid gap-4 sm:grid-cols-2">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} highlightRate />
            ))}
          </div>
          {listings.length === 0 && (
            <Empty
              emoji="🚀"
              title="Dein erster Job setzt den Standard"
              hint="Poste mit klarer Rate + Spesen/ÜN — Bewerbungen landen in der Pipeline, Compare in einem Tap."
              actionLabel="Job posten"
              onAction={() => navigate('/listings/new?vertical=job&kind=offer')}
            />
          )}

          {user && postedJobs.length > 0 && (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Meine Job-Posts</h2>
                <span className="text-xs text-muted">{postedJobs.length} aktiv</span>
              </div>
              <div className="space-y-2">
                {postedJobs.map((job) => {
                  const apps = store.listBookingsForListing(job.id)
                  return (
                    <div
                      key={job.id}
                      className="card-elevated flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{job.title}</div>
                        <div className="text-xs text-muted">
                          {apps.length} Bewerbung{apps.length === 1 ? '' : 'en'}
                          {job.priceFrom != null ? ` · ab ${formatPrice(job.priceFrom)}` : ''}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {apps.length >= 2 && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/jobs/compare/${job.id}`)}
                          >
                            <Scale size={14} /> Vergleichen
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/listings/${job.id}`)}
                        >
                          Öffnen
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {user && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-semibold">
                <Users size={16} className="text-teal" /> Bewerber-Pipeline
              </h2>
              {myJobBookings.filter(
                (b) =>
                  b.providerId === user.id || postedJobs.some((p) => p.id === b.listingId),
              ).length === 0 ? (
                <Empty
                  emoji="📬"
                  title="Pipeline bereit — noch leer"
                  hint="Poste einen Job mit klarer Rate. Eingehende Bewerbungen erscheinen hier zum Compare & Chat."
                  actionLabel="Job posten"
                  onAction={() => navigate('/listings/new?vertical=job&kind=offer')}
                />
              ) : (
                <div className="space-y-2">
                  {myJobBookings
                    .filter(
                      (b) =>
                        b.providerId === user.id ||
                        postedJobs.some((p) => p.id === b.listingId),
                    )
                    .map((b) => (
                      <Link
                        key={b.id}
                        to={`/bookings/${b.id}`}
                        className="card-hover flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 hover:border-teal/40"
                      >
                        <div>
                          <div className="font-medium">{b.requesterName}</div>
                          <div className="text-xs text-muted">
                            {b.listingTitle}
                            {b.offerAmount != null ? ` · ${formatPrice(b.offerAmount)}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge>{BOOKING_STATUS_LABELS[b.status]}</Badge>
                          {b.threadId && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.preventDefault()
                                navigate(chatHref(b.threadId))
                              }}
                            >
                              Chat
                            </Button>
                          )}
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
