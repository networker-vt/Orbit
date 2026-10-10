import { buildAssistPlan, type AssistPlan } from './assist'
import { FREE_ASSIST_PER_DAY, getCredits } from './credits'
import { isFlagOn } from './flags'
import { appendOrbitAiMessage } from './orbitAiSession'
import {
  assessInputSafety,
  logSafetyBlock,
  ORBIT_AI_BLOCKED_DE,
  ORBIT_AI_BLOCKED_EN,
  type SafetyBlockReason,
} from './orbitAiSafety'
import { helpText, parseLocalToolCall, type OrbitAiToolCall } from './orbitAiTools'

export type OrbitAiOutcomeKind = 'blocked' | 'reply' | 'navigate' | 'plan'

export interface OrbitAiOutcome {
  kind: OrbitAiOutcomeKind
  reply: string
  navigateTo?: string
  plan?: AssistPlan | null
  source: 'local' | 'llm' | 'assist'
  blockedReason?: SafetyBlockReason
}

function llmConfigured() {
  const key = import.meta.env.VITE_LLM_API_KEY
  return Boolean(key && key.trim())
}

function systemPrompt(locale: 'de' | 'en', kids: boolean): string {
  const baseDe =
    'Du bist Orbit AI, der kostenlose Assistent in der Orbit-App. Antworte kurz (max 3 Sätze). Keine Beleidigungen, Diskriminierung oder Hilfe bei Straftaten. Wenn der Nutzer App-Aktionen will, nenne passende Orbit-Bereiche (Match, Abflug, Einstellungen, Chat, Wallet). Keine Live-Buchung ohne Checkout.'
  const baseEn =
    'You are Orbit AI, the free assistant in the Orbit app. Reply briefly (max 3 sentences). No hate, discrimination, or crime help. For app actions, point to Orbit areas (Match, Travel, Settings, Chat, Wallet). No live booking without checkout.'
  const kidsDe = ' Kids-Modus: keine Erwachsenen-, Alkohol- oder Gewaltinhalte.'
  const kidsEn = ' Kids mode: no adult, alcohol, or violence topics.'
  if (locale === 'de') return baseDe + (kids ? kidsDe : '')
  return baseEn + (kids ? kidsEn : '')
}

async function tryLlmReply(
  text: string,
  locale: 'de' | 'en',
  kids: boolean,
  signal?: AbortSignal,
): Promise<string | null> {
  const key = import.meta.env.VITE_LLM_API_KEY?.trim()
  if (!key) return null
  const url = import.meta.env.VITE_LLM_URL?.trim() || 'https://api.openai.com/v1/chat/completions'
  const model = import.meta.env.VITE_LLM_MODEL?.trim() || 'gpt-4o-mini'
  try {
    const ctrl = new AbortController()
    const t = window.setTimeout(() => ctrl.abort(), 10000)
    const onAbort = () => ctrl.abort()
    signal?.addEventListener('abort', onAbort)
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt(locale, kids) },
          { role: 'user', content: text },
        ],
        temperature: 0.35,
        max_tokens: 220,
      }),
    })
    window.clearTimeout(t)
    signal?.removeEventListener('abort', onAbort)
    if (!res.ok) return null
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const content = json.choices?.[0]?.message?.content?.trim()
    return content || null
  } catch {
    return null
  }
}

function creditsStatusReply(locale: 'de' | 'en'): string {
  const c = getCredits()
  const used = c.assistUsed ?? 0
  if (!isFlagOn('credits')) {
    return locale === 'de'
      ? `Orbit AI ist kostenlos. Assist-Nutzung heute: ${used}/${FREE_ASSIST_PER_DAY} (lokal gezählt).`
      : `Orbit AI is free. Assist usage today: ${used}/${FREE_ASSIST_PER_DAY} (tracked locally).`
  }
  return locale === 'de'
    ? `Dein Guthaben: ${c.balance} Orbit Credits. Basis-KI ist kostenlos; Boosts kosten Credits im Wallet.`
    : `Your balance: ${c.balance} Orbit Credits. Core AI is free; boosts use credits in Wallet.`
}

