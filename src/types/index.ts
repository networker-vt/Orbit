export type ListingKind = 'offer' | 'request'
export type Vertical =
  | 'freelancer'
  | 'company'
  | 'material'
  | 'transporter'
  | 'courier'
  | 'hotel'
  | 'job'
  | 'partnership'

/** Unified marketplace taxonomy — Match hub lanes include mobility + barter + sell-by-photo. */
export type MarketType =
  | 'job'
  | 'minijob'
  | 'service'
  | 'b2b'
  | 'partnership'
  | 'asset'
  | 'courier'
  | 'ride'
  | 'barter'
  | 'sell'

/** Tausch: rein natural vs. later Aufpreis/Escrow (Escrow gated in product). */
export type BarterMode = 'natural' | 'hybrid'

/** Second-hand condition for sell-by-photo listings. */
export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'parts'

/** Simple create-sheet intents. Need = Gesuch on any lane. */
export type CreateIntent =
  | 'job'
  | 'minijob'
  | 'service'
  | 'courier'
  | 'ride'
  | 'barter'
  | 'sell'
  | 'partnership'
  | 'need'

export type Role =
  | 'freelancer'
  | 'company'
  | 'hotel'
  | 'transporter'
  | 'courier'
  | 'material'
  | 'agency'
  | 'admin'

export type BookingStatus =
  | 'inquiry'
  | 'offer'
  | 'accepted'
  | 'booked'
  | 'completed'
  | 'cancelled'

export type VerificationLevel = 'none' | 'email' | 'id' | 'business'

export interface Profile {
  id: string
  name: string
  email: string
  role: Role
  city: string
  bio: string
  avatarUrl?: string
  crafts: string[]
  verified: VerificationLevel
  rating: number
  reviewCount: number
  phone?: string
  companyName?: string
  /** Verfügbarkeit Freelancer / Crew */
  available?: boolean
  /** Reise-Radius in km (Treffen vor Ort) */
  travelRadiusKm?: number
  /** Zertifikate / Versicherungen */
  certifications?: string[]
  insured?: boolean
  createdAt: string
}

export interface Listing {
  id: string
  kind: ListingKind
  vertical: Vertical
  title: string
  description: string
  city: string
  crafts: string[]
  priceFrom?: number
  priceTo?: number
  priceUnit?: string
  currency: 'EUR'
  dateFrom?: string
  dateTo?: string
  ownerId: string
  ownerName: string
  ownerVerified: VerificationLevel
  rating?: number
  tags: string[]
  capacity?: string
  imageEmoji: string
  featured?: boolean
  createdAt: string
  status: 'active' | 'filled' | 'archived'
  /** Job/Gig Felder */
  venue?: string
  callTime?: string
  requirements?: string[]
  /** Anfahrt — Transparenz vs. WhatsApp-Listen */
  travel?: TravelCover
  /** Übernachtung */
  overnight?: OvernightCover
  /** Spesen */
  expenses?: ExpensesCover
  expensesNote?: string
  /** Angenommene Arbeitstag-Länge (DE Event: typisch 10h) */
  dayHours?: number
  /** Warum dieses Angebot gerankt / empfohlen wird */
  matchReason?: string
  /** Orbit global job fields */
  industry?: string
  jobType?: string
  workMode?: 'remote' | 'hybrid' | 'onsite'
  country?: string
  languages?: string[]
  source?: string
  salaryPeriod?: 'hour' | 'day' | 'month' | 'year'
  /** Marketplace lane; derived from vertical/jobType when omitted (legacy seeds). */
  marketType?: MarketType
  /** Tausch only: natural swap vs hybrid with optional EUR top-up (Escrow later). */
  barterMode?: BarterMode
  /** Sell-by-photo: article condition (user-confirmed). */
  itemCondition?: ItemCondition
  /** What this post offers (chips) — used in offer↔need scoring. */
  offerTags?: string[]
  /** What this post needs (chips). */
  needTags?: string[]
  /** Jugendschutz: listing may appear in Orbit Kids Treffer. */
  safeForKids?: boolean
  /** DSA: private or commercial seller. Missing means private. */
  sellerKind?: 'private' | 'commercial'
  trader?: { name: string; address: string; email: string; phone: string }
}


export type TravelCover = 'included' | 'per_km' | 'self' | 'tbd'
export type OvernightCover = 'provided' | 'hotel' | 'none' | 'tbd'
export type ExpensesCover = 'receipts' | 'flat' | 'included' | 'none' | 'tbd'

export interface Message {
  id: string
  threadId: string
  senderId: string
  senderName: string
  body: string
  createdAt: string
  read: boolean
}

export interface Thread {
  id: string
  listingId?: string
  listingTitle?: string
  participantIds: string[]
  participantNames: string[]
  lastMessage?: string
  updatedAt: string
  /** Conversations hub: Match, Booking, Support, Social DM. */
  kind?: ThreadKind
}

export type ThreadKind = 'match' | 'booking' | 'support' | 'social'

export interface Booking {
  id: string
  listingId: string
  listingTitle: string
  vertical: Vertical
  requesterId: string
  providerId: string
  requesterName: string
  providerName: string
  status: BookingStatus
  offerAmount?: number
  note?: string
  projectId?: string
  threadId?: string
  dateFrom?: string
  dateTo?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectResource {
  bookingId: string
  vertical: Vertical
  label: string
  status: BookingStatus
}

export interface Project {
  id: string
  title: string
  city: string
  dateFrom: string
  dateTo: string
  ownerId: string
  description: string
  resources: ProjectResource[]
  status: 'draft' | 'active' | 'done'
  createdAt: string
}

export interface ListingFilters {
  q?: string
  city?: string
  craft?: string
  vertical?: Vertical | 'all'
  kind?: ListingKind | 'all'
  priceMax?: number
  priceMin?: number
  dateFrom?: string
  /** Mock-Radius: filtert Stadt + Nachbarstädte (vereinfacht) */
  radiusKm?: number
  marketType?: MarketType | 'all'
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
}

export interface Review {
  id: string
  bookingId: string
  listingId: string
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  rating: number
  comment: string
  createdAt: string
}

export type StoreMode = 'local' | 'supabase'
