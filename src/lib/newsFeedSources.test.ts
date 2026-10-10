import { beforeEach, describe, expect, it } from 'vitest'
import {
  addCustomFeed,
  addPresetFeed,
  getNewsFeedSources,
  isAllowedFeedUrl,
  moveNewsFeedSource,
  NEWS_FEED_KEY,
  removeNewsFeedSource,
  resetNewsFeedSources,
} from './newsFeedSources'

describe('newsFeedSources', () => {
  beforeEach(() => {
    localStorage.clear()
    resetNewsFeedSources()
  })

  it('defaults to tagesschau + heise', () => {
    const sources = getNewsFeedSources('de')
    expect(sources.map((s) => s.id)).toEqual(['preset-tagesschau', 'preset-heise'])
  })

  it('rejects non-https feed urls', () => {
    expect(isAllowedFeedUrl('http://example.com/feed.xml')).toBe(false)
    expect(isAllowedFeedUrl('https://example.com/rss.xml')).toBe(true)
  })

  it('adds custom feed and persists', () => {
    const result = addCustomFeed(
      { label: 'Example', feedUrl: 'https://example.com/atom.xml' },
      'de',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.sources.some((s) => s.label === 'Example')).toBe(true)
    expect(localStorage.getItem(NEWS_FEED_KEY)).toContain('example.com')
  })

  it('reorders and removes sources', () => {
    addPresetFeed('preset-spiegel', 'de')
    let sources = getNewsFeedSources('de')
    const spiegelId = 'preset-spiegel'
    sources = moveNewsFeedSource(spiegelId, -1, 'de')
    sources = moveNewsFeedSource(spiegelId, -1, 'de')
    expect(sources[0].id).toBe(spiegelId)
    sources = removeNewsFeedSource(spiegelId, 'de')
    expect(sources.some((s) => s.id === spiegelId)).toBe(false)
  })
})
