import { useEffect, useMemo, useState } from 'react'
import { Fuel, MapPin, Search } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { readGeoPosition, type GeoResult } from '../lib/geo'
import {
  fetchNearbyStations,
  mapsStationUrl,
  osmFuelSearchUrl,
  sortByCheapest,
  type FuelKind,
  type GasStation,
} from '../lib/tankerkoenig'
import { useI18n } from '../lib/i18n'

export function TankenPage() {
  const { t } = useI18n()
  const [geo, setGeo] = useState<GeoResult>({ status: 'idle' })
  const [fuel, setFuel] = useState<FuelKind>('e5')
  const [radius, setRadius] = useState(5)
  const [stations, setStations] = useState<GasStation[]>([])
  const [live, setLive] = useState(false)
  const [note, setNote] = useState<'ok' | 'no_key' | 'api_error' | null>(null)
  const [filter, setFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadStations = async (lat: number, lon: number) => {
    setLoading(true)
    const ac = new AbortController()
    try {
      const result = await fetchNearbyStations(lat, lon, radius, ac.signal)
      setStations(result.stations)
      setLive(result.live)
      setNote(result.note)
      if (result.stations[0]) setSelectedId(result.stations[0].id)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setGeo({ status: 'pending' })
    void readGeoPosition()
      .then(({ lat, lon }) => {
        setGeo({ status: 'ok', lat, lon, accuracy: null })
        return loadStations(lat, lon)
      })
      .catch(() => setGeo({ status: 'denied' }))
  }, [])

  useEffect(() => {
    if (geo.status !== 'ok') return
    void loadStations(geo.lat, geo.lon)
  }, [radius, geo.status])

  const sorted = useMemo(() => sortByCheapest(stations, fuel), [stations, fuel])
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        s.place.toLowerCase().includes(q),
    )
  }, [sorted, filter])

  const selected = filtered.find((s) => s.id === selectedId) ?? filtered[0]
  const mapUrl =
    geo.status === 'ok'
      ? selected
        ? mapsStationUrl(selected)
        : osmFuelSearchUrl(geo.lat, geo.lon)
      : osmFuelSearchUrl(52.52, 13.405)

  const priceLabel = (s: GasStation) => {
    const p = s[fuel]
    return p != null ? `${p.toFixed(3)} €` : '—'
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome pt-4" data-tanken-page="1">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-amber-200">{t('daily.stubBadge')}</p>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink">
          <Fuel size={22} aria-hidden />
          {t('daily.tankenTitle')}
        </h1>
        <p className="text-sm text-muted">{t('daily.tankenLead')}</p>
      </header>

      {note === 'no_key' && (
        <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {t('daily.tankenNoKey')}
        </p>
      )}
      {note === 'api_error' && live && (
        <p className="text-sm text-amber-200">{t('daily.tankenApiError')}</p>
      )}
      {geo.status === 'denied' && <p className="text-sm text-muted">{t('daily.geoDenied')}</p>}

      <div className="flex flex-wrap gap-2">
        {(['diesel', 'e5', 'e10'] as FuelKind[]).map((kind) => (
          <button
            key={kind}
            type="button"
            data-tanken-fuel={kind}
            aria-pressed={fuel === kind}
            onClick={() => setFuel(kind)}
            className={
              fuel === kind
                ? 'rounded-full bg-[var(--theme-accent)]/20 px-3 py-1.5 text-sm font-medium text-ink'
                : 'rounded-full border border-border px-3 py-1.5 text-sm text-muted'
            }
          >
            {kind.toUpperCase()}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          {t('daily.radius')}
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-ink"
          >
            {[3, 5, 10, 15].map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t('daily.tankenSearch')}
          className="pl-9"
          data-tanken-search="1"
        />
      </div>

      {loading && <p className="text-sm text-muted">{t('daily.loading')}</p>}

      <ul className="space-y-2" data-tanken-list="1">
        {filtered.map((s, idx) => (
          <li key={s.id}>
            <button
              type="button"
              data-tanken-station={s.id}
              onClick={() => setSelectedId(s.id)}
              className={
                selectedId === s.id
                  ? 'w-full rounded-2xl border border-[var(--theme-accent)]/50 bg-surface-2 px-3 py-3 text-left'
                  : 'w-full rounded-2xl border border-border bg-surface-2 px-3 py-3 text-left hover:border-[var(--theme-accent)]/30'
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {idx === 0 && !s.demo ? t('daily.cheapest') : s.name}
                    {s.demo && (
                      <span className="ml-2 text-xs text-amber-200">{t('daily.demoLabel')}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {s.brand} · {s.street}, {s.place} · {s.distKm.toFixed(1)} km
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-[var(--theme-accent)]">{priceLabel(s)}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <section className="space-y-2" aria-label={t('daily.mapTitle')}>
        <h2 className="text-sm font-semibold text-ink">{t('daily.mapTitle')}</h2>
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-surface-2 px-3 py-3 text-sm text-[var(--theme-accent)]"
          data-tanken-map="1"
        >
          <MapPin size={16} />
          {t('daily.openMap')}
        </a>
        <p className="text-xs text-muted">{t('daily.mapHint')}</p>
      </section>
    </div>
  )
}
