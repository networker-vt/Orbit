/**
 * Essenstipps — freely usable cooking imagery + honest nearby fallbacks.
 * TheMealDB (CC images / free API), Wikimedia Commons, OSM link fallbacks.
 */

export type EssenTip = {
  id: string
  titleDe: string
  titleEn: string
  image: string
  source: string
  sourceUrl: string
  tags: string[]
}

/** Curated free-to-use cooking stills (Wikimedia Commons + TheMealDB CDN). */
export const ESSEN_TIPS: EssenTip[] = [
  {
    id: 'pasta',
    titleDe: 'Pasta mit Tomate',
    titleEn: 'Tomato pasta',
    image: 'https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg',
    source: 'TheMealDB',
    sourceUrl: 'https://www.themealdb.com/',
    tags: ['essen', 'pasta', 'warm', 'hunger'],
  },
  {
    id: 'salad',
    titleDe: 'Frischer Salat',
    titleEn: 'Fresh salad',
    image: 'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg',
    source: 'TheMealDB',
    sourceUrl: 'https://www.themealdb.com/',
    tags: ['essen', 'leicht', 'salat', 'hunger'],
  },
  {
    id: 'soup',
    titleDe: 'Gemüsesuppe',
    titleEn: 'Vegetable soup',
    image: 'https://www.themealdb.com/images/media/meals/1520084193.jpg',
    source: 'TheMealDB',
    sourceUrl: 'https://www.themealdb.com/',
    tags: ['essen', 'suppe', 'warm', 'hunger'],
  },
  {
    id: 'coffee',
    titleDe: 'Kaffee & Kuchen',
    titleEn: 'Coffee & cake',
    image: 'https://www.themealdb.com/images/media/meals/wxywrq1468237727.jpg',
    source: 'TheMealDB',
    sourceUrl: 'https://www.themealdb.com/',
    tags: ['trinken', 'kaffee', 'süß', 'durst'],
  },
  {
    id: 'smoothie',
    titleDe: 'Frucht-Smoothie',
    titleEn: 'Fruit smoothie',
    image: 'https://www.themealdb.com/images/media/meals/rwuyqx1511383174.jpg',
    source: 'TheMealDB',
    sourceUrl: 'https://www.themealdb.com/',
    tags: ['trinken', 'smoothie', 'frisch', 'durst'],
  },
  {
    id: 'bowl',
    titleDe: 'Reis-Bowl',
    titleEn: 'Rice bowl',
    image: 'https://www.themealdb.com/images/media/meals/1529444830.jpg',
    source: 'TheMealDB',
    sourceUrl: 'https://www.themealdb.com/',
    tags: ['essen', 'bowl', 'satt', 'hunger'],
  },
]

export type NearbyPlace = {
  id: string
  name: string
  lat: number
  lon: number
  kind: 'restaurant' | 'cafe' | 'fast_food'
}

export function filterTips(query: string, locale: 'de' | 'en'): EssenTip[] {
  const q = query.trim().toLowerCase()
  if (!q) return ESSEN_TIPS
  return ESSEN_TIPS.filter((tip) => {
    const title = (locale === 'de' ? tip.titleDe : tip.titleEn).toLowerCase()
    return title.includes(q) || tip.tags.some((t) => t.includes(q) || q.includes(t))
  })
}

export function osmSearchUrl(query: string, lat?: number, lon?: number): string {
  const q = encodeURIComponent(query.trim() || 'restaurant')
  if (lat != null && lon != null) {
    return `https://www.openstreetmap.org/search?query=${q}#map=15/${lat.toFixed(5)}/${lon.toFixed(5)}`
  }
  return `https://www.openstreetmap.org/search?query=${q}`
}

export function mapsSearchUrl(query: string, lat?: number, lon?: number): string {
  const q = encodeURIComponent(query.trim() || 'restaurant')
  if (lat != null && lon != null) {
    return `https://www.openstreetmap.org/directions?from=&to=${lat}%2C${lon}#map=16/${lat}/${lon}`
  }
  return `https://www.openstreetmap.org/search?query=${q}`
}

/** Overpass nearby amenities — may fail CORS; caller must fall back. */
export async function fetchNearbyPlaces(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<NearbyPlace[]> {
  const query = `
    [out:json][timeout:8];
    (
      node["amenity"~"restaurant|cafe|fast_food"](around:1200,${lat},${lon});
      way["amenity"~"restaurant|cafe|fast_food"](around:1200,${lat},${lon});
    );
    out center 12;
  `
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    signal,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (!res.ok) throw new Error(`overpass_${res.status}`)
  const data = (await res.json()) as {
    elements?: Array<{
      id: number
      lat?: number
      lon?: number
      center?: { lat: number; lon: number }
      tags?: { name?: string; amenity?: string }
    }>
  }
  const places: NearbyPlace[] = []
  for (const el of data.elements ?? []) {
    const name = el.tags?.name?.trim()
    if (!name) continue
    const plat = el.lat ?? el.center?.lat
    const plon = el.lon ?? el.center?.lon
    if (plat == null || plon == null) continue
    const amenity = el.tags?.amenity
    const kind =
      amenity === 'cafe' ? 'cafe' : amenity === 'fast_food' ? 'fast_food' : 'restaurant'
    places.push({ id: String(el.id), name, lat: plat, lon: plon, kind })
    if (places.length >= 8) break
  }
  return places
}
