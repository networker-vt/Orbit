import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { useI18n } from '../../lib/i18n'
import { openPartnerUrl } from '../../lib/providers/openPartnerUrl'
import type { TravelSearchHit } from '../../lib/providers/travelProviders'
import { TRAVEL_KIND_META } from '../../lib/travel'
import { cn, formatPrice } from '../../lib/utils'

export function TravelResultCard({ hit, compact }: { hit: TravelSearchHit; compact?: boolean }) {
  const { t, resolved } = useI18n()
  const meta = TRAVEL_KIND_META[hit.kind]
  const kindLabel = resolved === 'de' ? meta.de : meta.en

  return (
    <article
      className={cn(
        'flex items-start gap-3 rounded-2xl border border-border bg-surface-2/70 px-3 py-3',
        hit.mode === 'live' && 'border-[var(--theme-accent)]/35',
      )}
      data-travel-hit={hit.mode}
      data-travel-kind={hit.kind}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-3 text-xl">
        {hit.imageEmoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-ink">{hit.title}</p>
          {hit.mode === 'demo' && <Badge tone="amber">{t('badge.demo')}</Badge>}
          {hit.mode === 'live' && (
            <Badge className="border-[var(--theme-accent)]/40 bg-[var(--theme-accent)]/15 text-xs">
              {t('providers.live')}
            </Badge>
          )}
          {hit.cheapest && hit.priceEur != null && (
            <Badge className="border-teal/40 bg-teal/15 text-xs">{t('travel.cheapest')}</Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {kindLabel} · {hit.provider}
          {hit.duration ? ` · ${hit.duration}` : ''}
        </p>
        {hit.tags.length > 0 && !compact && (
          <p className="mt-1 truncate text-xs text-neutral-500">{hit.tags.join(' · ')}</p>
        )}
        <p className="mt-2 text-sm font-semibold tabular-nums text-ink">
          {hit.priceEur != null ? formatPrice(hit.priceEur) : t('travel.partnerPrice')}
        </p>
      </div>
      <Button
        size="sm"
        type="button"
        className="shrink-0 self-center"
        onClick={() => void openPartnerUrl(hit.bookingUrl)}
        data-travel-book="1"
      >
        {t('travel.bookPartner')}
      </Button>
    </article>
  )
}
