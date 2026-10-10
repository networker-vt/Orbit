import { describe, expect, it } from 'vitest'
import { hasLiveSellVision, proposeSellFromPhoto, stubSellProposal } from './sellByPhoto'

describe('sell-by-photo', () => {
  it('stubs a proposal without vision env and never claims live vision', () => {
    expect(hasLiveSellVision()).toBe(false)
    const file = new File(['x'], 'tasse-weiss.jpg', { type: 'image/jpeg' })
    const stub = stubSellProposal(file)
    expect(stub.source).toBe('demo-stub')
    expect(stub.title.length).toBeGreaterThan(3)
    expect(stub.priceHintEur).toBeGreaterThanOrEqual(1)
    expect(stub.disclaimerDe).toMatch(/Demo-Stub/i)
  })

  it('async propose falls back to stub when no API', async () => {
    const file = new File(['abc'], 'book-demo.pdf', { type: 'application/pdf' })
    const proposal = await proposeSellFromPhoto(file)
    expect(proposal.source).toBe('demo-stub')
    expect(proposal.category.length).toBeGreaterThan(0)
  })
})
