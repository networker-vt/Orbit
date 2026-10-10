import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Gift, MapPin, Scale, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { JobConditions } from '../components/listings/JobConditions'
import { MarketRateHint } from '../components/listings/MarketRateHint'
import { FavoriteButton } from '../components/favorites/FavoriteButton'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Select, Textarea } from '../components/ui/Input'
import { SpeakButton } from '../components/a11y/SpeakButton'
import { InteresseButton } from '../components/apply/InteresseButton'
import { AnschreibenButton } from '../components/chat/AnschreibenButton'
import { chatHref } from '../lib/chatPath'
import { ExperienceList } from '../components/reviews/ExperienceList'
import { BOOKING_STATUS_LABELS, VERTICAL_META } from '../data/constants'
import { DEMO_USER_ID, seedProfiles } from '../data/seed'
import { useAuth } from '../lib/auth'
import { store } from '../lib/store'
import { useStoreVersion } from '../hooks/useStore'
import { formatDate, formatPriceRange, verificationLabel } from '../lib/utils'
import { CalendarExport } from '../components/calendar/CalendarExport'
import { trackBehavior } from '../lib/behavior'
import { listingSpeech } from '../lib/tts'
import { listForListing } from '../lib/experience'
import { giftWalletHref } from '../lib/gift'
import { isFlagOn } from '../lib/flags'
import { useI18n } from '../lib/i18n'
import { ReportButton } from '../components/report/ReportButton'
import { SellerLabel } from '../components/listings/SellerLabel'

