import { useEffect, useState } from 'react'
import { CloudSun, MapPin, Shirt } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { fetchCurrentWeather, weatherLabel } from '../lib/openMeteo'
import { outfitLines, suggestOutfit } from '../lib/outfitSuggest'
import { readGeoPosition, type GeoResult } from '../lib/geo'
import { useI18n } from '../lib/i18n'

export function OutfitPage() {
  const { t, resolved } = useI18n()
  const [geo, setGeo] = useState<GeoResult>({ status: 'idle' })
  const [weatherNote, setWeatherNote] = useState<string | null>(null)
  const [outfit, setOutfit] = useState<ReturnType<typeof outfitLines> | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    setGeo({ status: 'pending' })
    void readGeoPosition()
      .then(({ lat, lon }) => {
        setGeo({ status: 'ok', lat, lon, accuracy: null })
        return fetchCurrentWeather(lat, lon, ac.signal).then((w) => {
          const suggestion = suggestOutfit(w, resolved)
          setOutfit(outfitLines(suggestion, resolved))
          setWeatherNote(
            `${weatherLabel(w.weatherCode, resolved)} · Open-Meteo · ${new Date(w.fetchedAt).toLocaleTimeString(resolved === 'de' ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}`,
          )
        })
      })
      .catch(() => {
        setGeo({ status: 'denied' })
        setWeatherNote(t('daily.geoDenied'))
      })
    return () => ac.abort()
  }, [resolved, t])

  const retryLocate = () => {
    setGeo({ status: 'pending' })
    void readGeoPosition()
      .then(({ lat, lon }) => {
        setGeo({ status: 'ok', lat, lon, accuracy: null })
        return fetchCurrentWeather(lat, lon).then((w) => {
          const suggestion = suggestOutfit(w, resolved)
          setOutfit(outfitLines(suggestion, resolved))
        })
      })
      .catch(() => setGeo({ status: 'denied' }))
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome pt-4" data-outfit-page="1">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-amber-200">{t('daily.stubBadge')}</p>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink">
          <Shirt size={22} aria-hidden />
          {t('daily.outfitTitle')}
        </h1>
        <p className="text-sm text-muted">{t('daily.outfitLead')}</p>
      </header>

      {geo.status === 'denied' && (
        <div className="rounded-2xl border border-border bg-surface-2 px-3 py-3 text-sm">
          <p className="text-muted">{t('daily.geoDenied')}</p>
          <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={retryLocate}>
            <MapPin size={16} /> {t('daily.locateAgain')}
          </Button>
        </div>
      )}

      {outfit && (
        <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4">
          <p className="flex items-center gap-2 text-lg font-semibold text-ink">
            <CloudSun size={20} aria-hidden />
            {outfit.headline}
          </p>
          {weatherNote && <p className="text-xs text-muted">{weatherNote}</p>}
          <ul className="list-inside list-disc space-y-1 text-sm text-ink">
            {outfit.items.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="text-xs text-muted">{outfit.note}</p>
        </section>
      )}

      {geo.status === 'pending' && <p className="text-sm text-muted">{t('daily.weatherLoading')}</p>}
    </div>
  )
}
