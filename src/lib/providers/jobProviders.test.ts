import { describe, expect, it } from 'vitest'
import { getPrefs } from '../prefs'
import { searchJobProviders } from './jobProviders'

describe('job providers', () => {
  it('returns Orbit job listings without a query', async () => {
    const hits = await searchJobProviders({ q: '', prefs: getPrefs(), locale: 'de' })
    const orbit = hits.filter((h) => h.mode === 'orbit')
    expect(orbit.length).toBeGreaterThan(0)
  })

  it('adds partner search rows when query is set', async () => {
    const hits = await searchJobProviders({ q: 'Technik', prefs: getPrefs(), locale: 'de' })
    expect(hits.some((h) => h.mode === 'partner-link' && h.externalUrl?.includes('arbeitsagentur'))).toBe(true)
    expect(hits.some((h) => h.mode === 'partner-link' && h.externalUrl?.includes('indeed'))).toBe(true)
  })
})
