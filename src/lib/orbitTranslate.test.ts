import { afterEach, describe, expect, it, vi } from 'vitest'
import { translateText } from './orbitTranslate'

describe('orbitTranslate', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns same text when source equals target', async () => {
    const out = await translateText({ text: 'Hallo', source: 'de', target: 'de' })
    expect(out.ok).toBe(true)
    if (out.ok) expect(out.text).toBe('Hallo')
  })

  it('uses MyMemory when no env providers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          responseStatus: 200,
          responseData: { translatedText: 'Hello' },
        }),
      })),
    )
    const out = await translateText({ text: 'Hallo', source: 'de', target: 'en' })
    expect(out.ok).toBe(true)
    if (out.ok) expect(out.text).toBe('Hello')
  })
})
