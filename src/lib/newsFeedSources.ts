/**
 * User-built Home news ticker sources (RSS/Atom / public APIs).
 * Storage: localStorage `orbit_news_feed_v1`
 * Event: `orbit-news-feed-changed`
 */

import {
  NEWS_FEED_PRESETS,
  presetById,
  type NewsFeedKind,
  type NewsFeedPreset,
} from '../data/newsFeedPresets'

export const NEWS_FEED_KEY = 'orbit_news_feed_v1'
export const NEWS_FEED_EVT = 'orbit-news-feed-changed'
export const NEWS_FEED_MAX = 12

export type NewsFeedSource = {
  id: string
  label: string
  feedUrl: string
  source: string
  kind: NewsFeedKind
  /** True when created from a built-in preset row. */
  preset?: boolean
}

type Stored = {
  order: string[]
  custom: Record<string, Omit<NewsFeedSource, 'id'>>
}

function defaultOrder(): string[] {
  return ['preset-tagesschau', 'preset-heise']
}

function presetToSource(p: NewsFeedPreset, locale: 'de' | 'en'): NewsFeedSource {
  return {
    id: p.id,
    label: locale === 'de' ? p.labelDe : p.labelEn,
    feedUrl: p.feedUrl,
    source: p.source,
    kind: p.kind,
    preset: true,
  }
}

function normalizeCustom(raw: unknown): Omit<NewsFeedSource, 'id'> | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const label = typeof o.label === 'string' ? o.label.trim().slice(0, 80) : ''
  const feedUrl = typeof o.feedUrl === 'string' ? o.feedUrl.trim() : ''
  const source = typeof o.source === 'string' ? o.source.trim().slice(0, 40) : ''
  const kind = o.kind === 'rss' || o.kind === 'atom' || o.kind === 'tagesschau-json' ? o.kind : 'rss'
  if (!label || !isAllowedFeedUrl(feedUrl) || !source) return null
  return { label, feedUrl, source, kind, preset: false }
}

function loadStored(): Stored {
  try {
    const raw = localStorage.getItem(NEWS_FEED_KEY)
    if (!raw) return { order: defaultOrder(), custom: {} }
    const parsed = JSON.parse(raw) as Stored
    const order = Array.isArray(parsed.order)
      ? parsed.order.filter((id): id is string => typeof id === 'string')
      : defaultOrder()
    const custom: Record<string, Omit<NewsFeedSource, 'id'>> = {}
    if (parsed.custom && typeof parsed.custom === 'object') {
      for (const [id, row] of Object.entries(parsed.custom)) {
        const clean = normalizeCustom(row)
        if (clean) custom[id] = clean
      }
    }
    return { order: sanitizeOrder(order, custom), custom }
  } catch {
    return { order: defaultOrder(), custom: {} }
  }
}

function sanitizeOrder(order: string[], custom: Record<string, Omit<NewsFeedSource, 'id'>>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of order) {
    if (seen.has(id)) continue
    if (presetById(id) || custom[id]) {
      seen.add(id)
      out.push(id)
    }
    if (out.length >= NEWS_FEED_MAX) break
  }
  if (out.length === 0) return defaultOrder()
  return out
}

let cache: Stored | null = null

function getStored(): Stored {
  if (!cache) cache = loadStored()
  return cache
}

function commit(next: Stored) {
  cache = next
  try {
    localStorage.setItem(NEWS_FEED_KEY, JSON.stringify(next))
  } catch {
    /* private mode */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NEWS_FEED_EVT))
  }
}

/** HTTPS feed URLs only — user responsibility for publisher terms. */
export function isAllowedFeedUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    if (u.username || u.password) return false
    const host = u.hostname.toLowerCase()
    if (host === 'localhost' || host.endsWith('.local')) return false
    return u.href.length <= 512
  } catch {
    return false
  }
}

export function slugFromFeedUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    const base = host.split('.')[0] || 'feed'
    return base.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24) || 'feed'
  } catch {
    return 'feed'
  }
}

