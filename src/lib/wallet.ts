import { uid } from './utils'

const KEY = 'el_wallet_v1'
const EVT = 'el-wallet-changed'

export type WalletMethodId = 'paypal' | 'card' | 'sepa' | 'btc' | 'usdc' | 'usdt'

export interface WalletMethod {
  id: WalletMethodId
  connected: boolean
  connectedAt?: string
  display?: string
}

export interface WalletTx {
  id: string
  type: 'pay' | 'topup' | 'payout' | 'connect' | 'withdraw_crypto'
  amountEur: number
  methodId: WalletMethodId
  status: 'demo_success'
  bookingId?: string
  label: string
  createdAt: string
}

export interface WalletState {
  balanceEur: number
  methods: Record<WalletMethodId, WalletMethod>
  txs: WalletTx[]
}

export const WALLET_METHODS: {
  id: WalletMethodId
  group: 'fiat' | 'crypto'
  label: string
  hint: string
  icon: string
}[] = [
  {
    id: 'paypal',
    group: 'fiat',
    label: 'PayPal',
    hint: 'Demo-Konto verbinden — kein PayPal-API-Call',
    icon: '🅿️',
  },
  {
    id: 'card',
    group: 'fiat',
    label: 'Kreditkarte',
    hint: 'Visa / Mastercard — UI-Stub, kein Stripe',
    icon: '💳',
  },
  {
    id: 'sepa',
    group: 'fiat',
    label: 'SEPA-Überweisung',
    hint: 'IBAN-Demo — kein Banking-API',
    icon: '🏦',
  },
  {
    id: 'btc',
    group: 'crypto',
    label: 'Bitcoin (BTC)',
    hint: 'Demo-Adresse — kein On-Chain, kein Exchange',
    icon: '₿',
  },
  {
    id: 'usdc',
    group: 'crypto',
    label: 'USDC',
    hint: 'Stablecoin-Demo — kein On-Chain, kein Circle',
    icon: '◎',
  },
  {
    id: 'usdt',
    group: 'crypto',
    label: 'USDT',
    hint: 'Tether-Demo — kein On-Chain, kein Issuer-Call',
    icon: '₮',
  },
]

export const WALLET_DISCLAIMER_DE =
  'Demo bis Stripe, PayPal und ein Banking-Partner inkl. KYC angebunden sind. Es findet keine echte Zahlungsbewegung statt. PayPal, Karte, SEPA/IBAN und Krypto (BTC, USDC, USDT) sind UI-Stubs. Ohne Provider-Keys und Live-Schalter bewegt Allda kein Geld und ruft keine Zahlungs-APIs auf.'

const DEMO_DISPLAY: Record<WalletMethodId, string> = {
  paypal: 'demo@example.invalid',
  card: '•••• 4242',
  sepa: 'DE•• •••• •••• •••• 8901',
  btc: 'bc1q…orbit (Demo)',
  usdc: '0xLOAD…USDC (Demo)',
  usdt: 'TLoad…USDT (Demo)',
}

function defaultState(): WalletState {
  return {
    balanceEur: 2480,
    methods: {
      paypal: { id: 'paypal', connected: false },
      card: { id: 'card', connected: false },
      sepa: { id: 'sepa', connected: false },
      btc: { id: 'btc', connected: false },
      usdc: { id: 'usdc', connected: false },
      usdt: { id: 'usdt', connected: false },
    },
    txs: [
      {
        id: 'tx-seed-1',
        type: 'topup',
        amountEur: 2480,
        methodId: 'sepa',
        status: 'demo_success',
        label: 'Startguthaben (Demo)',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
    ],
  }
}

function load(): WalletState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as WalletState
    if (typeof parsed.balanceEur !== 'number' || !parsed.methods) return defaultState()
    const base = defaultState()
    parsed.methods = { ...base.methods, ...parsed.methods }
    return parsed
  } catch {
    return defaultState()
  }
}

function save(state: WalletState) {
  localStorage.setItem(KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(EVT))
}

let cache: WalletState | null = null

function get(): WalletState {
  if (!cache) cache = load()
  return cache
}

function commit(next: WalletState) {
  cache = next
  save(next)
}

