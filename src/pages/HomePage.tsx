import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mic, Send } from 'lucide-react'
import { HOME_PRIMARY_COUNT, splitAdaptiveHome } from '../lib/hubTiles'
import { getWidgetTaps, subscribeWidgetTaps } from '../lib/widgetUsage'
import { TripOptionCards } from '../components/assist/TripOptionCards'
import { FuerDichCard } from '../components/home/FuerDichCard'
import { OrbitRobot } from '../components/home/OrbitRobot'
import { Tageskarte } from '../components/home/Tageskarte'
import { Button } from '../components/ui/Button'
import { Empty } from '../components/ui/Empty'
import { useListings, useStoreVersion } from '../hooks/useStore'
import { useAuth } from '../lib/auth'
import {
  buildAssistPlan,
  getLastPlan,
  subscribeAssist,
  type AssistPlan,
} from '../lib/assist'
import { getCompany, subscribeCompany } from '../lib/company'
import { isCompanySide, getPrefs, savePrefs, subscribePrefs, type PrefsSide } from '../lib/prefs'
import { subscribeBehavior } from '../lib/behavior'
import { subscribeChannels } from '../lib/channels'
import { rankFuerDich } from '../lib/fuerDich'
import { NewsStrip } from '../components/home/NewsStrip'
import { consumeAssistTurn } from '../lib/credits'
import { isDemo, isFlagOn } from '../lib/flags'
import { getResume, subscribeResume } from '../lib/resume'
import { dueReminders, subscribeReminders, tapReminder } from '../lib/reminders'
import { rankHomeNews } from '../lib/homeSuggestions'
import { useI18n } from '../lib/i18n'
import { claimOrbiSessionBubble, orbiTipsAllowed } from '../lib/orbiMotion'
import { canListen, listenOnce } from '../lib/speech'
import { matchSpokenTripChoice } from '../lib/trip'
import { pickTageskarte, tageskarteCopy } from '../lib/tageskarte'
import { cn } from '../lib/utils'
import {
  isKidsMode,
  kidsHideTravel,
  kidsHideWallet,
  kidsMaySeeJobs,
  subscribeKids,
} from '../lib/kids'

type WarmChip = 'seek' | 'offer' | 'resume'

