import { Link } from 'react-router-dom'
import { Share2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export type TileTone = 'teal' | 'amber' | 'violet' | 'sky' | 'rose' | 'lime' | 'indigo' | 'slate' | 'orange'

export interface HubTile {
  id?: string
  to: string
  label: string
  /** Visible emoji — required so every tip tile has a thematic mark. */
  emoji: string
  /** Replaces the emoji when set. `share` is the neutral recommend mark. */
  icon?: 'share'
  /** Optional small thematic image; emoji still shown if image fails. */
  image?: string
  tone: TileTone
  demo?: boolean
}

const TONE: Record<TileTone, string> = {
  teal: 'border-teal/35 bg-teal/12 text-teal',
  amber: 'border-amber-300/40 bg-amber-200/15 text-amber-200',
  violet: 'border-violet-300/40 bg-violet-200/12 text-violet-300',
  sky: 'border-cyan/35 bg-cyan/12 text-cyan',
  rose: 'border-rose-300/40 bg-rose-300/12 text-rose-300',
  lime: 'border-emerald-300/40 bg-emerald-300/12 text-emerald-300',
  indigo: 'border-[var(--theme-accent)]/30 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]',
  slate: 'border-border bg-surface-3 text-ink-soft',
  orange: 'border-amber-300/50 bg-amber-200/20 text-amber-200',
}

export function TileGrid({
  tiles,
  columns = 2,
  label,
  iconSize = 'md',
}: {
  tiles: HubTile[]
  columns?: 2 | 3
  label?: string
  /** Home „Mehr entdecken“ uses larger marks. */
  iconSize?: 'md' | 'lg'
}) {
  const mark =
    iconSize === 'lg'
      ? 'h-14 w-14 rounded-2xl text-[2.1rem]'
      : 'h-11 w-11 rounded-xl text-[1.65rem]'
  const sharePx = iconSize === 'lg' ? 28 : 22
  const imgClass = iconSize === 'lg' ? 'h-10 w-10 object-contain' : 'h-8 w-8 object-contain'
  return (
    <ul
      data-tile-grid={tiles.length}
      data-tile-icon-size={iconSize}
      aria-label={label}
      className={cn('grid gap-3', columns === 3 ? 'grid-cols-3' : 'grid-cols-2')}
    >
      {tiles.map((tile) => (
        <li key={`${tile.id ?? tile.to}:${tile.label}`}>
          <Link
            to={tile.to}
            data-tile-id={tile.id}
            data-tile-emoji={tile.emoji}
            className={cn(
              'btn-press flex flex-col items-start justify-between rounded-2xl border-2 px-3 py-3',
              iconSize === 'lg' ? 'min-h-[7.5rem]' : 'min-h-[6.25rem]',
              TONE[tile.tone],
            )}
          >
            <span
              className={cn(
                'flex items-center justify-center overflow-hidden bg-surface/80 leading-none shadow-sm',
                mark,
              )}
            >
              {tile.icon === 'share' ? (
                <Share2 size={sharePx} aria-hidden />
              ) : tile.image ? (
                <img src={tile.image} alt="" className={imgClass} />
              ) : (
                <span aria-hidden>{tile.emoji}</span>
              )}
            </span>
            <span className="mt-3 flex w-full items-end justify-between gap-2">
              <span className="text-sm font-semibold leading-tight text-ink">{tile.label}</span>
              {tile.demo && (
                <span className="shrink-0 rounded-full border border-current/30 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
                  Demo
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
