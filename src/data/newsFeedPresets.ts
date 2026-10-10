/** Public RSS/Atom/API feeds only — no paywall scraping. */
export type NewsFeedKind = 'rss' | 'atom' | 'tagesschau-json'

export interface NewsFeedPreset {
  id: string
  labelDe: string
  labelEn: string
  feedUrl: string
  /** Short slug shown in the ticker (e.g. tagesschau). */
  source: string
  kind: NewsFeedKind
}

export const NEWS_FEED_PRESETS: NewsFeedPreset[] = [
  {
    id: 'preset-tagesschau',
    labelDe: 'tagesschau',
    labelEn: 'tagesschau',
    feedUrl: 'https://www.tagesschau.de/api2u/news/',
    source: 'tagesschau',
    kind: 'tagesschau-json',
  },
  {
    id: 'preset-heise',
    labelDe: 'heise online',
    labelEn: 'heise online',
    feedUrl: 'https://www.heise.de/rss/heise-atom.xml',
    source: 'heise',
    kind: 'atom',
  },
  {
    id: 'preset-spiegel',
    labelDe: 'SPIEGEL Schlagzeilen',
    labelEn: 'SPIEGEL headlines',
    feedUrl: 'https://www.spiegel.de/schlagzeilen/index.rss',
    source: 'spiegel',
    kind: 'rss',
  },
  {
    id: 'preset-zeit',
    labelDe: 'ZEIT Nachrichten',
    labelEn: 'ZEIT news',
    feedUrl: 'https://newsfeed.zeit.de/index',
    source: 'zeit',
    kind: 'rss',
  },
]

export function presetById(id: string): NewsFeedPreset | undefined {
  return NEWS_FEED_PRESETS.find((p) => p.id === id)
}
