import { useEffect, useRef, useState } from 'react'
import idlePose from '../../assets/orbi/orbi-kind-idle.webp'
import {
  ORBI_DANCE_MS,
  ORBI_ERROR_MS,
  ORBI_WAVE_MS,
  isOrbiMotion,
  nextOrbiDanceDelay,
  orbiNavRunRemaining,
  poseAfterIdle,
  poseForTap,
  resolveOrbiPose,
  type OrbiMotion,
  type OrbiStage,
} from '../../lib/orbiMotion'
import { useI18n } from '../../lib/i18n'
import { orbiAriaLabel } from '../../lib/orbiMotion'
import { cn } from '../../lib/utils'

const poseCache: Partial<Record<OrbiMotion, string>> = { idle: idlePose }

const LAZY_POSE: Partial<Record<OrbiMotion, () => Promise<{ default: string }>>> = {
  winken: () => import('../../assets/orbi/orbi-kind-wave.webp'),
  tanzen: () => import('../../assets/orbi/orbi-kind-dance.webp'),
  arbeiten: () => import('../../assets/orbi/orbi-kind-work.webp'),
  rennen: () => import('../../assets/orbi/orbi-kind-run.webp'),
}

function usePoseSrc(motion: OrbiMotion) {
  const cached = poseCache[motion]
  const [src, setSrc] = useState(cached || idlePose)
  useEffect(() => {
    if (motion === 'idle') {
      setSrc(idlePose)
      return
    }
    const ready = poseCache[motion]
    if (ready) {
      setSrc(ready)
      return
    }
    let cancel = false
    const load = LAZY_POSE[motion]
    if (!load) {
      setSrc(idlePose)
      return
    }
    void load()
      .then((mod) => {
        poseCache[motion] = mod.default
        if (!cancel) setSrc(mod.default)
      })
      .catch(() => {
        if (!cancel) setSrc(idlePose)
      })
    return () => {
      cancel = true
    }
  }, [motion])
  return src
}

function lightHaptic() {
  const nav = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean }
  if (typeof nav.vibrate !== 'function') return
  try {
    nav.vibrate(10)
  } catch {
    /* some browsers expose vibrate but reject it */
  }
}

export type { OrbiMotion, OrbiStage }

/** Dev-only pin so a screenshot can hold one pose. Production builds drop this. */
function pinnedPose(): OrbiMotion | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('orbi')
  return isOrbiMotion(raw) ? raw : null
}

function initialLive(): OrbiMotion {
  return orbiNavRunRemaining() > 0 ? 'rennen' : 'idle'
}

/**
 * Orbi Kind — CSS pose swap. Idle WebP is eager; wave, dance, work and run load on use.
 * Idle bobs. Tap scales 0.98→1, waves, and ticks a light haptic when the device allows it.
 * After a random 8–16s idle, one dance, then idle again.
 * Busy shows work. A nav cue shows a short run. Reduced motion stays on the still idle frame.
 * Timers pause when the tab is hidden or Orbi is off screen.
 */
