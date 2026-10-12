/**
 * Allda Chat — contextual openers for Match / Jobs / Marktplatz / Foto.
 * Transactional threads (not Social cold-DMs); no consent gate.
 */
import { deriveMarketType } from './market'
import { store } from './store'
import type { Listing, Thread, ThreadKind } from '../types'
import type { MutualMatch } from './match'

export type ChatContextSource = 'match' | 'job' | 'listing' | 'market' | 'foto' | 'barter' | 'sell'

function kindForListing(listing: Listing): ThreadKind {
  if (listing.vertical === 'job' || listing.marketType === 'job' || listing.marketType === 'minijob') {
    return 'match'
  }
  return 'booking'
}

export function chatSourceForListing(listing: Listing, fallback: ChatContextSource = 'listing'): ChatContextSource {
  const t = deriveMarketType(listing)
  if (t === 'sell') return 'sell'
  if (t === 'barter') return 'barter'
  if (t === 'job' || t === 'minijob') return 'job'
  if (fallback === 'match') return 'match'
  return 'market'
}

function labelForSource(source: ChatContextSource): string {
  switch (source) {
    case 'foto':
      return 'Foto'
    case 'sell':
      return 'Foto-Verkauf'
    case 'barter':
      return 'Tausch'
    case 'job':
      return 'Job'
    case 'market':
      return 'Marktplatz'
    case 'match':
      return 'Match'
    default:
      return 'Inserat'
  }
}

export function openListingChat(input: {
  meId: string
  meName: string
  listing: Listing
  note?: string
  source?: ChatContextSource
}): Thread {
  const source = input.source ?? chatSourceForListing(input.listing)
  const label = labelForSource(source)
  const body =
    input.note?.trim() ||
    `Allda Chat — Anschreiben (${label}) zu „${input.listing.title}“.`

  return store.createDirectThread({
    participantIds: [input.meId, input.listing.ownerId],
    participantNames: [input.meName, input.listing.ownerName],
    listingId: input.listing.id,
    listingTitle: input.listing.title,
    senderId: input.meId,
    senderName: input.meName,
    body,
    kind: kindForListing(input.listing),
  })
}

/** After mutual swipe interest — open Allda Chat with listing context when possible. */
export function openMutualMatchChat(input: {
  meId: string
  meName: string
  mutual: MutualMatch
}): Thread {
  const listing = input.mutual.listingId ? store.getListing(input.mutual.listingId) : undefined
  if (listing) {
    return openListingChat({
      meId: input.meId,
      meName: input.meName,
      listing,
      source: chatSourceForListing(listing, 'match'),
    })
  }
  const peerId = input.mutual.candidateId
  if (!peerId) {
    throw new Error('openMutualMatchChat: missing listing or candidate on mutual match')
  }
  return store.createDirectThread({
    participantIds: [input.meId, peerId],
    participantNames: [input.meName, input.mutual.title],
    listingTitle: input.mutual.title,
    senderId: input.meId,
    senderName: input.meName,
    body: `Allda Chat — Anschreiben (Match) zu „${input.mutual.title}“.`,
    kind: 'match',
  })
}
