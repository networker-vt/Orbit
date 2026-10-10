import { store } from './store'
import { getPrefs, type OrbitPrefs } from './prefs'
import { uid } from './utils'
import type { Thread } from '../types'

const KEY = 'orbit_social_v1'
const EVT = 'orbit-social-changed'

/** Curated interest chips when prefs have no occupation/life terms yet. */
export const DEFAULT_SEARCH_SUGGESTIONS = [
  'Logistik',
  'Buchhaltung',
  'Remote',
  'Partnerschaft',
  'Minijob',
  'Essen',
  'Freizeit',
  '3PL',
] as const

export interface SocialComment {
  id: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
}

export interface SocialPost {
  id: string
  authorId: string
  authorName: string
  authorKind: 'person' | 'company'
  body: string
  listingId?: string
  createdAt: string
  likes: string[]
  comments: SocialComment[]
  featured?: boolean
  /** Interest / search terms this post is about (Suchbegriffe). Optional for older localStorage. */
  topics?: string[]
}

interface SocialState {
  posts: SocialPost[]
  following: string[]
  /** Active search preference chips that rank the feed and open topic chats. */
  searchPrefs: string[]
}

function seedPosts(): SocialPost[] {
  return [
    {
      id: 'soc-1',
      authorId: 'user-b2b-1',
      authorName: 'Northline Ops',
      authorKind: 'company',
      body: 'Looking for a 3PL in ES→DACH. Complementary to our WMS — swipe us in Match, don’t catalogue-spam.',
      createdAt: '2026-09-16T08:00:00Z',
      likes: ['user-b2b-3'],
      topics: ['Logistik', '3PL', 'Partnerschaft'],
      comments: [
        {
          id: 'c-1',
          authorId: 'user-b2b-3',
          authorName: 'Harbor Fulfill',
          body: 'We run Benelux + NRW last-mile. Mutual match?',
          createdAt: '2026-09-16T09:00:00Z',
        },
      ],
    },
    {
      id: 'soc-2',
      authorId: 'user-svc-1',
      authorName: 'Nora Patel',
      authorKind: 'person',
      body: 'Open for SME bookkeeping sprints this month. Remote EN/DE. Post a need or Match.',
      createdAt: '2026-09-15T14:00:00Z',
      likes: ['user-it-1'],
      comments: [],
      topics: ['Buchhaltung', 'Remote'],
    },
    {
      id: 'soc-3',
      authorId: 'user-ptn-1',
      authorName: 'GreenShelf Retail',
      authorKind: 'company',
      body: 'Co-marketing DACH grocery — independent stores, no franchise fee. Partnership lane on the marketplace.',
      createdAt: '2026-09-14T11:00:00Z',
      likes: [],
      comments: [],
      topics: ['Essen', 'Partnerschaft'],
    },
    {
      id: 'soc-4',
      authorId: 'user-svc-2',
      authorName: 'Leo Hartmann',
      authorKind: 'person',
      body: 'Abend-Minijob in der Event-Crew gesucht — Aufbau, Load-in, freundliches Team. Köln / Düsseldorf.',
      createdAt: '2026-09-13T18:30:00Z',
      likes: [],
      comments: [],
      topics: ['Minijob', 'Freizeit'],
    },
    {
      id: 'soc-5',
      authorId: 'user-b2b-2',
      authorName: 'Riverlane Studio',
      authorKind: 'company',
      body: 'Looking for remote motion designers for a short campaign. Share your reel or open a #Remote chat.',
      createdAt: '2026-09-12T10:15:00Z',
      likes: ['user-svc-1'],
      comments: [],
      topics: ['Remote', 'Freizeit'],
    },
  ]
}

function defaultState(): SocialState {
  return { posts: seedPosts(), following: [], searchPrefs: [] }
}

function normalizeTerm(raw: string): string {
  return raw.trim().replace(/^#/, '').replace(/\s+/g, ' ').slice(0, 40)
}

function uniqueTerms(terms: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of terms) {
    const term = normalizeTerm(raw)
    if (!term) continue
    const key = term.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(term)
  }
  return out
}