export function subscribeWallet(cb: () => void) {
  const handler = () => cb()
  window.addEventListener(EVT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function getWallet(): WalletState {
  return structuredClone(get())
}

export function connectMethod(id: WalletMethodId): WalletState {
  const next = structuredClone(get())
  next.methods[id] = {
    id,
    connected: true,
    connectedAt: new Date().toISOString(),
    display: DEMO_DISPLAY[id],
  }
  next.txs.unshift({
    id: uid('tx'),
    type: 'connect',
    amountEur: 0,
    methodId: id,
    status: 'demo_success',
    label: `${WALLET_METHODS.find((m) => m.id === id)?.label ?? id} verbunden (Demo)`,
    createdAt: new Date().toISOString(),
  })
  commit(next)
  return next
}

export function disconnectMethod(id: WalletMethodId): WalletState {
  const next = structuredClone(get())
  next.methods[id] = { id, connected: false }
  commit(next)
  return next
}

export function mockAdjustBalance(
  type: 'topup' | 'payout',
  amountEur: number,
  methodId: WalletMethodId,
): WalletState {
  const next = structuredClone(get())
  const amt = Math.max(0, amountEur)
  if (type === 'topup') next.balanceEur += amt
  else next.balanceEur = Math.max(0, next.balanceEur - amt)
  next.txs.unshift({
    id: uid('tx'),
    type,
    amountEur: amt,
    methodId,
    status: 'demo_success',
    label: type === 'topup' ? 'Einzahlung (Demo)' : 'Auszahlung (Demo)',
    createdAt: new Date().toISOString(),
  })
  commit(next)
  return next
}

export function mockPayBooking(input: {
  amountEur: number
  methodId: WalletMethodId
  bookingId: string
  label: string
}): WalletTx {
  const next = structuredClone(get())
  const amt = Math.max(0, input.amountEur)
  next.balanceEur = Math.max(0, next.balanceEur - amt)
  const tx: WalletTx = {
    id: uid('tx'),
    type: 'pay',
    amountEur: amt,
    methodId: input.methodId,
    status: 'demo_success',
    bookingId: input.bookingId,
    label: input.label,
    createdAt: new Date().toISOString(),
  }
  next.txs.unshift(tx)
  commit(next)
  return tx
}

export function resetWallet() {
  cache = defaultState()
  save(cache)
}

export function methodMeta(id: WalletMethodId) {
  return WALLET_METHODS.find((m) => m.id === id)
}


export function mockPayoutIban(input: { iban: string; bic?: string; holder: string; amountEur: number }): WalletState {
  const next = structuredClone(get())
  const amt = Math.max(0, input.amountEur)
  next.balanceEur = Math.max(0, next.balanceEur - amt)
  const masked = input.iban.replace(/\s+/g, '').slice(-4)
  next.txs.unshift({
    id: uid('tx'),
    type: 'payout',
    amountEur: amt,
    methodId: 'sepa',
    status: 'demo_success',
    label: `Auszahlung Bank · ****${masked || 'IBAN'} (Demo, kein Transfer)`,
    createdAt: new Date().toISOString(),
  })
  commit(next)
  return next
}

export function mockCryptoWithdraw(input: {
  asset: Extract<WalletMethodId, 'btc' | 'usdc' | 'usdt'>
  address: string
  amountEur: number
}): WalletState {
  const next = structuredClone(get())
  const amt = Math.max(0, input.amountEur)
  next.balanceEur = Math.max(0, next.balanceEur - amt)
  const short = input.address.slice(0, 6)
  next.txs.unshift({
    id: uid('tx'),
    type: 'withdraw_crypto',
    amountEur: amt,
    methodId: input.asset,
    status: 'demo_success',
    label: `Krypto-Auszahlung ${input.asset.toUpperCase()} · ${short}… (Demo, kein On-Chain)`,
    createdAt: new Date().toISOString(),
  })
  commit(next)
  return next
}

export function mockPlatformCheckout(input: { amountEur: number; label: string }): WalletState {
  const next = structuredClone(get())
  const amt = Math.max(0, input.amountEur)
  next.balanceEur = Math.max(0, next.balanceEur - amt)
  const method: WalletMethodId = next.methods.card.connected
    ? 'card'
    : next.methods.paypal.connected
      ? 'paypal'
      : 'sepa'
  next.txs.unshift({
    id: uid('tx'),
    type: 'pay',
    amountEur: amt,
    methodId: method,
    status: 'demo_success',
    label: input.label,
    createdAt: new Date().toISOString(),
  })
  commit(next)
  return next
}
