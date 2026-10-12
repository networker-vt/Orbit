import type {
  Booking,
  Listing,
  Message,
  Profile,
  Project,
  Thread,
  VerificationLevel,
  Vertical,
  ListingKind,
  BookingStatus,
  Role,
} from '../types'
import { isSupabaseConfigured, supabase } from './supabase'

/** Map DB listing row (+ optional joined profile) → app Listing */
export function mapListingRow(row: Record<string, unknown>): Listing {
  const owner = (row.profiles ?? row.owner ?? {}) as Record<string, unknown>
  return {
    id: String(row.id),
    kind: row.kind as ListingKind,
    vertical: row.vertical as Vertical,
    title: String(row.title),
    description: String(row.description ?? ''),
    city: String(row.city),
    crafts: (row.crafts as string[]) ?? [],
    priceFrom: row.price_from != null ? Number(row.price_from) : undefined,
    priceTo: row.price_to != null ? Number(row.price_to) : undefined,
    priceUnit: (row.price_unit as string) || undefined,
    currency: 'EUR',
    dateFrom: (row.date_from as string) || undefined,
    dateTo: (row.date_to as string) || undefined,
    ownerId: String(row.owner_id),
    ownerName: String(owner.name ?? row.owner_name ?? 'Anbieter'),
    ownerVerified: (owner.verified as VerificationLevel) ?? 'email',
    rating: owner.rating != null ? Number(owner.rating) : undefined,
    tags: (row.tags as string[]) ?? [],
    capacity: (row.capacity as string) || undefined,
    imageEmoji: String(row.image_emoji ?? '⚡'),
    featured: Boolean(row.featured),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    status: (row.status as Listing['status']) ?? 'active',
    venue: (row.venue as string) || undefined,
    callTime: (row.call_time as string) || undefined,
    requirements: (row.requirements as string[]) || undefined,
    travel: (row.travel as Listing['travel']) || undefined,
    overnight: (row.overnight as Listing['overnight']) || undefined,
    expenses: (row.expenses as Listing['expenses']) || undefined,
    expensesNote: (row.expenses_note as string) || undefined,
    dayHours: row.day_hours != null ? Number(row.day_hours) : undefined,
  }
}