/** Pull interest terms from Orbit prefs (occupations, life, skills). */
export function interestTermsFromPrefs(prefs: OrbitPrefs = getPrefs()): string[] {
  const bag: string[] = [
    ...prefs.seeker.occupationTerms,
    ...prefs.employer.occupationTerms,
    ...prefs.seeker.mustHaveSkills,
    ...prefs.employer.mustHaveSkills,
    ...prefs.seeker.lifeExamples,
    prefs.seeker.occupationOther,
    prefs.employer.occupationOther,
  ]
  if (prefs.seeker.lifeSentence.trim()) {
    for (const word of prefs.seeker.lifeSentence.split(/[\s,;/|]+/)) {
      if (word.trim().length >= 3) bag.push(word)
    }
  }
  return uniqueTerms(bag).slice(0, 16)
}

export function suggestSearchTerms(prefs: OrbitPrefs = getPrefs()): string[] {
  const fromPrefs = interestTermsFromPrefs(prefs)
  if (fromPrefs.length) return uniqueTerms([...fromPrefs, ...DEFAULT_SEARCH_SUGGESTIONS]).slice(0, 12)
  return [...DEFAULT_SEARCH_SUGGESTIONS]
}

function load(): SocialState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<SocialState>
    const posts =
      Array.isArray(parsed.posts) && parsed.posts.length
        ? parsed.posts.map((p) => ({
            ...p,
            topics: Array.isArray(p.topics) ? uniqueTerms(p.topics) : undefined,
          }))
        : seedPosts()
    return {
      posts,
      following: Array.isArray(parsed.following) ? parsed.following : [],
      searchPrefs: Array.isArray(parsed.searchPrefs) ? uniqueTerms(parsed.searchPrefs) : [],
    }
  } catch {
    return defaultState()
  }
}

let cache: SocialState | null = null
function get(): SocialState {
  if (!cache) cache = load()
  return cache
}
function commit(next: SocialState) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeSocial(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function getSocial(): SocialState {
  return structuredClone(get())
}

/** Active chips: stored prefs, else soft-seed from Orbit prefs once into the return value (not persisted until toggled). */
export function getActiveSearchPrefs(prefs: OrbitPrefs = getPrefs()): string[] {
  const stored = get().searchPrefs
  if (stored.length) return [...stored]
  return interestTermsFromPrefs(prefs)
}

export function setSearchPrefs(terms: string[]) {
  const s = get()
  commit({ ...s, searchPrefs: uniqueTerms(terms).slice(0, 16) })
  return getSocial()
}

export function toggleSearchPref(term: string) {
  const clean = normalizeTerm(term)
  if (!clean) return getSocial()
  const s = get()
  const active = s.searchPrefs.length ? s.searchPrefs : interestTermsFromPrefs()
  const key = clean.toLowerCase()
  const next = active.some((t) => t.toLowerCase() === key)
    ? active.filter((t) => t.toLowerCase() !== key)
    : uniqueTerms([...active, clean]).slice(0, 16)
  commit({ ...s, searchPrefs: next })
  return getSocial()
}

function postHaystack(post: SocialPost): string {
  const topics = (post.topics ?? []).join(' ')
  const comments = post.comments.map((c) => c.body).join(' ')
  return `${post.body} ${topics} ${comments}`.toLowerCase()
}

/** Score how well a post matches active search preferences (0 = no match). */
export function scorePostForPrefs(post: SocialPost, prefs: string[]): number {
  if (!prefs.length) return post.featured ? 1 : 0
  const hay = postHaystack(post)
  let score = 0
  for (const term of prefs) {
    const needle = term.toLowerCase()
    if (!needle) continue
    if ((post.topics ?? []).some((t) => t.toLowerCase() === needle)) score += 5
    else if (hay.includes(needle)) score += 2
  }
  if (post.featured) score += 3
  return score
}

export function rankPostsBySearchPrefs(posts: SocialPost[], prefs: string[]): SocialPost[] {
  const scored = posts.map((post, index) => ({
    post,
    index,
    score: scorePostForPrefs(post, prefs),
  }))
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (Boolean(b.post.featured) !== Boolean(a.post.featured)) {
      return Number(Boolean(b.post.featured)) - Number(Boolean(a.post.featured))
    }
    return b.post.createdAt.localeCompare(a.post.createdAt) || a.index - b.index
  })
  if (!prefs.length) return scored.map((s) => s.post)
  const matched = scored.filter((s) => s.score > 0)
  // Prefer matches; if none match yet, still show the full feed (demo-honest, not a blank wall).
  return (matched.length ? matched : scored).map((s) => s.post)
}

