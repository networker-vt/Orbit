/**
 * Chat extras — local history window + media slot limits (demo, on-device).
 * Extended tier comes from Credits spend (`chat_plus` in credits state).
 */
import { getCredits } from './credits'

export const CHAT_HISTORY_FREE = 80
export const CHAT_HISTORY_PLUS = 320
export const CHAT_MEDIA_SLOTS_FREE = 3
export const CHAT_MEDIA_SLOTS_PLUS = 10

const MEDIA_KEY = 'orbit_chat_media_slots_v1'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadMediaDay(): { day: string; used: number } {
  try {
    const raw = localStorage.getItem(MEDIA_KEY)
    if (!raw) return { day: todayKey(), used: 0 }
    const parsed = JSON.parse(raw) as { day?: string; used?: number }
    const day = parsed.day || todayKey()
    if (day !== todayKey()) return { day: todayKey(), used: 0 }
    return { day, used: Math.max(0, parsed.used ?? 0) }
  } catch {
    return { day: todayKey(), used: 0 }
  }
}

function saveMediaDay(next: { day: string; used: number }) {
  localStorage.setItem(MEDIA_KEY, JSON.stringify(next))
}

export function chatPlusActive(): boolean {
  const until = getCredits().chatPlusUntil
  if (!until) return false
  return until.slice(0, 10) >= todayKey()
}

export function chatHistoryLimit(): number {
  return chatPlusActive() ? CHAT_HISTORY_PLUS : CHAT_HISTORY_FREE
}

export function chatMediaSlotLimit(): number {
  return chatPlusActive() ? CHAT_MEDIA_SLOTS_PLUS : CHAT_MEDIA_SLOTS_FREE
}

export function chatMediaSlotsRemaining(): number {
  const { used } = loadMediaDay()
  return Math.max(0, chatMediaSlotLimit() - used)
}

/** Demo: count a local media attachment against today's slot budget. */
export function consumeChatMediaSlot(): boolean {
  const lim = chatMediaSlotLimit()
  const cur = loadMediaDay()
  if (cur.used >= lim) return false
  saveMediaDay({ day: todayKey(), used: cur.used + 1 })
  return true
}

export function resetChatExtrasForTests() {
  localStorage.removeItem(MEDIA_KEY)
}
