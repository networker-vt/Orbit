import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Heart, SkipForward, SlidersHorizontal, MessageSquare, Plane } from 'lucide-react'
import { rankPersonalizedMatch, type PersonalizedItem } from '../lib/personalizedMatch'
import { chatHref } from '../lib/chatPath'
import type { TravelOffer } from '../lib/travel'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LaneBadge } from '../components/credits/LaneBadge'
import { SpeakButton } from '../components/a11y/SpeakButton'
import { useStoreVersion } from '../hooks/useStore'
import { useAuth } from '../lib/auth'
import { store } from '../lib/store'
import { useI18n } from '../lib/i18n'
import { applyInterest } from '../lib/apply'
import { rankForCompanyWorld, rankForWorld, trackBehavior } from '../lib/behavior'
import { buyBoost, boostCost, consumeSwipe, getSwipeBudget, subscribeCredits } from '../lib/credits'
import { SoftPaywall } from '../components/credits/SoftPaywall'
import { listingSpeech } from '../lib/tts'
import { cn, formatPrice } from '../lib/utils'
import { getCompany, subscribeCompany } from '../lib/company'
import { deriveMarketType, isSeekerFeedListing } from '../lib/market'
import { hasOccupationIntent, intentForMatch, listingVisibleForChoice, profileMatchesOccupationIntent } from '../lib/occupationMatch'
import { alcoholChoiceBlocked, publicMatchLine } from '../lib/lifeHome'
import { hasConfirmedAdult } from '../lib/ageGate'
import {
  filterCandidatesByEmployerPrefs,
  getPrefs,
  subscribePrefs,
} from '../lib/prefs'
import {
  getMatchDeckMode,
  getSwipes,
  recordSwipe,
  scoreB2bMatch,
  scoreCandidateMatch,
  scoreJobMatch,
  setMatchDeckMode,
  subscribeSwipes,
  swipedIds,
  type MatchDeckMode,
  type MatchScore,
  type MutualMatch,
} from '../lib/match'
import { isFlagOn } from '../lib/flags'
import { listingIsSafeForKids, kidsMaySeeJobs, isKidsMode, subscribeKids } from '../lib/kids'
import type { Listing, Profile } from '../types'

type DeckCard =
  | { kind: 'job'; listing: Listing; score: MatchScore; reason?: string }
  | { kind: 'company'; listing: Listing; score: MatchScore; reason?: string }
  | { kind: 'candidate'; profile: Profile; score: MatchScore; reason?: string }
  | { kind: 'travel'; offer: TravelOffer; score: MatchScore; reason?: string }

function fromPersonalized(item: PersonalizedItem): DeckCard {
  if (item.kind === 'travel') return { kind: 'travel', offer: item.offer, score: item.score, reason: item.reason }
  if (item.kind === 'person') return { kind: 'candidate', profile: item.profile, score: item.score, reason: item.reason }
  if (item.kind === 'job') return { kind: 'job', listing: item.listing, score: item.score, reason: item.reason }
  return { kind: 'company', listing: item.listing, score: item.score, reason: item.reason }
}

