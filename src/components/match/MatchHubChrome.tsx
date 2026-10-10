import { Camera, Plus } from 'lucide-react'
import { Button, ButtonLink } from '../ui/Button'
import { cn } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import {
  MATCH_HUB_LANES,
  createPathForHubLane,
  hubLaneLegalNote,
  type MatchHubLane,
} from '../../lib/matchHub'

export function MatchHubChrome({
  lane,
  onLane,
  cardCount,
  onSellPhoto,
}: {
  lane: MatchHubLane
  onLane: (lane: MatchHubLane) => void
  cardCount: number
  onSellPhoto?: () => void
}) {
  const { t, resolved } = useI18n()
  const note = hubLaneLegalNote(lane)
  const noteText = resolved === 'de' ? note.de : note.en

  return (
    <div className="space-y-3" data-match-hub="1">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--theme-accent)]">
          {t('match.hubKicker')}
        </p>
        <h1 className="text-xl font-bold tracking-tight">{t('match.hubTitle')}</h1>
        <p className="text-xs text-muted">{t('match.hubLead')}</p>
      </header>

      <p
        className={cn(
          'rounded-xl border px-3 py-2 text-xs leading-relaxed',
          note.tone === 'warn'
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
            : 'border-border bg-surface-2 text-neutral-300',
        )}
        data-match-legal={lane}
      >
        {noteText}
      </p>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t('match.hubLanes')}>
        {MATCH_HUB_LANES.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={lane === id}
            data-match-lane={id}
            onClick={() => onLane(id)}
            className={cn(
              'min-h-9 rounded-full border px-3 text-xs font-medium',
              lane === id
                ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15 text-ink'
                : 'border-border text-neutral-300',
            )}
          >
            {id === 'all' ? t('market.all') : t(`market.${id}` as 'market.job')}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {lane === 'sell' ? (
          <Button size="sm" type="button" onClick={onSellPhoto} data-sell-photo-cta="1">
            <Camera size={14} /> {t('sell.cta')}
          </Button>
        ) : (
          <ButtonLink size="sm" variant="primary" to={createPathForHubLane(lane)}>
            <Plus size={14} /> {t('match.hubPost')}
          </ButtonLink>
        )}
        <span className="text-xs text-muted">
          {cardCount} {t('match.cards')}
        </span>
      </div>
    </div>
  )
}
