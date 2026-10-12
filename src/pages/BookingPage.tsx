import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RatingPrompt } from '../components/bookings/RatingPrompt'
import { PaySheet } from '../components/wallet/PaySheet'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { BOOKING_STATUS_LABELS, VERTICAL_META } from '../data/constants'
import { useStoreVersion } from '../hooks/useStore'
import { useAuth } from '../lib/auth'
import { isFlagOn } from '../lib/flags'
import { store } from '../lib/store'
import type { BookingStatus } from '../types'
import { formatDate, formatPrice } from '../lib/utils'
import { CalendarExport } from '../components/calendar/CalendarExport'

const FLOW: BookingStatus[] = ['inquiry', 'offer', 'accepted', 'booked', 'completed']

export function BookingPage() {
  const { id } = useParams()
  useStoreVersion()
  const booking = store.getBooking(id!)
  const { user, loginDemo } = useAuth()
  const navigate = useNavigate()
  const [offerAmount, setOfferAmount] = useState(booking?.offerAmount?.toString() ?? '')
  const [projectId, setProjectId] = useState(booking?.projectId ?? '')
  const [payOpen, setPayOpen] = useState(false)

  if (!booking) {
    return (
      <div className="p-8 text-center">
        Booking nicht gefunden.{' '}
        <Button className="mt-3" onClick={() => navigate('/dashboard')}>
          Dashboard
        </Button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <Button onClick={() => loginDemo()}>Demo Login</Button>
      </div>
    )
  }

  const projects = store.listProjects(user.id)
  const idx = FLOW.indexOf(booking.status === 'cancelled' ? 'inquiry' : booking.status)

  const advance = (status: BookingStatus) => {
    store.updateBookingStatus(booking.id, status, {
      offerAmount: offerAmount ? Number(offerAmount) : booking.offerAmount,
    })
  }

  const attach = () => {
    if (!projectId) return
    store.attachBookingToProject(projectId, booking)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-2xl border border-border bg-surface-2 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="teal">{VERTICAL_META[booking.vertical]?.label}</Badge>
          <Badge tone="cyan">{BOOKING_STATUS_LABELS[booking.status]}</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-bold">{booking.listingTitle}</h1>
        <p className="mt-1 text-sm text-muted">
          {booking.requesterName} → {booking.providerName}
          {booking.dateFrom && (
            <>
              {' '}
              · {formatDate(booking.dateFrom)}
              {booking.dateTo ? ` – ${formatDate(booking.dateTo)}` : ''}
            </>
          )}
        </p>
        {booking.note && <p className="mt-3 text-sm text-neutral-300">{booking.note}</p>}
        {booking.offerAmount != null && (
          <p className="mt-2 text-lg font-semibold text-cyan">{formatPrice(booking.offerAmount)}</p>
        )}
        {isFlagOn('interview') && (
        <div className="mt-4">
          <Link
            to={`/interview`}
            className="text-sm text-[var(--theme-accent)] hover:underline"
          >
            Interview-Raum (Chat · Slot · Video-Stub) →
          </Link>
        </div>
        )}
      </div>

      {booking.dateFrom && (
        <CalendarExport
          kind={booking.status === 'booked' || booking.status === 'accepted' ? 'start' : 'interview'}
          event={{
            title: `Allda: ${booking.listingTitle}`,
            description: `${booking.requesterName} ↔ ${booking.providerName}\nStatus: ${booking.status}`,
            startIso: `${booking.dateFrom}T09:00:00.000Z`,
            endIso: booking.dateTo ? `${booking.dateTo}T17:00:00.000Z` : undefined,
          }}
        />
      )}

      {booking.status === 'completed' && (
        <RatingPrompt booking={booking} userId={user.id} userName={user.name} />
      )}

      <div className="rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="mb-3 font-semibold">Status-Flow</h2>
        <div className="flex flex-wrap gap-2">
          {FLOW.map((s, i) => (
            <div
              key={s}
              className={`rounded-full px-3 py-1 text-xs ${i <= idx && booking.status !== 'cancelled' ? 'bg-cyan/20 text-cyan' : 'bg-ink/5 text-muted'}`}
            >
              {BOOKING_STATUS_LABELS[s]}
            </div>
          ))}
          {booking.status === 'cancelled' && <Badge tone="rose">Storniert</Badge>}
        </div>

        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
          <div className="mt-4 space-y-3">
            {(booking.status === 'inquiry' || booking.status === 'offer') && (
              <Input
                label="Angebotsbetrag (€)"
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
              />
            )}
            <div className="flex flex-wrap gap-2">
              {booking.status === 'inquiry' && (
                <Button onClick={() => advance('offer')}>Angebot senden</Button>
              )}
              {booking.status === 'offer' && (
                <Button onClick={() => advance('accepted')}>Angebot annehmen</Button>
              )}
              {booking.status === 'accepted' && (
                <Button onClick={() => setPayOpen(true)}>Zahlung & als gebucht markieren</Button>
              )}
              {booking.status === 'booked' && (
                <Button
                  onClick={() => {
                    advance('completed')
                    void import('../lib/rewards')
                      .then((m) => m.grantJobCompleted(booking.id))
                      .catch(() => undefined)
                  }}
                >
                  Abschließen
                </Button>
              )}
              <Button variant="danger" onClick={() => advance('cancelled')}>
                Stornieren
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="mb-3 font-semibold">An Projekt anhängen</h2>
        <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">Projekt wählen…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </Select>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={attach} disabled={!projectId}>
            Anhängen
          </Button>
          {booking.threadId && (
            <Button variant="ghost" onClick={() => navigate(`/messages/${booking.threadId}`)}>
              Zum Chat
            </Button>
          )}
          <Link to={`/listings/${booking.listingId}`} className="self-center text-sm text-cyan">
            Inserat öffnen
          </Link>
        </div>
      </div>

      <PaySheet
        open={payOpen}
        onClose={() => setPayOpen(false)}
        amountEur={booking.offerAmount ?? 0}
        title={booking.listingTitle}
        bookingId={booking.id}
        onSuccess={() => {
          advance('booked')
          setPayOpen(false)
        }}
      />
      {booking.status === 'accepted' && (
        <p className="text-center text-xs text-muted">
          <button type="button" className="text-cyan hover:underline" onClick={() => advance('booked')}>
            Ohne Demo-Zahlung als gebucht markieren
          </button>
        </p>
      )}
    </div>
  )
}
