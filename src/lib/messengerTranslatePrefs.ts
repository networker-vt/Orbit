import { defaultMyLangFromUiLocale, isTranslateLang } from './translateLanguages'

export type MessengerTranslatePrefs = {
  enabled: boolean
  myLang: string
  partnerLang: string
  autoDetectIncoming: boolean
  ttsPreview: boolean
  ttsIncoming: boolean
}

const GLOBAL_KEY = 'orbit_messenger_translate_v1'
const THREAD_PREFIX = 'orbit_messenger_translate_thread_v1:'
const EVT = 'orbit-messenger-translate-changed'

export const DEFAULT_MESSENGER_TRANSLATE: MessengerTranslatePrefs = {
  enabled: true,
  myLang: 'de',
  partnerLang: 'en',
  autoDetectIncoming: true,
  ttsPreview: false,
  ttsIncoming: false,
}

function normalize(p: Partial<MessengerTranslatePrefs>): MessengerTranslatePrefs {
  const base = { ...DEFAULT_MESSENGER_TRANSLATE, ...p }
  return {
    enabled: Boolean(base.enabled),
    myLang: isTranslateLang(base.myLang) ? base.myLang : 'de',
    partnerLang: isTranslateLang(base.partnerLang) ? base.partnerLang : 'en',
    autoDetectIncoming: Boolean(base.autoDetectIncoming),
    ttsPreview: Boolean(base.ttsPreview),
    ttsIncoming: Boolean(base.ttsIncoming),
  }
}

function readJson(key: string): Partial<MessengerTranslatePrefs> | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as Partial<MessengerTranslatePrefs>
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new Event(EVT))
}

export function getGlobalMessengerTranslatePrefs(uiLocale = 'de'): MessengerTranslatePrefs {
  const stored = readJson(GLOBAL_KEY)
  const merged = normalize({
    ...stored,
    myLang: stored?.myLang ?? defaultMyLangFromUiLocale(uiLocale),
  })
  return merged
}

export function saveGlobalMessengerTranslatePrefs(patch: Partial<MessengerTranslatePrefs>, uiLocale = 'de') {
  const next = normalize({ ...getGlobalMessengerTranslatePrefs(uiLocale), ...patch })
  writeJson(GLOBAL_KEY, next)
  return next
}

export function hasThreadMessengerOverride(threadKey: string): boolean {
  return Boolean(readJson(THREAD_PREFIX + threadKey))
}

export function getThreadMessengerOverride(threadKey: string): Partial<MessengerTranslatePrefs> | null {
  return readJson(THREAD_PREFIX + threadKey)
}

/** Global prefs merged with optional per-thread override. */
export function getEffectiveMessengerTranslatePrefs(
  threadKey: string | null | undefined,
  uiLocale = 'de',
): MessengerTranslatePrefs {
  const global = getGlobalMessengerTranslatePrefs(uiLocale)
  if (!threadKey) return global
  const over = getThreadMessengerOverride(threadKey)
  if (!over) return global
  return normalize({ ...global, ...over })
}

export function saveThreadMessengerTranslatePrefs(
  threadKey: string,
  patch: Partial<MessengerTranslatePrefs>,
  uiLocale = 'de',
) {
  const global = getGlobalMessengerTranslatePrefs(uiLocale)
  const next = normalize({ ...global, ...getThreadMessengerOverride(threadKey), ...patch })
  writeJson(THREAD_PREFIX + threadKey, next)
  return next
}

export function clearThreadMessengerTranslatePrefs(threadKey: string) {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(THREAD_PREFIX + threadKey)
  window.dispatchEvent(new Event(EVT))
}

export function subscribeMessengerTranslate(onChange: () => void) {
  const h = () => onChange()
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => {
    window.removeEventListener(EVT, h)
    window.removeEventListener('storage', h)
  }
}

/** Stable keys for all in-app messenger surfaces. */
export function orbitChatThreadKey(threadId: string) {
  return `orbit-chat:${threadId}`
}

export function interviewThreadKey(roomId: string) {
  return `interview:${roomId}`
}
