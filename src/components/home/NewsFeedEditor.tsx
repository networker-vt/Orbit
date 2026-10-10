import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Rss, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  addCustomFeed,
  addPresetFeed,
  getAvailablePresets,
  getNewsFeedSources,
  moveNewsFeedSource,
  removeNewsFeedSource,
  subscribeNewsFeed,
  type NewsFeedSource,
} from '../../lib/newsFeedSources'
import { useI18n } from '../../lib/i18n'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

type Props = {
  /** Compact row on Home vs full block in Einstellungen */
  variant?: 'home' | 'settings'
}

export function NewsFeedEditor({ variant = 'home' }: Props) {
  const { t, resolved } = useI18n()
  const locale = resolved === 'en' ? 'en' : 'de'
  const [sources, setSources] = useState<NewsFeedSource[]>(() => getNewsFeedSources(locale))
  const [open, setOpen] = useState(variant === 'settings')
  const [label, setLabel] = useState('')
  const [feedUrl, setFeedUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => subscribeNewsFeed(() => setSources(getNewsFeedSources(locale))), [locale])

  const presets = getAvailablePresets(locale)

  const onAddCustom = () => {
    setError(null)
    const result = addCustomFeed({ label, feedUrl }, locale)
    if (!result.ok) {
      setError(
        result.reason === 'url'
          ? t('newsFeed.errUrl')
          : result.reason === 'max'
            ? t('newsFeed.errMax')
            : t('newsFeed.errLabel'),
      )
      return
    }
    setSources(result.sources)
    setLabel('')
    setFeedUrl('')
  }

  const body = (
    <div className="space-y-3" data-news-feed-editor={variant}>
      <p className="text-xs text-muted">{t('newsFeed.legal')}</p>
      <ul className="space-y-2">
        {sources.map((src, idx) => (
          <li
            key={src.id}
            className="flex items-center gap-2 rounded-xl border border-border/70 bg-black/20 px-3 py-2 text-sm"
          >
            <Rss size={14} className="shrink-0 text-[var(--theme-accent)]" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{src.label}</div>
              <div className="truncate text-[10px] text-muted">{src.feedUrl}</div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                className="min-h-9 min-w-9 rounded-lg text-muted hover:text-ink disabled:opacity-30"
                disabled={idx === 0}
                aria-label={t('newsFeed.moveUp')}
                onClick={() => setSources(moveNewsFeedSource(src.id, -1, locale))}
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                className="min-h-9 min-w-9 rounded-lg text-muted hover:text-ink disabled:opacity-30"
                disabled={idx === sources.length - 1}
                aria-label={t('newsFeed.moveDown')}
                onClick={() => setSources(moveNewsFeedSource(src.id, 1, locale))}
              >
                <ChevronDown size={16} />
              </button>
              <button
                type="button"
                className="min-h-9 min-w-9 rounded-lg text-rose-300 hover:text-rose-200 disabled:opacity-30"
                disabled={sources.length <= 1}
                aria-label={t('newsFeed.remove')}
                onClick={() => setSources(removeNewsFeedSource(src.id, locale))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {presets.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted">{t('newsFeed.presets')}</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border px-3 text-xs hover:border-[var(--theme-accent)]/45"
                onClick={() => setSources(addPresetFeed(p.id, locale))}
              >
                <Plus size={12} aria-hidden /> {locale === 'de' ? p.labelDe : p.labelEn}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 rounded-xl border border-dashed border-border/80 p-3">
        <p className="text-xs font-medium">{t('newsFeed.addCustom')}</p>
        <label className="block text-xs">
          {t('newsFeed.customLabel')}
          <Input className="mt-1" value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label className="block text-xs">
          {t('newsFeed.customUrl')}
          <Input
            className="mt-1"
            value={feedUrl}
            placeholder="https://…/feed.xml"
            onChange={(e) => setFeedUrl(e.target.value)}
          />
        </label>
        {error && <p className="text-xs text-amber-200">{error}</p>}
        <Button type="button" size="sm" variant="secondary" onClick={onAddCustom}>
          {t('newsFeed.add')}
        </Button>
      </div>
    </div>
  )

  if (variant === 'settings') {
    return (
      <section className="rounded-2xl border border-border bg-surface-2 p-4" id="newsfeed">
        <h2 className="text-lg font-semibold">{t('newsFeed.title')}</h2>
        <p className="mt-1 text-xs text-muted">{t('newsFeed.lead')}</p>
        <div className="mt-3">{body}</div>
      </section>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="text-xs text-muted hover:text-ink"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t('newsFeed.collapse') : t('newsFeed.edit')}
        </button>
        <Link to="/einstellung#newsfeed" className="text-xs text-muted hover:text-ink">
          {t('newsFeed.settingsLink')}
        </Link>
      </div>
      {open ? body : null}
    </div>
  )
}
