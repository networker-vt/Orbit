import { describe, expect, it } from 'vitest'
import {
  hasLiveSellVision,
  parsePhotoMode,
  proposePhotoFromFile,
  stubBarterProposal,
  stubSellProposal,
} from './sellByPhoto'

describe('sell / barter by photo', () => {
  it('stubs sell proposal without vision env', () => {
    expect(hasLiveSellVision()).toBe(false)
    const file = new File(['x'], 'tasse-weiss.jpg', { type: 'image/jpeg' })
    const stub = stubSellProposal(file)
    expect(stub.source).toBe('demo-stub')
    expect(stub.title.length).toBeGreaterThan(3)
    expect(stub.priceHintEur).toBeGreaterThanOrEqual(1)
    expect(stub.disclaimerDe).toMatch(/Demo-Stub/i)
  })

  it('stubs barter proposal with offer/need, not silent-publish language', async () => {
    const file = new File(['abc'], 'book-demo.jpg', { type: 'image/jpeg' })
    const stub = stubBarterProposal(file)
    expect(stub.offerLabel).toBeTruthy()
    expect(stub.needLabel).toMatch(/bietest|Offen|Brauche/i)
    expect(stub.title).toMatch(/Biete:/i)
    expect(stub.barterMode).toBe('natural')
    expect(stub.disclaimerDe).toMatch(/still/i)

    const proposed = await proposePhotoFromFile(file, 'barter')
    expect(proposed.source).toBe('demo-stub')
    expect(parsePhotoMode('barter')).toBe('barter')
    expect(parsePhotoMode('sell')).toBe('sell')
  })
})
