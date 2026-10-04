import { describe, expect, it, vi } from 'vitest'

describe('closed Parkmerke page', () => {
  it('does not start a timer or load tiles when the module is imported', async () => {
    const interval = vi.spyOn(window, 'setInterval')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))
    await import('./parkmerke')
    await import('./parkmerkeStore')
    await import('./parkmerkeTiles')
    await import('../pages/ParkmerkePage')
    expect(interval).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    interval.mockRestore()
    fetchSpy.mockRestore()
  })
})
