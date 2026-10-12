import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Gift,
  Landmark,
  Link2,
  Link2Off,
  Loader2,
  Wallet,
} from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Empty } from '../components/ui/Empty'
import { LaneBadge } from '../components/credits/LaneBadge'
import { SupplyMeter } from '../components/credits/SupplyMeter'
import { BurnTable } from '../components/credits/BurnTable'
import { VerifyPanel } from '../components/verify/VerifyPanel'
import { Input, Select } from '../components/ui/Input'
import { GiftSheet } from '../components/wallet/GiftSheet'
import { WalletDisclaimer } from '../components/wallet/WalletDisclaimer'
import { useFx } from '../hooks/useFx'
import { useWallet } from '../hooks/useWallet'
import { convertFx, FX_CODES, formatFx, type FxCode } from '../lib/fx'
import {
  CREDIT_PACKS,
  CREDITS_BOOST_KINDS,
  CREDITS_COSTS,
  CREDITS_DISCLAIMER_DE,
  CREDITS_DISCLAIMER_EN,
  CREDITS_FREE_DE,
  CREDITS_FREE_EN,
  CREDITS_PER_EUR,
  ALLOCATION_TABLE,
  P2P_ORDERS,
  buyP2POrder,
  claimReferralCreditsDemo,
  creditsToEur,
  exchangeCreditsToEur,
  exchangeEurToCredits,
  formatSupplyLine,
  getCredits,
  getProtocol,
  getSignupIdentity,
  isPackMarketP2P,
  purchaseCreditPack,
  simulatePacksSoldOut,
  spendCredits,
  boostCost,
  subscribeCredits,
  type CreditPackId,
} from '../lib/credits'
import { ledgerModeLine } from '../lib/creditLedger'
import { canPayout, subscribeVerify } from '../lib/verify'
import { REWARD_RULES_DE, REWARD_RULES_EN, CONTRIBUTOR_REWARDS, isVerbesserer, getRewardFlags, subscribeRewards } from '../lib/rewards'
import {
  WALLET_METHODS,
  connectMethod,
  disconnectMethod,
  mockAdjustBalance,
  mockCryptoWithdraw,
  mockPlatformCheckout,
  mockPayoutIban,
  resetWallet,
  type WalletMethodId,
} from '../lib/wallet'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { listTickets, subscribeTickets } from '../lib/tickets'
import { store } from '../lib/store'
import { formatDateTime, formatPrice } from '../lib/utils'
import { cn } from '../lib/utils'
import { KidsBlocked } from '../components/kids/KidsBlocked'
import { kidsHideWallet, subscribeKids } from '../lib/kids'

