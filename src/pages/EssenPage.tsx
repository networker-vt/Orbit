import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Search, UtensilsCrossed } from 'lucide-react'
import { buttonClassName } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import {
  ESSEN_TIPS,
  fetchNearbyPlaces,
  filterTips,
  mapsSearchUrl,
  osmSearchUrl,
  type NearbyPlace,
} from '../lib/essenTips'
import { useI18n } from '../lib/i18n'

type GeoState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'denied' }
  | { status: 'error'; message: string }
  | { status: 'ok'; lat: number; lon: number }

export function EssenPage() {
  const { t, resolved } = useI18n()
  const [query, setQuery] = useState('')
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' })
  const [nearby, setNearby] = useState<NearbyPlace[]>([])
  const [nearbyNote, setNearbyNote] = useState<string | null>(null)

  const tips = useMemo(() => filterTips(query, resolved), [query, resolved])

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo({ status: 'denied' })
      setNearbyNote(t('essen.geoUnavailable'))
      return
    }
    setGeo({ status: 'pending' })
    const ac = new AbortController()
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        setGeo({ status: 'ok', lat, lon })
        void fetchNearbyPlaces(lat, lon, ac.signal)
          .then((places) => {
            setNearby(places)
            setNearbyNote(places.length ? null : t('essen.nearbyEmpty'))
          })
          .catch(() => {
            setNearby([])
            setNearbyNote(t('essen.nearbyCors'))
          })
      },
      () => {
        setGeo({ status: 'denied' })
        setNearbyNote(t('essen.geoDenied'))
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120_000 },
    )
    return () => ac.abort()
  }, [t])

  const lat = geo.status === 'ok' ? geo.lat : undefined
  const lon = geo.status === 'ok' ? geo.lon : undefined
  const searchQ = query.trim() || t('essen.searchDefault')

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome pt-4">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{t('essen.kicker')}</p>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink">
          <UtensilsCrossed size={22} aria-hidden />
          {t('essen.title')}
        </h1>
        <p className="text-sm text-muted">{t('essen.lead')}</p>
      </header>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">{t('essen.inputLabel')}</span>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('essen.inputPh')}
              className="pl-9"
              data-essen-query="1"
            />
          </div>
        </label>
      </form>

      <section className="space-y-3" aria-labelledby="essen-tips">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="essen-tips" className="text-sm font-semibold text-ink">
            {t('essen.tipsTitle')}
          </h2>
          <a
            href="https://www.themealdb.com/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted hover:text-ink"
          >
            {t('essen.imageCredit')}
          </a>
        </div>
        <ul className="grid grid-cols-2 gap-3" data-essen-tips={tips.length}>
          {(tips.length ? tips : ESSEN_TIPS.slice(0, 2)).map((tip) => (
            <li key={tip.id} className="overflow-hidden rounded-2xl border border-border bg-surface-2">
              <img
                src={tip.image}
                alt=""
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="space-y-1 px-2.5 py-2">
                <p className="text-sm font-medium text-ink">
                  {resolved === 'de' ? tip.titleDe : tip.titleEn}
                </p>
                <a
                  href={tip.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted hover:text-ink"
                >
                  {tip.source}
                </a>
              </div>
            </li>
          ))}
        </ul>
        {tips.length === 0 && (
          <p className="text-xs text-muted">{t('essen.tipsFallback')}</p>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="essen-nearby">
        <h2 id="essen-nearby" className="flex items-center gap-2 text-sm font-semibold text-ink">
          <MapPin size={16} aria-hidden />
          {t('essen.nearbyTitle')}
        </h2>
        {geo.status === 'pending' && <p className="text-sm text-muted">{t('essen.geoPending')}</p>}
        {nearbyNote && <p className="text-sm text-muted">{nearbyNote}</p>}
        {nearby.length > 0 && (
          <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border">
            {nearby.map((place) => (
              <li key={place.id}>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=17/${place.lat}/${place.lon}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-ink/5"
                >
                  <span className="text-ink">{place.name}</span>
                  <span className="text-xs text-muted">{place.kind}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <a
            href={osmSearchUrl(searchQ, lat, lon)}
            target="_blank"
            rel="noreferrer"
            className={buttonClassName({ variant: 'secondary', size: 'sm' })}
          >
            {t('essen.linkOsm')}
          </a>
          <a
            href={mapsSearchUrl(searchQ, lat, lon)}
            target="_blank"
            rel="noreferrer"
            className={buttonClassName({ variant: 'secondary', size: 'sm' })}
          >
            {t('essen.linkMap')}
          </a>
        </div>
      </section>

      <Link to="/" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-ink">
        ← {t('essen.backHome')}
      </Link>
    </div>
  )
}
