import { describe, expect, it } from 'vitest'
import { seedListings } from '../data/seed'
import { deriveMarketType } from './market'
import {
  createPathForHubLane,
  hubLaneBypassesOccupation,
  hubLaneLegalNote,
  listingMatchesHubLane,
  parseMatchHubLane,
} from './matchHub'

describe('match hub lanes', () => {
  it('parses lane query and bypasses occupation for concrete lanes', () => {
    expect(parseMatchHubLane(null)).toBe('all')
    expect(parseMatchHubLane('sell')).toBe('sell')
    expect(parseMatchHubLane('nope')).toBe('all')
    expect(hubLaneBypassesOccupation('all')).toBe(false)
    expect(hubLaneBypassesOccupation('minijob')).toBe(true)
    expect(createPathForHubLane('sell')).toContain('photoMode=sell')
    expect(createPathForHubLane('barter')).toContain('photoMode=barter')
  })

  it('filters seed listings onto hub lanes including sell-by-photo', () => {
    const sell = seedListings.filter((l) => listingMatchesHubLane(l, 'sell'))
    const courier = seedListings.filter((l) => listingMatchesHubLane(l, 'courier'))
    const ride = seedListings.filter((l) => listingMatchesHubLane(l, 'ride'))
    const barter = seedListings.filter((l) => listingMatchesHubLane(l, 'barter'))
    expect(sell.length).toBeGreaterThan(0)
    expect(courier.length).toBeGreaterThan(0)
    expect(ride.length).toBeGreaterThan(0)
    expect(barter.length).toBeGreaterThan(0)
    expect(sell.every((l) => deriveMarketType(l) === 'sell')).toBe(true)
  })

  it('keeps honest legal notes (no payroll / Bolt branding copy)', () => {
    const mini = hubLaneLegalNote('minijob')
    expect(mini.de).toMatch(/keinen Lohn/i)
    expect(mini.de).toMatch(/Kein Rechtsrat/i)
    const ride = hubLaneLegalNote('ride')
    expect(ride.de).toMatch(/keine Uber\/Bolt-Marke/i)
    const sell = hubLaneLegalNote('sell')
    expect(sell.de).toMatch(/bestätigst immer/i)
  })
})
