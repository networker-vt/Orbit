import { describe, expect, it } from 'vitest'
import { parseLocalToolCall } from './orbitAiTools'

describe('parseLocalToolCall', () => {
  it('navigates to match', () => {
    expect(parseLocalToolCall('Öffne Match')?.tool).toBe('navigate')
    expect(parseLocalToolCall('Öffne Match')).toMatchObject({ path: '/match' })
  })

  it('opens chat', () => {
    expect(parseLocalToolCall('Open chat')?.tool).toBe('open_chat')
  })

  it('credits status', () => {
    expect(parseLocalToolCall('Wie ist mein Guthaben?')?.tool).toBe('credits_status')
  })

  it('search need extracts query', () => {
    const c = parseLocalToolCall('Suche LED Techniker Berlin')
    expect(c?.tool).toBe('search_need')
    if (c?.tool === 'search_need') expect(c.query.toLowerCase()).toContain('led')
  })

  it('skips travel when hidden', () => {
    const c = parseLocalToolCall('Abflug', { hideTravel: true })
    expect(c).toBeNull()
  })
})
