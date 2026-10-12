import { addLocalCalendarItem } from './calendar'
import { uid } from './utils'

const KEY = 'orbit_interviews_v1'
const EVT = 'orbit-interviews-changed'

export interface InterviewMessage {
  id: string
  role: 'bot' | 'user'
  body: string
  at: string
}

export interface InterviewSlot {
  id: string
  startIso: string
  endIso: string
  label: string
  confirmed: boolean
  priority?: boolean
}

export interface InterviewRoom {
  id: string
  title: string
  listingId?: string
  listingTitle?: string
  peerName: string
  messages: InterviewMessage[]
  slots: InterviewSlot[]
  createdAt: string
}

const BOT_QUESTIONS = [
  'Warum passt diese Rolle zu dir — in zwei Sätzen?',
  'Wann könntest du diese Woche 20 Minuten sprechen?',
  'Nenn eine Skill-Situation (1–5 Sterne hast du dir selbst gegeben) — kurz konkret.',
]

function defaultRooms(): InterviewRoom[] {
  const now = new Date()
  return [
    {
      id: 'iv-demo-1',
      title: 'Demo-Interview · CityMart Hamburg',
      listingId: 'lst-g-retail-1',
      listingTitle: 'Verkäufer:in Teilzeit CityMart Hamburg',
      peerName: 'CityMart HR',
      createdAt: now.toISOString(),
      messages: [
        {
          id: 'ivm-1',
          role: 'bot',
          body: BOT_QUESTIONS[0] ? 'Hallo — kurzes Allda-Interview (Demo). Kein klassisches CV-Spam. ' + BOT_QUESTIONS[0] : '',
          at: now.toISOString(),
        },
      ],
      slots: suggestSlots(),
    },
  ]
}

export function suggestSlots(from = new Date()): InterviewSlot[] {
  const out: InterviewSlot[] = []
  for (let d = 1; d <= 4; d++) {
    const day = new Date(from)
    day.setDate(day.getDate() + d)
    day.setHours(10 + ((d * 2) % 6), 0, 0, 0)
    const end = new Date(day)
    end.setMinutes(30)
    out.push({
      id: uid('slot'),
      startIso: day.toISOString(),
      endIso: end.toISOString(),
      label: day.toLocaleString(undefined, {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      confirmed: false,
    })
  }
  return out
}

function load(): InterviewRoom[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultRooms()
    const parsed = JSON.parse(raw) as InterviewRoom[]
    return Array.isArray(parsed) && parsed.length ? parsed : defaultRooms()
  } catch {
    return defaultRooms()
  }
}

let cache: InterviewRoom[] | null = null
function get(): InterviewRoom[] {
  if (!cache) cache = load()
  return cache
}
function commit(next: InterviewRoom[]) {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribeInterviews(cb: () => void) {
  const h = () => cb()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

export function listInterviewRooms(): InterviewRoom[] {
  return structuredClone(get()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getInterviewRoom(id: string): InterviewRoom | undefined {
  return structuredClone(get().find((r) => r.id === id))
}

export function ensureInterviewRoom(input: {
  listingId?: string
  listingTitle?: string
  peerName: string
}): InterviewRoom {
  const existing = get().find(
    (r) => input.listingId && r.listingId === input.listingId,
  )
  if (existing) return structuredClone(existing)
  const room: InterviewRoom = {
    id: uid('iv'),
    title: input.listingTitle ? `Interview · ${input.listingTitle}` : 'Allda Interview',
    listingId: input.listingId,
    listingTitle: input.listingTitle,
    peerName: input.peerName,
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: uid('ivm'),
        role: 'bot',
        body: `Hallo — kurzes Allda-Interview (Demo) mit ${input.peerName}. ${BOT_QUESTIONS[0]}`,
        at: new Date().toISOString(),
      },
    ],
    slots: suggestSlots(),
  }
  commit([room, ...get()])
  return structuredClone(room)
}

export function sendInterviewMessage(roomId: string, body: string): InterviewRoom | undefined {
  const text = body.trim()
  if (!text) return getInterviewRoom(roomId)
  const next = structuredClone(get())
  const room = next.find((r) => r.id === roomId)
  if (!room) return undefined
  room.messages.push({
    id: uid('ivm'),
    role: 'user',
    body: text,
    at: new Date().toISOString(),
  })
  const userTurns = room.messages.filter((m) => m.role === 'user').length
  const q = BOT_QUESTIONS[userTurns] 
  const follow = q
    ? q
    : 'Danke. Das reicht für die Demo. Wähle einen Slot oder öffne den Video-Stub — echtes Calling braucht später einen Provider.'
  room.messages.push({
    id: uid('ivm'),
    role: 'bot',
    body: follow,
    at: new Date().toISOString(),
  })
  commit(next)
  return structuredClone(room)
}

export function confirmInterviewSlot(
  roomId: string,
  slotId: string,
  opts?: { priority?: boolean },
): InterviewRoom | undefined {
  const next = structuredClone(get())
  const room = next.find((r) => r.id === roomId)
  if (!room) return undefined
  room.slots = room.slots.map((s) => ({
    ...s,
    confirmed: s.id === slotId,
    priority: s.id === slotId ? Boolean(opts?.priority) : s.priority,
  }))
  const slot = room.slots.find((s) => s.id === slotId)
  if (slot) {
    addLocalCalendarItem({
      kind: 'interview',
      title: room.title,
      startIso: slot.startIso,
      endIso: slot.endIso,
      location: room.peerName,
    })
    room.messages.push({
      id: uid('ivm'),
      role: 'bot',
      body: slot.priority
        ? `Priority-Slot bestätigt: ${slot.label}. Liegt in Mein Bereich → Kalender. Video bleibt ein Stub.`
        : `Slot bestätigt: ${slot.label}. Liegt in Mein Bereich → Kalender. Video bleibt ein Stub.`,
      at: new Date().toISOString(),
    })
  }
  commit(next)
  return structuredClone(room)
}
