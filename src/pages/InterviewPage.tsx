import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarClock, MessageSquare, Video } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Empty } from '../components/ui/Empty'
import { LaneBadge } from '../components/credits/LaneBadge'
import { SpeakButton } from '../components/a11y/SpeakButton'
import { useI18n } from '../lib/i18n'
import { buyBoost, CREDITS_COSTS } from '../lib/credits'
import {
  confirmInterviewSlot,
  getInterviewRoom,
  listInterviewRooms,
  sendInterviewMessage,
  subscribeInterviews,
  type InterviewRoom,
} from '../lib/interviews'
import { formatDateTime } from '../lib/utils'
import { MessengerComposer } from '../components/messenger/MessengerComposer'
import { TranslatedMessageBubble } from '../components/messenger/TranslatedMessageBubble'
import { interviewThreadKey } from '../lib/messengerTranslatePrefs'
import { useMessengerTranslatePrefs } from '../hooks/useMessengerTranslate'

export function InterviewPage() {
  const { t } = useI18n()
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [, setTick] = useState(0)
  useEffect(() => subscribeInterviews(() => setTick((n) => n + 1)), [])

  const rooms = listInterviewRooms()
  const active = roomId ? getInterviewRoom(roomId) : rooms[0]

  if (!roomId && rooms[0]) {
    return (
      <div className="space-y-4 pb-scroll-chrome">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">{t('interview.title')}</h1>
          <p className="text-sm text-muted">{t('interview.lead')}</p>
          <SpeakButton text={`${t('interview.title')}. ${t('interview.lead')}`} />
        </header>
        <ul className="space-y-2">
          {rooms.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => navigate(`/interview/${r.id}`)}
                className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-border bg-surface-2 px-4 py-3 text-left"
              >
                <span>
                  <span className="block font-medium">{r.title}</span>
                  <span className="text-xs text-muted">{r.peerName}</span>
                </span>
                <MessageSquare size={16} className="text-[var(--theme-accent)]" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (!active) {
    return (
      <Empty
        emoji="🎥"
        title={t('interview.empty')}
        hint={t('interview.emptyHint')}
        actionLabel={t('home.ctaMatch')}
        onAction={() => navigate('/match')}
      />
    )
  }

  return <InterviewRoomView room={active} />
}

function InterviewRoomView({ room }: { room: InterviewRoom }) {
  const { t } = useI18n()
  const [tab, setTab] = useState<'chat' | 'schedule' | 'video'>('chat')
  const threadKey = interviewThreadKey(room.id)
  const { prefs: translatePrefs } = useMessengerTranslatePrefs(threadKey)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((tr) => tr.stop())
    }
  }, [stream])

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream
  }, [stream])

  const startPreview = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch {
      setStream(null)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-scroll-chrome">
      <header>
        <p className="text-xs uppercase tracking-wider text-[var(--theme-accent)]">{t('interview.title')}</p>
        <h1 className="text-xl font-bold">{room.title}</h1>
        <p className="text-sm text-muted">{room.peerName}</p>
      </header>

      <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface-2 p-1">
        {(
          [
            ['chat', t('interview.chat'), MessageSquare],
            ['schedule', t('interview.schedule'), CalendarClock],
            ['video', t('interview.video'), Video],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex min-h-11 items-center justify-center gap-1 rounded-lg text-xs font-medium ${
              tab === id ? 'bg-[var(--theme-accent)] text-black' : 'text-neutral-300'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'chat' && (
        <section className="flex min-h-[50vh] flex-col rounded-2xl border border-border bg-surface-2">
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {room.messages.map((m) => {
              const mine = m.role === 'user'
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <TranslatedMessageBubble
                    messageId={m.id}
                    body={m.body}
                    mine={mine}
                    enabled={translatePrefs.enabled}
                    myLang={translatePrefs.myLang}
                    partnerLang={translatePrefs.partnerLang}
                    autoDetect={translatePrefs.autoDetectIncoming}
                    ttsIncoming={translatePrefs.ttsIncoming}
                    bubbleClass={
                      mine ? 'bg-[var(--theme-accent)] text-black' : 'bg-surface-3 text-neutral-200'
                    }
                    timestamp={<div className="mt-1 text-xs opacity-70">{formatDateTime(m.at)}</div>}
                  />
                </div>
              )
            })}
          </div>
          <MessengerComposer
            threadKey={threadKey}
            placeholder={t('chat.compose')}
            sendLabel={t('chat.send')}
            onSend={(text) => sendInterviewMessage(room.id, text)}
          />
        </section>
      )}

      {tab === 'schedule' && (
        <section className="space-y-2 rounded-2xl border border-border bg-surface-2 p-4">
          <h2 className="font-semibold">{t('interview.schedule')}</h2>
          <p className="text-xs text-muted">
            {t('interview.priorityHint')} <LaneBadge lane="credits" />
          </p>
          {room.slots.map((s) => (
            <div key={s.id} className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => confirmInterviewSlot(room.id, s.id)}
                className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${
                  s.confirmed
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15'
                    : 'border-border bg-black/20'
                }`}
              >
                <span>
                  {s.label}
                  {s.priority ? ` · ${t('interview.priority')}` : ''}
                </span>
                <span className="text-xs text-muted">{s.confirmed ? '✓' : t('interview.confirm')}</span>
              </button>
              {!s.confirmed && (
                <button
                  type="button"
                  className="self-end text-xs text-violet-300 hover:underline"
                  onClick={() => {
                    void buyBoost('interview_slot').then((ok) => {
                      confirmInterviewSlot(room.id, s.id, { priority: Boolean(ok) })
                    })
                  }}
                >
                  {t('interview.priority')} · {CREDITS_COSTS.interview_slot.credits} Credits
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {tab === 'video' && (
        <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4">
          <h2 className="font-semibold">{t('interview.video')}</h2>
          <p className="text-sm text-muted">{t('interview.videoHint')}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="overflow-hidden rounded-xl border border-border bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full object-cover" />
              <p className="px-2 py-1 text-xs text-muted">Du (lokal)</p>
            </div>
            <div className="flex aspect-video flex-col items-center justify-center rounded-xl border border-dashed border-border bg-black/40 text-center text-xs text-muted">
              <Video size={28} className="mb-2 opacity-50" />
              {room.peerName}
              <span className="mt-1">Kein Remote-Stream</span>
            </div>
          </div>
          <Button variant="secondary" onClick={() => void startPreview()}>
            Kamera-Vorschau starten (Demo)
          </Button>
          <p className="text-xs text-muted">
            Kein Live-Call. Deep-link später z. B. <code>https://orbit.jobs/call/{room.id}</code> — Provider
            anbinden.
          </p>
          {room.listingId && (
            <Link to={`/listings/${room.listingId}`} className="text-sm text-[var(--theme-accent)] hover:underline">
              Zum Job →
            </Link>
          )}
        </section>
      )}
    </div>
  )
}