export function mapProfileRow(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role as Role,
    city: String(row.city ?? 'Berlin'),
    bio: String(row.bio ?? ''),
    avatarUrl: (row.avatar_url as string) || undefined,
    crafts: (row.crafts as string[]) ?? [],
    verified: (row.verified as VerificationLevel) ?? 'email',
    rating: Number(row.rating ?? 5),
    reviewCount: Number(row.review_count ?? 0),
    phone: (row.phone as string) || undefined,
    companyName: (row.company_name as string) || undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

export function mapBookingRow(row: Record<string, unknown>): Booking {
  return {
    id: String(row.id),
    listingId: String(row.listing_id),
    listingTitle: String(row.listing_title),
    vertical: row.vertical as Vertical,
    requesterId: String(row.requester_id),
    providerId: String(row.provider_id),
    requesterName: String(row.requester_name ?? 'Anfragender'),
    providerName: String(row.provider_name ?? 'Anbieter'),
    status: row.status as BookingStatus,
    offerAmount: row.offer_amount != null ? Number(row.offer_amount) : undefined,
    note: (row.note as string) || undefined,
    projectId: (row.project_id as string) || undefined,
    threadId: (row.thread_id as string) || undefined,
    dateFrom: (row.date_from as string) || undefined,
    dateTo: (row.date_to as string) || undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export function listingToRow(l: Listing) {
  return {
    id: l.id,
    kind: l.kind,
    vertical: l.vertical,
    title: l.title,
    description: l.description,
    city: l.city,
    crafts: l.crafts,
    price_from: l.priceFrom ?? null,
    price_to: l.priceTo ?? null,
    price_unit: l.priceUnit ?? null,
    currency: l.currency,
    date_from: l.dateFrom ?? null,
    date_to: l.dateTo ?? null,
    owner_id: l.ownerId,
    tags: l.tags,
    capacity: l.capacity ?? null,
    image_emoji: l.imageEmoji,
    featured: l.featured ?? false,
    status: l.status,
    created_at: l.createdAt,
    venue: l.venue ?? null,
    call_time: l.callTime ?? null,
    requirements: l.requirements ?? null,
    travel: l.travel ?? null,
    overnight: l.overnight ?? null,
    expenses: l.expenses ?? null,
    expenses_note: l.expensesNote ?? null,
    day_hours: l.dayHours ?? null,
  }
}

/**
 * Try to hydrate marketplace data from Supabase.
 * Returns null on missing config, network/RLS errors, or empty listings
 * so the caller can keep the localStorage demo seed.
 */
export async function fetchSupabaseSnapshot(): Promise<{
  listings: Listing[]
  profiles: Profile[]
  bookings: Booking[]
  threads: Thread[]
  messages: Message[]
  projects: Project[]
} | null> {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    const [listingsRes, profilesRes, bookingsRes] = await Promise.all([
      supabase
        .from('listings')
        .select('*, profiles:owner_id(name, verified, rating)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('profiles').select('*').limit(200),
      supabase.from('bookings').select('*').order('updated_at', { ascending: false }).limit(200),
    ])

    if (listingsRes.error) {
      console.info('[Allda] Supabase listings:', listingsRes.error.message)
      return null
    }
    if (!listingsRes.data?.length) {
      console.info('[Allda] Supabase listings leer — Demo-Store bleibt aktiv')
      return null
    }

    const listings = listingsRes.data.map((r) => mapListingRow(r as Record<string, unknown>))
    const profiles = (profilesRes.data ?? []).map((r) =>
      mapProfileRow(r as Record<string, unknown>),
    )
    const bookings = (bookingsRes.data ?? []).map((r) =>
      mapBookingRow(r as Record<string, unknown>),
    )

    // Threads/messages/projects optional — empty if RLS blocks anon
    let threads: Thread[] = []
    let messages: Message[] = []
    let projects: Project[] = []
    try {
      const [tRes, mRes, pRes] = await Promise.all([
        supabase.from('threads').select('*').limit(100),
        supabase.from('messages').select('*').limit(500),
        supabase.from('projects').select('*').limit(50),
      ])
      if (tRes.data) {
        threads = tRes.data.map((t) => ({
          id: String(t.id),
          listingId: t.listing_id ?? undefined,
          listingTitle: t.listing_title ?? undefined,
          participantIds: [],
          participantNames: [],
          updatedAt: String(t.updated_at ?? t.created_at),
        }))
      }
      if (mRes.data) {
        messages = mRes.data.map((m) => ({
          id: String(m.id),
          threadId: String(m.thread_id),
          senderId: String(m.sender_id),
          senderName: 'User',
          body: String(m.body),
          createdAt: String(m.created_at),
          read: Boolean(m.read),
        }))
      }
      if (pRes.data) {
        projects = pRes.data.map((p) => ({
          id: String(p.id),
          title: String(p.title),
          city: String(p.city),
          dateFrom: String(p.date_from),
          dateTo: String(p.date_to),
          ownerId: String(p.owner_id),
          description: String(p.description ?? ''),
          resources: [],
          status: p.status as Project['status'],
          createdAt: String(p.created_at),
        }))
      }
    } catch {
      /* ignore optional tables */
    }

    return { listings, profiles, bookings, threads, messages, projects }
  } catch (e) {
    console.info('[Allda] Supabase hydrate failed — Demo-Store:', e)
    return null
  }
}

export async function pushListingToSupabase(listing: Listing) {
  if (!isSupabaseConfigured || !supabase) return
  try {
    await supabase.from('listings').upsert(listingToRow(listing))
  } catch (e) {
    console.info('[Allda] listing sync skip:', e)
  }
}

export async function pushBookingStatusToSupabase(
  id: string,
  status: BookingStatus,
  extra?: { offerAmount?: number; note?: string },
) {
  if (!isSupabaseConfigured || !supabase) return
  try {
    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (extra?.offerAmount != null) patch.offer_amount = extra.offerAmount
    if (extra?.note) patch.note = extra.note
    await supabase.from('bookings').update(patch).eq('id', id)
  } catch (e) {
    console.info('[Allda] booking sync skip:', e)
  }
}
