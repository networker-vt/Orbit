import { beforeEach, describe, expect, it } from 'vitest'
import { seedListings } from '../data/seed'
import { chatSourceForListing, openListingChat, openMutualMatchChat } from './contextualChat'
import { store } from './store'
import type { Listing } from '../types'

const jobListing = {
  id: 'lst-chat-job',
  title: 'Demo Minijob',
  ownerId: 'user-owner-1',
  ownerName: 'Owner',
  vertical: 'job',
  marketType: 'minijob',
} as Listing

const sellListing = {
  id: 'lst-chat-sell',
  title: 'Kamera verkaufen',
  ownerId: 'user-owner-1',
  ownerName: 'Owner',
  marketType: 'sell',
} as Listing

describe('contextualChat', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('maps sell/barter listings to chat sources', () => {
    expect(chatSourceForListing(sellListing)).toBe('sell')
    expect(
      chatSourceForListing({ ...sellListing, marketType: 'barter', id: 'b1' } as Listing),
    ).toBe('barter')
  })

  it('opens a match-kind thread for jobs with Anschreiben context', () => {
    const thread = openListingChat({
      meId: 'user-demo-1',
      meName: 'Alex',
      listing: jobListing,
      source: 'job',
    })
    expect(thread.kind).toBe('match')
    expect(thread.listingId).toBe('lst-chat-job')
    expect(thread.lastMessage).toMatch(/Anschreiben/)
    expect(store.listMessages(thread.id).length).toBeGreaterThan(0)
  })

  it('opens mutual match chat with listing when listingId is set', () => {
    const base = seedListings.find((item) => item.status === 'active')!
    const { id: _id, createdAt: _created, status: _status, ...rest } = base
    const created = store.createListing({
      ...rest,
      title: sellListing.title,
      marketType: 'sell',
    })
    const thread = openMutualMatchChat({
      meId: 'user-demo-1',
      meName: 'Alex',
      mutual: {
        id: 'mut-1',
        listingId: created.id,
        title: created.title,
        at: new Date().toISOString(),
        threadSeeded: false,
      },
    })
    expect(thread.listingId).toBe(created.id)
    expect(thread.lastMessage).toMatch(/Foto-Verkauf/)
  })
})
