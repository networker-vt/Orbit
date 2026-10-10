import { useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import { cn } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'

const THRESHOLD = 88

/**
 * Primary Match decision UX: horizontal swipe.
 * Right = interest, left = skip. Buttons remain as a11y fallback outside.
 */
export function SwipeCardShell({
  children,
  onInterest,
  onSkip,
  disabled,
}: {
  children: ReactNode
  onInterest: () => void
  onSkip: () => void
  disabled?: boolean
}) {
  const { t } = useI18n()
  const startX = useRef<number | null>(null)
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)

  const reset = () => {
    startX.current = null
    setDx(0)
    setDragging(false)
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    if (disabled) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    startX.current = e.clientX
    setDragging(true)
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    if (startX.current == null) return
    setDx(e.clientX - startX.current)
  }

  const onPointerUp = () => {
    if (startX.current == null) return
    const delta = dx
    reset()
    if (delta >= THRESHOLD) onInterest()
    else if (delta <= -THRESHOLD) onSkip()
  }

  const rot = Math.max(-12, Math.min(12, dx / 18))
  const label =
    dx > 40 ? t('match.interest') : dx < -40 ? t('match.skip') : null

  return (
    <div
      className="relative touch-pan-y select-none"
      data-match-swipe="1"
      style={{ touchAction: 'pan-y' }}
    >
      <div
        role="group"
        aria-roledescription="swipe card"
        aria-label={t('match.swipeHint')}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={reset}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'ArrowRight' || e.key === 'Enter') {
            e.preventDefault()
            onInterest()
          }
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            onSkip()
          }
        }}
        className={cn(
          'cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]',
          dragging && 'transition-none',
        )}
        style={{
          transform: `translateX(${dx}px) rotate(${rot}deg)`,
          transition: dragging ? 'none' : 'transform 180ms ease-out',
        }}
      >
        {label && (
          <div
            className={cn(
              'pointer-events-none absolute left-4 top-4 z-10 rounded-lg border-2 px-3 py-1 text-sm font-bold uppercase tracking-wider',
              dx > 0
                ? 'border-[var(--theme-accent)] text-[var(--theme-accent)]'
                : 'border-rose-400 text-rose-300',
            )}
            data-match-swipe-label={dx > 0 ? 'interest' : 'skip'}
          >
            {label}
          </div>
        )}
        {children}
      </div>
      <p className="mt-2 text-center text-xs text-muted">{t('match.swipeHint')}</p>
    </div>
  )
}
