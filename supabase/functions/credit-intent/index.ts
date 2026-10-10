/**
 * Orbit Credits — Edge Function `credit-intent`.
 *
 * Demo (`VITE_APP_MODE=demo`): unused. The SPA keeps a localStorage ledger.
 * Prod: verify JWT, then:
 *   * delta > 0 (mint / inbound) — service_role RPC with p_user_id (never user JWT)
 *   * delta < 0 (spend / burn / gift) — user JWT RPC
 *
 * Kind allowlist must match src/lib/creditKinds.ts.
 * Rate-limit: 30 intents / user / rolling 60s (in-memory per isolate — not durable
 * across replicas). Put a gateway limit in front for production.
 *
 * Deploy: `supabase functions deploy credit-intent`
 * Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 * Vite does not compile this file.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_KINDS = new Set([
  'welcome',
  'earn',
  'purchase',
  'burn',
  'gift',
  'boost',
  'p2p',
  'featured',
  'extra_swipes',
  'travel_scan',
  'social_boost',
  'interview_slot',
  'booking',
  'unlock_message',
  'demo_gig',
  'sponsor_fee',
  'look_tryon',
  'look_shop',
  'assist_priority',
  'exchange_in',
  'exchange_out',
  'rewards',
  'home_pins_plus',
  'orbit_plus_theme',
  'chat_plus',
  'match_highlight',
  'referral',
])

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 30
const hits = new Map<string, number[]>()

function rateLimited(userId: string): boolean {
  const now = Date.now()
  const prev = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS)
  if (prev.length >= MAX_PER_WINDOW) {
    hits.set(userId, prev)
    return true
  }
  prev.push(now)
  hits.set(userId, prev)
  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') {
    return json({ ok: false, reason: 'method' }, 405)
  }

  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const auth = req.headers.get('Authorization') ?? ''

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
  })

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (userErr || !user) return json({ ok: false, reason: 'auth' }, 401)

  if (rateLimited(user.id)) {
    return json({ ok: false, reason: 'rate_limited', txn_id: '' }, 429)
  }

  let body: {
    txn_id?: string
    delta?: number
    kind?: string
    label?: string
    pool?: string
    metadata?: Record<string, unknown>
  }
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, reason: 'invalid_json' }, 400)
  }

  const txn_id = String(body.txn_id || '').trim()
  const delta = Number(body.delta)
  const kind = String(body.kind || '').trim().toLowerCase()
  const label = String(body.label || '').trim()
  if (!txn_id || !kind || !label || !Number.isFinite(delta)) {
    return json({ ok: false, reason: 'invalid_intent' }, 400)
  }
  if (!ALLOWED_KINDS.has(kind)) {
    return json({ ok: false, reason: 'kind_not_allowed', txn_id }, 400)
  }

  const rounded = Math.round(delta)
  const args = {
    p_txn_id: txn_id,
    p_delta: rounded,
    p_kind: kind,
    p_label: label,
    p_pool: body.pool ?? null,
    p_metadata: body.metadata ?? {},
  }

  if (rounded > 0) {
    if (!service) {
      return json({ ok: false, reason: 'mint_requires_service_role', txn_id }, 503)
    }
    const admin = createClient(url, service)
    const { data, error } = await admin.rpc('apply_credit_intent', {
      ...args,
      p_user_id: user.id,
    })
    if (error) return json({ ok: false, reason: error.message, txn_id }, 400)
    return json(data ?? { ok: false, reason: 'empty', txn_id })
  }

  const { data, error } = await supabase.rpc('apply_credit_intent', args)
  if (error) return json({ ok: false, reason: error.message, txn_id }, 400)
  return json(data ?? { ok: false, reason: 'empty', txn_id })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