export function OrbitRobot({
  className,
  tapped = false,
  onTap,
  label,
  motion: motionProp,
  busy = false,
  reaction = null,
  size = 'hero',
  stage = 'kind',
}: {
  className?: string
  tapped?: boolean
  onTap?: () => void
  label?: string
  /** Controlled pose. Omit to let Orbi follow the provisional defaults. */
  motion?: OrbiMotion
  /** Loading or in-flight work. Shows the work pose. */
  busy?: boolean
  /** success waves, error shakes, then both return to idle. */
  reaction?: 'success' | 'error' | null
  size?: 'hero' | 'compact'
  /** Only Kind is shipped. Other stage names stay on the Kind art. */
  stage?: OrbiStage
}) {
  const slotRef = useRef<HTMLSpanElement>(null)
  const [live, setLive] = useState<OrbiMotion>(initialLive)
  const [pinned] = useState(pinnedPose)
  const [reduced, setReduced] = useState(false)
  const [paused, setPaused] = useState(false)
  const [seq, setSeq] = useState(0)
  const [reactionTick, setReactionTick] = useState(0)
  const [seenReaction, setSeenReaction] = useState(reaction)
  if (reaction !== seenReaction) {
    setSeenReaction(reaction)
    if (reaction) setReactionTick((n) => n + 1)
  }
  const entry = useRef<OrbiMotion>(initialLive())
  const [prevBusy, setPrevBusy] = useState(busy)
  if (busy !== prevBusy) {
    setPrevBusy(busy)
    if (!busy) setLive('idle')
  }

  const driven = motionProp == null && pinned == null
  const shown = resolveOrbiPose({
    reduced,
    pinned,
    motion: motionProp,
    busy,
    live,
  })

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const sync = () => {
      const hidden = document.visibilityState === 'hidden'
      const el = slotRef.current
      const box = el?.getBoundingClientRect()
      const off = !!box && box.height > 0 && (box.bottom <= 0 || box.top >= window.innerHeight)
      setPaused(hidden || off)
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    const el = slotRef.current
    const observer =
      el && typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            ([entry]) => {
              const hidden = document.visibilityState === 'hidden'
              setPaused(hidden || !entry?.isIntersecting)
            },
            { threshold: 0.2 },
          )
        : null
    if (el && observer) observer.observe(el)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      observer?.disconnect()
    }
  }, [])

  const onPress = () => {
    if (!reduced) lightHaptic()
    if (driven && !reduced && !busy) {
      entry.current = poseForTap()
      setLive(poseForTap())
      setSeq((n) => n + 1)
    }
    onTap?.()
  }

  useEffect(() => {
    if (!driven || reduced || busy || paused) {
      entry.current = 'idle'
      return
    }
    let stopped = false
    let timer = 0

    const arm = (delay: number, fn: () => void) => {
      timer = window.setTimeout(() => {
        if (!stopped) fn()
      }, delay)
    }

    const beginIdle = () => {
      setLive('idle')
      arm(nextOrbiDanceDelay(), () => {
        setLive(poseAfterIdle())
        arm(ORBI_DANCE_MS, beginIdle)
      })
    }

    const start = entry.current
    entry.current = 'idle'
    if (reaction === 'success') {
      setLive(poseForTap())
      arm(ORBI_WAVE_MS, beginIdle)
    } else if (reaction === 'error') {
      setLive('idle')
      arm(ORBI_ERROR_MS, beginIdle)
    } else if (start === 'winken') arm(ORBI_WAVE_MS, beginIdle)
    else if (start === 'rennen') arm(orbiNavRunRemaining(), beginIdle)
    else arm(nextOrbiDanceDelay(), () => {
      setLive(poseAfterIdle())
      arm(ORBI_DANCE_MS, beginIdle)
    })

    return () => {
      stopped = true
      window.clearTimeout(timer)
      // Strict-mode remounts the effect immediately. Keep the entry pose
      // unless a newer tap already replaced it.
      if (entry.current === 'idle' && (start === 'winken' || start === 'rennen')) {
        entry.current = start
      }
    }
  }, [driven, reduced, busy, paused, seq, reaction, reactionTick])

  const { t } = useI18n()
  const slot = size === 'compact' ? 'h-28 w-36' : 'h-52 w-60'
  const poseSrc = usePoseSrc(shown)
  const aria = orbiAriaLabel(t, label)

  const frame = (
    <span
      ref={slotRef}
      className={cn('orbi-slot inline-flex shrink-0 items-end justify-center bg-transparent', slot, className)}
      data-orbi-motion={shown}
      data-orbi-paused={paused || reduced ? '1' : '0'}
      data-orbi-reaction={reaction === 'error' ? 'error' : undefined}
      data-orbi-kind="1"
      data-orbi-stage={stage}
      data-orbi-look="kind"
    >
      <img
        src={poseSrc}
        alt=""
        draggable={false}
        decoding={shown === 'idle' ? 'sync' : 'async'}
        className="orbi-kind-img h-full w-full bg-transparent object-contain object-bottom"
      />
    </span>
  )

  if (!onTap) return frame

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={aria}
      data-orbi-caption="1"
      aria-expanded={tapped}
      className="orbi-tap tap-target inline-flex shrink-0 items-center justify-center rounded-2xl border-0 bg-transparent p-0"
    >
      {frame}
    </button>
  )
}

/** Same companion. Home and Prefs share these frames. */
export const OrbiPresence = OrbitRobot