export function HomePage() {
  useStoreVersion()
  const { t, resolved } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const askRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [prefs, setPrefs] = useState(getPrefs)
  const [company, setCompany] = useState(getCompany)
  const [behaviorTick, setBehaviorTick] = useState(0)
  const [plan, setPlan] = useState<AssistPlan | null>(getLastPlan)
  const [ask, setAsk] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [warm, setWarm] = useState<WarmChip>('seek')
  const [pendingSide, setPendingSide] = useState<PrefsSide | null>(null)
  const [resume, setResume] = useState(getResume)
  const [reminders, setReminders] = useState(dueReminders)
  const [assistNote, setAssistNote] = useState<string | null>(null)
  const [robotTapped, setRobotTapped] = useState(false)
  const [orbiBubble, setOrbiBubble] = useState(false)
  const [orbiReaction, setOrbiReaction] = useState<'success' | 'error' | null>(null)
  const [kids, setKids] = useState(isKidsMode)
  const [tripVoicePick, setTripVoicePick] = useState<1 | 2 | 3 | null>(null)
  const [widgetTaps, setWidgetTaps] = useState(getWidgetTaps)
  const companyView = isCompanySide(prefs.side) && prefs.side !== 'both'
  const { listings: raw } = useListings({})
  const daily = useMemo(() => pickTageskarte(new Date(), { kids }), [kids])
  const dailyCopy = tageskarteCopy(daily.item, resolved)
  const hideWallet = kidsHideWallet()

  useEffect(() => {
    try {
      if (!orbiTipsAllowed((key) => localStorage.getItem(key))) return
      if (claimOrbiSessionBubble(sessionStorage)) setOrbiBubble(true)
    } catch {
      /* private mode */
    }
  }, [])

  useEffect(() => {
    if (!orbiReaction) return
    const timer = window.setTimeout(() => setOrbiReaction(null), 1200)
    return () => window.clearTimeout(timer)
  }, [orbiReaction])

  useEffect(() => {
    const u1 = subscribePrefs(() => setPrefs(getPrefs()))
    const u2 = subscribeBehavior(() => setBehaviorTick((n) => n + 1))
    const u4 = subscribeCompany(() => setCompany(getCompany()))
    const u5 = subscribeAssist(() => setPlan(getLastPlan()))
    const u6 = subscribeChannels(() => setBehaviorTick((n) => n + 1))
    const u7 = subscribeResume(() => setResume(getResume()))
    const u8 = subscribeReminders(() => setReminders(dueReminders()))
    const u9 = subscribeKids(() => setKids(isKidsMode()))
    const u10 = subscribeWidgetTaps(() => setWidgetTaps(getWidgetTaps()))
    return () => {
      u1()
      u2()
      u4()
      u5()
      u6()
      u7()
      u8()
      u9()
      u10()
      abortRef.current?.abort()
    }
  }, [])

  const fuerDich = useMemo(() => {
    const ranked = rankFuerDich(raw, prefs, resolved, 8).filter((item) => item.lane !== 'news')
    if (!kids) return ranked
    if (!kidsMaySeeJobs()) return []
    return ranked.filter((item) => item.action !== 'look' && item.action !== 'book')
  }, [raw, prefs, behaviorTick, resolved, kids])
  const newsItems = useMemo(() => rankHomeNews(prefs, resolved, 3), [prefs, behaviorTick, resolved])
  const widgets = useMemo(
    () => splitAdaptiveHome({ kids, hideTravel: kidsHideTravel(), hideWallet }, widgetTaps, t),
    [kids, hideWallet, widgetTaps, t],
  )

  const first = companyView && company.firmName ? company.firmName : user?.name.split(' ')[0]
  const greeting = first ? `${t('home.hello')}, ${first}.` : `${t('home.hello')}.`
  const stems: Record<WarmChip, string> = {
    seek: t('home.stemSeek'),
    offer: t('home.stemOffer'),
    resume: resume ? `${t('home.stemResume')}${resume.title}` : t('home.stemThink'),
  }
  const placeholder =
    warm === 'offer' ? t('home.phOffer') : warm === 'resume' ? t('home.phResume') : companyView ? t('assist.phCompany') : t('home.phSeek')

  const pickWarm = (id: WarmChip) => {
    setWarm(id)
    setPendingSide(id === 'seek' ? 'seeker' : id === 'offer' ? 'employer' : null)
    setAsk((prev) => {
      const trimmed = prev.trim()
      const wasStem = (Object.values(stems) as string[]).some(
        (s) => !trimmed || trimmed === s.trim() || prev === s,
      )
      return wasStem ? stems[id] : prev
    })
    window.requestAnimationFrame(() => {
      const el = askRef.current
      if (!el) return
      el.focus()
      const len = el.value.length
      el.setSelectionRange(len, len)
    })
  }

  const fillPrompt = (prompt: string) => {
    setAsk(prompt)
    window.requestAnimationFrame(() => {
      const el = askRef.current
      if (!el) return
      el.focus()
      const len = prompt.length
      el.setSelectionRange(len, len)
    })
  }

  const submitAsk = async (text: string) => {
    const q = text.trim() || dailyCopy.prompt
    if (!q || busy) return
    const spokenPick = plan?.tripOptions?.length ? matchSpokenTripChoice(q) : null
    if (spokenPick) {
      if (kidsHideTravel()) {
        setAssistNote(t('trip.kids'))
        return
      }
      setTripVoicePick(spokenPick)
      return
    }
    const gate = await consumeAssistTurn()
    if (!isFlagOn('credits')) {
      if (gate !== 'ok') {
        setAssistNote(t('home.assistLimit'))
        setOrbiReaction('error')
        return
      }
      setAssistNote(null)
    } else if (gate === 'limit') {
      setAssistNote(t('home.assistLimit'))
      setOrbiReaction('error')
      return
    } else if (gate === 'need_credits') {
      setAssistNote(t('home.assistNeedCredits'))
      setOrbiReaction('error')
      return
    } else if (gate === 'paid') {
      setAssistNote(t('home.assistPaid'))
    } else {
      setAssistNote(null)
    }
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setBusy(true)
    try {
      const next = await buildAssistPlan(q, resolved, ac.signal)
      if (next) {
        setPlan(next)
        setOrbiReaction('success')
        if (pendingSide) savePrefs({ side: pendingSide })
      } else {
        setOrbiReaction('error')
      }
    } finally {
      setBusy(false)
    }
  }

  const onMic = async () => {
    if (!canListen() || listening) return
    setListening(true)
    const said = await listenOnce(resolved === 'de' ? 'de-DE' : 'en-GB')
    setListening(false)
    if (said) {
      setAsk(said)
      await submitAsk(said)
    }
  }

  const onRobotTap = () => {
    setRobotTapped(true)
    window.setTimeout(() => setRobotTapped(false), 700)
  }

  const chips: { id: WarmChip; title: string }[] = [
    { id: 'seek', title: t('home.tileSeek') },
    { id: 'offer', title: t('home.tileOffer') },
    { id: 'resume', title: t('home.tileResume') },
  ]

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome pt-6 md:pt-10">
      <header className="space-y-4">
        <div className="flex flex-col items-center px-2 text-center" data-orbi-primary="1" data-orbi-hero="above-greeting">
          <OrbitRobot
            tapped={robotTapped}
            onTap={onRobotTap}
            label={t('home.robotAria')}
            stage="kind"
            busy={busy}
            reaction={orbiReaction}
          />
          {orbiBubble && (
            <p
              className="mt-2 max-w-xs rounded-2xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink"
              role="status"
              data-orbi-bubble="1"
            >
              {t('home.orbiOnce')}
              <button
                type="button"
                className="ml-2 text-xs text-muted hover:text-ink"
                onClick={() => setOrbiBubble(false)}
              >
                {t('home.robotDismiss')}
              </button>
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Orbit{isDemo ? ` · ${t('home.demoBadge')}` : ''}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink md:text-[2rem]">{greeting}</h1>
          <p className="mt-1 max-w-sm text-sm text-muted">{t('home.need')}</p>
        </div>

        {reminders[0] && (
          <p className="text-sm">
            <button
              type="button"
              className="text-[var(--theme-accent)] hover:underline"
              onClick={() => {
                const item = tapReminder(reminders[0].id)
                if (item) navigate(item.actionTo)
              }}
            >
              {reminders[0].actionLabel}: {reminders[0].title} →
            </button>
          </p>
        )}

        <nav aria-label={t('home.chipsAria')} className="flex flex-wrap gap-2">
          {chips
            .filter((chip) => !(kids && chip.id === 'offer'))
            .map((chip) => (
            <Button
              key={chip.id}
              type="button"
              size="sm"
              variant={warm === chip.id ? 'tonal' : 'secondary'}
              onClick={() => pickWarm(chip.id)}
            >
              {chip.title}
            </Button>
          ))}
        </nav>

        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            void submitAsk(ask)
          }}
        >
          <label className="block">
            <span className="sr-only">{placeholder}</span>
            <textarea
              ref={askRef}
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
              rows={2}
              placeholder={placeholder}
              className="w-full resize-none rounded-2xl border border-border bg-surface-2 px-3 py-3 text-base text-ink placeholder:text-muted outline-none focus:border-[var(--theme-accent)]/50"
            />
          </label>
          {assistNote && <p className="text-xs text-amber-200">{assistNote}</p>}
          <div className="flex items-center gap-2">
            {canListen() && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => void onMic()}
                aria-label={t('assist.voice')}
                className={cn('h-11 w-11 shrink-0 px-0', listening && 'bg-[var(--theme-accent)]/15')}
              >
                <Mic size={18} />
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={busy} data-home-primary="1">
              {busy ? t('assist.thinking') : t('assist.submit')} <Send size={16} />
            </Button>
          </div>
        </form>
      </header>

      <div className={plan ? 'assist-result space-y-6' : undefined} data-assist-result={plan ? '1' : undefined}>
        <Tageskarte item={daily.item} slot={daily.slot} plan={plan} onUsePrompt={fillPrompt} />
        {plan?.tripOptions && plan.tripOptions.length > 0 && (
          <TripOptionCards
            options={plan.tripOptions}
            pendingVoice={tripVoicePick}
            onConsumedVoice={() => setTripVoicePick(null)}
          />
        )}
      </div>

      <NewsStrip items={newsItems} />

      <section className="space-y-3 pt-2" aria-labelledby="mehr-entdecken">
        <h2 id="mehr-entdecken" className="text-xs font-medium uppercase tracking-wider text-muted">
          {t('home.mehrEntdecken')}
        </h2>
        <ul
          aria-label={t('home.mehrEntdecken')}
          data-home-discover={Math.min(widgets.primary.length, HOME_PRIMARY_COUNT)}
          className="space-y-0.5"
        >
          {widgets.primary.slice(0, HOME_PRIMARY_COUNT).map((tile) => (
            <li key={tile.id ?? tile.to}>
              <Link
                to={tile.to}
                data-tile-id={tile.id}
                className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-ink"
              >
                <span aria-hidden>{tile.emoji}</span>
                <span>{tile.label}</span>
                {tile.demo && (
                  <span className="text-xs font-medium uppercase tracking-wide">{t('home.demoBadge')}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        {widgets.folded.length > 0 && (
          <Link to="/mehr" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-ink">
            {t('home.widgetsMore')}
          </Link>
        )}
        {resume && (
          <Link
            to={resume.path}
            className="inline-flex min-h-11 items-center text-sm text-ink-soft hover:text-ink"
          >
            {t('home.tileResume')}: {resume.title}
          </Link>
        )}

        {fuerDich.length === 0 ? (
          <Empty emoji="✨" title={t('home.dealsEmpty')} hint={t('home.dealsEmptyHint')} className="py-6" />
        ) : (
          <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            <ul className="flex snap-x snap-mandatory gap-2">
              {fuerDich.map((item) => (
                <li key={item.id}>
                  <FuerDichCard item={item} />
                </li>
              ))}
            </ul>
          </div>
        )}

      </section>
    </div>
  )
}
