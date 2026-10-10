import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, Mic, Share2, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { buildIcs, parseEventText } from '../lib/calendarNlp'
import {
  addEvent,
  createShareRoom,
  getRoom,
  joinShareRoom,
  leaveShareRoom,
  listEvents,
  removeEvent,
  shareInviteUrl,
  subscribeCalendar,
  type OrbitCalendarEvent,
} from '../lib/orbitCalendar'
import { canListen, listenOnce } from '../lib/speech'
import { useI18n } from '../lib/i18n'

export function KalenderPage() {
  const { t, resolved } = useI18n()
  const [params] = useSearchParams()
  const [draft, setDraft] = useState('')
  const [events, setEvents] = useState<OrbitCalendarEvent[]>(listEvents)
  const [room, setRoom] = useState(getRoom)
  const [joinCode, setJoinCode] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [listening, setListening] = useState(false)

  useEffect(() => subscribeCalendar(() => setEvents(listEvents())), [])
  useEffect(() => {
    const code = params.get('join')
    if (code) {
      const joined = joinShareRoom(code)
      if (joined) setRoom(joined)
    }
  }, [params])

  const sorted = useMemo(
    () => [...events].sort((a, b) => a.start.localeCompare(b.start)),
    [events],
  )

  const commitDraft = (text: string) => {
    const parsed = parseEventText(text)
    if (!parsed) {
      setParseError(t('daily.calendarParseFail'))
      return
    }
    setParseError(null)
    addEvent({
      title: parsed.title,
      start: parsed.start.toISOString(),
      end: parsed.end.toISOString(),
      allDay: parsed.allDay,
      source: room ? 'shared' : 'local',
    })
    setDraft('')
  }

  const onMic = async () => {
    if (!canListen() || listening) return
    setListening(true)
    const said = await listenOnce(resolved === 'de' ? 'de-DE' : 'en-GB')
    setListening(false)
    if (said) {
      setDraft(said)
      commitDraft(said)
    }
  }

  const exportIcs = () => {
    const body = buildIcs(sorted)
    const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orbit-kalender.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  const mailtoInvite = () => {
    if (!room) return
    const url = shareInviteUrl(room.code)
    const subject = encodeURIComponent(t('daily.calendarShareSubject'))
    const body = encodeURIComponent(`${t('daily.calendarShareBody')}\n${url}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome pt-4" data-kalender-page="1">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-amber-200">{t('daily.stubBadge')}</p>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink">
          <CalendarDays size={22} aria-hidden />
          {t('daily.calendarTitle')}
        </h1>
        <p className="text-sm text-muted">{t('daily.calendarLead')}</p>
      </header>

      <p className="rounded-2xl border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
        {t('daily.calendarSyncHonest')}
      </p>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault()
          commitDraft(draft)
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('daily.calendarPlaceholder')}
          data-kalender-input="1"
        />
        {parseError && <p className="text-xs text-amber-200">{parseError}</p>}
        <div className="flex gap-2">
          {canListen() && (
            <Button type="button" variant="secondary" onClick={() => void onMic()} disabled={listening}>
              <Mic size={16} /> {t('assist.voice')}
            </Button>
          )}
          <Button type="submit" className="flex-1">
            {t('daily.calendarAdd')}
          </Button>
        </div>
      </form>

      <section className="space-y-2 rounded-2xl border border-border bg-surface-2 p-3" data-kalender-share="1">
        <h2 className="text-sm font-semibold text-ink">{t('daily.calendarShareTitle')}</h2>
        {room ? (
          <>
            <p className="text-sm text-ink">
              {t('daily.calendarRoom')}: <span className="font-mono">{room.code}</span>
            </p>
            <p className="text-xs text-muted">{t('daily.calendarShareHint')}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={mailtoInvite}>
                <Share2 size={14} /> {t('daily.calendarEmail')}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { leaveShareRoom(); setRoom(null) }}>
                {t('daily.calendarLeave')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => setRoom(createShareRoom())}>
              {t('daily.calendarCreateRoom')}
            </Button>
            <div className="flex gap-2">
              <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder={t('daily.calendarJoinPh')} />
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const joined = joinShareRoom(joinCode)
                  if (joined) setRoom(joined)
                }}
              >
                {t('daily.calendarJoin')}
              </Button>
            </div>
          </>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={exportIcs}>
          {t('daily.calendarExportIcs')}
        </Button>
      </div>

      <ul className="space-y-2" data-kalender-list="1">
        {sorted.length === 0 && <li className="text-sm text-muted">{t('daily.calendarEmpty')}</li>}
        {sorted.map((ev) => (
          <li key={ev.id} className="flex items-start justify-between gap-2 rounded-2xl border border-border bg-surface-2 px-3 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{ev.title}</p>
              <p className="text-xs text-muted">
                {new Date(ev.start).toLocaleString(resolved === 'de' ? 'de-DE' : 'en-GB')}
                {ev.source === 'shared' ? ` · ${t('daily.calendarShared')}` : ''}
              </p>
            </div>
            <button type="button" aria-label={t('daily.calendarDelete')} onClick={() => removeEvent(ev.id)}>
              <Trash2 size={16} className="text-muted hover:text-ink" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
