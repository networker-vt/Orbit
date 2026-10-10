import { useNavigate, useParams } from 'react-router-dom'
import { QrStub } from '../components/travel/QrStub'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Empty } from '../components/ui/Empty'
import { chatHref } from '../lib/chatPath'
import { useI18n } from '../lib/i18n'
import { cancelTicket, getTicket, subscribeTickets } from '../lib/tickets'
import { formatDateTime, formatPrice } from '../lib/utils'
import { useSyncExternalStore } from 'react'

function useTicket(id?: string) {
  return useSyncExternalStore(
    subscribeTickets,
    () => (id ? getTicket(id) : undefined),
    () => undefined,
  )
}

export function TicketPage() {
  const { id } = useParams()
  const { t } = useI18n()
  const navigate = useNavigate()
  const ticket = useTicket(id)

  if (!ticket) {
    return (
      <Empty
        emoji="🎫"
        title={t('ticket.missing')}
        hint={t('ticket.missingHint')}
        actionLabel={t('nav.wallet')}
        onAction={() => navigate('/wallet')}
      />
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-5 pb-scroll-chrome">
      <header className="space-y-1 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--theme-accent)]">
          {t('ticket.kicker')}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{t('ticket.title')}</h1>
        <Badge tone={ticket.status === 'confirmed' ? 'green' : 'amber'}>
          {ticket.status === 'confirmed' ? t('ticket.confirmed') : t('ticket.cancelled')}
        </Badge>
      </header>

      <div className="flex flex-col items-center rounded-3xl border border-border bg-surface-2 p-6">
        <QrStub value={ticket.qr} />
        <p className="mt-3 font-mono text-sm tracking-wider text-ink">{ticket.ref}</p>
        <p className="mt-1 text-center text-xs text-muted">{t('ticket.qrHint')}</p>
      </div>

      <section className="space-y-2 rounded-2xl border border-border bg-surface-2 p-4">
        <p className="text-lg font-semibold text-ink">{ticket.title}</p>
        <p className="text-sm text-muted">{ticket.subtitle}</p>
        <p className="text-sm text-neutral-300">
          {ticket.location} · {formatDateTime(ticket.whenIso)}
        </p>
        <p className="text-sm">
          {formatPrice(ticket.priceEur)} · {ticket.paidWith === 'credits' ? 'Orbit Credits' : t('checkout.fiat')}
        </p>
      </section>

      <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
        {t('ticket.demo')}
      </p>

      <div className="flex flex-wrap gap-2">
        {ticket.threadId && (
          <Button variant="secondary" onClick={() => navigate(chatHref(ticket.threadId))}>
            {t('ticket.chat')}
          </Button>
        )}
        <Button variant="secondary" onClick={() => navigate('/wallet')}>
          {t('nav.wallet')}
        </Button>
        {ticket.status === 'confirmed' && (
          <Button
            variant="ghost"
            onClick={() => {
              cancelTicket(ticket.id)
            }}
          >
            {t('ticket.cancel')}
          </Button>
        )}
      </div>
    </div>
  )
}
