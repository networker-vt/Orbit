import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Cable, ExternalLink, Info } from 'lucide-react'
import { AGGREGATOR_SOURCES } from '../data/industries'
import { ListingCard } from '../components/listings/ListingCard'
import { Badge } from '../components/ui/Badge'
import { useStoreVersion } from '../hooks/useStore'
import { store } from '../lib/store'
import type { Listing } from '../types'

const STATUS_LABEL: Record<string, string> = {
  live: 'Live',
  mock: 'Demo-Sample',
  planned: 'Geplant',
}

export function QuellenPage() {
  useStoreVersion()
  const imported = useMemo(() => {
    return store
      .listListings({ vertical: 'job' })
      .filter((l) => (l as Listing & { source?: string }).source)
      .slice(0, 12)
  }, [])

  return (
    <div className="space-y-6 pb-scroll-chrome">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-cyan">Aggregatoren</p>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Cable size={22} className="text-cyan" /> Quellen
        </h1>
        <p className="text-sm text-muted">
          Job-Boards & Partner — Status mock/geplant. Allda imported Samples sind gekennzeichnet.
        </p>
      </header>

      <div className="flex gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 text-sm text-amber-100">
        <Info size={18} className="mt-0.5 shrink-0 text-amber-300" />
        <div>
          <p className="font-semibold text-amber-200">Keine inoffiziellen Scrapes</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/90">
            Allda scrapt nicht LinkedIn, StepStone, Indeed, Xing o. Ä. ohne Erlaubnis. Anbindung nur
            über offizielle APIs / Partner-Import. Bis dahin: Demo-Samples mit Source-Tag und
            Status-Stubs.
          </p>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {AGGREGATOR_SOURCES.map((src) => (
          <div
            key={src.id}
            className="rounded-2xl border border-border bg-surface-2 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-ink">{src.name}</h2>
              <Badge
                tone={
                  src.status === 'live' ? 'cyan' : src.status === 'mock' ? 'amber' : 'default'
                }
              >
                {STATUS_LABEL[src.status]}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted">{src.hint}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Importierte Samples</h2>
          <Link to="/match" className="text-xs text-cyan hover:underline">
            Im Match öffnen →
          </Link>
        </div>
        {imported.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Source-Tags in den Seed-Jobs.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {imported.map((l) => (
              <div key={l.id} className="relative">
                <ListingCard listing={l} />
                {(l as Listing & { source?: string }).source && (
                  <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-200">
                    <ExternalLink size={10} />
                    {(l as Listing & { source?: string }).source}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