export function getNewsFeedSources(locale: 'de' | 'en' = 'de'): NewsFeedSource[] {
  const { order, custom } = getStored()
  const out: NewsFeedSource[] = []
  for (const id of order) {
    const preset = presetById(id)
    if (preset) {
      out.push(presetToSource(preset, locale))
      continue
    }
    const row = custom[id]
    if (row) out.push({ id, ...row })
  }
  return out
}

export function getAvailablePresets(_locale: 'de' | 'en'): NewsFeedPreset[] {
  const active = new Set(getStored().order)
  return NEWS_FEED_PRESETS.filter((p) => !active.has(p.id))
}

export function setNewsFeedOrder(ids: string[]): NewsFeedSource[] {
  const stored = getStored()
  const next = sanitizeOrder(ids, stored.custom)
  commit({ ...stored, order: next })
  return getNewsFeedSources()
}

export function addPresetFeed(presetId: string, locale: 'de' | 'en'): NewsFeedSource[] {
  if (!presetById(presetId)) return getNewsFeedSources(locale)
  const stored = getStored()
  if (stored.order.includes(presetId)) return getNewsFeedSources(locale)
  const order = sanitizeOrder([...stored.order, presetId], stored.custom)
  commit({ ...stored, order })
  return getNewsFeedSources(locale)
}

export function addCustomFeed(input: {
  label: string
  feedUrl: string
  source?: string
  kind?: NewsFeedKind
}, locale: 'de' | 'en'): { ok: true; sources: NewsFeedSource[] } | { ok: false; reason: 'url' | 'label' | 'max' } {
  const label = input.label.trim().slice(0, 80)
  const feedUrl = input.feedUrl.trim()
  if (!label) return { ok: false, reason: 'label' }
  if (!isAllowedFeedUrl(feedUrl)) return { ok: false, reason: 'url' }
  const stored = getStored()
  if (stored.order.length >= NEWS_FEED_MAX) return { ok: false, reason: 'max' }
  const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const source = (input.source?.trim() || slugFromFeedUrl(feedUrl)).slice(0, 40)
  const kind = input.kind ?? guessFeedKind(feedUrl)
  const custom = { ...stored.custom, [id]: { label, feedUrl, source, kind, preset: false as const } }
  const order = sanitizeOrder([...stored.order, id], custom)
  commit({ order, custom })
  return { ok: true, sources: getNewsFeedSources(locale) }
}

export function removeNewsFeedSource(id: string, locale: 'de' | 'en'): NewsFeedSource[] {
  const stored = getStored()
  const order = stored.order.filter((x) => x !== id)
  const custom = { ...stored.custom }
  delete custom[id]
  commit({ order: sanitizeOrder(order.length ? order : defaultOrder(), custom), custom })
  return getNewsFeedSources(locale)
}

export function moveNewsFeedSource(id: string, dir: -1 | 1, locale: 'de' | 'en'): NewsFeedSource[] {
  const stored = getStored()
  const idx = stored.order.indexOf(id)
  if (idx < 0) return getNewsFeedSources(locale)
  const nextIdx = idx + dir
  if (nextIdx < 0 || nextIdx >= stored.order.length) return getNewsFeedSources(locale)
  const order = [...stored.order]
  ;[order[idx], order[nextIdx]] = [order[nextIdx], order[idx]]
  commit({ ...stored, order })
  return getNewsFeedSources(locale)
}

function guessFeedKind(url: string): NewsFeedKind {
  const lower = url.toLowerCase()
  if (lower.includes('tagesschau.de/api')) return 'tagesschau-json'
  if (lower.includes('atom')) return 'atom'
  return 'rss'
}

export function subscribeNewsFeed(cb: () => void) {
  const handler = () => {
    cache = null
    cb()
  }
  window.addEventListener(NEWS_FEED_EVT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(NEWS_FEED_EVT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function resetNewsFeedSources() {
  commit({ order: defaultOrder(), custom: {} })
}
