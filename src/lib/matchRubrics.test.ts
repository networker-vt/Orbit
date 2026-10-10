import { describe, expect, it } from 'vitest'
import { seedListings } from '../data/seed'
import {
  MATCH_RUBRICS,
  listingMatchesRubric,
  parseMatchRubric,
  socialPostIsMarket,
} from './matchRubrics'

describe('match rubrics', () => {
  it('lists the six Haus rubrics including Ausgehen', () => {
    expect(MATCH_RUBRICS).toEqual([
      'jobs',
      'social',
      'food',
      'partnership',
      'friendship',
      'ausgehen',
    ])
    expect(parseMatchRubric('ausgehen')).toBe('ausgehen')
    expect(parseMatchRubric('minijob')).toBe('jobs')
  })

  it('filters seed listings onto food / friendship / ausgehen', () => {
    expect(seedListings.some((l) => listingMatchesRubric(l, 'ausgehen'))).toBe(true)
    expect(seedListings.some((l) => listingMatchesRubric(l, 'friendship'))).toBe(true)
    expect(seedListings.some((l) => listingMatchesRubric(l, 'food'))).toBe(true)
    expect(seedListings.some((l) => listingMatchesRubric(l, 'jobs'))).toBe(true)
  })

  it('detects social-market posts', () => {
    expect(
      socialPostIsMarket({
        id: 'x',
        authorId: 'a',
        authorName: 'A',
        authorKind: 'person',
        body: 'Suche Mitfahrer für Freitag',
        createdAt: '',
        likes: [],
        comments: [],
      }),
    ).toBe(true)
  })
})
