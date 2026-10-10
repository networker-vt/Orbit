import { useEffect, useMemo, useState } from 'react'
import type { HomeNewsItem } from '../../data/homeNews'
import { HOME_NEWS } from '../../data/homeNews'
import { newsTitle } from '../../lib/homeSuggestions'
import { fetchNewsFromSources } from '../../lib/newsFeedFetch'
import {
  getNewsFeedSources,
  subscribeNewsFeed,
  type NewsFeedSource,
} from '../../lib/newsFeedSources'
import { useI18n } from '../../lib/i18n'
import { NewsFeedEditor } from './NewsFeedEditor'

type FeedState = 'live' | 'curated' | 'fallback'

/**
 * Horizontal news ticker (right → left). Loads the user's RSS/Atom/API selection
 * from localStorage; on failure uses curated HOME_NEWS for those sources only.
 */
export function NewsStrip({ items }: { items: HomeNewsItem[] }) {
  const { t, resolved } = useI18n()
  const locale = resolved === 'en' ? 'en' : 'de'
  const [sources, setSources] = useState<NewsFeedSource[]>(() => getNewsFeedSources(locale))
  const [feed, setFeed] = useState<HomeNewsItem[]>(() => curatedFallback(items, sources))
  const [mode, setMode] = useState<FeedState>('curated')

  useEffect(() => subscribeNewsFeed(() => setSources(getNewsFeedSources(locale))), [locale])

  useEffect(() => {
    const fallback = curatedFallback(items, sources)
    if (import.meta.env.MODE === 'test') {
      setFeed(fallback)
      setMode(fallback.length ? 'curated' : 'fallback')
      return
    }
    let alive = true
    const ac = new AbortController()
    void fetchNewsFromSources(sources, ac.signal)
      .then((remote) => {
        if (!alive) return
        if (!remote.length) {
          setFeed(fallback)
          setMode(fallback.length ? 'curated' : 'fallback')
          return
        }
        setFeed(remote)
        setMode('live')
      })
      .catch((err: unknown) => {
        if (!alive || (err instanceof DOMException && err.name === 'AbortError')) return
        setFeed(fallback)
        setMode(fallback.length ? 'curated' : 'fallback')
      })
    return () => {
      alive = false
      ac.abort()
    }
  }, [items, sources])

  const track = useMemo(() => {
    const base = feed.length ? feed : curatedFallback(items, sources)
    return base.length ? [...base, ...base] : []
  }, [feed, items, sources])

  if (track.length === 0) return null

  const sourceLabel = sources.map((s) => s.source).join(' · ')
  const modeLabel =
    mode === 'live'
      ? `${t('news.livePrefix')} · ${sourceLabel}`
      : mode === 'curated'
        ? `${t('news.demoPrefix')} · ${sourceLabel}`
        : t('news.fallback')

  return (
    <section className="space-y-1.5" aria-label={t('news.title')} data-news-ticker="1">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          {t('news.title')} · {modeLabel}
        </p>
      </div>
      <div className="news-ticker overflow-hidden rounded-xl border border-border/60 bg-surface-2">
        <ul className="news-ticker-track flex w-max gap-6 py-2.5 pl-4" aria-live="off">
          {track.map((item, i) => (
            <li key={`${item.id}-${i}`} className="shrink-0">
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-baseline gap-2 text-xs hover:text-ink"
              >
                <span className="font-semibold uppercase tracking-wide text-[var(--theme-accent)]">
                  {item.source}
                </span>
                <span className="max-w-[18rem] truncate text-ink-soft sm:max-w-xs">
                  {newsTitle(item, resolved)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <NewsFeedEditor variant="home" />
    </section>
  )
}

function curatedFallback(items: HomeNewsItem[], sources: NewsFeedSource[]): HomeNewsItem[] {
  const slugs = new Set(sources.map((s) => s.source.toLowerCase()))
  const fromRank = items.filter((i) => slugs.has(i.source.toLowerCase()))
  if (fromRank.length) return fromRank
  return HOME_NEWS.filter((i) => slugs.has(i.source.toLowerCase()))
}
