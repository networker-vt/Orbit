import { beforeEach, describe, expect, it } from 'vitest'
import { openListingChat, openMutualMatchChat } from './contextualChat'
import { store } from './store'
import type { Listing } from '../types'

const listing = {
  id: 'lst-chat-1',
  title: 'Demo Minijob',
  ownerId: 'user-owner-1',
  ownerName: 'Owner',
  vertical: 'job',
  marketType: 'minijob',
} as Listing

describe('contextualChat', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('opens a match-kind thread for jobs with Anschreiben context', () => {
    const thread = openListingChat({
      meId: 'user-demo-1',
      meName: 'Alex',
      listing,
      source: 'job',
    })
    expect(thread.kind).toBe('match')
    expect(thread.listingId).toBe('lst-chat-1')
    expect(thread.lastMessage).toMatch(/Anschreiben/)
    const msgs = store.listMessages(thread.id)
    expect(msgs.length).toBeGreaterThan(0)
  })

  it('opens mutual match chat on listing when listingId is set', () => {
    const created = store.createListing({
      ...listing,
      description: 'Demo',
      kind: 'offer',
      status: 'active',
    } as Omit<typeof listing, 'id' | 'createdAt' | 'status'>)
    const thread = openMutualMatchChat({
      meId: 'user-demo-1',
      meName: 'Alex',
      mutual: {
        id: 'mm-1',
        listingId: created.id,
        title: created.title,
        at: new Date().toISOString(),
        threadSeeded: true,
      },
    })
    expect(thread.listingId).toBe(created.id)
    expect(thread.lastMessage).toMatch(/Anschreiben/)
  })
})
