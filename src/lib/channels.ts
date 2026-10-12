/**
 * Channel linking stubs — no OAuth, no scraping, no silent harvest.
 * Connected flags live in localStorage and only bias on-device ranking.
 * Connect requires explicit consent. Kids: no social connects.
 */
import { kidsHideSocialConnects } from './kids'

export type ChannelKind = 'commerce' | 'entertainment' | 'social' | 'gaming'

export type ChannelId =
  | 'amazon'
  | 'netflix'
  | 'youtube'
  | 'spotify'
  | 'instagram'
  | 'meta'
  | 'x'
  | 'steam'
  | 'playstation'
  | 'xbox'

export interface ChannelDef {
  id: ChannelId
  label: string
  emoji: string
  kind: ChannelKind
  tags: string[]
  demo: true
}

export const CHANNEL_DEFS: ChannelDef[] = [
  {
    id: 'amazon',
    label: 'Amazon',
    emoji: '📦',
    kind: 'commerce',
    demo: true,
    tags: ['shop', 'shopping', 'retail', 'handel', 'amazon', 'marktplatz', 'kleid', 'sneaker'],
  },
  {
    id: 'netflix',
    label: 'Netflix',
    emoji: '🎬',
    kind: 'entertainment',
    demo: true,
    tags: ['film', 'serie', 'stream', 'entertainment', 'netflix', 'creator'],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    emoji: '▶️',
    kind: 'entertainment',
    demo: true,
    tags: ['youtube', 'video', 'creator', 'entertainment', 'tutorial'],
  },
  {
    id: 'spotify',
    label: 'Spotify',
    emoji: '🎧',
    kind: 'entertainment',
    demo: true,
    tags: ['musik', 'music', 'band', 'spotify', 'konzert', 'entertainment'],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    emoji: '📸',
    kind: 'social',
    demo: true,
    tags: ['instagram', 'fashion', 'look', 'style', 'foto', 'creator'],
  },
  {
    id: 'meta',
    label: 'Meta',
    emoji: '🔵',
    kind: 'social',
    demo: true,
    tags: ['meta', 'facebook', 'social', 'community', 'gruppe'],
  },
  {
    id: 'x',
    label: 'X / Twitter',
    emoji: '🐦',
    kind: 'social',
    demo: true,
    tags: ['twitter', 'x.com', 'news', 'social', 'creator'],
  },
  {
    id: 'steam',
    label: 'Steam',
    emoji: '🎮',
    kind: 'gaming',
    demo: true,
    tags: ['steam', 'game', 'gaming', 'pc', 'spiel'],
  },
  {
    id: 'playstation',
    label: 'PlayStation',
    emoji: '🕹️',
    kind: 'gaming',
    demo: true,
    tags: ['playstation', 'ps5', 'psn', 'gaming', 'konsole'],
  },
  {
    id: 'xbox',
    label: 'Xbox',
    emoji: '❎',
    kind: 'gaming',
    demo: true,
    tags: ['xbox', 'gamepass', 'gaming', 'konsole'],
  },
]

export const CHANNEL_IDS = CHANNEL_DEFS.map((c) => c.id)

const KEY = 'orbit_channels_v1'
const EVT = 'orbit-channels-changed'

export type ChannelRecord = {
  connected: boolean
  consentedAt?: string
}

export type ChannelRecords = Record<ChannelId, ChannelRecord>
export type ChannelState = Record<ChannelId, boolean>

function emptyRecord(): ChannelRecord {
  return { connected: false }
}

function defaultRecords(): ChannelRecords {
  return {
    amazon: emptyRecord(),
    netflix: emptyRecord(),
    youtube: emptyRecord(),
    spotify: emptyRecord(),
    instagram: emptyRecord(),
    meta: emptyRecord(),
    x: emptyRecord(),
    steam: emptyRecord(),
    playstation: emptyRecord(),
    xbox: emptyRecord(),
  }
}

