import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Textarea } from '../components/ui/Input'
import { Empty } from '../components/ui/Empty'
import { useStoreVersion } from '../hooks/useStore'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { store } from '../lib/store'
import { formatDateTime, cn } from '../lib/utils'
import type { ThreadKind } from '../types'
import { KidsBlocked } from '../components/kids/KidsBlocked'
import { kidsHidePublicChat } from '../lib/kids'
import { chatHref } from '../lib/chatPath'
import { ReportButton } from '../components/report/ReportButton'

const KINDS: { id: 'all' | ThreadKind; key: string }[] = [
  { id: 'all', key: 'chat.all' },
  { id: 'match', key: 'chat.match' },
  { id: 'booking', key: 'chat.booking' },
  { id: 'support', key: 'chat.support' },
  { id: 'social', key: 'chat.social' },
]

function threadKind(kind?: ThreadKind): ThreadKind {
  return kind ?? 'match'
}

export function MessagesPage() {
  const { threadId } = useParams()
  const { user, loginDemo } = useAuth()
  const { t } = useI18n()
  useStoreVersion()
  const navigate = useNavigate()
  const [body, setBody] = useState('')
  const [filter, setFilter] = useState<'all' | ThreadKind>('all')

  const threads = user ? store.listThreads(user.id) : []
  const visible = useMemo(
    () => (filter === 'all' ? threads : threads.filter((th) => threadKind(th.kind) === filter)),
    [threads, filter],
  )
  const active = threadId ? store.getThread(threadId) : undefined
  const messages = active ? store.listMessages(active.id) : []
  const showList = !threadId
  const showThread = Boolean(threadId)

  useEffect(() => {
    if (!user) return
    if (!threadId && visible[0] && window.matchMedia('(min-width: 768px)').matches) {
      navigate(chatHref(visible[0].id), { replace: true })
    }
  }, [user, threadId, visible, navigate])

  if (kidsHidePublicChat()) {
    return <KidsBlocked title={t('kids.chatBlocked')} />
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-surface-2 p-8 text-center">
        <p className="mb-4">Chat benötigt Login.</p>
        <Button onClick={() => loginDemo()}>Demo starten</Button>
      </div>
    )
  }

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    if (!active || !body.trim()) return
    store.sendMessage({
      threadId: active.id,
      senderId: user.id,
      senderName: user.name,
      body: body.trim(),
    })
    setBody('')
  }

  const kindLabel = (kind?: ThreadKind) => t(`chat.${threadKind(kind)}`)

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <aside
        className={`rounded-2xl border border-border bg-surface-2 ${showThread ? 'hidden md:block' : 'block'}`}
      >
        <div className="border-b border-border px-4 py-3 font-semibold">{t('nav.inbox')}</div>
        <div className="flex flex-wrap gap-1 border-b border-border px-2 py-2">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setFilter(k.id)}
              className={cn(
                'min-h-8 rounded-full border px-2.5 text-xs',
                filter === k.id
                  ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15'
                  : 'border-border',
              )}
            >
              {t(k.key)}
            </button>
          ))}
        </div>
        <div className="max-h-[70vh] overflow-y-auto pb-scroll-chrome">
          {visible.map((th) => (
            <Link
              key={th.id}
              to={chatHref(th.id)}
              className={`block min-h-14 border-b border-border/60 px-4 py-3 hover:bg-ink/5 ${active?.id === th.id ? 'bg-cyan/10' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-medium">
                  {th.participantIds.some((id) => id.startsWith('topic:'))
                    ? th.listingTitle?.replace(/\s*·\s*Orbit Social$/i, '') ||
                      th.participantNames.find((n) => n.startsWith('#')) ||
                      'Chat'
                    : th.participantNames.filter((n) => n !== user.name).join(', ') || 'Chat'}
                </div>
                <span className="shrink-0 text-xs uppercase tracking-wide text-muted">
                  {kindLabel(th.kind)}
                </span>
              </div>
              <div className="truncate text-xs text-muted">{th.listingTitle}</div>
              <div className="truncate text-xs text-neutral-500">{th.lastMessage}</div>
            </Link>
          ))}
          {visible.length === 0 && (
            <Empty
              emoji="💬"
              title={t('chat.empty')}
              hint={t('chat.emptyHint')}
              actionLabel={t('nav.match')}
              onAction={() => navigate('/match')}
            />
          )}
        </div>
      </aside>

      <section
        className={`flex min-h-[60vh] flex-col rounded-2xl border border-border bg-surface-2 md:min-h-[420px] ${showList && !showThread ? 'hidden md:flex' : 'flex'}`}
      >
        {active ? (
          <>
            <div className="flex items-center gap-2 border-b border-border px-3 py-3">
              <button
                type="button"
                className="tap-target flex items-center justify-center rounded-lg text-muted md:hidden"
                onClick={() => navigate(chatHref())}
                aria-label="Zurück"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0">
                <div className="truncate font-medium">{active.listingTitle ?? 'Konversation'}</div>
                <div className="truncate text-xs text-muted">
                  {kindLabel(active.kind)} · {active.participantNames.join(' · ')}
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-scroll-chrome">
              {messages.map((m) => {
                const mine = m.senderId === user.id
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-cyan text-black' : 'bg-surface-3 text-neutral-200'}`}
                    >
                      {!mine && <div className="mb-0.5 text-xs opacity-70">{m.senderName}</div>}
                      <div>{m.body}</div>
                      <div className="mt-1">
                        <ReportButton targetKind="message" targetId={m.id} />
                      </div>
                      <div className={`mt-1 text-xs ${mine ? 'text-black/60' : 'text-muted'}`}>
                        {formatDateTime(m.createdAt)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <form onSubmit={send} className="border-t border-border p-3 safe-pb">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Nachricht schreiben…"
                className="min-h-16"
              />
              <Button type="submit" className="mt-2 w-full sm:w-auto" disabled={!body.trim()}>
                Senden
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted">
            Wähle einen Chat oder starte eine Anfrage.
          </div>
        )}
      </section>
    </div>
  )
}
