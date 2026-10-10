import { describe, expect, it } from 'vitest'
import { HOME_NEWS } from '../data/homeNews'
import { innovationNews } from '../data/innovation/news'
import { fortbildungen } from '../data/wissen/fortbildung'
import { branchenMedien } from '../data/wissen/medien'
import { tStatic } from './i18n'
import { LEGAL } from './legal'

const KEYS = [
  'home.orbiKind',
  'home.orbiTap',
  'footer.privacy',
  'footer.support',
  'trip.openSearch',
  'archive.katalogTitle',
  'archive.missingTitle',
  'checkout.stubTitle',
  'checkout.openSearch',
  'demo.bannerTitle',
  'demo.bannerBody',
  'auth.kidsNote',
] as const

describe('launch surface', () => {
  it('resolves Orbi, privacy, support and empty-state copy in DE and EN', () => {
    for (const locale of ['de', 'en'] as const) {
      for (const key of KEYS) {
        const value = tStatic(key, locale)
        expect(value).not.toBe(key)
        expect(value.length).toBeGreaterThan(2)
      }
    }
    expect(tStatic('footer.support', 'de')).toBe('Support')
    expect(tStatic('footer.privacy', 'en')).toBe('Privacy')
  })

  it('keeps the operator a private person with the published address', () => {
    expect(LEGAL.operatorName).toBe('Mirco Küßner')
    expect(LEGAL.street).toBe('Schlebuscher Weg 8')
    expect(LEGAL.zip).toBe('51061')
    expect(LEGAL.city).toBe('Köln')
    expect(LEGAL.email).toBe('mirco.kuessner@gmail.com')
    expect(LEGAL.form.toLowerCase()).toContain('privat')
    expect(LEGAL.register).toBeNull()
  })

  it('keeps news, innovation and wissen as outbound https links', () => {
    for (const item of HOME_NEWS) expect(item.href).toMatch(/^https:\/\//)
    for (const card of innovationNews) expect(card.sourceUrl).toMatch(/^https:\/\//)
    for (const medium of branchenMedien) expect(medium.url).toMatch(/^https:\/\//)
    for (const course of fortbildungen) expect(course.url).toMatch(/^https:\/\//)
  })
})
