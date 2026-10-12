import { afterEach, describe, expect, it } from 'vitest'
import {
  CHANNEL_DEFS,
  __resetChannelsForTests,
  connectChannel,
  disconnectChannel,
  getChannels,
  kidsMayConnectChannel,
  toggleChannel,
  visibleChannelDefs,
} from './channels'
import { __resetKidsForTests, enableKids } from './kids'

describe('Allda 2.8.1 channel opt-in stubs', () => {
  afterEach(() => {
    __resetChannelsForTests()
    __resetKidsForTests()
  })

  it('lists Meta, X/Twitter and gaming stubs as demo', () => {
    const ids = CHANNEL_DEFS.map((c) => c.id)
    expect(ids).toEqual(
      expect.arrayContaining(['meta', 'x', 'steam', 'playstation', 'xbox', 'instagram', 'amazon']),
    )
    expect(CHANNEL_DEFS.every((c) => c.demo && c.emoji)).toBe(true)
    expect(CHANNEL_DEFS.filter((c) => c.kind === 'social').map((c) => c.id)).toEqual(
      expect.arrayContaining(['meta', 'x', 'instagram']),
    )
    expect(CHANNEL_DEFS.filter((c) => c.kind === 'gaming').map((c) => c.id)).toEqual(
      expect.arrayContaining(['steam', 'playstation', 'xbox']),
    )
  })

  it('refuses connect without consent and never silent-harvests', () => {
    expect(connectChannel('meta', false)).toBe(false)
    expect(getChannels().meta).toBe(false)
    expect(toggleChannel('steam', true)).toBe(false)
    expect(getChannels().steam).toBe(false)
    expect(connectChannel('steam', true)).toBe(true)
    expect(getChannels().steam).toBe(true)
    expect(disconnectChannel('steam')).toBe(true)
    expect(getChannels().steam).toBe(false)
  })

  it('hides social connects in kids mode', () => {
    expect(enableKids('under13', '1234')).not.toBeNull()
    expect(kidsMayConnectChannel('meta')).toBe(false)
    expect(kidsMayConnectChannel('x')).toBe(false)
    expect(kidsMayConnectChannel('instagram')).toBe(false)
    expect(kidsMayConnectChannel('steam')).toBe(true)
    expect(visibleChannelDefs(true).some((c) => c.kind === 'social')).toBe(false)
    expect(connectChannel('meta', true)).toBe(false)
    expect(getChannels().meta).toBe(false)
    expect(connectChannel('amazon', true)).toBe(true)
    expect(getChannels().amazon).toBe(true)
  })
})
