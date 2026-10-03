import {
  seedBookings,
  seedListings,
  seedMessages,
  seedProfiles,
  seedProjects,
  seedThreads,
} from '../data/seed'
import type {
  Booking,
  BookingStatus,
  Listing,
  ListingFilters,
  Message,
  Profile,
  Project,
  Review,
  StoreMode,
  Thread,
} from '../types'
import { deriveMarketType } from './market'
import { isSupabaseConfigured } from './supabase'
import { isFlagOn } from './flags'
import {
  fetchSupabaseSnapshot,
  pushBookingStatusToSupabase,
  pushListingToSupabase,
} from './supabaseSync'
import { uid } from './utils'

const KEY = 'el_store_v4'
const SEED_REV = 7
const REVIEWS_KEY = 'el_reviews_v1'

interface StoreData {
  listings: Listing[]
  bookings: Booking[]
  threads: Thread[]
  messages: Message[]
  projects: Project[]
  profiles: Profile[]
  reviews: Review[]
}

let mode: StoreMode = 'local'

function defaultData(): StoreData {
  return {
    listings: [...seedListings],
    bookings: [...seedBookings],
    threads: [...seedThreads],
    messages: [...seedMessages],
    projects: [...seedProjects],
    profiles: [...seedProfiles],
    reviews: loadReviews(),
  }
}

function loadReviews(): Review[] {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY)
    return raw ? (JSON.parse(raw) as Review[]) : []
  } catch {
    return []
  }
}

function persistReviews(reviews: Review[]) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews))
}

function load(): StoreData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultData()
    const parsed = JSON.parse(raw) as StoreData & { seedRev?: number }
    if (!parsed.listings?.length) return defaultData()
    const data: StoreData = {
      ...parsed,
      reviews: parsed.reviews?.length ? parsed.reviews : loadReviews(),
    }
    if (parsed.seedRev !== SEED_REV) {
      const seedIds = new Set(seedListings.map((l) => l.id))
      const seedProfileIds = new Set(seedProfiles.map((p) => p.id))
      const userListings = data.listings.filter((l) => !seedIds.has(l.id))
      const userProfiles = data.profiles.filter((p) => !seedProfileIds.has(p.id))
      data.listings = [...seedListings, ...userListings]
      data.profiles = [...seedProfiles, ...userProfiles]
      ;(data as StoreData & { seedRev?: number }).seedRev = SEED_REV
    }
    return data
  } catch {
    return defaultData()
  }
}

function save(data: StoreData) {
  localStorage.setItem(KEY, JSON.stringify({ ...data, seedRev: SEED_REV }))
  persistReviews(data.reviews)
  window.dispatchEvent(new CustomEvent('el-store-changed'))
}

let cache: StoreData | null = null

function getData(): StoreData {
  if (!cache) cache = load()
  return cache
}

function mutate(fn: (data: StoreData) => void) {
  const data = structuredClone(getData())
  fn(data)
  cache = data
  save(data)
  return data
}

export function getStoreMode(): StoreMode {
  return mode
}

export function isLiveBackend() {
  return mode === 'supabase' && isSupabaseConfigured
}

/**
 * Prefer Supabase when env keys are set and data is available.
 * Graceful fallback to localStorage + seed demo otherwise.
 */
export async function initStore(): Promise<StoreMode> {
  if (!isSupabaseConfigured) {
    mode = 'local'
    return mode
  }
  const snap = await fetchSupabaseSnapshot()
  if (!snap) {
    mode = 'local'
    console.info(
      '[Orbit] VITE_SUPABASE_* gesetzt, aber kein nutzbarer Snapshot — Demo-Store aktiv',
    )
    return mode
  }
  cache = {
    listings: snap.listings,
    bookings: snap.bookings.length ? snap.bookings : [...seedBookings],
    threads: snap.threads.length ? snap.threads : [...seedThreads],
    messages: snap.messages.length ? snap.messages : [...seedMessages],
    projects: snap.projects.length ? snap.projects : [...seedProjects],
    profiles: snap.profiles.length ? snap.profiles : [...seedProfiles],
    reviews: loadReviews(),
  }
  save(cache)
  mode = 'supabase'
  console.info('[Orbit] Store: Supabase live (%d listings)', snap.listings.length)
  return mode
}