export function extractTopicsFromBody(body: string, known: string[] = []): string[] {
  const hay = body.toLowerCase()
  const hits = known.filter((t) => hay.includes(t.toLowerCase()))
  const hashes = [...body.matchAll(/#([\p{L}\p{N}_-]{2,40})/gu)].map((m) => m[1])
  return uniqueTerms([...hits, ...hashes]).slice(0, 8)
}

export function addPost(input: {
  authorId: string
  authorName: string
  authorKind: 'person' | 'company'
  body: string
  listingId?: string
  featured?: boolean
  topics?: string[]
}) {
  const body = input.body.trim()
  if (!body) return getSocial()
  const topics = uniqueTerms([
    ...(input.topics ?? []),
    ...extractTopicsFromBody(body, [...DEFAULT_SEARCH_SUGGESTIONS, ...getActiveSearchPrefs()]),
  ])
  const post: SocialPost = {
    id: uid('soc'),
    ...input,
    body,
    featured: Boolean(input.featured),
    topics: topics.length ? topics : undefined,
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [],
  }
  const s = get()
  const posts = [post, ...s.posts].slice(0, 80)
  posts.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
  commit({ ...s, posts })
  return getSocial()
}

export function toggleLike(postId: string, userId: string) {
  const s = structuredClone(get())
  const p = s.posts.find((x) => x.id === postId)
  if (!p) return getSocial()
  p.likes = p.likes.includes(userId) ? p.likes.filter((id) => id !== userId) : [...p.likes, userId]
  commit(s)
  return getSocial()
}

export function addComment(postId: string, authorId: string, authorName: string, body: string) {
  const text = body.trim()
  if (!text) return getSocial()
  const s = structuredClone(get())
  const p = s.posts.find((x) => x.id === postId)
  if (!p) return getSocial()
  p.comments.push({
    id: uid('cmt'),
    authorId,
    authorName,
    body: text,
    createdAt: new Date().toISOString(),
  })
  commit(s)
  return getSocial()
}

export function toggleFollow(profileId: string) {
  const s = get()
  const following = s.following.includes(profileId)
    ? s.following.filter((id) => id !== profileId)
    : [...s.following, profileId]
  commit({ ...s, following })
  return getSocial()
}

/** No sample people. A real meeting list does not exist yet. */
export function discoverPeople() {
  return []
}

export function topicParticipantId(term: string) {
  return `topic:${normalizeTerm(term).toLowerCase().replace(/\s+/g, '-')}`
}

export function isTopicThread(thread: Thread): boolean {
  return (thread.kind ?? 'match') === 'social' && thread.participantIds.some((id) => id.startsWith('topic:'))
}

export function topicLabelFromThread(thread: Thread): string | null {
  if (!isTopicThread(thread)) return null
  const fromTitle = thread.listingTitle?.replace(/\s*·\s*Orbit Social$/i, '').trim()
  if (fromTitle) return fromTitle
  const name = thread.participantNames.find((n) => n.startsWith('#'))
  return name ? name.replace(/^#/, '') : null
}

/** Open or reuse a demo chat room keyed by a search term (Suchbegriff). */
export function openSearchTermChat(input: {
  meId: string
  meName: string
  term: string
}): Thread {
  const term = normalizeTerm(input.term)
  const topicId = topicParticipantId(term)
  const title = `${term} · Orbit Social`
  const existing = store.listThreads(input.meId).find(
    (t) =>
      (t.kind ?? 'match') === 'social' &&
      t.participantIds.includes(topicId) &&
      (t.listingTitle || '') === title,
  )
  if (existing) return existing
  return store.createDirectThread({
    participantIds: [input.meId, topicId],
    participantNames: [input.meName, `#${term}`],
    listingTitle: title,
    senderId: input.meId,
    senderName: input.meName,
    body: `Orbit Social — Chat zu „${term}“ (Demo, localStorage). Teile Tipps oder Fragen rund um diesen Suchbegriff.`,
    kind: 'social',
  })
}

export function listSearchTermChats(userId: string): Thread[] {
  return store
    .listThreads(userId)
    .filter(isTopicThread)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function startSocialDm(input: {
  meId: string
  meName: string
  otherId: string
  otherName: string
}) {
  return store.createDirectThread({
    participantIds: [input.meId, input.otherId],
    participantNames: [input.meName, input.otherName],
    listingTitle: input.otherName,
    senderId: input.meId,
    senderName: input.meName,
    body: 'Orbit Social — kurzer DM (Demo).',
    kind: 'social',
  })
}

/** Test helper — clears in-memory cache so the next read reloads from localStorage. */
export function __resetSocialCacheForTests() {
  cache = null
}
