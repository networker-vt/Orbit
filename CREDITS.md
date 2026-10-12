# Allda Credits (v2.7.0)

Bitcoin-style **hard cap: 21.000.000** Allda Credits. **Balance = sum(`credit_events.delta`)**. Every write is an append-only intent with an idempotent **`txn_id`**. Duplicate `txn_id` is a no-op.

## Modes (`VITE_APP_MODE=demo|prod`)

| Mode | Ledger | Auth |
|------|--------|------|
| **demo** (default, GitHub Pages) | Optimistic localStorage `orbit_credit_events_v1`; balance = sum(delta) | Magic-link UI, no mail server — 1-tap demo link |
| **prod** + Keys | **Server first.** RPC / Edge `credit-intent` must return `ok:true` before any local mirror. Hydrate **replaces** the local cache (no merge of leftover client mints). Wallet `CreditsState.balance` is a cache of `ledgerBalance()`. | Supabase `signInWithOtp` |
| prod **without keys** | **Hard-fail** credit mutations (`prod_unconfigured`). No silent local mint. | Magic-link UI still degrades; credits do not. |

SQL: `supabase/migrations/20260916_credit_events.sql` **and** `20260917_apply_credit_intent_allowlist.sql`. Edge: `supabase/functions/credit-intent/index.ts`. Client: `src/lib/creditLedger.ts`. The 21M protocol in `creditProtocol.ts` is a **UX guardrail**; prod RPC is the source of truth and refuses mints that would breach the supply row.

### R1 — Prod does not trust the client first

`submitCreditIntent` in prod calls RPC/Edge **first**. Local append happens only on `ok:true`. `ok:false` / cap reject → **hard rollback**: no local event, no pending queue that later credits the wallet. Demo (`VITE_APP_MODE=demo` only) may still append optimistically.

Mints (`delta > 0`) never go through the user-JWT RPC. They go to the Edge Function, which uses `service_role` + `p_user_id`.

### R2 — One source of truth

In prod, **balance = sum of ledger events** (server/hydrate). After hydrate, `CreditsState.balance` is synced from `ledgerBalance()`. The wallet is a cache.

### R3 — Atomic mint

Client `mintFromPoolToWallet`: snapshot protocol → `mintFromPool` → ledger/`creditWallet`. If the wallet/intent fails, `restoreProtocolSnapshot` rolls back the pool debit so circulating cannot move without a user credit.

Prod server: `apply_credit_intent` is **one SQL transaction** (lock `credit_supply` + insert `credit_events`).

### R4 — SECURITY DEFINER allowlist

`apply_credit_intent` (`SECURITY DEFINER`):

- `kind` must be in the allowlist: `welcome`, `earn`, `purchase`, `burn`, `gift`, `boost`, plus existing spend kinds (`featured`, `extra_swipes`, …). Arbitrary kinds are rejected (`kind_not_allowed`).
- Authenticated users **cannot** apply `delta > 0` (`mint_forbidden`). Spend/burn/gift only.
- Mints require `auth.role() = 'service_role'` and `p_user_id` (Edge Function).

### Rate limit

Edge Function `credit-intent`: **30 intents / user / rolling 60s** (in-memory per isolate — not durable across replicas). Put an API-gateway / Cloudflare / Supabase rate-limit in front for production. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the SPA (`VITE_*` is forbidden).

Invariant: `circulating + remainingReserve + burned === 21_000_000`. Every grant (welcome, early tester, rewards, packs) **debits a pre-allocated pool** or fails.

## Allocation (sums to 21M)

| Pool | Amount | Rule |
|------|--------|------|
| Early Testers (signup **1–50**) | 100.000 | **2.000** Credits each (10× welcome) **plus −20% boost price forever** |
| Welcome later (signup 51+) | 3.400.000 | **200** Credits each (**17.000 seats**) |
| Rewards (performance) | 4.500.000 | Prefs, profile, match, referral, reviews, jobs — transfer from this pool |
| Packs (system mint) | 11.000.000 | While reserve remains. After 0: **P2P only**. **−3.000.000** vs prior split (moved to Early + Welcome) |
| P2P float (genesis) | 100.000 | Already circulating with simulated peers |
| Treasury (unissued) | 1.900.000 | Ops, no airdrop |
| **Total** | **21.000.000** | |

Money Boy (2026-09-16): Early **2.000** / Welcome **200**. Welcome pool is **3.400.000** so **17.000 seats** stay funded. The extra **3.000.000** is taken from **Packs** (14M → 11M). Treasury stays 1.900.000. Cap unchanged.

