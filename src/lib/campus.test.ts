import { afterEach, describe, expect, it } from 'vitest'
import {
  __resetCampusForTests,
  CAMPUS_CATALOG,
  CAMPUS_LEVELS,
  campusCopy,
  campusFreeLessonRemaining,
  detectCampusIntent,
  filterCourses,
  getCampusPath,
  getCourse,
  getCampusProgress,
  pickCampusPath,
  resumeCampus,
  startLesson,
} from './campus'
import { __resetKidsForTests, enableKids } from './kids'

describe('Allda Campus', () => {
  afterEach(() => {
    __resetCampusForTests()
    __resetKidsForTests()
  })

  it('has the six product levels and a seed catalog', () => {
    expect(CAMPUS_LEVELS).toEqual([
      'grundschule',
      'weiterfuehrend',
      'ausbildung',
      'studium',
      'sprachen',
      'skills',
    ])
    expect(CAMPUS_CATALOG.length).toBeGreaterThanOrEqual(8)
    expect(CAMPUS_CATALOG.every((c) => CAMPUS_LEVELS.includes(c.level))).toBe(true)
    expect(CAMPUS_CATALOG.some((c) => c.premium)).toBe(true)
    expect(filterCourses('grundschule').every((c) => c.safeForKids)).toBe(true)
  })

  it('filters by level and kids-safe flag', () => {
    const kids = filterCourses('all', true)
    expect(kids.every((c) => c.safeForKids)).toBe(true)
    expect(filterCourses('studium', true)).toHaveLength(0)
    expect(filterCourses('sprachen').length).toBeGreaterThan(0)
  })

  it('requires one path before Lektion starten and allows one free lesson per day', () => {
    expect(startLesson('gs-lesen')).toBe('no_path')
    pickCampusPath('grundschule')
    expect(getCampusPath()).toBe('grundschule')
    expect(startLesson('azubi-ihk')).toBe('no_path')
    expect(startLesson('gs-lesen')).toBe('started')
    expect(getCampusProgress()?.courseId).toBe('gs-lesen')
    expect(campusFreeLessonRemaining()).toBe(0)
    expect(startLesson('gs-rechnen')).toBe('need_credits')
    expect(startLesson('gs-rechnen', { paid: true })).toBe('started')
  })

  it('refuses extra lessons for kids instead of SoftPaywall', () => {
    enableKids('under13', '1234')
    pickCampusPath('grundschule')
    expect(startLesson('gs-lesen')).toBe('started')
    expect(startLesson('gs-rechnen')).toBe('kids_quota')
  })

  it('stores Weiterlernen progress', () => {
    expect(getCampusProgress()).toBeNull()
    const next = resumeCampus('gs-lesen', 2)
    expect(next?.courseId).toBe('gs-lesen')
    expect(getCampusProgress()?.step).toBe(2)
    expect(getCourse('gs-lesen')?.titleDe).toMatch(/Lesen/)
    expect(campusCopy(getCourse('gs-lesen')!, 'en').title).toMatch(/Reading/)
  })

  it('detects lernen intents for Assist / robot', () => {
    expect(detectCampusIntent('Ich will heute auf dem Campus lernen')).toBe(true)
    expect(detectCampusIntent('billigster Flug nach Berlin')).toBe(false)
  })
})