export function resetStore() {
  mode = 'local'
  cache = defaultData()
  save(cache)
}

export function subscribeStore(cb: () => void) {
  const handler = () => cb()
  window.addEventListener('el-store-changed', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('el-store-changed', handler)
    window.removeEventListener('storage', handler)
  }
}

/** Repository interface — Supabase preferred when configured + hydrated */
export const store = {
  listListings(filters: ListingFilters = {}): Listing[] {
    let items = getData().listings.filter((l) => l.status === 'active')
    if (filters.vertical && filters.vertical !== 'all') {
      items = items.filter((l) => l.vertical === filters.vertical)
    }
    if (filters.kind && filters.kind !== 'all') {
      items = items.filter((l) => l.kind === filters.kind)
    }
    if (filters.marketType && filters.marketType !== 'all') {
      items = items.filter((l) => deriveMarketType(l) === filters.marketType)
    }
    if (filters.city) {
      items = items.filter((l) => l.city === filters.city)
    }
    if (filters.craft) {
      const needle = filters.craft.toLowerCase()
      items = items.filter((l) => {
        if (l.crafts.includes(filters.craft!)) return true
        const hay = [l.title, l.industry, ...(l.tags || []), ...(l.crafts || [])].join(' ').toLowerCase()
        return hay.includes(needle)
      })
    }
    if (filters.priceMax != null) {
      items = items.filter(
        (l) => l.priceFrom == null || l.priceFrom <= filters.priceMax!,
      )
    }
    if (filters.priceMin != null) {
      items = items.filter(
        (l) => (l.priceFrom ?? l.priceTo ?? 0) >= filters.priceMin!,
      )
    }
    if (filters.dateFrom) {
      items = items.filter(
        (l) =>
          !l.dateTo ||
          l.dateTo >= filters.dateFrom! ||
          !l.dateFrom ||
          l.dateFrom >= filters.dateFrom!,
      )
    }
    if (filters.q) {
      const q = filters.q.toLowerCase()
      items = items.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q)) ||
          l.ownerName.toLowerCase().includes(q),
      )
    }
    if (!isFlagOn('credits')) return items
    return items.sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1))
  },

  getListing(id: string): Listing | undefined {
    return getData().listings.find((l) => l.id === id)
  },

  createListing(listing: Omit<Listing, 'id' | 'createdAt' | 'status'>): Listing {
    const item: Listing = {
      ...listing,
      id: uid('lst'),
      createdAt: new Date().toISOString(),
      status: 'active',
    }
    mutate((d) => {
      d.listings.unshift(item)
    })
    if (isFlagOn('publishListings')) void pushListingToSupabase(item)
    return item
  },

  updateListing(id: string, patch: Partial<Listing>): Listing | undefined {
    let updated: Listing | undefined
    mutate((d) => {
      const i = d.listings.findIndex((l) => l.id === id)
      if (i < 0) return
      d.listings[i] = { ...d.listings[i], ...patch, id: d.listings[i].id }
      updated = d.listings[i]
    })
    if (updated && isFlagOn('publishListings')) void pushListingToSupabase(updated)
    return updated
  },

  archiveListing(id: string): Listing | undefined {
    return store.updateListing(id, { status: 'archived' })
  },

  listListingsForOwner(ownerId: string): Listing[] {
    return getData()
      .listings.filter((l) => l.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  listProfiles(): Profile[] {
    return [...getData().profiles]
  },

  getProfile(id: string): Profile | undefined {
    return getData().profiles.find((p) => p.id === id)
  },

  upsertProfile(profile: Profile) {
    mutate((d) => {
      const i = d.profiles.findIndex((p) => p.id === profile.id)
      if (i >= 0) d.profiles[i] = profile
      else d.profiles.push(profile)
    })
  },

  listBookingsForUser(userId: string): Booking[] {
    return getData()
      .bookings.filter((b) => b.requesterId === userId || b.providerId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  listBookingsForListing(listingId: string): Booking[] {
    return getData()
      .bookings.filter((b) => b.listingId === listingId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  getBooking(id: string): Booking | undefined {
    return getData().bookings.find((b) => b.id === id)
  },

  createInquiry(input: {
    listing: Listing
    requesterId: string
    requesterName: string
    note: string
    projectId?: string
  }): { booking: Booking; thread: Thread } {
    const threadId = uid('thr')
    const bookingId = uid('bk')
    const now = new Date().toISOString()
    const thread: Thread = {
      id: threadId,
      listingId: input.listing.id,
      listingTitle: input.listing.title,
      participantIds: [input.requesterId, input.listing.ownerId],
      participantNames: [input.requesterName, input.listing.ownerName],
      lastMessage: input.note,
      updatedAt: now,
      kind: 'match',
    }
    const booking: Booking = {
      id: bookingId,
      listingId: input.listing.id,
      listingTitle: input.listing.title,
      vertical: input.listing.vertical,
      requesterId: input.requesterId,
      providerId: input.listing.ownerId,
      requesterName: input.requesterName,
      providerName: input.listing.ownerName,
      status: 'inquiry',
      note: input.note,
      projectId: input.projectId,
      threadId,
      dateFrom: input.listing.dateFrom,
      dateTo: input.listing.dateTo,
      createdAt: now,
      updatedAt: now,
    }
    const msg: Message = {
      id: uid('msg'),
      threadId,
      senderId: input.requesterId,
      senderName: input.requesterName,
      body: input.note,
      createdAt: now,
      read: false,
    }
    mutate((d) => {
      d.threads.unshift(thread)
      d.bookings.unshift(booking)
      d.messages.push(msg)
      if (input.projectId) {
        const pr = d.projects.find((p) => p.id === input.projectId)
        if (pr) {
          pr.resources.push({
            bookingId,
            vertical: input.listing.vertical,
            label: `${input.listing.ownerName} — ${input.listing.title}`,
            status: 'inquiry',
          })
        }
      }
    })
    return { booking, thread }
  },

  updateBookingStatus(
    id: string,
    status: BookingStatus,
    extra?: { offerAmount?: number; note?: string },
  ): Booking | undefined {
    let updated: Booking | undefined
    mutate((d) => {
      const b = d.bookings.find((x) => x.id === id)
      if (!b) return
      b.status = status
      b.updatedAt = new Date().toISOString()
      if (extra?.offerAmount != null) b.offerAmount = extra.offerAmount
      if (extra?.note) b.note = extra.note
      updated = b
      d.projects.forEach((p) => {
        p.resources.forEach((r) => {
          if (r.bookingId === id) r.status = status
        })
      })
    })
    void pushBookingStatusToSupabase(id, status, extra)
    return updated
  },

  listThreads(userId: string): Thread[] {
    return getData()
      .threads.filter((t) => t.participantIds.includes(userId))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  getThread(id: string): Thread | undefined {
    return getData().threads.find((t) => t.id === id)
  },

  listMessages(threadId: string): Message[] {
    return getData()
      .messages.filter((m) => m.threadId === threadId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  sendMessage(input: {
    threadId: string
    senderId: string
    senderName: string
    body: string
  }): Message {
    const now = new Date().toISOString()
    const msg: Message = {
      id: uid('msg'),
      threadId: input.threadId,
      senderId: input.senderId,
      senderName: input.senderName,
      body: input.body,
      createdAt: now,
      read: false,
    }
    mutate((d) => {
      d.messages.push(msg)
      const t = d.threads.find((x) => x.id === input.threadId)
      if (t) {
        t.lastMessage = input.body
        t.updatedAt = now
      }
    })
    return msg
  },

  createDirectThread(input: {
    participantIds: [string, string]
    participantNames: [string, string]
    listingId?: string
    listingTitle?: string
    senderId: string
    senderName: string
    body: string
    kind?: Thread['kind']
  }): Thread {
    const kind = input.kind ?? 'match'
    const existing = getData().threads.find(
      (t) =>
        t.participantIds.includes(input.participantIds[0]) &&
        t.participantIds.includes(input.participantIds[1]) &&
        (t.kind ?? 'match') === kind &&
        (input.listingId
          ? t.listingId === input.listingId
          : !t.listingId && (t.listingTitle || '') === (input.listingTitle || '')),
    )
    if (existing) {
      this.sendMessage({
        threadId: existing.id,
        senderId: input.senderId,
        senderName: input.senderName,
        body: input.body,
      })
      return this.getThread(existing.id) ?? existing
    }
    const now = new Date().toISOString()
    const threadId = uid('thr')
    const thread: Thread = {
      id: threadId,
      listingId: input.listingId,
      listingTitle: input.listingTitle,
      participantIds: [...input.participantIds],
      participantNames: [...input.participantNames],
      lastMessage: input.body,
      updatedAt: now,
      kind,
    }
    const msg: Message = {
      id: uid('msg'),
      threadId,
      senderId: input.senderId,
      senderName: input.senderName,
      body: input.body,
      createdAt: now,
      read: false,
    }
    mutate((d) => {
      d.threads.unshift(thread)
      d.messages.push(msg)
    })
    return thread
  },

  listProjects(ownerId: string): Project[] {
    return getData()
      .projects.filter((p) => p.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  getProject(id: string): Project | undefined {
    return getData().projects.find((p) => p.id === id)
  },

  createProject(
    input: Omit<Project, 'id' | 'createdAt' | 'resources' | 'status'>,
  ): Project {
    const project: Project = {
      ...input,
      id: uid('prj'),
      resources: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    mutate((d) => {
      d.projects.unshift(project)
    })
    return project
  },

  attachBookingToProject(projectId: string, booking: Booking) {
    mutate((d) => {
      const p = d.projects.find((x) => x.id === projectId)
      const b = d.bookings.find((x) => x.id === booking.id)
      if (!p || !b) return
      b.projectId = projectId
      if (!p.resources.some((r) => r.bookingId === booking.id)) {
        p.resources.push({
          bookingId: booking.id,
          vertical: booking.vertical,
          label: `${booking.providerName} — ${booking.listingTitle}`,
          status: booking.status,
        })
      }
      if (p.status === 'draft') p.status = 'active'
    })
  },

  getReviewForBooking(bookingId: string, fromUserId: string): Review | undefined {
    return getData().reviews.find(
      (r) => r.bookingId === bookingId && r.fromUserId === fromUserId,
    )
  },

  listReviewsForUser(userId: string): Review[] {
    return getData()
      .reviews.filter((r) => r.toUserId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  submitReview(input: {
    bookingId: string
    listingId: string
    fromUserId: string
    fromUserName: string
    toUserId: string
    toUserName: string
    rating: number
    comment: string
  }): Review {
    const review: Review = {
      id: uid('rev'),
      ...input,
      rating: Math.min(5, Math.max(1, Math.round(input.rating))),
      createdAt: new Date().toISOString(),
    }
    mutate((d) => {
      d.reviews = d.reviews.filter(
        (r) => !(r.bookingId === input.bookingId && r.fromUserId === input.fromUserId),
      )
      d.reviews.push(review)
      const profile = d.profiles.find((p) => p.id === input.toUserId)
      if (profile) {
        const all = d.reviews.filter((r) => r.toUserId === input.toUserId)
        const avg = all.reduce((s, r) => s + r.rating, 0) / all.length
        profile.rating = Math.round(avg * 10) / 10
        profile.reviewCount = all.length
      }
    })
    return review
  },

  stats() {
    const d = getData()
    return {
      offers: d.listings.filter((l) => l.kind === 'offer' && l.status === 'active').length,
      requests: d.listings.filter((l) => l.kind === 'request' && l.status === 'active').length,
      bookings: d.bookings.length,
      projects: d.projects.length,
      mode,
    }
  },
}

export type Store = typeof store
