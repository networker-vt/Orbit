import { useEffect, useMemo, useState } from 'react'
import type { HomeNewsItem } from '../../data/homeNews'
import { HOME_NEWS } from '../../data/homeNews'
import { newsTitle } from '../../lib/homeSuggestions'
import { useI18n } from '../../lib/i18n'

type FeedState = 'live' | 'curated' | 'fallback'

/**
 * Horizontal news ticker (right → left). Tries public RSS via a CORS-friendly
 * read path; on failure uses curated HOME_NEWS with honest attribution.
 */
export function NewsStrip({ items }: { items: HomeNewsItem[] }) {
  const { t, resolved } = useI18n()
  const [feed, setFeed] = useState<HomeNewsItem[]>(items.length ? items : HOME_NEWS)
  const [mode, setMode] = useState<FeedState>(items.length ? 'curated' : 'fallback')

  useEffect(() => {
    // Vitest/happy-dom: stay on curated seed — avoid flaky CORS proxies in CI.
    if (import.meta.env.MODE === 'test') {
      setFeed(items.length ? items : HOME_NEWS)
      setMode(items.length ? 'curated' : 'fallback')
      return
    }
    let alive = true
    const ac = new AbortController()
    void loadBreakingNews(ac.signal)
      .then((remote) => {
        if (!alive) return
        if (!remote.length) {
          setFeed(items.length ? items : HOME_NEWS)
          setMode(items.length ? 'curated' : 'fallback')
          return
        }
        setFeed(remote)
        setMode('live')
      })
      .catch((err: unknown) => {
        if (!alive || (err instanceof DOMException && err.name === 'AbortError')) return
        setFeed(items.length ? items : HOME_NEWS)
        setMode(items.length ? 'curated' : 'fallback')
      })
    return () => {
      alive = false
      ac.abort()
    }
  }, [items])

  const track = useMemo(() => {
    const base = feed.length ? feed : HOME_NEWS
    return [...base, ...base]
  }, [feed])

  if (track.length === 0) return null

  const modeLabel =
    mode === 'live' ? t('news.live') : mode === 'curated' ? t('news.demo') : t('news.fallback')

  return (
    <section className="space-y-1.5" aria-label={t('news.title')} data-news-ticker="1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        {t('news.title')} · {modeLabel}
      </p>
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
    </section>
  )
}

async function loadBreakingNews(signal: AbortSignal): Promise<HomeNewsItem[]> {
  // tagesschau Atom is freizugänglich; allorigins is a public CORS proxy for demos.
  const feedUrl = 'https://www.tagesschau.de/api2u/news/'
  const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`
  const res = await fetch(proxied, { signal })
  if (!res.ok) throw new Error(`news_${res.status}`)
  const data = (await res.json()) as {
    news?: Array<{
      sophoraId?: string
      title?: string
      shareURL?: string
      externalId?: string
      tags?: Array<{ tag?: string }>
    }>
  }
  const rows = (data.news ?? [])
    .filter((n) => n.title && (n.shareURL || n.externalId))
    .slice(0, 10)
  return rows.map((n, idx) => ({
    id: n.sophoraId || n.externalId || `ts-live-${idx}`,
    cat: 'politik' as const,
    titleDe: n.title!,
    titleEn: n.title!,
    source: 'tagesschau',
    href: n.shareURL || `https://www.tagesschau.de/`,
    tags: (n.tags ?? []).map((x) => x.tag).filter((x): x is string => Boolean(x)),
  }))
}
