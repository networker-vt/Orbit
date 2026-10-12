# Contributing to Allda / Allda mitgestalten

## English

Forks are welcome if they improve **Allda** — the global job-matching OS.

1. Fork the repo, create a branch, open a PR against `main`.
2. Keep the default Vite `base` as `/orbit/` for GitHub Pages. Native iOS builds set `CAPACITOR=1` (`npm run build:ios`) and must not change that Pages default.
3. Prefer preference-first matching, honest aggregators (no unofficial scrapes), and clear demos for payments/Credits.
4. Do not add LinkedIn/Indeed/etc. scrapers. Partner/API stubs only.
5. Keep impressum attribution to Mirco Küßner unless legal ownership changes.
6. Run `npm test` and `npm run build` before opening a PR.

### Contributor rewards (HARD — Super veto)

Contributor credits are **not** a Home feature and **not** a client mint.

| Rule | Detail |
|------|--------|
| Source | Pre-allocated **rewards pool** inside the 21M cap |
| Trigger | A GitHub PR that is **merged** into `main` |
| Amount | 120 Credits |
| Anti-farm | **1 grant per PR number** |
| Ordinal | **Required** `proof.serverOrdinal` (positive int) **must equal** `prNumber`. Op id `contributor:pr:{n}` (`seenOpIds` + wallet tx id) |
| Fail-closed | Missing/mismatched ordinal, empty pool, duplicate PR, unmerged PR, kids mode, or ledger reject → **no credit** |
| Never | Client-mint, pasted URL claim, Ideen-Box “Verbessern”, Home CTA, Kids accounts |

How a grant happens (operators / CI only):

1. PR is **merged**.
2. Server or trusted CI calls `grantContributorMergedPr(prNumber, { merged: true, serverOrdinal: prNumber })`. Missing or mismatched `serverOrdinal` is rejected. There is no public `grantMergedPrFromRewardsPool`.
3. That debit uses `mintFromPool('rewards', 120, 'contributor:pr:{n}')` then `creditWallet` with the same op id (welcome-style). If the wallet write fails, the protocol snapshot is restored.
4. The demo app has **no** claim form. Wallet only documents the rule. A **Verbesserer** badge appears after a successful merged-PR grant on that device/ledger.

Casual ideas-box notes (8 Credits, cap 3) are **not** contributor rewards.

Kids accounts: **0 Credits** — no mint, no spend, no P2P.

Ledger rules unchanged: RPC-first in prod, local demo ledger, `MAX_SUPPLY` 21M. See [CREDITS.md](./CREDITS.md).

## Deutsch

Forks sind willkommen, wenn sie **Allda** verbessern.

1. Fork → Branch → PR gegen `main`.
2. Vite-`base` bleibt standardmäßig `/orbit/` (GitHub Pages). Der iOS-Build setzt `CAPACITOR=1` (`npm run build:ios`) und ändert diesen Pages-Default nicht.
3. Preference-first Matching, ehrliche Aggregatoren (keine inoffiziellen Scrapes), klare Demo-Hinweise für Zahlungen/Credits.
4. Keine Scrapes von LinkedIn/Indeed & Co. — nur API/Partner-Stubs.
5. Impressum: Mirco Küßner belassen, solange die Betreiberrolle so bleibt.
6. Vor dem PR: `npm test` und `npm run build`.

### Contributor-Rewards (HARD — Super-Veto)

Contributor-Credits kommen **nur** aus dem Rewards-Pool **nach einem gemergten PR**. Anti-Farm: **1 Grant pro PR**. Op `contributor:pr:{n}`, server-ordinal, fail-closed. **Nie** Client-Mint, **nie** URL-Claim, **nie** im Home-Flow, **nie** in Kids.

In der Demo gibt es kein Claim-Formular. Operator/CI ruft `grantContributorMergedPr(n, { merged: true, serverOrdinal: n })` nach dem Merge — `serverOrdinal` ist Pflicht und muss `n` sein. Es gibt keinen öffentlichen `grantMergedPrFromRewardsPool`. Ideen-Box bleibt Casual (8 Credits), kein Verbesserer-Grant. Ledger: RPC-first / Demo≠Prod / MAX_SUPPLY 21M.

Danke — Matching statt Spam.
