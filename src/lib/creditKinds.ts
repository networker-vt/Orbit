/**
 * Allowlisted `credit_events.kind` values.
 * Keep in sync with:
 *   supabase/migrations/20260917_apply_credit_intent_allowlist.sql
 *   supabase/functions/credit-intent/index.ts
 *
 * Authenticated users may only apply **negative** deltas (spend / burn / gift).
 * Positive deltas (mint / inbound credit) go through the Edge Function with
 * service_role — never via a user JWT SECURITY DEFINER call.
 */
export const CREDIT_KIND_ALLOWLIST = [
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
  'home_pins_plus',
  'orbit_plus_theme',
  'chat_plus',
  'match_highlight',
  'exchange_in',
  'exchange_out',
  'rewards',
  'referral',
] as const

export type AllowedCreditKind = (typeof CREDIT_KIND_ALLOWLIST)[number]

export const CREDIT_KIND_ALLOWLIST_SET: ReadonlySet<string> = new Set(CREDIT_KIND_ALLOWLIST)

/** Positive-delta kinds. Edge/service_role only. */
export const CREDIT_MINT_KINDS = [
  'welcome',
  'earn',
  'purchase',
  'p2p',
  'exchange_in',
  'rewards',
  'referral',
] as const

export function isAllowedCreditKind(kind: string): boolean {
  return CREDIT_KIND_ALLOWLIST_SET.has(kind)
}
