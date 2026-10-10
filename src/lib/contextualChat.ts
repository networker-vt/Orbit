/**
 * Orbit Chat — contextual openers for Match / Jobs / Marktplatz / Foto.
 * These are transactional threads (not Social cold-DMs); no consent gate.
 */
import { store } from './store'
import type { Listing, Thread, ThreadKind } from '../types'

export type ChatContextSource = 'match' | 'job' | 'listing' | 'market' | 'foto' | 'barter' | 'sell'

function kindForListing(listing: Listing): ThreadKind {
  if (listing.vertical === 'job' || listing.marketType === 'job' || listing.marketType === 'minijob') {
    return 'match'
  }
  return 'booking'
}

export function openListingChat(input: {
  meId: string
  meName: string
  listing: Listing
  note?: string
  source?: ChatContextSource
}): Thread {
  const source = input.source ?? 'listing'
  const label =
    source === 'foto'
      ? 'Foto'
      : source === 'sell'
        ? 'Foto-Verkauf'
        : source === 'barter'
          ? 'Tausch'
          : source === 'job'
            ? 'Job'
            : source === 'market'
              ? 'Marktplatz'
              : source === 'match'
                ? 'Match'
                : 'Inserat'
  const body =
    input.note?.trim() ||
    `Orbit Chat — Anschreiben (${label}) zu „${input.listing.title}“.`

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
