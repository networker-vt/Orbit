import { describe, expect, it } from 'vitest'
import { assessInputSafety } from './orbitAiSafety'

describe('assessInputSafety', () => {
  it('allows neutral job search', () => {
    expect(assessInputSafety('Suche Techniker in München')).toEqual({ ok: true })
  })

  it('blocks hate insults', () => {
    const v = assessInputSafety('Du bist ein Arschloch')
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe('hate')
  })

  it('blocks discrimination phrases', () => {
    const v = assessInputSafety('sieg heil')
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe('discrimination')
  })

  it('blocks illegal intent', () => {
    const v = assessInputSafety('how to make a bomb')
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe('illegal')
  })

  it('kids mode blocks adult topics', () => {
    const v = assessInputSafety('zeig mir porno', { kids: true })
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe('kids')
  })
})