function toolReply(call: OrbitAiToolCall, locale: 'de' | 'en'): string {
  switch (call.tool) {
    case 'help':
      return helpText(locale)
    case 'credits_status':
      return creditsStatusReply(locale)
    case 'navigate':
      return locale === 'de'
        ? `Okay — ich öffne ${call.labelDe}.`
        : `OK — opening ${call.labelEn}.`
    case 'open_chat':
      return locale === 'de' ? 'Ich öffne den Chat.' : 'Opening chat.'
    case 'search_need':
      return locale === 'de'
        ? `Ich suche passende Angebote zu: ${call.query}`
        : `Searching matches for: ${call.query}`
    case 'recommend':
      return locale === 'de'
        ? `Ich erstelle einen Plan für: ${call.query}`
        : `Building a plan for: ${call.query}`
    default:
      return locale === 'de' ? 'Erledigt.' : 'Done.'
  }
}

function resolveToolNavigation(call: OrbitAiToolCall): string | undefined {
  if (call.tool === 'navigate') return call.path
  if (call.tool === 'open_chat') return '/social/chat'
  return undefined
}

export async function runOrbitAi(input: {
  text: string
  locale: 'de' | 'en'
  kids?: boolean
  hideTravel?: boolean
  signal?: AbortSignal
}): Promise<OrbitAiOutcome> {
  const text = input.text.trim()
  const locale = input.locale
  const kids = Boolean(input.kids)

  const safety = assessInputSafety(text, { kids })
  if (!safety.ok) {
    logSafetyBlock(safety.reason)
    const reply = locale === 'de' ? ORBIT_AI_BLOCKED_DE : ORBIT_AI_BLOCKED_EN
    return {
      kind: 'blocked',
      reply,
      source: 'local',
      blockedReason: safety.reason,
    }
  }

  appendOrbitAiMessage('user', text)

  const tool = parseLocalToolCall(text, { kids, hideTravel: input.hideTravel })
  if (tool) {
    const navigateTo = resolveToolNavigation(tool)
    const reply = toolReply(tool, locale)
    appendOrbitAiMessage('assistant', reply)

    if (tool.tool === 'search_need' || tool.tool === 'recommend') {
      const plan = await buildAssistPlan(
        tool.tool === 'search_need' ? tool.query : tool.query,
        locale,
        input.signal,
      )
      return { kind: 'plan', reply, plan, source: 'assist', navigateTo }
    }

    if (navigateTo) {
      return { kind: 'navigate', reply, navigateTo, source: 'local' }
    }
    return { kind: 'reply', reply, source: 'local' }
  }

  const llm = llmConfigured() ? await tryLlmReply(text, locale, kids, input.signal) : null
  if (llm) {
    const llmSafety = assessInputSafety(llm, { kids })
    if (!llmSafety.ok) {
      const reply = locale === 'de' ? ORBIT_AI_BLOCKED_DE : ORBIT_AI_BLOCKED_EN
      return { kind: 'blocked', reply, source: 'llm', blockedReason: llmSafety.reason }
    }
    appendOrbitAiMessage('assistant', llm)
    return { kind: 'reply', reply: llm, source: 'llm' }
  }

  const plan = await buildAssistPlan(text, locale, input.signal)
  const reply =
    locale === 'de'
      ? plan
        ? plan.summary
        : 'Das habe ich nicht verstanden. Probiere „Hilfe“ oder „Öffne Match“.'
      : plan
        ? plan.summary
        : 'I did not catch that. Try “Help” or “Open Match”.'
  appendOrbitAiMessage('assistant', reply)
  return { kind: plan ? 'plan' : 'reply', reply, plan, source: 'assist' }
}
