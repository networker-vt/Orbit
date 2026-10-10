/**
 * Tankerkönig JSON API (DE) — requires API key from tankerkoenig.de.
 * No scraping; without key we show honest demo rows + map deep links.
 */

export type FuelKind = 'diesel' | 'e5' | 'e10'

export type GasStation = {
  id: string
  name: string
  brand: string
  street: string
  place: string
  lat: number
  lon: number
  distKm: number
  diesel: number | null
  e5: number | null
  e10: number | null
  demo?: boolean
}

export function tankerApiKey(): string | null {
  const key = import.meta.env.VITE_TANKERKOENIG_API_KEY?.trim()
  return key || null
}

export function cheapestPrice(station: GasStation, kind: FuelKind): number | null {
  return station[kind]
}

export function sortByCheapest(stations: GasStation[], kind: FuelKind): GasStation[] {
  return [...stations].sort((a, b) => {
    const pa = cheapestPrice(a, kind)
    const pb = cheapestPrice(b, kind)
    if (pa == null && pb == null) return a.distKm - b.distKm
    if (pa == null) return 1
    if (pb == null) return -1
    return pa - pb || a.distKm - b.distKm
  })
}

export function mapsStationUrl(station: GasStation): string {
  const q = encodeURIComponent(`${station.name} ${station.street} ${station.place}`)
  return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${encodeURIComponent(station.id)}`
}

export function osmFuelSearchUrl(lat: number, lon: number): string {
  return `https://www.openstreetmap.org/search?query=tankstelle#map=14/${lat.toFixed(5)}/${lon.toFixed(5)}`
}

const DEMO_STATIONS: GasStation[] = [
  {
    id: 'demo-nord',
    name: 'Demo Tankstelle Nord',
    brand: 'Demo',
    street: 'Musterstraße 1',
    place: 'Berlin',
    lat: 52.52,
    lon: 13.405,
    distKm: 1.2,
    diesel: 1.729,
    e5: 1.859,
    e10: 1.799,
    demo: true,
  },
  {
    id: 'demo-sued',
    name: 'Demo Tankstelle Süd',
    brand: 'Demo',
    street: 'Beispielweg 9',
    place: 'Berlin',
    lat: 52.49,
    lon: 13.38,
    distKm: 2.4,
    diesel: 1.749,
    e5: 1.839,
    e10: 1.819,
    demo: true,
  },
]

export async function fetchNearbyStations(
  lat: number,
  lon: number,
  radiusKm: number,
  signal?: AbortSignal,
): Promise<{ stations: GasStation[]; live: boolean; note: 'ok' | 'no_key' | 'api_error' }> {
  const apiKey = tankerApiKey()
  if (!apiKey) {
    return {
      stations: DEMO_STATIONS.map((s) => ({
        ...s,
        lat: lat + (s.lat - 52.52) * 0.01,
        lon: lon + (s.lon - 13.405) * 0.01,
        demo: true,
      })),
      live: false,
      note: 'no_key',
    }
  }
  const url = new URL('https://creativecommons.tankerkoenig.de/json/list.php')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lng', String(lon))
  url.searchParams.set('rad', String(Math.min(25, Math.max(1, Math.round(radiusKm)))))
  url.searchParams.set('sort', 'price')
  url.searchParams.set('type', 'all')
  url.searchParams.set('apikey', apiKey)
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as {
      ok?: boolean
      stations?: Array<{
        id: string
        name: string
        brand: string
        street: string
        place: string
        lat: number
        lng: number
        dist: number
        diesel?: number
        e5?: number
        e10?: number
      }>
    }
    if (!data.ok || !data.stations?.length) {
      return { stations: [], live: true, note: 'api_error' }
    }
    const stations: GasStation[] = data.stations.map((s) => ({
      id: s.id,
      name: s.name,
      brand: s.brand,
      street: s.street,
      place: s.place,
      lat: s.lat,
      lon: s.lng,
      distKm: s.dist,
      diesel: s.diesel ?? null,
      e5: s.e5 ?? null,
      e10: s.e10 ?? null,
    }))
    return { stations, live: true, note: 'ok' }
  } catch {
    return { stations: [], live: true, note: 'api_error' }
  }
}