export function MatchPage() {
  useStoreVersion()
  const { t, resolved } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const forceCrew = location.pathname.startsWith('/crew')
  const forceTreffer = location.pathname.startsWith('/treffer')
  const personalized = !forceCrew && !forceTreffer
  const { user, loginDemo, profile } = useAuth()
  const [prefs, setPrefs] = useState(getPrefs)
  const [company, setCompany] = useState(getCompany)
  const [, setSwipeTick] = useState(0)
  const [toast, setToast] = useState<MutualMatch | null>(null)
  const [explain, setExplain] = useState(false)
  const [capOpen, setCapOpen] = useState(false)
  const [budget, setBudget] = useState(getSwipeBudget)
  const [deckMode, setDeckMode] = useState<MatchDeckMode>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/crew')) return 'company'
    if (typeof window !== 'undefined' && window.location.pathname.includes('/treffer')) return 'seeker'
    return getMatchDeckMode(getPrefs().side === 'employer' ? 'company' : 'seeker')
  })
  const [kids, setKids] = useState(isKidsMode)

  useEffect(() => {
    if (forceCrew) {
      setDeckMode('company')
      setMatchDeckMode('company')
    } else if (forceTreffer) {
      setDeckMode('seeker')
      setMatchDeckMode('seeker')
    }
  }, [forceCrew, forceTreffer])

  useEffect(() => {
    const u1 = subscribePrefs(() => setPrefs(getPrefs()))
    const u2 = subscribeSwipes(() => setSwipeTick((n) => n + 1))
    const u3 = subscribeCompany(() => setCompany(getCompany()))
    const u4 = subscribeCredits(() => setBudget(getSwipeBudget()))
    const u5 = subscribeKids(() => setKids(isKidsMode()))
    return () => {
      u1()
      u2()
      u3()
      u4()
      u5()
    }
  }, [])

  const both = prefs.side === 'both' && !forceCrew && !forceTreffer
  const useSeekerDeck = forceCrew
    ? false
    : forceTreffer
      ? true
      : prefs.side === 'seeker' || (prefs.side === 'both' && deckMode === 'seeker')

  const adult = hasConfirmedAdult()
  const intent = intentForMatch(prefs)
  const deck = useMemo((): DeckCard[] => {
    if (!hasOccupationIntent(intent)) return []
    if (personalized) {
      const skip = new Set<string>([
        ...swipedIds(['job', 'company', 'candidate']),
      ])
      const items = rankPersonalizedMatch({
        listings: store.listListings({}).filter((l) => {
          if (l.status !== 'active') return false
          if (!kids) return true
          if (!kidsMaySeeJobs()) return l.vertical !== 'job'
          return listingIsSafeForKids(l)
        }),
        profiles: kids ? [] : store.listProfiles(),
        prefs,
        userId: user?.id,
        locale: resolved,
        skipIds: skip,
        adult,
      })
      return items
        .filter((item) => !(kids && (item.kind === 'travel' || item.kind === 'person')))
        .map(fromPersonalized)
    }
    if (kids && !useSeekerDeck) return []
    if (useSeekerDeck) {
      const done = swipedIds(['job', 'company'])
      const pool = store
        .listListings({})
        .filter((l) => isSeekerFeedListing(l) && l.kind === 'offer' && l.status === 'active' && !done.has(l.id))
        .filter((l) => {
          if (!kids) return true
          if (!kidsMaySeeJobs()) return false
          return listingIsSafeForKids(l)
        })
      const matched = pool.filter((l) => listingVisibleForChoice(l, intent, adult))
      const ranked = rankForWorld(matched, prefs)
      return ranked.map((l) => {
        const lane = deriveMarketType(l)
        if (lane === 'service') {
          return { kind: 'company' as const, listing: l, score: scoreB2bMatch(l, prefs, company) }
        }
        return { kind: 'job' as const, listing: l, score: scoreJobMatch(l, prefs) }
      })
    }
    const donePeople = swipedIds('candidate')
    const doneListings = swipedIds(['company', 'job'])
    const candidates = filterCandidatesByEmployerPrefs(
      store.listProfiles().filter((p) => p.role === 'freelancer' || p.role === 'courier'),
      prefs,
    )
      .filter((p) => profileMatchesOccupationIntent(p, prefs.employer))
      .filter((p) => !donePeople.has(p.id) && p.id !== user?.id)
    const listings = rankForCompanyWorld(
      store
        .listListings({})
        .filter((l) => l.ownerId !== user?.id && l.status === 'active' && !doneListings.has(l.id))
        .filter((l) => listingVisibleForChoice(l, intent, adult)),
      prefs,
    )
    const peopleCards: DeckCard[] = candidates.map((p) => ({
      kind: 'candidate',
      profile: p,
      score: scoreCandidateMatch(p, prefs, company),
    }))
    const listingCards: DeckCard[] = listings.map((l) => ({
      kind: 'company',
      listing: l,
      score: scoreB2bMatch(l, prefs, company),
    }))
    return [...listingCards, ...peopleCards].sort((a, b) => b.score.percent - a.score.percent)
  }, [prefs, company, useSeekerDeck, toast, user?.id, kids, personalized, resolved, adult, intent])

  const alcoholClosed = alcoholChoiceBlocked(intent, adult)

  const current = deck[0]

  const ensureActor = () => {
    let actor = user
    if (!actor) {
      loginDemo()
      actor = { id: 'user-demo-1', name: 'Alex Müller', email: '', role: 'agency' }
    }
    return actor
  }

  const swipe = (action: 'interested' | 'skip') => {
    if (!current) return
    if (!consumeSwipe()) {
      setCapOpen(true)
      setBudget(getSwipeBudget())
      return
    }
    setBudget(getSwipeBudget())
    if (current.kind === 'travel') {
      trackBehavior({
        kind: action === 'skip' ? 'swipe_skip' : 'swipe_interest',
        query: current.offer.title,
        city: current.offer.to,
      })
      recordSwipe({
        targetId: current.offer.id,
        targetKind: 'company',
        action,
        title: current.offer.title,
      })
      if (action === 'interested') navigate(`/abflug/${current.offer.id}`)
      setSwipeTick((n) => n + 1)
      return
    }
    if (current.kind === 'candidate') {
      const { mutual } = recordSwipe({
        targetId: current.profile.id,
        targetKind: 'candidate',
        action,
        title: current.profile.name,
        candidateId: current.profile.id,
      })
      if (action === 'interested') {
        const actor = ensureActor()
        if (actor.id !== current.profile.id) {
          store.createDirectThread({
            participantIds: [actor.id, current.profile.id],
            participantNames: [actor.name, current.profile.name],
            listingTitle: current.profile.name,
            senderId: actor.id,
            senderName: actor.name,
            body: `Orbit Match — ${company.firmName || actor.name} · ${t('match.candidateNote')}`,
            kind: 'match',
          })
        }
        if (mutual) {
          setToast(mutual)
          window.setTimeout(() => setToast(null), 4200)
        }
      }
    } else {
      const listing = current.listing
      trackBehavior({
        kind: action === 'skip' ? 'swipe_skip' : 'swipe_interest',
        listingId: listing.id,
        industry: listing.industry,
        jobType: listing.jobType,
        city: listing.city,
      })
      const { mutual } = recordSwipe({
        targetId: listing.id,
        targetKind: current.kind === 'job' ? 'job' : 'company',
        action,
        title: listing.title,
        listingId: listing.id,
      })
      if (action === 'interested') {
        const actor = ensureActor()
        if (actor.id !== listing.ownerId) {
          try {
            applyInterest({
              listing,
              requesterId: actor.id,
              requesterName: actor.name,
              city: profile?.city,
            })
          } catch {
            /* demo best-effort */
          }
        }
        if (mutual) {
          setToast(mutual)
          window.setTimeout(() => setToast(null), 4200)
        }
      }
    }
    setSwipeTick((n) => n + 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowLeft') swipe('skip')
      if (e.key === 'ArrowRight' || e.key === 'Enter') swipe('interested')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  if (alcoholClosed) {
    return (
      <QuietMatch
        marker="alcohol"
        sentence={t('match.alcoholClosed')}
        action={t('match.alcoholAction')}
        onAction={() => navigate('/auth')}
      />
    )
  }

  if (!hasOccupationIntent(intent) || !current) {
    return (
      <QuietMatch
        marker={hasOccupationIntent(intent) ? 'none' : 'choice'}
        sentence={hasOccupationIntent(intent) ? t('match.quietNone') : t('match.quietEmpty')}
        action={t('match.quietAction')}
        onAction={() => navigate('/')}
      />
    )
  }

  const mutuals = getSwipes().mutuals
  const heading = personalized ? t('match.title') : useSeekerDeck ? t('match.jobs') : t('match.companyDeck')

  return (
    <div className="relative mx-auto flex min-h-[70dvh] max-w-lg flex-col gap-4 pb-scroll-chrome">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--theme-accent)]">
            {personalized ? t('match.forYou') : t('match.kicker')}
          </p>
          <h1 className="text-xl font-bold tracking-tight">{heading}</h1>
          <p className="text-xs text-muted">
            {deck.length} {t('match.cards')}
            {isFlagOn('credits') && (
              <>
                {' '}
                · {t('match.swipesLeft')} {budget.remaining}/{budget.freeCap}
                {budget.extra ? ` +${budget.extra}` : ''}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFlagOn('credits') && <LaneBadge lane="free" />}
          <Button size="sm" variant="secondary" onClick={() => navigate('/prefs')}>
            <SlidersHorizontal size={16} /> {t('match.tweakPrefs')}
          </Button>
        </div>
      </header>

      {both && !personalized && (
        <div className="flex gap-1 rounded-full border border-border p-1" role="tablist">
          {(['seeker', 'company'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setDeckMode(m)
                setMatchDeckMode(m)
              }}
              className={cn(
                'min-h-10 flex-1 rounded-full text-xs font-medium',
                deckMode === m ? 'bg-[var(--theme-accent)] text-[var(--theme-on-accent)]' : 'text-neutral-300',
              )}
            >
              {m === 'seeker' ? t('match.jobs') : t('match.companyDeck')}
            </button>
          ))}
        </div>
      )}

      {current.kind === 'candidate' ? (
        <CandidateCard
          profile={current.profile}
          score={current.score}
          explain={explain}
          onToggleExplain={() => setExplain((v) => !v)}
        />
      ) : current.kind === 'travel' ? (
        <TravelCard
          offer={current.offer}
          score={current.score}
          explain={explain}
          onToggleExplain={() => setExplain((v) => !v)}
        />
      ) : (
        <JobCard
          listing={current.listing}
          score={current.score}
          explain={explain}
          onToggleExplain={() => setExplain((v) => !v)}
          lane={deriveMarketType(current.listing)}
        />
      )}

      {current && (
        <div className="sticky bottom-20 z-10 flex items-center justify-center gap-4 md:bottom-4">
          <button
            type="button"
            aria-label={t('match.skip')}
            onClick={() => swipe('skip')}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-2 text-neutral-300 shadow-lg hover:border-rose-400/50 hover:text-rose-300"
          >
            <SkipForward size={24} />
          </button>
          <button
            type="button"
            aria-label={t('match.interest')}
            onClick={() => swipe('interested')}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--theme-accent)] text-[var(--theme-on-accent)] shadow-[0_0_28px_color-mix(in_oklab,var(--theme-accent)_40%,transparent)]"
          >
            <Heart size={28} fill="currentColor" />
          </button>
        </div>
      )}

      <div className="flex justify-center gap-6 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <SkipForward size={12} /> {t('match.skip')}
        </span>
        <span className="inline-flex items-center gap-1 text-[var(--theme-accent)]">
          <Heart size={12} /> {t('match.interest')}
        </span>
      </div>

      {mutuals.length > 0 && (
        <section className="rounded-2xl border border-teal/30 bg-teal/5 p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal">
            <MessageSquare size={16} /> {t('match.mutual')} ({mutuals.length})
          </h2>
          <ul className="space-y-2">
            {mutuals.slice(0, 5).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-neutral-200">{m.title}</span>
                <Link
                  to={m.listingId ? `/listings/${m.listingId}` : chatHref()}
                  className="shrink-0 text-cyan hover:underline"
                >
                  {t('apply.chat')}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {toast && (
        <div className="fixed inset-x-4 bottom-28 z-40 mx-auto max-w-sm rounded-2xl border border-cyan/40 bg-surface-2 p-4 shadow-xl md:bottom-8">
          <p className="text-sm font-semibold text-[var(--theme-accent)]">✨ {t('match.mutual')}</p>
          <p className="mt-1 text-sm text-neutral-200">{toast.title}</p>
          <p className="mt-1 text-xs text-muted">{t('apply.sentHint')}</p>
          <Button
            size="sm"
            className="mt-3 w-full"
            onClick={() => navigate(toast.listingId ? `/listings/${toast.listingId}` : chatHref())}
          >
            {t('apply.chat')}
          </Button>
        </div>
      )}

      {capOpen && (
        <SoftPaywall
          title={t('match.swipesCap')}
          hint={t('match.swipesCapHint')}
          cost={boostCost('extra_swipes')}
          onBuy={() => {
            void buyBoost('extra_swipes').then((ok) => {
              setBudget(getSwipeBudget())
              if (ok) setCapOpen(false)
            })
          }}
          onClose={() => setCapOpen(false)}
        />
      )}
    </div>
  )
}

function ScoreRing({ score }: { score: MatchScore }) {
  return (
    <div
      className={cn(
        'flex h-16 w-16 flex-col items-center justify-center rounded-full border-2',
        score.percent >= 75
          ? 'border-cyan bg-cyan/15 text-cyan'
          : score.percent >= 50
            ? 'border-teal bg-teal/15 text-teal'
            : 'border-amber-400/50 bg-amber-400/10 text-amber-200',
      )}
    >
      <span className="text-lg font-bold tabular-nums leading-none">{score.percent}</span>
      <span className="text-xs uppercase tracking-wider opacity-80">%</span>
    </div>
  )
}

function Breakdown({ score, open, hidden = [] }: { score: MatchScore; open: boolean; hidden?: string[] }) {
  if (!open) return null
  const skip = new Set(hidden.map((item) => item.trim().toLowerCase()).filter(Boolean))
  const reasons = score.reasons.filter((reason) => {
    if (/^(Stadt|Ort):/i.test(reason)) return false
    return !skip.has(reason.trim().toLowerCase())
  })
  const rows = score.labels
  return (
    <div className="mt-3 space-y-1 rounded-xl border border-border/80 bg-black/30 p-3 text-xs">
      {rows.map(([label, key]) => (
        <div key={label} className="flex items-center justify-between gap-2">
          <span className="text-muted">{label}</span>
          <span className="tabular-nums text-neutral-200">{score.breakdown[key]}</span>
        </div>
      ))}
      <ul className="mt-2 list-disc space-y-0.5 pl-4 text-neutral-300">
        {reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  )
}

function QuietMatch({
  sentence,
  action,
  onAction,
  marker,
}: {
  sentence: string
  action: string
  onAction: () => void
  marker: string
}) {
  return (
    <div
      className="mx-auto flex min-h-[50dvh] max-w-md flex-col items-center justify-center gap-4 px-4 pb-scroll-chrome text-center"
      data-match-empty={marker}
    >
      <p className="max-w-sm text-sm leading-relaxed text-muted">{sentence}</p>
      <Button type="button" onClick={onAction}>
        {action}
      </Button>
    </div>
  )
}

function JobCard({
  listing,
  score,
  explain,
  onToggleExplain,
  lane,
}: {
  listing: Listing
  score: MatchScore
  explain: boolean
  onToggleExplain: () => void
  lane?: string
}) {
  const { t } = useI18n()
  const L = listing
  return (
    <article className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-[var(--theme-accent)]/25 bg-gradient-to-b from-surface-2 to-surface p-5 shadow-[0_8px_32px_color-mix(in_oklab,var(--color-ink)_8%,transparent)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {lane && <Badge tone="violet">{t(`market.${lane}` as 'market.job')}</Badge>}
            {L.kind === 'request' && <Badge tone="amber">{t('create.need')}</Badge>}
            {L.industry && <Badge tone="cyan">{L.industry}</Badge>}
            {L.jobType && <Badge tone="teal">{L.jobType}</Badge>}
            {L.workMode && <Badge>{L.workMode}</Badge>}
            {L.source && <Badge tone="violet">{L.source}</Badge>}
          </div>
          <h2 className="text-xl font-bold leading-snug text-ink">{listing.title}</h2>
          {publicMatchLine(listing.ownerName) && (
            <p className="mt-1 text-sm text-muted">{publicMatchLine(listing.ownerName)}</p>
          )}
        </div>
        <ScoreRing score={score} />
      </div>
      <p className="mt-4 line-clamp-5 flex-1 text-sm leading-relaxed text-neutral-300">
        {listing.description}
      </p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          {listing.priceFrom != null && (
            <p className="text-lg font-semibold text-cyan">
              {formatPrice(listing.priceFrom)}
              {listing.priceUnit ? ` / ${listing.priceUnit}` : ''}
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-1">
            {(listing.crafts || []).slice(0, 3).map((c) => (
              <span key={c} className="rounded-md bg-ink/5 px-2 py-0.5 text-xs text-neutral-400">
                {c}
              </span>
            ))}
          </div>
        </div>
        <button type="button" onClick={onToggleExplain} className="text-xs text-[var(--theme-accent)] hover:underline">
          {explain ? t('match.hideScore') : t('match.explain')}
        </button>
      </div>
      <div className="mt-3">
        <SpeakButton
          compact
          text={listingSpeech({
            title: listing.title,
            ownerName: listing.ownerName,
            description: listing.description,
            rate:
              listing.priceFrom != null
                ? `${formatPrice(listing.priceFrom)}${listing.priceUnit ? ' / ' + listing.priceUnit : ''}`
                : undefined,
            industry: L.industry,
          })}
        />
      </div>
      <Breakdown score={score} open={explain} hidden={[listing.city, listing.venue ?? '']} />
      <div className="pointer-events-none absolute -right-8 -top-8 text-7xl opacity-20">
        {listing.imageEmoji || '💼'}
      </div>
    </article>
  )
}

function CandidateCard({
  profile,
  score,
  explain,
  onToggleExplain,
}: {
  profile: Profile
  score: MatchScore
  explain: boolean
  onToggleExplain: () => void
}) {
  const { t } = useI18n()
  return (
    <article className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-teal/30 bg-gradient-to-b from-surface-2 to-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone="teal">{profile.role}</Badge>
          <h2 className="mt-2 text-xl font-bold text-ink">{profile.name}</h2>
          <p className="text-sm text-muted">
            ★ {profile.rating.toFixed(1)} ({profile.reviewCount})
          </p>
        </div>
        <ScoreRing score={score} />
      </div>
      <p className="mt-4 line-clamp-5 flex-1 text-sm text-neutral-300">{profile.bio}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {profile.crafts.map((c) => (
          <span key={c} className="rounded-md bg-ink/5 px-2 py-0.5 text-xs text-neutral-400">
            {c}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onToggleExplain}
        className="mt-3 self-end text-xs text-cyan hover:underline"
      >
        {explain ? t('match.hideScore') : t('match.explain')}
      </button>
      <Breakdown score={score} open={explain} hidden={[profile.city]} />
    </article>
  )
}

function TravelCard({
  offer,
  score,
  explain,
  onToggleExplain,
}: {
  offer: TravelOffer
  score: MatchScore
  explain: boolean
  onToggleExplain: () => void
}) {
  const { t } = useI18n()
  return (
    <article className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-cyan/30 bg-gradient-to-b from-surface-2 to-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge tone="cyan">{t('travel.nav')}</Badge>
            <Badge>{offer.kind}</Badge>
          </div>
          <h2 className="text-xl font-bold leading-snug text-ink">{offer.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {offer.from ? `${offer.from} → ` : ''}
            {offer.to} · {offer.provider}
          </p>
        </div>
        <ScoreRing score={score} />
      </div>
      <p className="mt-4 text-lg font-semibold text-cyan">{formatPrice(offer.priceEur)}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {offer.tags.map((tag) => (
          <span key={tag} className="rounded-md bg-ink/5 px-2 py-0.5 text-xs text-neutral-400">
            {tag}
          </span>
        ))}
      </div>
      <button type="button" onClick={onToggleExplain} className="mt-3 self-end text-xs text-cyan hover:underline">
        {explain ? t('match.hideScore') : t('match.explain')}
      </button>
      <Breakdown score={score} open={explain} />
      <div className="pointer-events-none absolute -right-6 -top-6 text-7xl opacity-20">
        <Plane size={72} />
      </div>
    </article>
  )
}
