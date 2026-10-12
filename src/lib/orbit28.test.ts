import { describe, expect, it } from 'vitest'
import { tStatic } from './i18n'

const META = /ruhig|quiet tiles|zwei Kachel|Discover-Liste|Nichts Lautes|Ruhige Links|Quiet links/i

describe('Allda 2.8.1 surface', () => {
  it('renames bottom nav to Start · Match · Allda Social · Mein', () => {
    for (const locale of ['de', 'en'] as const) {
      expect(tStatic('nav.home', locale)).toMatch(/Start|Home/)
      expect(tStatic('nav.match', locale)).toBe('Match')
      expect(tStatic('nav.social', locale)).toBe('Allda Social')
      expect(tStatic('nav.mein', locale)).toMatch(/Mein|Me/)
    }
  })

  it('keeps Treffer / Crew / Kabine / Abflug product names', () => {
    for (const locale of ['de', 'en'] as const) {
      expect(tStatic('match.kicker', locale)).toBe('Treffer')
      expect(tStatic('nav.crew', locale)).toBe('Crew')
      expect(tStatic('look.nav', locale)).toBe('Kabine')
      expect(tStatic('travel.nav', locale)).toBe('Abflug')
    }
  })

  it('has no meta ruhig/quiet copy on Mehr / Home discover / Mein', () => {
    const keys = [
      'mehr.lead',
      'mehr.tiles',
      'home.mehrEntdecken',
      'home.mehrHint',
      'mein.lead',
      'entdecker.disclaimer',
    ]
    for (const locale of ['de', 'en'] as const) {
      for (const key of keys) {
        expect(tStatic(key, locale)).not.toMatch(META)
      }
    }
  })

  it('labels Entdecker as Demo and keeps Assist primary copy', () => {
    expect(tStatic('entdecker.explain', 'de')).toMatch(/Demo/)
    expect(tStatic('assist.submit', 'de')).toMatch(/Allda fragen/)
    expect(tStatic('assist.submit', 'en')).toMatch(/Ask Allda/)
  })

  it('Home discover copy no longer lists Mein / Social / Wallet', () => {
    for (const locale of ['de', 'en'] as const) {
      expect(tStatic('home.mehrHint', locale)).not.toMatch(/Social|Wallet|Mein/)
    }
  })

  it('Mein Allda title and Einstellung entry are renamed', () => {
    expect(tStatic('mein.title', 'de')).toBe('Mein Allda')
    expect(tStatic('mein.kicker', 'de')).toBe('Mein Allda')
    expect(tStatic('einstellung.title', 'de')).toBe('Einstellung')
    expect(tStatic('mein.lead', 'de')).toMatch(/Schnellzugriffe|Startseite/)
  })
})
