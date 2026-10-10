import { beforeEach, describe, expect, it } from 'vitest'
import { runOrbitAi } from './orbitAi'

describe('runOrbitAi', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns help locally without API', async () => {
    const out = await runOrbitAi({ text: 'Hilfe', locale: 'de' })
    expect(out.kind).toBe('reply')
    expect(out.reply).toMatch(/Match/)
    expect(out.source).toBe('local')
  })

  it('blocks hate before session write', async () => {
    const out = await runOrbitAi({ text: 'Du bist ein Arschloch', locale: 'de' })
    expect(out.kind).toBe('blocked')
    expect(localStorage.getItem('orbit_ai_session_v1')).toBeNull()
  })
})
