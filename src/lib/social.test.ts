import { beforeEach, describe, expect, it } from 'vitest'
import {
  __resetSocialCacheForTests,
  DEFAULT_SEARCH_SUGGESTIONS,
  extractTopicsFromBody,
  getActiveSearchPrefs,
  interestTermsFromPrefs,
  rankPostsBySearchPrefs,
  scorePostForPrefs,
  setSearchPrefs,
  suggestSearchTerms,
  toggleSearchPref,
  topicParticipantId,
  type SocialPost,
} from './social'
import { defaultPrefs, type OrbitPrefs } from './prefs'

function post(partial: Partial<SocialPost> & Pick<SocialPost, 'id' | 'body'>): SocialPost {
  return {
    authorId: 'u1',
    authorName: 'Test',
    authorKind: 'person',
    createdAt: '2026-09-16T08:00:00Z',
    likes: [],
    comments: [],
    ...partial,
  }
}

describe('Allda Social search prefs + ranking', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetSocialCacheForTests()
  })

  it('derives interest terms from Allda prefs', () => {
    const prefs: OrbitPrefs = {
      ...defaultPrefs(),
      seeker: {
        ...defaultPrefs().seeker,
        occupationTerms: ['Logistik'],
        lifeExamples: ['Essen'],
        mustHaveSkills: ['Excel'],
        occupationOther: 'Buchhaltung',
      },
    }
    expect(interestTermsFromPrefs(prefs)).toEqual(
      expect.arrayContaining(['Logistik', 'Essen', 'Excel', 'Buchhaltung']),
    )
  })

  it('falls back to curated suggestions when prefs are empty', () => {
    expect(suggestSearchTerms(defaultPrefs())[0]).toBe(DEFAULT_SEARCH_SUGGESTIONS[0])
  })

  it('ranks posts that match active search prefs first', () => {
    const posts = [
      post({ id: 'a', body: 'Hello world', topics: ['Freizeit'] }),
      post({ id: 'b', body: 'Need a 3PL partner', topics: ['Logistik', '3PL'] }),
      post({ id: 'c', body: 'Remote bookkeeping', topics: ['Buchhaltung', 'Remote'], featured: true }),
    ]
    const ranked = rankPostsBySearchPrefs(posts, ['Logistik'])
    expect(ranked[0].id).toBe('b')
    expect(scorePostForPrefs(posts[1], ['Logistik'])).toBeGreaterThan(
      scorePostForPrefs(posts[0], ['Logistik']),
    )
  })

  it('keeps the full feed when nothing matches (demo-honest)', () => {
    const posts = [post({ id: 'a', body: 'Unrelated' })]
    expect(rankPostsBySearchPrefs(posts, ['Quantenphysik'])).toHaveLength(1)
  })

  it('toggles search prefs in localStorage', () => {
    toggleSearchPref('Remote')
    expect(getActiveSearchPrefs()).toContain('Remote')
    toggleSearchPref('Remote')
    expect(getActiveSearchPrefs()).not.toContain('Remote')
    setSearchPrefs(['Essen', 'Essen', '#Freizeit'])
    expect(getActiveSearchPrefs()).toEqual(['Essen', 'Freizeit'])
  })

  it('extracts #hashtags and known terms from body', () => {
    expect(extractTopicsFromBody('Suche #Remote Hilfe bei Buchhaltung', ['Buchhaltung'])).toEqual(
      expect.arrayContaining(['Buchhaltung', 'Remote']),
    )
  })

  it('builds stable topic participant ids', () => {
    expect(topicParticipantId('3PL')).toBe('topic:3pl')
    expect(topicParticipantId('  Green Shelf ')).toBe('topic:green-shelf')
  })
})
