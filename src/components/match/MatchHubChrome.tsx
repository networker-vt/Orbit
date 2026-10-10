import { useState } from 'react'
import { Camera, ChevronDown, Plus, RefreshCw } from 'lucide-react'
import { Button, ButtonLink } from '../ui/Button'
import { cn } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import {
  MATCH_HUB_LANES,
  createPathForHubLane,
  hubLaneLegalNote,
  type MatchHubLane,
} from '../../lib/matchHub'
import type { PhotoListingMode } from '../../lib/sellByPhoto'

/** Secondary marketplace tools under rubrics (minijob, foto verkaufen/tauschen, mobility…). */
export function MatchHubChrome({
  lane,
  onLane,
  cardCount,
  onPhotoListing,
}: {
  lane: MatchHubLane
  onLane: (lane: MatchHubLane) => void
  cardCount: number
  onPhotoListing?: (mode: PhotoListingMode) => void
}) {
  const { t, resolved } = useI18n()
  const [open, setOpen] = useState(() => lane !== 'all')
  const note = hubLaneLegalNote(lane === 'all' ? 'sell' : lane)
  const noteText = resolved === 'de' ? note.de : note.en
  const toolLanes = MATCH_HUB_LANES.filter((id) => id !== 'all')

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-surface-2/60 p-3" data-match-hub="1">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
        data-match-tools-toggle="1"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <p className="text-xs font-semibold text-ink">{t('match.toolsTitle')}</p>
          <p className="text-xs text-muted">{t('match.toolsLead')}</p>
        </div>
        <ChevronDown size={18} className={cn('shrink-0 text-muted transition', open && 'rotate-180')} />
      </button>

      {/* Always-visible Foto entries — Haus: verkaufen / tauschen PERFEKT */}
      <div className="flex flex-wrap gap-2" data-photo-entries="1">
        <Button
          size="sm"
          type="button"
          variant="primary"
          onClick={() => onPhotoListing?.('sell')}
          data-sell-photo-cta="1"
        >
          <Camera size={14} /> {t('sell.cta')}
        </Button>
        <Button
          size="sm"
          type="button"
          variant="secondary"
          onClick={() => onPhotoListing?.('barter')}
          data-barter-photo-cta="1"
        >
          <RefreshCw size={14} /> {t('photoTrade.cta')}
        </Button>
      </div>

      {open && (
        <div className="space-y-2 pt-1">
          <p
            className={cn(
              'rounded-xl border px-3 py-2 text-xs leading-relaxed',
              note.tone === 'warn'
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                : 'border-border bg-black/20 text-neutral-300',
            )}
            data-match-legal={lane}
          >
            {noteText}
          </p>

          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t('match.hubLanes')}>
            {toolLanes.map((id) => (
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
                {t(`market.${id}` as 'market.job')}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {lane !== 'sell' && lane !== 'barter' && (
              <ButtonLink size="sm" variant="secondary" to={createPathForHubLane(lane === 'all' ? 'job' : lane)}>
                <Plus size={14} /> {t('match.hubPost')}
              </ButtonLink>
            )}
            <span className="text-xs text-muted">
              {cardCount} {t('match.cards')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