function asRecord(value: unknown): ChannelRecord {
  if (value === true) return { connected: true, consentedAt: 'legacy' }
  if (value === false || value == null) return emptyRecord()
  if (typeof value === 'object') {
    const rec = value as Partial<ChannelRecord>
    return {
      connected: Boolean(rec.connected),
      consentedAt: typeof rec.consentedAt === 'string' ? rec.consentedAt : undefined,
    }
  }
  return emptyRecord()
}

function loadRecords(): ChannelRecords {
  const base = defaultRecords()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Record<string, unknown>
    for (const id of CHANNEL_IDS) {
      if (id in parsed) base[id] = asRecord(parsed[id])
    }
    return base
  } catch {
    return base
  }
}

let cache: ChannelRecords | null = null
function getRecords(): ChannelRecords {
  if (!cache) cache = loadRecords()
  return cache
}

function commit(next: ChannelRecords) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

function flagsFrom(records: ChannelRecords): ChannelState {
  const flags = {} as ChannelState
  for (const id of CHANNEL_IDS) flags[id] = records[id].connected
  return flags
}

export function getChannelRecords(): ChannelRecords {
  return { ...getRecords() }
}

export function getChannels(): ChannelState {
  return flagsFrom(getRecords())
}

export function isSocialChannel(id: ChannelId): boolean {
  return CHANNEL_DEFS.find((c) => c.id === id)?.kind === 'social'
}

export function kidsMayConnectChannel(id: ChannelId, kids = kidsHideSocialConnects()): boolean {
  if (!kids) return true
  return !isSocialChannel(id)
}

export function visibleChannelDefs(kids = kidsHideSocialConnects()): ChannelDef[] {
  return CHANNEL_DEFS.filter((c) => kidsMayConnectChannel(c.id, kids))
}

export function connectChannel(id: ChannelId, consent: boolean): boolean {
  if (!consent) return false
  if (!kidsMayConnectChannel(id)) return false
  const next = { ...getRecords(), [id]: { connected: true, consentedAt: new Date().toISOString() } }
  commit(next)
  return true
}

export function disconnectChannel(id: ChannelId): boolean {
  const next = { ...getRecords(), [id]: emptyRecord() }
  commit(next)
  return true
}

/** Legacy toggle. Turning on without consent is a no-op. */
export function toggleChannel(id: ChannelId, on?: boolean) {
  const connected = getRecords()[id].connected
  const nextOn = on ?? !connected
  if (nextOn) return connectChannel(id, false)
  return disconnectChannel(id)
}

export function subscribeChannels(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function connectedChannelDefs(): ChannelDef[] {
  const st = getChannels()
  return CHANNEL_DEFS.filter((c) => st[c.id])
}

/** Light on-device bias. Never claims to have read the real account. */
export function channelBoostForText(text: string): { score: number; label?: string } {
  const hay = text.toLowerCase()
  const connected = connectedChannelDefs()
  if (connected.length === 0) return { score: 0 }
  let score = 0
  let label: string | undefined
  for (const ch of connected) {
    if (ch.tags.some((t) => hay.includes(t))) {
      score += 14
      label = ch.label
    }
  }
  return { score: Math.min(28, score), label }
}

export function __resetChannelsForTests() {
  cache = null
  localStorage.removeItem(KEY)
}

export const CHANNELS_DISCLAIMER_DE =
  'Verbinden ist ein Demo-Stub — kein OAuth, kein Login bei Meta / X / Steam / PlayStation. Allda liest und scrapet diese Konten nicht. Nur nach ausdrücklicher Zustimmung speichert der Schalter lokal ein connected-Flag.'

export const CHANNELS_DISCLAIMER_EN =
  'Connect is a demo stub — no OAuth, no Meta / X / Steam / PlayStation login. Allda does not read or scrape those accounts. Only after explicit consent does the toggle store a local connected flag.'
