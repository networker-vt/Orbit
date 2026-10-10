import { uid } from './utils'

const KEY = 'orbit_social_v1'
const EVT = 'orbit-social-changed'

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
}

interface SocialState {
  posts: SocialPost[]
  following: string[]
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
    },
  ]
}

function defaultState(): SocialState {
  return { posts: seedPosts(), following: [] }
}

function load(): SocialState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as SocialState
    return {
      posts: Array.isArray(parsed.posts) && parsed.posts.length ? parsed.posts : seedPosts(),
      following: Array.isArray(parsed.following) ? parsed.following : [],
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

export function addPost(input: {
  authorId: string
  authorName: string
  authorKind: 'person' | 'company'
  body: string
  listingId?: string
  featured?: boolean
}) {
  const body = input.body.trim()
  if (!body) return getSocial()
  const post: SocialPost = {
    id: uid('soc'),
    ...input,
    body,
    featured: Boolean(input.featured),
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

/**
 * Social cold-DM entry — consent-gated via socialDm API.
 * Prefer importing requestSocialDm / openAcceptedSocialChat from `./socialDm`.
 */
export { startSocialDm, requestSocialDm, openAcceptedSocialChat, getSocialDmPermission } from './socialDm'
