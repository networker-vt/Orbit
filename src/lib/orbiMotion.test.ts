import { describe, expect, it } from 'vitest'
import { tStatic } from './i18n'
import {
  ORBI_DANCE_MAX_MS,
  ORBI_DANCE_MIN_MS,
  ORBI_STAGES,
  claimOrbiSessionBubble,
  cueOrbiNavRun,
  isOrbiMotion,
  isOrbiStage,
  nextOrbiDanceDelay,
  orbiAriaLabel,
  orbiNavRunRemaining,
  orbiTipsAllowed,
  poseAfterIdle,
  poseForBusy,
  poseForNav,
  poseForTap,
  resolveOrbiPose,
} from './orbiMotion'

describe('Orbi Kind motions', () => {
  it('locks the provisional defaults', () => {
    expect(nextOrbiDanceDelay(() => 0)).toBe(ORBI_DANCE_MIN_MS)
    expect(nextOrbiDanceDelay(() => 0.999999)).toBe(ORBI_DANCE_MAX_MS)
    expect(nextOrbiDanceDelay(() => 0)).toBeGreaterThanOrEqual(8000)
    expect(nextOrbiDanceDelay(() => 0)).toBeLessThanOrEqual(16000)
    expect(nextOrbiDanceDelay(() => 0)).not.toBe(5500)
    expect(poseForTap()).toBe('winken')
    expect(poseAfterIdle()).toBe('tanzen')
    expect(poseForBusy()).toBe('arbeiten')
    expect(poseForNav()).toBe('rennen')
  })

  it('resolves busy, nav, and reduced motion ahead of the live pose', () => {
    expect(resolveOrbiPose({ live: 'idle' })).toBe('idle')
    expect(resolveOrbiPose({ live: 'tanzen' })).toBe('tanzen')
    expect(resolveOrbiPose({ live: 'idle', busy: true })).toBe('arbeiten')
    expect(resolveOrbiPose({ live: 'rennen' })).toBe('rennen')
    expect(resolveOrbiPose({ live: 'tanzen', reduced: true })).toBe('idle')
    expect(resolveOrbiPose({ live: 'idle', busy: true, reduced: true })).toBe('idle')
    expect(resolveOrbiPose({ live: 'idle', motion: 'arbeiten' })).toBe('arbeiten')
    expect(resolveOrbiPose({ live: 'tanzen', pinned: 'winken', busy: true })).toBe('winken')
  })

  it('keeps a nav run cue only for its brief window', () => {
    cueOrbiNavRun(1_000, 900)
    expect(orbiNavRunRemaining(1_000)).toBe(900)
    expect(orbiNavRunRemaining(1_500)).toBe(400)
    expect(orbiNavRunRemaining(2_000)).toBe(0)
  })

  it('accepts only known poses', () => {
    expect(isOrbiMotion('idle')).toBe(true)
    expect(isOrbiMotion('tanzen')).toBe(true)
    expect(isOrbiMotion('stock')).toBe(false)
    expect(isOrbiMotion(null)).toBe(false)
  })

  it('uses Orbi captions that exist in German and English', () => {
    for (const locale of ['de', 'en'] as const) {
      const label = orbiAriaLabel((key) => tStatic(key, locale), tStatic('home.robotAria', locale))
      expect(label).not.toContain('home.orbiKind')
      expect(label).not.toContain('home.orbiTap')
      expect(label).toContain(tStatic('home.orbiKind', locale))
      expect(label).toContain(tStatic('home.orbiTap', locale))
    }
  })

  it('shows at most one session bubble and honors a tips-off flag', () => {
    const bag = new Map<string, string>()
    const storage = {
      getItem: (key: string) => bag.get(key) ?? null,
      setItem: (key: string, value: string) => {
        bag.set(key, value)
      },
    }
    expect(claimOrbiSessionBubble(storage)).toBe(true)
    expect(claimOrbiSessionBubble(storage)).toBe(false)
    expect(orbiTipsAllowed(() => null)).toBe(true)
    expect(orbiTipsAllowed((key) => (key === 'orbit_orbi_tips' ? '0' : null))).toBe(false)
  })

  it('names Kind as the shipped stage and keeps Teen and Adult as stubs', () => {
    expect(ORBI_STAGES[0]).toBe('kind')
    expect(isOrbiStage('teen')).toBe(true)
    expect(isOrbiStage('adult')).toBe(true)
    expect(isOrbiStage('stock')).toBe(false)
  })
})
