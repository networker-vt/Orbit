const KEY = 'orbit_calendar_v1'
const ROOM_KEY = 'orbit_calendar_room_v1'
const EVT = 'orbit-calendar-changed'

export type OrbitCalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  createdAt: string
  source: 'local' | 'shared'
}

export type CalendarRoom = {
  code: string
  joinedAt: string
}

function loadRaw(): OrbitCalendarEvent[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as OrbitCalendarEvent[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveRaw(events: OrbitCalendarEvent[]) {
  localStorage.setItem(KEY, JSON.stringify(events))
  window.dispatchEvent(new Event(EVT))
  const room = getRoom()
  if (room && typeof BroadcastChannel !== 'undefined') {
    const bc = new BroadcastChannel(`orbit-calendar-${room.code}`)
    bc.postMessage({ type: 'sync', events })
    bc.close()
  }
}

export function subscribeCalendar(cb: () => void): () => void {
  const onStore = () => cb()
  window.addEventListener(EVT, onStore)
  window.addEventListener('storage', onStore)
  let bc: BroadcastChannel | null = null
  const room = getRoom()
  if (room && typeof BroadcastChannel !== 'undefined') {
    bc = new BroadcastChannel(`orbit-calendar-${room.code}`)
    bc.onmessage = (ev: MessageEvent<{ type?: string; events?: OrbitCalendarEvent[] }>) => {
      if (ev.data?.type === 'sync' && Array.isArray(ev.data.events)) {
        localStorage.setItem(KEY, JSON.stringify(ev.data.events))
        cb()
      }
    }
  }
  return () => {
    window.removeEventListener(EVT, onStore)
    window.removeEventListener('storage', onStore)
    bc?.close()
  }
}

export function listEvents(): OrbitCalendarEvent[] {
  return loadRaw().sort((a, b) => a.start.localeCompare(b.start))
}

export function addEvent(ev: Omit<OrbitCalendarEvent, 'id' | 'createdAt'>): OrbitCalendarEvent {
  const next: OrbitCalendarEvent = {
    ...ev,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  saveRaw([...loadRaw(), next])
  return next
}

export function removeEvent(id: string) {
  saveRaw(loadRaw().filter((e) => e.id !== id))
}

export function getRoom(): CalendarRoom | null {
  try {
    const raw = localStorage.getItem(ROOM_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CalendarRoom
  } catch {
    return null
  }
}

export function createShareRoom(): CalendarRoom {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase()
  const room: CalendarRoom = { code, joinedAt: new Date().toISOString() }
  localStorage.setItem(ROOM_KEY, JSON.stringify(room))
  window.dispatchEvent(new Event(EVT))
  return room
}

export function joinShareRoom(code: string): CalendarRoom | null {
  const normalized = code.trim().toUpperCase()
  if (normalized.length < 4) return null
  const room: CalendarRoom = { code: normalized, joinedAt: new Date().toISOString() }
  localStorage.setItem(ROOM_KEY, JSON.stringify(room))
  window.dispatchEvent(new Event(EVT))
  return room
}

export function leaveShareRoom() {
  localStorage.removeItem(ROOM_KEY)
  window.dispatchEvent(new Event(EVT))
}

export function shareInviteUrl(code: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin + import.meta.env.BASE_URL : ''
  const path = `kalender?join=${encodeURIComponent(code)}`
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}
