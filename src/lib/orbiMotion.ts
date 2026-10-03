/** Living Orbi poses. German names match the Kind companion brief. */
export const ORBI_MOTIONS = ['idle', 'winken', 'tanzen', 'arbeiten', 'rennen'] as const

export type OrbiMotion = (typeof ORBI_MOTIONS)[number]

/** Kind ships now. Teen and Adult are named stubs until their drawings exist. */
export const ORBI_STAGES = ['kind', 'teen', 'adult'] as const

export type OrbiStage = (typeof ORBI_STAGES)[number]

/**
 * Idle holds, then one dance. The wait is random, not a fixed 5.5s.
 * Reduced motion stays on the still idle frame.
 * Motion itself is transform and opacity only — no pupil overlay.
 */
export const ORBI_DANCE_MIN_MS = 8000
export const ORBI_DANCE_MAX_MS = 16000
export const ORBI_DANCE_MS = 2200
export const ORBI_WAVE_MS = 1800
export const ORBI_RUN_MS = 900
export const ORBI_ERROR_MS = 900

/** One self-shown line per browser session. */
export const ORBI_BUBBLE_SESSION_KEY = 'orbit_orbi_bubble_v1'

/** Honor an off switch when one is stored. There is no separate tips control in the UI. */
export const ORBI_TIPS_KEY = 'orbit_orbi_tips'

export function nextOrbiDanceDelay(random: () => number = Math.random): number {
  const span = ORBI_DANCE_MAX_MS - ORBI_DANCE_MIN_MS
  const unit = Math.min(0.999999, Math.max(0, random()))
  return ORBI_DANCE_MIN_MS + Math.floor(unit * (span + 1))
}

export function orbiTipsAllowed(read: (key: string) => string | null): boolean {
  return read(ORBI_TIPS_KEY) !== '0'
}

export function claimOrbiSessionBubble(storage: {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}): boolean {
  if (storage.getItem(ORBI_BUBBLE_SESSION_KEY) === '1') return false
  storage.setItem(ORBI_BUBBLE_SESSION_KEY, '1')
  return true
}

export function isOrbiStage(value: string | null | undefined): value is OrbiStage {
  return !!value && (ORBI_STAGES as readonly string[]).includes(value)
}

export function isOrbiMotion(value: string | null | undefined): value is OrbiMotion {
  return !!value && (ORBI_MOTIONS as readonly string[]).includes(value)
}

/** Tap plays a wave. */
export function poseForTap(): OrbiMotion {
  return 'winken'
}

/** After a quiet idle, Orbi dances once, then returns to idle. */
export function poseAfterIdle(): OrbiMotion {
  return 'tanzen'
}

/** Loading and busy use the work pose. */
export function poseForBusy(): OrbiMotion {
  return 'arbeiten'
}

/** A navigation change plays a short run. */
export function poseForNav(): OrbiMotion {
  return 'rennen'
}

let navRunUntil = 0

/** Mark a navigation so the next mounted Orbi can play a brief run. */
export function cueOrbiNavRun(now = Date.now(), ms = ORBI_RUN_MS) {
  navRunUntil = now + ms
}

export function orbiNavRunRemaining(now = Date.now()) {
  return Math.max(0, navRunUntil - now)
}

/** Visible Orbi labels. Both keys must resolve — a raw key is a dead caption. */
export function orbiAriaLabel(t: (key: string) => string, extra?: string) {
  const base = `${t('home.orbiKind')}. ${t('home.orbiTap')}`
  const more = extra?.trim()
  return more ? `${base}. ${more}` : base
}

/** Which frame to show. Reduced motion is always the still idle PNG. */
export function resolveOrbiPose(opts: {
  reduced?: boolean
  pinned?: OrbiMotion | null
  motion?: OrbiMotion | null
  busy?: boolean
  live: OrbiMotion
}): OrbiMotion {
  if (opts.reduced) return 'idle'
  if (opts.pinned) return opts.pinned
  if (opts.motion) return opts.motion
  if (opts.busy) return poseForBusy()
  return opts.live
}
