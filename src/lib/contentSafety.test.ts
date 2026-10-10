import { describe, expect, it } from 'vitest'
import { assessInputSafety } from './contentSafety'

describe('contentSafety', () => {
  it('allows normal chat', () => {
    expect(assessInputSafety('Guten Tag, ist der Job noch frei?').ok).toBe(true)
  })

  it('blocks hate before send', () => {
    expect(assessInputSafety('Du bist ein Arschloch').ok).toBe(false)
  })
})
