import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, MessageSquare, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
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
import {
  acceptSocialDm,
  declineSocialDm,
  listIncomingPending,
  subscribeSocialDm,
} from '../lib/socialDm'
import { isFlagOn } from '../lib/flags'
import {
  chatHistoryLimit,
  chatMediaSlotsRemaining,
  chatPlusActive,
  CHAT_HISTORY_FREE,
} from '../lib/chatExtras'
import { buyBoost, boostCost, getCredits, subscribeCredits } from '../lib/credits'

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
  const version = useStoreVersion()
  const navigate = useNavigate()
  const [body, setBody] = useState('')
  const [filter, setFilter] = useState<'all' | ThreadKind>('all')
  const [dmTick, setDmTick] = useState(0)
  const [creditsBal, setCreditsBal] = useState(() => getCredits().balance)

  useEffect(() => subscribeSocialDm(() => setDmTick((n) => n + 1)), [])
  useEffect(() => subscribeCredits(() => setCreditsBal(getCredits().balance)), [])

  const threads = useMemo(
    () => (user ? store.listThreads(user.id) : []),
    [user?.id, version, dmTick],
  )
  const visible = useMemo(
    () => (filter === 'all' ? threads : threads.filter((th) => threadKind(th.kind) === filter)),
    [threads, filter],
  )
  const active = threadId ? store.getThread(threadId) : undefined
  const messages = active ? store.listMessages(active.id) : []
  const showList = !threadId
  const showThread = Boolean(threadId)
  const incoming = user ? listIncomingPending(user.id) : []

  useEffect(() => {
    if (!user) return
    if (!threadId && visible[0] && window.matchMedia('(min-width: 768px)').matches) {
      navigate(chatHref(visible[0].id), { replace: true })
    }
  }, [user, threadId, visible, navigate])

  useEffect(() => {
    if (user && threadId) store.markThreadRead(threadId, user.id)
  }, [user?.id, threadId, messages.length])

  if (kidsHidePublicChat()) {
    return <KidsBlocked title={t('kids.chatBlocked')} />
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-surface-2 p-8 text-center">
        <p className="mb-4">{t('chat.needLogin')}</p>
        <Button onClick={() => loginDemo()}>{t('chat.startDemo')}</Button>
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

  const peerName = (th: (typeof threads)[0]) => {
    if (th.participantIds.some((id) => id.startsWith('topic:'))) {
      return (
        th.listingTitle?.replace(/\s*·\s*Orbit Social$/i, '') ||
        th.participantNames.find((n) => n.startsWith('#')) ||
        t('chat.brand')
      )
    }
    return th.participantNames.filter((n) => n !== user.name).join(', ') || t('chat.brand')
  }

  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr]">
      <aside
        className={`overflow-hidden rounded-2xl border border-border bg-surface-2 ${showThread ? 'hidden md:block' : 'block'}`}
      >
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-[var(--theme-accent)]" />
            <div>
              <div className="font-semibold tracking-tight">{t('chat.brand')}</div>
              <p className="text-xs text-muted">{t('chat.brandLead')}</p>
            </div>
          </div>
        </div>

        {isFlagOn('credits') && (
          <div className="border-b border-border px-3 py-2 text-xs text-muted">
            <p>
              {chatPlusActive()
                ? 'Chat-Extras aktiv (heute): erweiterte lokale Historie & Medien-Slots.'
                : `Basis: ${CHAT_HISTORY_FREE} Nachrichten sichtbar (lokal).`}
              {' · '}
              Medien-Slots heute: {chatMediaSlotsRemaining()}
            </p>
            {!chatPlusActive() && (
              <button
                type="button"
                className="mt-1 text-[var(--theme-accent)] hover:underline"
                disabled={creditsBal < boostCost('chat_plus')}
                onClick={() => void buyBoost('chat_plus')}
              >
                Chat-Extras (−{boostCost('chat_plus')} Credits, kein echtes Geld)
              </button>
            )}
            {active && messages.length >= chatHistoryLimit() && (
              <p className="mt-1 text-amber-200">Ältere Nachrichten sind lokal ausgeblendet — Chat-Extras erweitern das Fenster.</p>
            )}
          </div>
        )}

        {incoming.length > 0 && (
          <div className="space-y-2 border-b border-border bg-[var(--theme-accent)]/8 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-accent)]">
              {t('chat.requests')}
            </p>
            {incoming.map((req) => (
              <div key={req.id} className="rounded-xl border border-border bg-surface-3 p-3">
                <p className="text-sm font-medium text-ink">{req.fromName}</p>
                {req.note && <p className="mt-1 text-xs text-muted">{req.note}</p>}
                <p className="mt-1 text-xs text-muted">{t('chat.requestHint')}</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const { threadId: id } = acceptSocialDm(req.id, user.id)
                      navigate(chatHref(id))
                    }}
                  >
                    <Check size={14} /> {t('chat.accept')}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => declineSocialDm(req.id, user.id)}>
                    <X size={14} /> {t('chat.decline')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

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
          {visible.map((th) => {
            const unread = store.unreadCount(th.id, user.id)
            return (
              <Link
                key={th.id}
                to={chatHref(th.id)}
                className={`block min-h-14 border-b border-border/60 px-4 py-3 hover:bg-ink/5 ${active?.id === th.id ? 'bg-cyan/10' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-medium">
                    {peerName(th)}
                    {unread > 0 && (
                      <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-cyan px-1.5 text-[10px] font-bold text-black">
                        {unread}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs uppercase tracking-wide text-muted">
                    {kindLabel(th.kind)}
                  </span>
                </div>
                <div className="truncate text-xs text-muted">{th.listingTitle}</div>
                <div className="truncate text-xs text-neutral-500">{th.lastMessage}</div>
              </Link>
            )
          })}
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
        className={`flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-border bg-surface-2 md:min-h-[480px] ${showList && !showThread ? 'hidden md:flex' : 'flex'}`}
      >
        {active ? (
          <>
            <div className="flex items-center gap-2 border-b border-border px-3 py-3">
              <button
                type="button"
                className="tap-target flex items-center justify-center rounded-lg text-muted md:hidden"
                onClick={() => navigate(chatHref())}
                aria-label={t('chat.back')}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{peerName(active)}</div>
                <div className="truncate text-xs text-muted">
                  {kindLabel(active.kind)}
                  {active.listingTitle ? ` · ${active.listingTitle}` : ''}
                </div>
              </div>
              {active.listingId && (
                <Link
                  to={`/listings/${active.listingId}`}
                  className="shrink-0 text-xs text-[var(--theme-accent)] hover:underline"
                >
                  {t('chat.openListing')}
                </Link>
              )}
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
            <form
              onSubmit={send}
              className="flex items-end gap-2 border-t border-border bg-surface-2/95 p-3 safe-pb backdrop-blur"
            >
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t('chat.compose')}
                className="min-h-11 flex-1 rounded-xl border border-border bg-surface-3 px-3 text-sm outline-none focus:border-[var(--theme-accent)]"
                aria-label={t('chat.compose')}
              />
              <Button type="submit" disabled={!body.trim()} className="shrink-0">
                {t('chat.send')}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted">
            <MessageSquare size={28} className="text-[var(--theme-accent)]" />
            <p className="font-medium text-ink">{t('chat.brand')}</p>
            <p>{t('chat.pick')}</p>
          </div>
        )}
      </section>
    </div>
  )
}
