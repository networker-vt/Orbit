import type { HomeNewsItem } from '../data/homeNews'
import type { NewsFeedKind } from '../data/newsFeedPresets'
import type { NewsFeedSource } from './newsFeedSources'

const PROXY = 'https://api.allorigins.win/raw?url='

export function corsProxyFeedUrl(feedUrl: string): string {
  return `${PROXY}${encodeURIComponent(feedUrl)}`
}

export async function fetchNewsFromSources(
  sources: NewsFeedSource[],
  signal: AbortSignal,
): Promise<HomeNewsItem[]> {
  if (!sources.length) return []
  const batches = await Promise.allSettled(
    sources.map((src) => fetchOneSource(src, signal)),
  )
  const merged: HomeNewsItem[] = []
  const seen = new Set<string>()
  for (const batch of batches) {
    if (batch.status !== 'fulfilled') continue
    for (const item of batch.value) {
      if (seen.has(item.href)) continue
      seen.add(item.href)
      merged.push(item)
    }
  }
  return merged.slice(0, 24)
}

async function fetchOneSource(src: NewsFeedSource, signal: AbortSignal): Promise<HomeNewsItem[]> {
  const proxied = corsProxyFeedUrl(src.feedUrl)
  const res = await fetch(proxied, { signal })
  if (!res.ok) throw new Error(`feed_${src.id}_${res.status}`)
  const body = await res.text()
  if (src.kind === 'tagesschau-json') {
    return parseTagesschauJson(body, src.source)
  }
  return parseFeedXml(body, src.source, src.kind)
}

export function parseTagesschauJson(body: string, sourceSlug: string): HomeNewsItem[] {
  let data: {
    news?: Array<{
      sophoraId?: string
      title?: string
      shareURL?: string
      externalId?: string
      tags?: Array<{ tag?: string }>
    }>
  }
  try {
    data = JSON.parse(body) as typeof data
  } catch {
    return []
  }
  return (data.news ?? [])
    .filter((n) => n.title && (n.shareURL || n.externalId))
    .slice(0, 8)
    .map((n, idx) => ({
      id: n.sophoraId || n.externalId || `${sourceSlug}-${idx}`,
      cat: 'politik' as const,
      titleDe: n.title!,
      titleEn: n.title!,
      source: sourceSlug,
      href: n.shareURL || 'https://www.tagesschau.de/',
      tags: (n.tags ?? []).map((x) => x.tag).filter((x): x is string => Boolean(x)),
    }))
}

export function parseFeedXml(body: string, sourceSlug: string, kind: NewsFeedKind): HomeNewsItem[] {
  if (typeof DOMParser === 'undefined') return []
  const doc = new DOMParser().parseFromString(body, 'application/xml')
  if (doc.querySelector('parsererror')) return []

  const entries =
    kind === 'atom'
      ? [...doc.querySelectorAll('entry')]
      : [...doc.querySelectorAll('item')]

  const out: HomeNewsItem[] = []
  for (const [idx, entry] of entries.entries()) {
    if (out.length >= 8) break
    const title = textContent(entry, 'title')
    const link = feedEntryLink(entry, kind)
    if (!title || !link) continue
    out.push({
      id: `${sourceSlug}-${idx}-${hashStable(link)}`,
      cat: 'tech',
      titleDe: title,
      titleEn: title,
      source: sourceSlug,
      href: link,
      tags: [],
    })
  }
  return out
}

function textContent(el: Element, tag: string): string {
  const node = el.querySelector(tag)
  return node?.textContent?.trim().replace(/\s+/g, ' ') ?? ''
}

function feedEntryLink(entry: Element, kind: NewsFeedKind): string | null {
  if (kind === 'atom') {
    const links = [...entry.querySelectorAll('link')]
    const alt = links.find((l) => l.getAttribute('rel') === 'alternate' && l.getAttribute('href'))
    const any = links.find((l) => l.getAttribute('href'))
    const href = alt?.getAttribute('href') || any?.getAttribute('href')
    return href && href.startsWith('https:') ? href : null
  }
  const link = entry.querySelector('link')?.textContent?.trim()
  if (link && link.startsWith('https:')) return link
  const guid = entry.querySelector('guid')?.textContent?.trim()
  if (guid && guid.startsWith('https:')) return guid
  return null
}

function hashStable(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}
