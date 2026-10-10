import { ExternalLink } from 'lucide-react'
import { openExternalSearchUrl, type OrbitAiWebSearchOffer } from '../../lib/orbitAiWebSearch'
import { useI18n } from '../../lib/i18n'

type Props = {
  offer: OrbitAiWebSearchOffer
}

export function OrbitAiWebSearch({ offer }: Props) {
  const { t } = useI18n()
  if (!offer.links.length) return null
  return (
    <div
      className="rounded-2xl border border-border bg-surface-2/60 px-3 py-3"
      data-orbit-ai-web-search="1"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {t('orbitAi.webSearchTitle')}
      </p>
      <ul className="mt-2 space-y-2">
        {offer.links.map((link) => (
          <li key={`${link.provider}-${link.href}`}>
            <button
              type="button"
              className="flex w-full min-h-11 items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-left text-sm text-ink hover:border-[var(--theme-accent)]/45"
              onClick={() => void openExternalSearchUrl(link.href)}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{link.label}</span>
                <span className="block text-xs text-muted">{link.providerLabel}</span>
              </span>
              <ExternalLink size={16} className="shrink-0 text-[var(--theme-accent)]" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-muted">{t('orbitAi.webSearchNote')}</p>
    </div>
  )
}
