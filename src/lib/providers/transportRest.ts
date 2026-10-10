/**
 * Open HAFAS proxy (transport.rest / v6.db.transport.rest).
 * Community API — attribute in UI; operator can disable or point to own instance.
 * @see https://github.com/public-transport/hafas-client
 */
import { parseRailJourneys, type RailJourney } from '../travelConnectors'
import { transportRestBaseUrl, transportRestEnabled } from './partnerEnv'

export interface TransportLocation {
  id: string
  name: string
}

function base(): string | null {
  if (!transportRestEnabled()) return null
  const b = transportRestBaseUrl()
  return b?.replace(/\/$/, '') || null
}

export async function resolveTransportLocation(
  query: string,
  signal?: AbortSignal,
): Promise<TransportLocation | null> {
  const root = base()
  if (!root || !query.trim()) return null
  const url = `${root}/locations?${new URLSearchParams({ query: query.trim(), results: '1' })}`
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const data: unknown = await res.json()
  if (!Array.isArray(data) || !data.length) return null
  const first = data[0] as { id?: string; name?: string }
  if (!first?.id || !first.name) return null
  return { id: String(first.id), name: String(first.name) }
}

function departureIso(dateIso?: string): string {
  if (dateIso) return `${dateIso}T08:00:00`
  const d = new Date()
  d.setHours(8, 0, 0, 0)
  return d.toISOString().slice(0, 19)
}

export async function searchTransportRestJourneys(input: {
  from: string
  to: string
  dateIso?: string
  results?: number
  signal?: AbortSignal
}): Promise<RailJourney[]> {
  const root = base()
  if (!root || !input.from.trim() || !input.to.trim()) return []
  const fromLoc = await resolveTransportLocation(input.from, input.signal)
  const toLoc = await resolveTransportLocation(input.to, input.signal)
  if (!fromLoc || !toLoc) return []
  const params = new URLSearchParams({
    from: fromLoc.id,
    to: toLoc.id,
    departure: departureIso(input.dateIso),
    results: String(input.results ?? 5),
  })
  const url = `${root}/journeys?${params}`
  const res = await fetch(url, { signal: input.signal, headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const payload = await res.json()
  return parseRailJourneys(payload)
}
