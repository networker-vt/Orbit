import { useCallback, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../lib/i18n'
import {
  clearThreadMessengerTranslatePrefs,
  getEffectiveMessengerTranslatePrefs,
  hasThreadMessengerOverride,
  saveGlobalMessengerTranslatePrefs,
  saveThreadMessengerTranslatePrefs,
  subscribeMessengerTranslate,
  type MessengerTranslatePrefs,
} from '../lib/messengerTranslatePrefs'
import {
  getCachedTranslation,
  setCachedTranslation,
  translateText,
  type TranslateOutcome,
} from '../lib/orbitTranslate'

export function useMessengerTranslatePrefs(threadKey?: string | null) {
  const { locale } = useI18n()
  const [tick, setTick] = useState(0)
  useEffect(() => subscribeMessengerTranslate(() => setTick((n) => n + 1)), [])

  const prefs = useMemo(
    () => getEffectiveMessengerTranslatePrefs(threadKey, locale),
    [threadKey, locale, tick],
  )

  const threadOverride = threadKey ? hasThreadMessengerOverride(threadKey) : false

  const setPrefs = useCallback(
    (patch: Partial<MessengerTranslatePrefs>, scope: 'global' | 'thread' = 'thread') => {
      if (scope === 'global' || !threadKey) {
        saveGlobalMessengerTranslatePrefs(patch, locale)
      } else {
        saveThreadMessengerTranslatePrefs(threadKey, patch, locale)
      }
      setTick((n) => n + 1)
    },
    [threadKey, locale],
  )

  const resetThread = useCallback(() => {
    if (!threadKey) return
    clearThreadMessengerTranslatePrefs(threadKey)
    setTick((n) => n + 1)
  }, [threadKey])

  return { prefs, setPrefs, resetThread, threadOverride }
}

export function useIncomingTranslation(input: {
  messageId: string
  body: string
  mine: boolean
  enabled: boolean
  myLang: string
  partnerLang: string
  autoDetect: boolean
}) {
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ok'; text: string; provider: string }
    | { status: 'error'; error: string }
    | { status: 'skip' }
  >({ status: 'idle' })

  useEffect(() => {
    if (!input.enabled || input.mine || !input.body.trim()) {
      setState({ status: 'skip' })
      return
    }
    const cached = getCachedTranslation(input.messageId, input.myLang)
    if (cached?.ok) {
      setState({ status: 'ok', text: cached.text, provider: cached.provider })
      return
    }

    let cancelled = false
    setState({ status: 'loading' })
    const source = input.autoDetect ? 'auto' : input.partnerLang
    void translateText({ text: input.body, source, target: input.myLang }).then((out: TranslateOutcome) => {
      if (cancelled) return
      if (out.ok) {
        setCachedTranslation(input.messageId, input.myLang, out)
        setState({ status: 'ok', text: out.text, provider: out.provider })
      } else {
        setState({ status: 'error', error: out.error })
      }
    })
    return () => {
      cancelled = true
    }
  }, [
    input.messageId,
    input.body,
    input.mine,
    input.enabled,
    input.myLang,
    input.partnerLang,
    input.autoDetect,
  ])

  return state
}

export async function translateOutgoingPreview(
  text: string,
  myLang: string,
  partnerLang: string,
): Promise<TranslateOutcome> {
  if (!text.trim() || myLang === partnerLang) {
    return { ok: true, text: text.trim(), provider: 'none' }
  }
  return translateText({ text, source: myLang, target: partnerLang })
}
