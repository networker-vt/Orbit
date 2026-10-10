const KEY = 'orbit_ai_session_v1'
const MAX = 24

export type OrbitAiMessageRole = 'user' | 'assistant'

export interface OrbitAiMessage {
  id: string
  role: OrbitAiMessageRole
  text: string
  at: string
}

export interface OrbitAiSession {
  messages: OrbitAiMessage[]
}

function load(): OrbitAiSession {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { messages: [] }
    const parsed = JSON.parse(raw) as OrbitAiSession
    return { messages: Array.isArray(parsed.messages) ? parsed.messages.slice(-MAX) : [] }
  } catch {
    return { messages: [] }
  }
}

let cache: OrbitAiSession | null = null

function get(): OrbitAiSession {
  if (!cache) cache = load()
  return cache
}

function commit(next: OrbitAiSession) {
  cache = { messages: next.messages.slice(-MAX) }
  localStorage.setItem(KEY, JSON.stringify(cache))
}

export function getOrbitAiMessages(): OrbitAiMessage[] {
  return [...get().messages]
}

export function appendOrbitAiMessage(role: OrbitAiMessageRole, text: string): OrbitAiMessage {
  const msg: OrbitAiMessage = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    at: new Date().toISOString(),
  }
  commit({ messages: [...get().messages, msg] })
  return msg
}

/** User turns that were blocked must never enter session storage. */
export function clearOrbitAiSession() {
  commit({ messages: [] })
}
