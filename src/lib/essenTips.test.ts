import { describe, expect, it } from 'vitest'
import { ESSEN_TIPS, filterTips, osmSearchUrl } from './essenTips'

describe('essen tips', () => {
  it('ships free-source tips with attribution', () => {
    expect(ESSEN_TIPS.length).toBeGreaterThanOrEqual(4)
    for (const tip of ESSEN_TIPS) {
      expect(tip.image).toMatch(/^https:\/\/www\.themealdb\.com\/images\//)
      expect(tip.source.length).toBeGreaterThan(2)
      expect(tip.sourceUrl).toMatch(/^https:\/\//)
    }
    // Known-dead CDN paths that once shipped as placeholders
    expect(ESSEN_TIPS.some((t) => t.image.includes('/1520084193.jpg'))).toBe(false)
    expect(ESSEN_TIPS.some((t) => t.image.includes('/wxywrq1468237727.jpg'))).toBe(false)
  })

  it('filters by hunger query', () => {
    expect(filterTips('kaffee', 'de').some((t) => t.id === 'coffee')).toBe(true)
    expect(filterTips('pasta', 'en').some((t) => t.id === 'pasta')).toBe(true)
  })

  it('builds OSM search links', () => {
    expect(osmSearchUrl('restaurant', 52.5, 13.4)).toContain('openstreetmap.org')
    expect(osmSearchUrl('pizza')).toContain('pizza')
  })
})
