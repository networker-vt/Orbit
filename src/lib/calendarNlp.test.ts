import { describe, expect, it } from 'vitest'
import { parseEventText } from './calendarNlp'

describe('parseEventText', () => {
  it('parses morgen with uhr', () => {
    const now = new Date('2026-10-10T10:00:00')
    const draft = parseEventText('Morgen 15 Uhr Zahnarzt', now)
    expect(draft).not.toBeNull()
    expect(draft!.title.toLowerCase()).toContain('zahnarzt')
    expect(draft!.start.getHours()).toBe(15)
    expect(draft!.start.getDate()).toBe(11)
  })

  it('returns null for empty', () => {
    expect(parseEventText('   ')).toBeNull()
  })
})
