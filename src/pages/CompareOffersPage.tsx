import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Scale, Star } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { BOOKING_STATUS_LABELS } from '../data/constants'
import { useStoreVersion } from '../hooks/useStore'
import { useAuth } from '../lib/auth'
import { chatHref } from '../lib/chatPath'
import { store } from '../lib/store'
import { cn, formatPrice, verificationLabel } from '../lib/utils'

export function CompareOffersPage() {
  const { listingId } = useParams()
  useStoreVersion()
  const { user, loginDemo } = useAuth()
  const navigate = useNavigate()
  const listing = store.getListing(listingId!)
  const bookings = store.listBookingsForListing(listingId!)
  const [selected, setSelected] = useState<string[]>(() =>
    bookings.slice(0, 3).map((b) => b.id),
  )

  const rows = useMemo(() => {
    return bookings
      .filter((b) => selected.includes(b.id))
      .map((b) => {
        const profile = store.getProfile(b.requesterId)
        return { booking: b, profile }
      })
  }, [bookings, selected])

  if (!listing) {
    return (
      <div className="p-8 text-center text-muted">
        Inserat nicht gefunden.{' '}
        <Button className="mt-3" onClick={() => navigate('/match')}>
          Zurück zu Match
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

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  type Row = (typeof rows)[number]

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <button
        type="button"
        onClick={() => navigate('/match')}
        className="flex min-h-11 items-center gap-2 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Match
      </button>

      <div className="rounded-2xl border border-border bg-surface-2 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal">
            <Scale size={18} />
          </div>
          <div>
            <p className="text-sm text-teal">Angebote vergleichen</p>
            <h1 className="text-xl font-bold md:text-2xl">{listing.title}</h1>
            <p className="mt-1 text-sm text-muted">
              Side-by-side: Rate, Verifizierung, Rating & Status — max. 4 Bewerber.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface-2 p-4">
        <h2 className="mb-3 text-sm font-semibold">Bewerber auswählen</h2>
        <div className="flex flex-wrap gap-2">
          {bookings.length === 0 && (
            <p className="text-sm text-muted">Noch keine Bewerbungen für diesen Job.</p>
          )}
          {bookings.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => toggle(b.id)}
              className={cn(
                'rounded-full border px-3 py-2 text-sm',
                selected.includes(b.id)
                  ? 'border-teal bg-teal/15 text-teal'
                  : 'border-border text-muted',
              )}
            >
              {selected.includes(b.id) && <Check size={12} className="mr-1 inline" />}
              {b.requesterName}
            </button>
          ))}
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map(({ booking: b, profile }) => (
              <div key={b.id} className="rounded-2xl border border-border bg-surface-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Link to={`/profiles/${b.requesterId}`} className="font-semibold text-cyan">
                    {b.requesterName}
                  </Link>
                  <Badge>{BOOKING_STATUS_LABELS[b.status]}</Badge>
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Angebot</dt>
                    <dd className="font-medium text-cyan">
                      {b.offerAmount != null ? formatPrice(b.offerAmount) : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Rating</dt>
                    <dd className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400" fill="currentColor" />
                      {profile ? `${profile.rating.toFixed(1)} (${profile.reviewCount})` : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Verifiziert</dt>
                    <dd>{profile ? verificationLabel(profile.verified) : '—'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Stadt</dt>
                    <dd>{profile?.city ?? '—'}</dd>
                  </div>
                </dl>
                {b.note && <p className="mt-3 text-xs text-neutral-400">{b.note}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => navigate(`/bookings/${b.id}`)}>
                    Booking
                  </Button>
                  {b.threadId && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(chatHref(b.threadId))}
                    >
                      Chat
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface-2 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Kriterium</th>
                  {rows.map(({ booking: b }) => (
                    <th key={b.id} className="px-4 py-3 font-semibold text-ink">
                      <Link to={`/profiles/${b.requesterId}`} className="text-cyan hover:underline">
                        {b.requesterName}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(
                  [
                    [
                      'Angebot / Rate',
                      (b: Row) =>
                        b.booking.offerAmount != null
                          ? formatPrice(b.booking.offerAmount)
                          : 'offen',
                    ],
                    ['Status', (b: Row) => BOOKING_STATUS_LABELS[b.booking.status]],
                    [
                      'Rating',
                      (b: Row) =>
                        b.profile
                          ? `⭐ ${b.profile.rating.toFixed(1)} (${b.profile.reviewCount})`
                          : '—',
                    ],
                    [
                      'Verifizierung',
                      (b: Row) => (b.profile ? verificationLabel(b.profile.verified) : '—'),
                    ],
                    ['Stadt', (b: Row) => b.profile?.city ?? '—'],
                    [
                      'Gewerke',
                      (b: Row) => b.profile?.crafts?.slice(0, 3).join(', ') || '—',
                    ],
                    [
                      'Zertifikate',
                      (b: Row) => b.profile?.certifications?.join(', ') || '—',
                    ],
                    ['Notiz', (b: Row) => b.booking.note || '—'],
                  ] as const
                ).map(([label, render]) => (
                  <tr key={label} className="bg-surface/50">
                    <td className="px-4 py-3 text-muted">{label}</td>
                    {rows.map((row) => (
                      <td key={row.booking.id} className="px-4 py-3 text-neutral-200">
                        {render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-surface-2">
                  <td className="px-4 py-3 text-muted">Aktionen</td>
                  {rows.map(({ booking: b }) => (
                    <td key={b.id} className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => navigate(`/bookings/${b.id}`)}>
                          Öffnen
                        </Button>
                        {b.threadId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(chatHref(b.threadId))}
                          >
                            Chat
                          </Button>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
