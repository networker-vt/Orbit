import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mic, Send } from 'lucide-react'
import { HOME_PRIMARY_COUNT, splitAdaptiveHome } from '../lib/hubTiles'
import { getWidgetTaps, subscribeWidgetTaps } from '../lib/widgetUsage'
import { TripOptionCards } from '../components/assist/TripOptionCards'
import { OrbitWordmarkHero } from '../components/brand/OrbitWordmarkHero'
import { Tageskarte } from '../components/home/Tageskarte'
import { TileGrid } from '../components/ui/TileGrid'
import { Button } from '../components/ui/Button'
import { useStoreVersion } from '../hooks/useStore'
import { useAuth } from '../lib/auth'
import {
  buildAssistPlan,
  getLastPlan,
  subscribeAssist,
  type AssistPlan,
} from '../lib/assist'
import { getCompany, subscribeCompany } from '../lib/company'
import { isCompanySide, getPrefs, savePrefs, subscribePrefs } from '../lib/prefs'
import { alcoholChoiceBlocked } from '../lib/lifeHome'
import { presetLabel, visibleHomePresets } from '../lib/homePresets'
import { sentenceOpensParkmerke } from '../lib/parkmerkeIntent'
import { hasConfirmedAdult } from '../lib/ageGate'
import { subscribeBehavior } from '../lib/behavior'
import { subscribeChannels } from '../lib/channels'
import { HomePins } from '../components/home/HomePins'
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
import { pickTageskarte } from '../lib/tageskarte'
import { cn } from '../lib/utils'
import {
  isKidsMode,
  kidsHideTravel,
  kidsHideWallet,
  subscribeKids,
} from '../lib/kids'

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
  const [resume, setResume] = useState(getResume)
  const [reminders, setReminders] = useState(dueReminders)
  const [assistNote, setAssistNote] = useState<string | null>(null)
  const [orbiBubble, setOrbiBubble] = useState(false)
  const [kids, setKids] = useState(isKidsMode)
  const [tripVoicePick, setTripVoicePick] = useState<1 | 2 | 3 | null>(null)
  const [widgetTaps, setWidgetTaps] = useState(getWidgetTaps)
  const companyView = isCompanySide(prefs.side) && prefs.side !== 'both'
  const daily = useMemo(() => pickTageskarte(new Date(), { kids }), [kids])
  const hideWallet = kidsHideWallet()
  const hideTravel = kidsHideTravel()
  const presets = useMemo(() => visibleHomePresets(hideTravel), [hideTravel])

  useEffect(() => {
    try {
      if (!orbiTipsAllowed((key) => localStorage.getItem(key))) return
      if (claimOrbiSessionBubble(sessionStorage)) setOrbiBubble(true)
    } catch {
      /* private mode */
    }
  }, [])

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

  const newsItems = useMemo(() => rankHomeNews(prefs, resolved, 8), [prefs, behaviorTick, resolved])
  const widgets = useMemo(
    () => splitAdaptiveHome({ kids, hideTravel, hideWallet }, widgetTaps, t),
    [kids, hideTravel, hideWallet, widgetTaps, t],
  )

  const greetingFirst =
    companyView && company.firmName ? company.firmName : user?.name?.trim().split(/\s+/)[0] || t('home.guestName')
  const greeting = `${t('home.hello')}, ${greetingFirst}.`
  const placeholder = t('home.phSeek')

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
    const q = text.trim()
    if (busy) return
    if (!q) {
      if (getPrefs().seeker.lifeExamples.length > 0) navigate('/match')
      return
    }
    if (sentenceOpensParkmerke(q)) {
      navigate('/parkmerke')
      return
    }
    const current = getPrefs()
    const seeker = { ...current.seeker, lifeSentence: q }
    savePrefs({ seeker })
    if (alcoholChoiceBlocked(seeker, hasConfirmedAdult())) {
      navigate('/match')
      return
    }
    const spokenPick = plan?.tripOptions?.length ? matchSpokenTripChoice(q) : null
    if (spokenPick) {
      if (hideTravel) {
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
        return
      }
      setAssistNote(null)
    } else if (gate === 'limit') {
      setAssistNote(t('home.assistLimit'))
      return
    } else if (gate === 'need_credits') {
      setAssistNote(t('home.assistNeedCredits'))
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
      if (next) setPlan(next)
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

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome pt-6 md:pt-10">
      <header className="relative space-y-4 overflow-hidden pb-1">
        <OrbitWordmarkHero />
        {orbiBubble && (
          <p
            className="relative z-[1] max-w-xs rounded-2xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink"
            role="status"
            data-orbi-bubble="1"
            data-orbi-primary="1"
            data-orbi-hero="above-greeting"
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
        <div className="relative z-[1]" data-orbi-primary="1" data-orbi-hero="greeting">
          {isDemo && (
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">{t('home.demoBadge')}</p>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-[2rem]">{greeting}</h1>
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

        <div
          role="group"
          aria-label={t('home.presetsAria')}
          data-home-presets="1"
          className="flex flex-wrap gap-2"
        >
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              data-home-preset={preset.id}
              onClick={() => navigate(preset.to)}
              className="min-h-10 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm text-ink hover:border-[var(--theme-accent)]/50 hover:text-ink"
            >
              {presetLabel(preset, resolved)}
            </button>
          ))}
        </div>

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
              data-home-search="1"
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
        <Tageskarte
          item={daily.item}
          slot={daily.slot}
          plan={plan}
          resume={resume}
          onUsePrompt={fillPrompt}
        />
        {plan?.tripOptions && plan.tripOptions.length > 0 && (
          <TripOptionCards
            options={plan.tripOptions}
            pendingVoice={tripVoicePick}
            onConsumedVoice={() => setTripVoicePick(null)}
          />
        )}
      </div>

      <NewsStrip items={newsItems} />

      {/* Shared slot: Mein Orbit writes via `orbit_home_pins_v1` / src/lib/homePins.ts */}
      <HomePins />

      <section className="space-y-3 pt-2" aria-labelledby="mehr-entdecken">
        <h2 id="mehr-entdecken" className="text-xs font-medium uppercase tracking-wider text-muted">
          {t('home.mehrEntdecken')}
        </h2>
        <div data-home-discover={Math.min(widgets.primary.length, HOME_PRIMARY_COUNT)}>
          <TileGrid
            tiles={widgets.primary.slice(0, HOME_PRIMARY_COUNT)}
            columns={2}
            iconSize="lg"
            label={t('home.mehrEntdecken')}
          />
        </div>
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
      </section>
    </div>
  )
}
