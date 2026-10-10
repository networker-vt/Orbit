import { describe, expect, it } from 'vitest'
import { tStatic } from './i18n'

describe('product surface names DE+EN', () => {
  it('renames Look/Travel/Job/B2B and keeps Wallet', () => {
    for (const locale of ['de', 'en'] as const) {
      expect(tStatic('look.nav', locale)).toBe('Kabine')
      expect(tStatic('look.title', locale)).toMatch(/Kabine/)
      expect(tStatic('travel.nav', locale)).toBe('Abflug')
      expect(tStatic('nav.match', locale)).toBe('Match')
      expect(tStatic('match.kicker', locale)).toBe('Treffer')
      expect(tStatic('nav.social', locale)).toBe('Orbit Social')
      expect(tStatic('nav.crew', locale)).toBe('Crew')
      expect(tStatic('match.companyDeck', locale)).toBe('Crew')
      expect(tStatic('nav.wallet', locale)).toBe('Wallet')
      expect(tStatic('campus.nav', locale)).toBe('Campus')
      expect(tStatic('campus.title', locale)).toBe('Campus')
      expect(tStatic('kids.title', locale)).toBe('Orbit Kids')
      expect(tStatic('assist.submit', locale)).toMatch(/Orbit fragen|Ask Orbit/)
      expect(tStatic('trip.confirm', locale)).toMatch(/Bestätigen|Confirm/)
    }
  })
})
