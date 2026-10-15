import { describe, expect, it } from 'vitest'
import { isChunkLoadError, OFFLINE_CHUNK_HINT } from './offlineChunk'
import { shouldWarmRuntimeCache } from './warmRuntimeCache'

describe('offlineChunk', () => {
  it('exposes a single offline hint string', () => {
    expect(OFFLINE_CHUNK_HINT).toMatch(/offline/i)
  })

  it('detects dynamic import fetch failures', () => {
    expect(
      isChunkLoadError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://example/orbit/assets/x.js',
        ),
      ),
    ).toBe(true)
    expect(isChunkLoadError(new Error('Export fehlgeschlagen'))).toBe(false)
  })
})

describe('shouldWarmRuntimeCache', () => {
  it('skips slow-2g / 2g effectiveType', () => {
    const original = (navigator as Navigator & { connection?: unknown }).connection
    try {
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: { effectiveType: '2g', type: 'wifi' },
      })
      expect(shouldWarmRuntimeCache()).toBe(false)
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: { effectiveType: 'slow-2g', type: 'wifi' },
      })
      expect(shouldWarmRuntimeCache()).toBe(false)
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: { effectiveType: '4g', type: 'wifi' },
      })
      expect(shouldWarmRuntimeCache()).toBe(true)
    } finally {
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: original,
      })
    }
  })
})