Signup ordinal is stored in `localStorage` (`orbit_signup_ordinal_v1`) on this device. Demo protocol cache is `orbit_credit_protocol_v2` (genesis reset after the pool split).

When **remainingReserve = 0**: no system minting. Users can (1) **earn** from whatever is left in the pre-allocated rewards pool, or (2) **buy/P2P** from other users (order-book stub). Gift / sponsoring is a **peer transfer** (~2% / min 1 Credit burned as fee) — never a new mint.

## Always free (soft paywall only at money moments)

- Assist ask
- Browse Match + **20 swipes / day**
- **Kabine base (photo + 1–2 variants)** — photo/video, free demo filters (Kabine is a **stub**)
- Basic chat (Match / Booking / Support)
- Wallet view
- Social read

Credits are required for: listing boosts, extra swipes, travel deep-scan, featured social, priority interview, Kabine extra variants / nearby shop boosts. Pack checkout is a stub (no Stripe/PayPal).

## Welcome / Early testers

| Cohort | Each | Extra |
|--------|------|-------|
| Signup 1–50 | 2.000 | −20% on boost prices forever |
| Signup 51+ | 200 | — |

No extra +100 seed. If a pool is empty, the grant fails.

## Rewards (from the rewards pool)

| Action | Credits | Cap |
|--------|---------|-----|
| Prefs complete | 20 | once |
| Profile mostly complete | 30 | once |
| First successful match | 15 | once |
| Referral demo-signup | 40 | per demo |
| Ideas box | 8 | max 3 |
| **Contributor merged PR** | **120** | **1 per PR** (`contributor:pr:{n}`, required `serverOrdinal === prNumber`, never client-mint) |
| Review | 10 | max 5 |
| Search / Match day | 5 | max 7 days |
| Job completed | 25 | max 5 |

## Buy packs (demo checkout)

While the **packs pool** has remainder, packs debit that pool:

| Pack | Credits | Shown price |
|------|---------|-------------|
| Klein | 100 | 9,90 € |
| Mittel | 300 | 24,90 € |
| Groß | 800 | 59,90 € |

**No Stripe, no PayPal.** When the pack reserve is empty, Wallet switches to **„von Nutzern kaufen“** (P2P stub).

## Spend (boosts — no remint into reserve)

| Boost | Credits | Early-50 |
|-------|---------|----------|
| Listing boost | 40 | 32 |
| Extra-Swipes | 25 | 20 |
| Travel deep-scan | 15 | 12 |
| Social featured | 20 | 16 |
| Priority interview | 30 | 24 |
| Kabine extra try-on variants (today) | 15 | 12 |
| Kabine nearby shop featured | 20 | 16 |
| Gift / sponsoring | peer transfer, **1 burned** | — |
| Match highlight (24h demo) | 22 | 18 |
| Home-Pins+ (+2 slots) | 35 | 28 |
| Allda+ theme unlock | 28 | 22 |
| Chat-Extras (local history today) | 18 | 14 |
| Referral signup grant | 40 from rewards pool | — |

### Gift / Sponsoring (Demo stub)

Wallet → **Verschenken / Sponsorn** (EN: Gift / Sponsor): pick a listing, company or profile → amount → optional message → confirm.

- Debits **your** demo balance (no new mint, 1 Credit fee burned). Circulating drops by the burn; net goes to the P2P float (honest local ledger, still one device).
- Quick **Sponsern** on Für-dich / Match-suggestion cards, listing detail, public profiles, Firma.
- **No real payout** to the recipient until payments + KYC exist.

DE: Demo-Ledger, kein Stripe. EN: same honesty — no real money.

## Channel linking (Demo stub)

Mein → **Kanäle verbinden**: Amazon, Netflix, YouTube, Spotify, Instagram.

- **Connected flag only.** Toggle only. **No OAuth, no scraping, no real account access.**
- When “connected”, Home Für-dich / Top Deals / News get a **light on-device tag bias** (shopping, entertainment, music, look).
- Copy never claims Allda read those accounts.

## Public Wert-Index + Burn table

Wallet shows `X / 21M im Umlauf`, remaining reserve, burned, P2P-float, a **Wert-Index** stub, and a **Burn-Tabelle** (gift fees).

`100 × log₁₀(1 + aktive Nutzer) × (1 + Umlauf / 21M)` — labeled Demo-Formel, not a market price.

Indicative rate: 10 Credits ≈ 1 € — not a payout.

## ORB / Bittensor (future)

ORB emission future = App-Improve subnet (TAO-inspired), not implemented this PR.

## Soft verify

E-Mail (magic link / login) → **phone before offering** → **ID / business before payout**. Stubs, no SMS vendor, no KYC vendor.
