import { store } from '../store'
import { deriveMarketType } from '../market'
import { rankForWorld } from '../behavior'
import type { OrbitPrefs } from '../prefs'
import type { Listing } from '../../types'
import { adzunaAppId, adzunaAppKey, jobFeedApiKey, jobFeedUrl } from './partnerEnv'
import { arbeitsagenturJobSearchUrl, indeedJobSearchUrl } from './partnerLinks'

export type JobHitMode = 'orbit' | 'partner-link' | 'feed'

export interface JobSearchHit {
  id: string
  title: string
  company: string
  location?: string
  snippet?: string
  mode: JobHitMode
  orbitListingId?: string
  externalUrl?: string
  sourceLabel: string
}

function listingToHit(listing: Listing): JobSearchHit {
  return {
    id: `orbit-job-${listing.id}`,
    title: listing.title,
    company: listing.ownerName || listing.city || 'Allda',
    location: listing.city,
    snippet: listing.description?.slice(0, 160),
    mode: 'orbit',
    orbitListingId: listing.id,
    sourceLabel: 'Allda',
  }
}

function matchesQuery(hit: JobSearchHit, q: string): boolean {
  if (!q.trim()) return true
  const hay = `${hit.title} ${hit.company} ${hit.location || ''} ${hit.snippet || ''}`.toLowerCase()
  return hay.includes(q.trim().toLowerCase())
}

function partnerJobHits(q: string, location: string | undefined, locale: 'de' | 'en'): JobSearchHit[] {
  if (!q.trim() && !location?.trim()) return []
  const query = q.trim() || (locale === 'de' ? 'Job' : 'job')
  return [
    {
      id: `partner-arbeitsagentur-${query}-${location || ''}`,
      title: locale === 'de' ? `Jobsuche: ${query}` : `Job search: ${query}`,
      company: locale === 'de' ? 'Bundesagentur für Arbeit' : 'Federal Employment Agency',
      location,
      mode: 'partner-link',
      externalUrl: arbeitsagenturJobSearchUrl(query, location),
      sourceLabel: 'arbeitsagentur.de',
    },
    {
      id: `partner-indeed-${query}-${location || ''}`,
      title: locale === 'de' ? `Indeed: ${query}` : `Indeed: ${query}`,
      company: 'Indeed',
      location,
      mode: 'partner-link',
      externalUrl: indeedJobSearchUrl(query, location),
      sourceLabel: 'indeed.com',
    },
  ]
}

async function fetchAdzuna(q: string, location: string | undefined, signal?: AbortSignal): Promise<JobSearchHit[]> {
  const appId = adzunaAppId()
  const appKey = adzunaAppKey()
  if (!appId || !appKey || !q.trim()) return []
  const where = location?.trim() || 'Berlin'
  const url = `https://api.adzuna.com/v1/api/jobs/de/search/1?${new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: '8',
    what: q.trim(),
    where,
  })}`
  const res = await fetch(url, { signal })
  if (!res.ok) return []
  const data = (await res.json()) as { results?: Array<{ id?: string; title?: string; company?: { display_name?: string }; location?: { display_name?: string }; redirect_url?: string; description?: string }> }
  const rows = data.results || []
  return rows.map((row) => ({
    id: `adzuna-${row.id || row.title}`,
    title: row.title || 'Job',
    company: row.company?.display_name || 'Adzuna',
    location: row.location?.display_name,
    snippet: row.description?.replace(/<[^>]+>/g, '').slice(0, 160),
    mode: 'feed' as const,
    externalUrl: row.redirect_url,
    sourceLabel: 'Adzuna',
  }))
}

async function fetchConfiguredFeed(signal?: AbortSignal): Promise<JobSearchHit[]> {
  const base = jobFeedUrl()
  if (!base) return []
  const headers: Record<string, string> = { Accept: 'application/json' }
  const key = jobFeedApiKey()
  if (key) headers.Authorization = `Bearer ${key}`
  const res = await fetch(base, { headers, signal })
  if (!res.ok) return []
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return data
    .map((row: Record<string, unknown>, index: number) => {
      const title = typeof row.title === 'string' ? row.title : null
      if (!title) return null
      return {
        id: `feed-${row.id || index}`,
        title,
        company: typeof row.company === 'string' ? row.company : 'Feed',
        location: typeof row.location === 'string' ? row.location : undefined,
        snippet: typeof row.snippet === 'string' ? row.snippet : undefined,
        mode: 'feed' as const,
        externalUrl: typeof row.url === 'string' ? row.url : undefined,
        sourceLabel: 'Job feed',
      } satisfies JobSearchHit
    })
    .filter(Boolean) as JobSearchHit[]
}

export async function searchJobProviders(input: {
  q?: string
  location?: string
  prefs: OrbitPrefs
  locale?: 'de' | 'en'
  signal?: AbortSignal
}): Promise<JobSearchHit[]> {
  const locale = input.locale ?? 'de'
  const q = input.q?.trim() || ''
  const location = input.location?.trim() || input.prefs.seeker.cities?.[0]?.trim()

  const orbitPool = store
    .listListings({})
    .filter((l) => l.status === 'active' && (deriveMarketType(l) === 'job' || deriveMarketType(l) === 'minijob'))
  const orbit = rankForWorld(orbitPool, input.prefs)
    .map(listingToHit)
    .filter((h) => matchesQuery(h, q))

  const feed = [...(await fetchConfiguredFeed(input.signal)), ...(await fetchAdzuna(q, location, input.signal))].filter(
    (h) => matchesQuery(h, q),
  )

  const partners = partnerJobHits(q, location, locale)

  const seen = new Set<string>()
  const out: JobSearchHit[] = []
  for (const batch of [orbit, feed, partners]) {
    for (const h of batch) {
      if (seen.has(h.id)) continue
      seen.add(h.id)
      out.push(h)
    }
  }
  return out
}
