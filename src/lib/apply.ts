import type { Listing } from '../types'
import { store } from './store'
import { formatDocsLine, formatSkillLine } from './profileHub'
import { getPrefs } from './prefs'
import { trackBehavior } from './behavior'
import { ensureInterviewRoom } from './interviews'

export function alreadyApplied(listingId: string, userId: string) {
  return store.listBookingsForListing(listingId).some(
    (b) => b.requesterId === userId || b.providerId === userId,
  )
}

export function buildInterestNote(input: { name: string; city?: string }): string {
  const prefs = getPrefs()
  const skills = formatSkillLine() || 'noch keine Skills'
  const docs = formatDocsLine()
  const radius = prefs.seeker.radiusKm
  const lines = [
    `Allda 1-Tap Interesse von ${input.name}${input.city ? ` (${input.city})` : ''}.`,
    `Suchradius: ${radius} km.`,
    `Skills: ${skills}.`,
    docs ? `Nachweise: ${docs}.` : 'Keine Nachweise hochgeladen.',
    'Kein Anschreiben — Profilpaket statt CV-Spam.',
  ]
  return lines.join('\n')
}

export function applyInterest(input: {
  listing: Listing
  requesterId: string
  requesterName: string
  city?: string
}) {
  if (alreadyApplied(input.listing.id, input.requesterId)) {
    const existing = store.listBookingsForListing(input.listing.id).find(
      (b) => b.requesterId === input.requesterId,
    )
    const room = ensureInterviewRoom({
      listingId: input.listing.id,
      listingTitle: input.listing.title,
      peerName: input.listing.ownerName,
    })
    return {
      duplicate: true as const,
      booking: existing,
      thread: existing?.threadId ? store.getThread(existing.threadId) : undefined,
      interviewId: room.id,
    }
  }
  const note = buildInterestNote({ name: input.requesterName, city: input.city })
  const { booking, thread } = store.createInquiry({
    listing: input.listing,
    requesterId: input.requesterId,
    requesterName: input.requesterName,
    note,
  })
  if (input.listing.priceFrom != null) {
    store.updateBookingStatus(booking.id, 'inquiry', { offerAmount: input.listing.priceFrom })
  }
  trackBehavior({
    kind: 'apply',
    listingId: input.listing.id,
    industry: input.listing.industry,
    jobType: input.listing.jobType,
    city: input.listing.city,
  })
  const room = ensureInterviewRoom({
    listingId: input.listing.id,
    listingTitle: input.listing.title,
    peerName: input.listing.ownerName,
  })
  return { duplicate: false as const, booking, thread, interviewId: room.id, note }
}
