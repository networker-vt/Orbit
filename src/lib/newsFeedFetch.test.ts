import { describe, expect, it } from 'vitest'
import { parseFeedXml, parseTagesschauJson } from './newsFeedFetch'

describe('newsFeedFetch parsers', () => {
  it('parses tagesschau json', () => {
    const body = JSON.stringify({
      news: [{ title: 'Test', shareURL: 'https://www.tagesschau.de/a.html', sophoraId: 'x1' }],
    })
    const items = parseTagesschauJson(body, 'tagesschau')
    expect(items).toHaveLength(1)
    expect(items[0].href).toBe('https://www.tagesschau.de/a.html')
    expect(items[0].source).toBe('tagesschau')
  })

  it('parses atom entries', () => {
    const body = `<?xml version="1.0"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <entry>
          <title>Atom headline</title>
          <link rel="alternate" href="https://example.com/story"/>
        </entry>
      </feed>`
    const items = parseFeedXml(body, 'heise', 'atom')
    expect(items[0]?.titleDe).toBe('Atom headline')
    expect(items[0]?.href).toBe('https://example.com/story')
  })

  it('parses rss items', () => {
    const body = `<?xml version="1.0"?>
      <rss><channel>
        <item>
          <title>RSS headline</title>
          <link>https://example.com/rss-story</link>
        </item>
      </channel></rss>`
    const items = parseFeedXml(body, 'spiegel', 'rss')
    expect(items[0]?.titleDe).toBe('RSS headline')
  })
})
