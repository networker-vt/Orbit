import { describe, expect, it } from 'vitest'
import type { OrbitAiOutcome } from './orbitAi'
import {
  buildWebSearchOffer,
  isGeneralKnowledgeQuestion,
  searchUrlForProvider,
  shouldOfferWebSearch,
  suggestSearchQueries,
} from './orbitAiWebSearch'

describe('orbitAiWebSearch', () => {
  it('builds DuckDuckGo deep link', () => {
    expect(searchUrlForProvider('duckduckgo', 'Orbit Demo')).toBe(
      'https://duckduckgo.com/?q=Orbit%20Demo',
    )
  })

  it('suggests up to 3 queries', () => {
    const q = suggestSearchQueries('Was ist Photosynthese?', 'de')
    expect(q.length).toBeGreaterThanOrEqual(1)
    expect(q.length).toBeLessThanOrEqual(3)
  })

  it('offers web for general knowledge with low-confidence plan', () => {
    const outcome: OrbitAiOutcome = {
      kind: 'plan',
      reply: 'Plan',
      source: 'assist',
      plan: {
        id: 'p1',
        createdAt: '',
        intent: {
          text: 'Was ist die Hauptstadt von Frankreich?',
          kind: 'everyday',
          items: [],
          companyNeed: false,
          marketTypes: [],
          travelKinds: [],
          cheapest: false,
        },
        summary: 'Plan',
        steps: [],
        tips: [],
        disclaimer: '',
        matchIds: [],
        travelIds: [],
        source: 'heuristic',
      },
    }
    expect(isGeneralKnowledgeQuestion('Was ist die Hauptstadt von Frankreich?')).toBe(true)
    expect(
      shouldOfferWebSearch(outcome, 'Was ist die Hauptstadt von Frankreich?', 'de'),
    ).toBe(true)
  })

  it('does not offer web for blocked paths', () => {
    const outcome: OrbitAiOutcome = {
      kind: 'blocked',
      reply: 'Nein',
      source: 'local',
      blockedReason: 'hate',
    }
    expect(shouldOfferWebSearch(outcome, 'Du Arschloch', 'de')).toBe(false)
    expect(buildWebSearchOffer('Du Arschloch', 'de')).toBeNull()
  })

  it('does not offer web for local tool replies', () => {
    const outcome: OrbitAiOutcome = {
      kind: 'reply',
      reply: 'Hilfe',
      source: 'local',
    }
    expect(shouldOfferWebSearch(outcome, 'Hilfe', 'de')).toBe(false)
  })
})