export function WalletPage() {
  const { t, resolved } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { hash } = useLocation()
  const [params] = useSearchParams()
  const { wallet } = useWallet()
  const { fx } = useFx()
  const [busy, setBusy] = useState<WalletMethodId | null>(null)
  const [sheet, setSheet] = useState<null | 'topup' | 'payout'>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [fxAmount, setFxAmount] = useState('250')
  const [fxTo, setFxTo] = useState<FxCode>('USD')
  const [iban, setIban] = useState('')
  const [bic, setBic] = useState('')
  const [holder, setHolder] = useState('')
  const [payoutAmt, setPayoutAmt] = useState('100')
  const [cryptoAddr, setCryptoAddr] = useState('')
  const [cryptoAsset, setCryptoAsset] = useState<'btc' | 'usdc' | 'usdt'>('usdt')
  const [cryptoAmt, setCryptoAmt] = useState('50')
  const [credits, setCredits] = useState(getCredits)
  const [creditAmt, setCreditAmt] = useState('50')
  const [tickets, setTickets] = useState(listTickets)
  const [packPick, setPackPick] = useState<CreditPackId | null>(null)
  const [protocol, setProtocol] = useState(getProtocol)
  const [payoutOk, setPayoutOk] = useState(canPayout)
  const [verbesserer, setVerbesserer] = useState(isVerbesserer)
  const [kids, setKids] = useState(kidsHideWallet)
  const identity = getSignupIdentity()
  const p2pOnly = isPackMarketP2P()

  useEffect(
    () =>
      subscribeCredits(() => {
        setCredits(getCredits())
        setProtocol(getProtocol())
      }),
    [],
  )
  useEffect(() => subscribeTickets(() => setTickets(listTickets())), [])
  useEffect(() => subscribeVerify(() => setPayoutOk(canPayout())), [])
  useEffect(() => subscribeRewards(() => setVerbesserer(isVerbesserer())), [])
  useEffect(() => subscribeKids(() => setKids(kidsHideWallet())), [])

  useEffect(() => {
    if (hash !== '#gift') return
    const timer = window.setTimeout(() => {
      document.getElementById('gift')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [hash, params])

  const connectedCount = WALLET_METHODS.filter((m) => wallet.methods[m.id]?.connected).length
  const eur = Number(fxAmount) || 0
  const converted = convertFx(eur, fxTo, fx.rates)

  const note = (msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 3200)
  }

  if (kids) {
    return <KidsBlocked title={t('kids.walletBlocked')} hint={t('kids.zeroCredits')} />
  }

  const runConnect = (id: WalletMethodId, next: boolean) => {
    setBusy(id)
    window.setTimeout(() => {
      if (next) connectMethod(id)
      else disconnectMethod(id)
      setBusy(null)
      note(next ? 'Methode verbunden (Demo — kein Provider-Call).' : 'Methode getrennt.')
    }, 650)
  }

  const runCash = (type: 'topup' | 'payout') => {
    const method = WALLET_METHODS.find((m) => wallet.methods[m.id]?.connected)?.id ?? 'sepa'
    mockAdjustBalance(type, type === 'topup' ? 250 : 100, method)
    setSheet(null)
    note(type === 'topup' ? 'Demo-Einzahlung +250 € — kein echtes Geld.' : 'Demo-Auszahlung −100 € — kein echtes Geld.')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-scroll-chrome">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-cyan">Zahlungen</p>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Wallet size={22} className="text-cyan" /> Wallet
        </h1>
        <p className="text-sm text-muted">
          Credits, Zahlungsmethoden, Buchungen und Tickets — ein Ort für alles. Demo, kein echtes Geld.
        </p>
      </header>

      <WalletDisclaimer />

      {flash && (
        <p className="rounded-xl border border-cyan/30 bg-cyan/10 px-3 py-2 text-xs text-cyan">{flash}</p>
      )}

      <section className="relative overflow-hidden rounded-3xl border border-cyan/30 bg-gradient-to-br from-cyan/15 via-surface-2 to-black p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan/20 blur-3xl" />
        <p className="text-xs uppercase tracking-wider text-cyan">Verfügbar (Demo)</p>
        <div className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-ink">
          {formatPrice(wallet.balanceEur)}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-300">
          {FX_CODES.filter((c) => c !== 'EUR').map((c) => (
            <span key={c}>
              {c} {formatFx(convertFx(wallet.balanceEur, c, fx.rates), c)}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-300">
          {connectedCount} Methode{connectedCount === 1 ? '' : 'n'} verbunden · Kurse {fx.source} ·
          indikativ
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setSheet('topup')}>
            <ArrowDownLeft size={16} /> Einzahlen
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setSheet('payout')}>
            <ArrowUpRight size={16} /> Auszahlen
          </Button>
          <Link
            to="/mein"
            className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm text-neutral-300 hover:text-cyan"
          >
            Zu Favoriten
          </Link>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-5">
        <div>
          <h2 className="text-lg font-semibold">{t('wallet.tickets')}</h2>
          <p className="text-xs text-muted">{t('wallet.ticketsHint')}</p>
        </div>
        {tickets.length === 0 ? (
          <Empty
            emoji="🎫"
            title={t('wallet.ticketsEmpty')}
            hint={t('wallet.ticketsEmptyHint')}
            actionLabel={t('travel.toAssist')}
            onAction={() => navigate('/')}
            className="py-8"
          />
        ) : (
          <ul className="space-y-2">
            {tickets.map((tk) => (
              <li key={tk.id}>
                <Link
                  to={`/tickets/${tk.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/80 px-3 py-2 hover:border-[var(--theme-accent)]/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{tk.title}</p>
                    <p className="truncate text-xs text-muted">
                      {tk.ref} · {tk.status} · {formatDateTime(tk.whenIso)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums">{formatPrice(tk.priceEur)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {user && (
          <div className="border-t border-border/60 pt-3">
            <h3 className="mb-2 text-sm font-semibold">{t('wallet.bookings')}</h3>
            {store.listBookingsForUser(user.id).length === 0 ? (
              <Empty
                emoji="📋"
                title={t('wallet.bookingsEmpty')}
                hint={t('home.value')}
                actionLabel={t('travel.toAssist')}
                onAction={() => navigate('/')}
                className="py-6"
              />
            ) : (
              <ul className="space-y-1">
                {store.listBookingsForUser(user.id).slice(0, 6).map((b) => (
                  <li key={b.id}>
                    <Link to={`/bookings/${b.id}`} className="text-sm text-[var(--theme-accent)] hover:underline">
                      {b.listingTitle} · {b.status}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>


      <section className="space-y-4 rounded-2xl border border-violet-500/35 bg-violet-500/10 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-violet-200">Allda Credits</h2>
          <LaneBadge lane="credits" />
          {identity?.earlyTester && (
            <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-100">
              Early Tester #{identity.ordinal}
            </span>
          )}
          {identity && !identity.earlyTester && (
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-neutral-300">
              Signup #{identity.ordinal}
            </span>
          )}
        </div>
        <p className="text-3xl font-bold tabular-nums text-ink">
          {credits.balance}{' '}
          <span className="text-sm font-normal text-muted">
            ≈ {creditsToEur(credits.balance).toFixed(2)} € indikativ ({CREDITS_PER_EUR} Cr / €)
          </span>
        </p>
        <p className="text-xs text-violet-200/90">{formatSupplyLine(protocol)}</p>
        <Link
          to="/wallet#gift"
          className="inline-flex min-h-10 items-center gap-1.5 text-sm text-violet-100 hover:underline"
        >
          <Gift size={16} /> {t('gift.title')}
        </Link>
        <p className="text-xs text-violet-100/80">
          {resolved === 'de' ? CREDITS_DISCLAIMER_DE : CREDITS_DISCLAIMER_EN}
        </p>

        <SupplyMeter />

        <p className="text-xs text-muted">
          {t('credits.ledgerMode')}: {ledgerModeLine()}
        </p>

        <BurnTable />

        <div className="rounded-xl border border-violet-400/20 bg-black/20 p-3">
          <h3 className="text-sm font-semibold">Allokation (21M)</h3>
          <ul className="mt-2 space-y-1 text-xs text-neutral-300">
            {ALLOCATION_TABLE.map((row) => {
              const left =
                row.id === 'p2p'
                  ? protocol.p2pFloat
                  : row.id in protocol.pools
                    ? protocol.pools[row.id as keyof typeof protocol.pools].remaining
                    : row.amount
              return (
                <li key={row.id} className="flex justify-between gap-2">
                  <span>
                    {row.labelDe}
                    <span className="block text-muted">{row.noteDe}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-right">
                    {row.amount.toLocaleString('de-DE')}
                    <span className="block text-muted">noch {left.toLocaleString('de-DE')}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
            {t('credits.freeLane')} <LaneBadge lane="free" />
          </h3>
          <ul className="list-disc space-y-0.5 pl-4 text-xs text-neutral-300">
            {(resolved === 'de' ? CREDITS_FREE_DE : CREDITS_FREE_EN).map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        </div>

        {!p2pOnly ? (
          <div>
            <h3 className="text-sm font-semibold">{t('credits.packs')}</h3>
            <p className="mt-0.5 text-xs text-muted">{t('credits.packsHint')}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {CREDIT_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => setPackPick(pack.id)}
                  className="rounded-xl border border-violet-400/30 bg-black/25 px-3 py-3 text-left hover:border-violet-300/60"
                >
                  <p className="text-sm font-semibold text-ink">
                    {resolved === 'de' ? pack.labelDe : pack.labelEn}
                  </p>
                  <p className="text-lg font-bold tabular-nums">{pack.credits}</p>
                  <p className="text-xs text-muted">{pack.priceLabel} · Demo</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-semibold">{t('credits.p2p')}</h3>
            <p className="mt-0.5 text-xs text-muted">{t('credits.p2pHint')}</p>
            <ul className="mt-2 space-y-2">
              {P2P_ORDERS.map((order) => {
                const filled = protocol.filledOrderIds.includes(order.id)
                return (
                  <li
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-400/25 bg-black/25 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{order.seller}</p>
                      <p className="text-xs text-muted">
                        {order.credits} Credits · {order.priceEur.toFixed(2)} € · {order.note}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={filled}
                      onClick={() => {
                        void buyP2POrder(order.id).then((ok) => {
                          note(ok ? t('credits.p2pBought') : t('credits.p2pFail'))
                        })
                      }}
                    >
                      {filled ? t('credits.p2pFilled') : t('credits.p2pBuy')}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {packPick && !p2pOnly && (
          <div className="rounded-xl border border-amber-400/50 bg-amber-500/15 p-3">
            <p className="text-sm font-semibold text-amber-100">{t('credits.checkout')}</p>
            <p className="mt-1 text-xs text-amber-100/85">{t('credits.checkoutHint')}</p>
            <p className="mt-2 text-sm">
              {CREDIT_PACKS.find((p) => p.id === packPick)?.credits} Credits ·{' '}
              {CREDIT_PACKS.find((p) => p.id === packPick)?.priceLabel}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const pack = CREDIT_PACKS.find((p) => p.id === packPick)
                  void purchaseCreditPack(packPick).then((ok) => {
                    note(
                      ok && pack
                        ? `+${pack.credits} Credits (Demo, aus Reserve, kein Stripe/PayPal)`
                        : t('credits.reserveEmpty'),
                    )
                    setPackPick(null)
                  })
                }}
              >
                {t('credits.confirmPack')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPackPick(null)}>
                {t('create.cancel')}
              </Button>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold">{t('credits.boosts')}</h3>
          <p className="mt-0.5 text-xs text-muted">{t('credits.boostsHint')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CREDITS_BOOST_KINDS.map((kind) => {
              const meta = CREDITS_COSTS[kind]
              const cost = boostCost(kind)
              return (
                <Button
                  key={kind}
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void spendCredits(cost, kind, cost < meta.credits ? `${meta.label} · Early −20%` : meta.label).then(
                      (ok) => {
                        note(ok ? `−${cost} Credits: ${meta.label}` : t('credits.notEnough'))
                      },
                    )
                  }}
                >
                  {meta.label} (−{cost}
                  {cost < meta.credits ? ' · Early' : ''})
                </Button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              void claimReferralCreditsDemo().then((ok) => {
                note(ok ? '+40 Credits Referral (Rewards-Pool)' : t('credits.reserveEmpty'))
              })
            }}
          >
            Referral verdienen
          </Button>
          {!p2pOnly && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                simulatePacksSoldOut()
                note(t('credits.packsSoldOut'))
              }}
            >
              {t('credits.simulateEmpty')}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-2 border-t border-violet-500/20 pt-3">
          <Input
            label="Umtausch Betrag"
            type="number"
            value={creditAmt}
            onChange={(e) => setCreditAmt(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => {
              const n = Number(creditAmt) || 0
              void exchangeEurToCredits(n).then((ok) => {
                note(
                  ok
                    ? `EUR→Credits: ${n} €`
                    : p2pOnly
                      ? t('credits.p2pHint')
                      : 'Wallet-EUR reicht nicht oder Reserve leer',
                )
              })
            }}
          >
            € → Credits
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const n = Number(creditAmt) || 0
              void exchangeCreditsToEur(n).then((ok) => {
                note(ok ? `Credits→€: ${n} Cr` : t('credits.notEnough'))
              })
            }}
          >
            Credits → €
          </Button>
        </div>
        <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-neutral-300">
          {credits.txs.slice(0, 8).map((tx) => (
            <li key={tx.id} className="flex justify-between gap-2">
              <span className="truncate">{tx.label}</span>
              <span className="tabular-nums shrink-0">
                {tx.type === 'spend' || tx.type === 'exchange_out' || tx.type === 'gift' ? '−' : '+'}
                {tx.amount}
              </span>
            </li>
          ))}
        </ul>
        <div className="rounded-xl border border-border/70 bg-black/20 p-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            Faire Rewards (Demo)
            {verbesserer && (
              <Badge tone="amber" data-verbesserer="1">
                {t('rewards.verbesserer')}
              </Badge>
            )}
          </h3>
          <p className="mt-1 text-xs text-muted">{t('rewards.verbessererHint')}</p>
          <table className="mt-3 w-full text-left text-xs">
            <caption className="sr-only">{t('rewards.tableTitle')}</caption>
            <thead>
              <tr className="text-muted">
                <th className="pb-1 font-medium">{t('rewards.tableTitle')}</th>
                <th className="pb-1 font-medium">Credits</th>
                <th className="pb-1 font-medium">Cap</th>
              </tr>
            </thead>
            <tbody>
              {CONTRIBUTOR_REWARDS.map((row) => (
                <tr key={row.id} className="border-t border-border/50">
                  <td className="py-1">{resolved === 'de' ? row.de : row.en}</td>
                  <td className="py-1 tabular-nums">{row.amount}</td>
                  <td className="py-1 tabular-nums">{row.cap}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">{t('rewards.noClientMint')}</p>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-neutral-300">
            {(resolved === 'de' ? REWARD_RULES_DE : REWARD_RULES_EN).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Flags: ideas {getRewardFlags().ideas} · merged PRs {getRewardFlags().grantedPrs.join(', ') || '—'}
          </p>
        </div>
      </section>

      <GiftSheet
        presetKind={params.get('gift')?.split(':')[0]}
        presetId={params.get('gift')?.split(':').slice(1).join(':')}
        presetLabel={params.get('label')}
      />

      {sheet && (
        <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-100">
            {sheet === 'topup' ? 'Demo-Einzahlung' : 'Demo-Auszahlung'}
          </p>
          <p className="mt-1 text-xs text-amber-100/85">
            Kein Bank- oder Krypto-Transfer. Der Betrag ändert nur die lokale Anzeige.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => runCash(sheet)}>
              {sheet === 'topup' ? '+250 € Demo' : '−100 € Demo'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setSheet(null)}>
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      <section className="card-elevated space-y-3 rounded-2xl border border-border p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ArrowLeftRight size={18} className="text-cyan" /> FX-Rechner
        </h2>
        <p className="text-xs text-muted">
          EUR → USD / GBP / CHF / USDT. Kurse indikativ
          {fx.source === 'static' ? ' (statisch)' : ' (Frankfurter.app, USDT ≈ USD)'}. Kein Handel.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Betrag in EUR"
            type="number"
            min={0}
            value={fxAmount}
            onChange={(e) => setFxAmount(e.target.value)}
          />
          <Select label="Zielwährung" value={fxTo} onChange={(e) => setFxTo(e.target.value as FxCode)}>
            {FX_CODES.filter((c) => c !== 'EUR').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-2xl font-bold tabular-nums text-cyan">{formatFx(converted, fxTo)}</p>
        <div className="flex flex-wrap gap-1.5 text-xs text-muted">
          {FX_CODES.map((c) => (
            <span key={c} className="chip">
              1 EUR = {c === 'EUR' ? '1' : fx.rates[c].toFixed(3)} {c}
            </span>
          ))}
        </div>
      </section>

      <section className="card-elevated space-y-3 rounded-2xl border border-border p-5">
        <h2 className="text-lg font-semibold">Auf der Plattform zahlen</h2>
        <p className="text-xs text-muted">
          Mock-Checkout für Bookings & Featured. Bestätigung ändert nur das Demo-Guthaben.
        </p>
        <Button
          size="sm"
          onClick={() => {
            mockPlatformCheckout({ amountEur: 49, label: 'Featured-Listing 7 Tage (Demo-Checkout)' })
            note('Demo-Checkout −49 € — kein Stripe/PayPal.')
          }}
        >
          Featured 7 Tage · 49 € (Demo)
        </Button>
        <Link to="/match" className="block text-sm text-cyan hover:underline">
          Bookings über Match / Booking-Seite mit Pay-Sheet zahlen →
        </Link>
      </section>

      <section className="card-elevated space-y-3 rounded-2xl border border-border p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Landmark size={18} className="text-cyan" /> Auszahlung aufs Konto
        </h2>
        <p className="text-xs text-muted">IBAN-Formular — Stub. Kein Banking-Partner, keine SEPA-Datei.</p>
        {!payoutOk ? (
          <VerifyPanel focus="payout" />
        ) : (
          <>
        <Input label="Kontoinhaber" value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Mirco Küßner" />
        <Input label="IBAN" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="DE89 ACCT-000034" />
        <Input label="BIC (optional)" value={bic} onChange={(e) => setBic(e.target.value)} placeholder="COBADEFFXXX" />
        <Input
          label="Betrag €"
          type="number"
          min={1}
          value={payoutAmt}
          onChange={(e) => setPayoutAmt(e.target.value)}
        />
        <Button
          size="sm"
          disabled={!iban || !holder}
          onClick={() => {
            mockPayoutIban({ iban, bic, holder, amountEur: Number(payoutAmt) || 0 })
            note('Demo-Auszahlung vorgemerkt — kein echter Überweisungsauftrag.')
          }}
        >
          Demo-Auszahlung
        </Button>
          </>
        )}
      </section>

      <section className="card-elevated space-y-3 rounded-2xl border border-border p-5">
        <h2 className="text-lg font-semibold">Krypto-Auszahlung</h2>
        <p className="text-xs text-muted">Adresse + Asset — kein On-Chain, keine Exchange-API.</p>
        <Select
          label="Asset"
          value={cryptoAsset}
          onChange={(e) => setCryptoAsset(e.target.value as 'btc' | 'usdc' | 'usdt')}
        >
          <option value="usdt">USDT</option>
          <option value="usdc">USDC</option>
          <option value="btc">BTC</option>
        </Select>
        <Input
          label="Adresse / Invoice"
          value={cryptoAddr}
          onChange={(e) => setCryptoAddr(e.target.value)}
          placeholder="bc1q… oder 0x… / T…"
        />
        <Input
          label="Betrag € (Gegenwert)"
          type="number"
          min={1}
          value={cryptoAmt}
          onChange={(e) => setCryptoAmt(e.target.value)}
        />
        <Button
          size="sm"
          disabled={!cryptoAddr}
          onClick={() => {
            mockCryptoWithdraw({
              asset: cryptoAsset,
              address: cryptoAddr,
              amountEur: Number(cryptoAmt) || 0,
            })
            note('Krypto-Withdraw nur lokal gebucht — keine Chain.')
          }}
        >
          Demo-Withdraw
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Zahlungsmethoden</h2>
        <div className="space-y-2">
          {WALLET_METHODS.map((m) => {
            const st = wallet.methods[m.id]
            const on = Boolean(st?.connected)
            return (
              <article
                key={m.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-4',
                  on ? 'border-cyan/30 bg-cyan/5' : 'border-border bg-surface-2',
                )}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-black/40 text-lg">
                  {m.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{m.label}</h3>
                    <Badge tone={on ? 'green' : 'default'}>{on ? 'verbunden' : 'nicht verbunden'}</Badge>
                    {m.group === 'crypto' && <Badge tone="amber">Krypto</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{on ? st.display : m.hint}</p>
                </div>
                <Button
                  size="sm"
                  variant={on ? 'ghost' : 'secondary'}
                  disabled={busy === m.id}
                  onClick={() => runConnect(m.id, !on)}
                >
                  {busy === m.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : on ? (
                    <>
                      <Link2Off size={14} /> Trennen
                    </>
                  ) : (
                    <>
                      <Link2 size={14} /> Verbinden
                    </>
                  )}
                </Button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Umsätze</h2>
        {wallet.txs.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Demo-Buchungen.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-2">
            {wallet.txs.slice(0, 20).map((tx) => {
              const meta = WALLET_METHODS.find((m) => m.id === tx.methodId)
              const sign =
                tx.type === 'payout' || tx.type === 'pay' || tx.type === 'withdraw_crypto' ? '−' : tx.type === 'topup' ? '+' : ''
              return (
                <li key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{tx.label}</p>
                    <p className="text-xs text-muted">
                      {meta?.label} · {formatDateTime(tx.createdAt)} · Demo
                    </p>
                  </div>
                  {tx.amountEur > 0 && (
                    <span
                      className={cn(
                        'shrink-0 text-sm font-semibold tabular-nums',
                        sign === '−' ? 'text-rose-300' : 'text-cyan',
                      )}
                    >
                      {sign}
                      {formatPrice(tx.amountEur)}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            resetWallet()
            note('Wallet auf Demo-Start zurückgesetzt.')
          }}
        >
          Wallet reset
        </Button>
        <Link to="/profile" className="self-center text-sm text-cyan hover:underline">
          Zum Profil
        </Link>
      </div>
    </div>
  )
}