export function ListingDetailPage() {
  const { t } = useI18n()
  const { id } = useParams()
  const version = useStoreVersion()
  const listing = store.getListing(id!)
  const { user, loginDemo } = useAuth()
  const navigate = useNavigate()
  const isJob = listing?.vertical === 'job'
  const [note, setNote] = useState(
    isJob
      ? 'Hallo! Ich bewerbe mich auf diesen Gig. Kurz zu mir: Erfahrung passend zum Gewerk, zeitlich verfügbar am genannten Datum.'
      : 'Hallo! Ich interessiere mich für dieses Inserat und würde gerne Details klären.',
  )
  const [projectId, setProjectId] = useState('')
  const [done, setDone] = useState<{ bookingId: string; threadId: string } | null>(null)

  const projects = useMemo(
    () => (user ? store.listProjects(user.id) : []),
    [user, version],
  )

  useEffect(() => {
    if (!listing || listing.vertical !== 'job') return
    trackBehavior({
      kind: 'view',
      listingId: listing.id,
      industry: listing.industry,
      jobType: listing.jobType,
      city: listing.city,
    })
  }, [listing?.id])

  if (!listing) {
    return (
      <div className="rounded-2xl border border-border p-8 text-center">
        <p>Inserat nicht gefunden.</p>
        <Button className="mt-4" onClick={() => navigate('/')}>
          Zur Discovery
        </Button>
      </div>
    )
  }

  const meta = VERTICAL_META[listing.vertical]
  const owner = store.getProfile(listing.ownerId)
  const rate = formatPriceRange(listing.priceFrom, listing.priceTo, listing.priceUnit)
  const isOwner = Boolean(user && user.id === listing.ownerId)
  const apps = isJob ? store.listBookingsForListing(listing.id) : []

  const submitInquiry = () => {
    let requesterId = user?.id
    let requesterName = user?.name
    if (!requesterId || !requesterName) {
      const ownerIsDemoAgency = listing.ownerId === DEMO_USER_ID
      const pick =
        seedProfiles.find((x) => x.id === (ownerIsDemoAgency ? 'user-2' : DEMO_USER_ID)) ??
        seedProfiles.find((x) => x.id !== listing.ownerId)!
      const asId = pick.id === listing.ownerId
        ? seedProfiles.find((x) => x.id !== listing.ownerId)!.id
        : pick.id
      loginDemo(asId)
      const demo = seedProfiles.find((x) => x.id === asId)!
      requesterId = demo.id
      requesterName = demo.name
    }
    if (requesterId === listing.ownerId) {
      alert('Du kannst dein eigenes Inserat nicht anfragen. Wechsle das Profil oder öffne ein fremdes Inserat.')
      return
    }
    const { booking, thread } = store.createInquiry({
      listing,
      requesterId,
      requesterName,
      note,
      projectId: projectId || undefined,
    })
    if (listing.priceFrom != null) {
      store.updateBookingStatus(booking.id, 'inquiry', { offerAmount: listing.priceFrom })
    }
    setDone({ bookingId: booking.id, threadId: thread.id })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-3xl border border-border bg-surface-2 p-5 md:p-6">
        <div className="flex flex-wrap gap-2">
          <Badge tone={listing.kind === 'offer' ? 'cyan' : 'amber'}>
            {listing.kind === 'offer' ? 'Angebot' : 'Gesuch'}
          </Badge>
          <Badge tone="teal">{meta.label}</Badge>
          {listing.featured && <Badge>Featured</Badge>}
        </div>

        {isJob && (
          <div className="mt-4 rounded-2xl border border-cyan/30 bg-cyan/10 px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-cyan">Tagessatz / Budget</div>
            <div className="text-2xl font-bold text-ink">{rate}</div>
            <p className="text-xs text-muted">Transparent · kein Bait — Rate steht im Inserat</p>
            <MarketRateHint compact className="mt-1" />
          </div>
        )}

        <div className="mt-4 flex gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-3 text-3xl">
            {listing.imageEmoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-bold md:text-2xl">{listing.title}</h1>
              <div className="flex items-center gap-1">
                <SpeakButton
                  compact
                  text={listingSpeech({
                    title: listing.title,
                    city: listing.city,
                    ownerName: listing.ownerName,
                    description: listing.description,
                    rate,
                    industry: listing.industry,
                  })}
                />
                <FavoriteButton listingId={listing.id} />
                {isFlagOn('credits') && (
                <Link
                  to={giftWalletHref({
                    kind: 'listing',
                    id: listing.id,
                    label: listing.title,
                    hint: listing.ownerName,
                  })}
                  className="tap-target inline-flex h-11 items-center gap-1 rounded-full border border-violet-400/40 px-3 text-xs text-violet-100"
                  aria-label={t('gift.nudge')}
                >
                  <Gift size={14} /> {t('gift.nudge')}
                </Link>
                )}
              </div>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin size={14} /> {listing.city}
              </span>
              {listing.rating != null && (
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <Star size={14} fill="currentColor" /> {listing.rating.toFixed(1)}
                </span>
              )}
              {listing.dateFrom && (
                <span>
                  {formatDate(listing.dateFrom)}
                  {listing.dateTo ? ` – ${formatDate(listing.dateTo)}` : ''}
                </span>
              )}
            </p>
            <div className="mt-3 space-y-2">
              <SellerLabel listing={listing} />
              <ReportButton targetKind="listing" targetId={listing.id} />
            </div>
          </div>
        </div>

        {(listing.venue || listing.callTime || listing.dateFrom) && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {listing.venue && (
              <div className="rounded-xl border border-border bg-surface-3/50 px-3 py-2 text-sm">
                <div className="text-xs text-muted">Venue / Ort</div>
                {listing.venue}
              </div>
            )}
            {listing.callTime && (
              <div className="rounded-xl border border-border bg-surface-3/50 px-3 py-2 text-sm">
                <div className="text-xs text-muted">Call-Zeiten</div>
                {listing.callTime}
              </div>
            )}
            {listing.dateFrom && (
              <div className="rounded-xl border border-border bg-surface-3/50 px-3 py-2 text-sm">
                <div className="text-xs text-muted">Zeitraum</div>
                {formatDate(listing.dateFrom)}
                {listing.dateTo ? ` – ${formatDate(listing.dateTo)}` : ''}
              </div>
            )}
            <div className="rounded-xl border border-border bg-surface-3/50 px-3 py-2 text-sm">
              <div className="text-xs text-muted">Standort</div>
              {listing.city}
              {listing.venue ? ` · ${listing.venue}` : ''}
            </div>
          </div>
        )}

        {listing.dateFrom && (
        <CalendarExport
          compact
          kind="application"
          event={{
            title: `Orbit Bewerbung: ${listing.title}`,
            description: listing.description.slice(0, 280),
            location: [listing.city, listing.venue].filter(Boolean).join(' · '),
            startIso: `${listing.dateFrom}T09:00:00.000Z`,
            endIso: listing.dateTo ? `${listing.dateTo}T17:00:00.000Z` : undefined,
          }}
        />
      )}
      <JobConditions listing={listing} />

        <p className="mt-5 whitespace-pre-wrap text-neutral-300">{listing.description}</p>

        {listing.requirements && listing.requirements.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-semibold">Qualifikationen / Requirements</h3>
            <ul className="space-y-1 text-sm text-neutral-300">
              {listing.requirements.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-cyan">•</span> {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {listing.matchReason && (
          <p className="mt-4 inline-flex items-start gap-2 rounded-xl bg-cyan/10 px-3 py-2 text-sm text-cyan">
            <Sparkles size={16} className="mt-0.5 shrink-0" />
            <span>
              <strong>Warum gezeigt:</strong> {listing.matchReason}
            </span>
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {listing.crafts.map((c) => (
            <Badge key={c}>{c}</Badge>
          ))}
          {listing.tags.map((t) => (
            <Badge key={t} tone="default">
              #{t}
            </Badge>
          ))}
        </div>

        {!isJob && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div>
              <div className="text-xl font-semibold text-cyan">{rate}</div>
              {listing.capacity && <div className="text-sm text-muted">{listing.capacity}</div>}
            </div>
            <Link to={`/profiles/${listing.ownerId}`} className="text-sm text-neutral-300 hover:text-cyan">
              {listing.ownerName} · {verificationLabel(listing.ownerVerified)}
            </Link>
          </div>
        )}
      </div>

      {owner && (
        <div className="rounded-2xl border border-border bg-surface-2 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-teal" size={20} />
            <div className="min-w-0">
              <Link to={`/profiles/${owner.id}`} className="font-medium hover:text-cyan">
                {owner.name}
              </Link>
              <div className="text-sm text-muted">
                {verificationLabel(owner.verified)} · ⭐ {owner.rating.toFixed(1)} ({owner.reviewCount}{' '}
                Bewertungen)
                {owner.travelRadiusKm != null && ` · Radius ${owner.travelRadiusKm} km`}
                {owner.insured && ' · Versichert'}
              </div>
              {owner.certifications && owner.certifications.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {owner.certifications.map((c) => (
                    <Badge key={c} tone="teal">
                      {c}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-surface-2 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Erfahrungen</h2>
          <Link to="/erfahrungen" className="text-xs text-[var(--theme-accent)] hover:underline">
            Selbst bewerten →
          </Link>
        </div>
        <ExperienceList reviews={listForListing(listing.id, listing.ownerName)} empty="Noch keine Reviews zu Job/Firma." />
      </section>

      {isOwner ? (
        <div className="space-y-3 rounded-2xl border border-teal/30 bg-teal/10 p-5">
          <h2 className="font-semibold text-teal">Dein Inserat</h2>
          <p className="text-sm text-neutral-300">
            {isJob
              ? `${apps.length} Bewerbung${apps.length === 1 ? '' : 'en'} — Pipeline im Hire-Board oder Vergleich.`
              : 'Anfragen landen in Chat und Booking-Flow.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {isJob && (
              <Button onClick={() => navigate('/match')}>Match</Button>
            )}
            {isJob && apps.length >= 2 && (
              <Button variant="secondary" onClick={() => navigate(`/jobs/compare/${listing.id}`)}>
                <Scale size={16} /> Bewerber vergleichen
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
          </div>
        </div>
      ) : isJob ? (
        <InteresseButton listing={listing} />
      ) : done ? (
        <div className="success-pop rounded-2xl border border-cyan/30 bg-cyan/10 p-5">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-cyan/40 bg-cyan/15 text-cyan success-check">
            ✓
          </div>
          <h2 className="font-semibold text-cyan">
            {isJob ? 'Bewerbung gesendet' : 'Anfrage gesendet'}
          </h2>
          <p className="mt-1 text-sm text-neutral-300">
            Status: {BOOKING_STATUS_LABELS.inquiry}. Nächster Schritt: Chat oder Booking-Flow
            (Angebot → Annahme → Buchung).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => navigate(chatHref(done.threadId))}>{t('chat.anschreiben')}</Button>
            <Button variant="secondary" onClick={() => navigate(`/bookings/${done.bookingId}`)}>
              Status öffnen
            </Button>
            <Button variant="ghost" onClick={() => navigate(isJob ? '/match' : '/dashboard')}>
              {isJob ? 'Match' : 'Dashboard'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-border bg-surface-2 p-5">
          <h2 className="font-semibold">Kurze Anfrage</h2>
          <AnschreibenButton listing={listing} source="listing" note={note} fullWidth size="lg" />
          <Textarea
            label="Nachricht (optional, kein Anschreiben nötig)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {user && projects.length > 0 && (
            <Select
              label="Optional: an Projekt anhängen"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Kein Projekt</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          )}
          <Button className="w-full md:w-auto" size="lg" onClick={submitInquiry}>
            {user ? 'Anfrage stellen' : 'Demo-Login & Anfrage stellen'}
          </Button>
          <p className="text-xs text-muted">Kein CV-Spam — kurze Nachricht reicht.</p>
        </div>
      )}
    </div>
  )
}
