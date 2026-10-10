import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, MessageSquare, Share2 } from 'lucide-react'
import { chatHref } from '../lib/chatPath'
import { Button } from '../components/ui/Button'
import { Empty } from '../components/ui/Empty'
import { Textarea } from '../components/ui/Input'
import { SpeakButton } from '../components/a11y/SpeakButton'
import { useStoreVersion } from '../hooks/useStore'
import { useAuth } from '../lib/auth'
import { DEMO_USER_ID } from '../data/seed'
import { useI18n } from '../lib/i18n'
import { buyBoost, CREDITS_COSTS, getCredits, subscribeCredits } from '../lib/credits'
import { isFlagOn } from '../lib/flags'
import { LaneBadge } from '../components/credits/LaneBadge'
import { Badge } from '../components/ui/Badge'
import {
  addComment,
  addPost,
  getSocial,
  subscribeSocial,
  toggleLike,
} from '../lib/social'
import {
  getSocialDmPermission,
  openAcceptedSocialChat,
  requestSocialDm,
  subscribeSocialDm,
  type SocialDmPermission,
} from '../lib/socialDm'
import { store } from '../lib/store'
import { formatDateTime, cn } from '../lib/utils'
import { KidsBlocked } from '../components/kids/KidsBlocked'
import { emitParentalRequired, kidsHideSocialChat, subscribeKids } from '../lib/kids'

export function SocialPage() {
  const { t } = useI18n()
  const { user, loginDemo } = useAuth()
  const navigate = useNavigate()
  useStoreVersion()
  const [social, setSocial] = useState(getSocial)
  const [draft, setDraft] = useState('')
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [shareId, setShareId] = useState('')
  const [feature, setFeature] = useState(false)
  const [credits, setCredits] = useState(getCredits)
  const [kids, setKids] = useState(kidsHideSocialChat)
  const [shareNote, setShareNote] = useState<string | null>(null)
  const [dmNote, setDmNote] = useState<string | null>(null)
  const [dmTick, setDmTick] = useState(0)

  useEffect(() => subscribeSocial(() => setSocial(getSocial())), [])
  useEffect(() => subscribeCredits(() => setCredits(getCredits())), [])
  useEffect(() => subscribeKids(() => setKids(kidsHideSocialChat())), [])
  useEffect(() => subscribeSocialDm(() => setDmTick((n) => n + 1)), [])
  void dmTick

  const actor = user ?? { id: DEMO_USER_ID, name: 'Alex Müller' }
  const listings = store.listListings({}).slice(0, 8)

  const ensureUser = () => {
    if (!user) loginDemo()
    return user ?? { id: DEMO_USER_ID, name: 'Alex Müller' }
  }

  const publish = async () => {
    const me = ensureUser()
    const listing = listings.find((l) => l.id === shareId)
    let featured = false
    if (feature) {
      featured = Boolean(await buyBoost('social_boost'))
    }
    addPost({
      authorId: me.id,
      authorName: me.name,
      authorKind: 'person',
      body: draft,
      listingId: listing?.id,
      featured,
    })
    setDraft('')
    setShareId('')
    setFeature(false)
  }

  const sharePost = async (body: string, author: string) => {
    const text = `${author}: ${body}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Orbit Social', text })
        return
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(text)
      setShareNote(t('social.shared'))
      window.setTimeout(() => setShareNote(null), 2000)
    } catch {
      setShareNote(t('social.shared'))
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-scroll-chrome">
      <header className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--theme-accent)]">
              {t('social.kicker')}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{t('social.title')}</h1>
            <p className="mt-1 text-sm text-muted">{t('social.lead')}</p>
          </div>
          <div className="flex items-center gap-2">
            <SpeakButton compact text={`${t('social.title')}. ${t('social.lead')}`} />
            {!kids && (
              <Button variant="secondary" size="sm" onClick={() => navigate(chatHref())}>
                <MessageSquare size={14} /> {t('chat.brand')}
              </Button>
            )}
          </div>
        </div>
      </header>

      <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
        {t('social.demo')} {t('social.dmConsent')}
      </p>
      {(shareNote || dmNote) && (
        <p className="text-xs text-[var(--theme-accent)]" role="status">
          {dmNote ?? shareNote}
        </p>
      )}

      {kids ? (
        <KidsBlocked
          title={t('kids.socialBlocked')}
          onAskParent={() => emitParentalRequired('external_social')}
        />
      ) : (
      <section className="rounded-2xl border border-border bg-surface-2 p-4 space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('social.compose')}
          className="min-h-20"
        />
        <label className="block text-xs text-muted">
          {t('social.shareOffer')}
          <select
            className="mt-1 w-full min-h-10 rounded-xl border border-border bg-surface-3 px-2 text-sm"
            value={shareId}
            onChange={(e) => setShareId(e.target.value)}
          >
            <option value="">{t('social.noOffer')}</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        {isFlagOn('credits') && (
        <label className="flex min-h-11 items-start gap-2 rounded-xl border border-border bg-black/20 px-3 py-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={feature}
            disabled={credits.balance < CREDITS_COSTS.social_boost.credits}
            onChange={(e) => setFeature(e.target.checked)}
          />
          <span>
            {t('social.featurePost')} ({CREDITS_COSTS.social_boost.credits} Credits){' '}
            <LaneBadge lane="credits" />
          </span>
        </label>
        )}
        <Button onClick={publish} disabled={!draft.trim()} className="w-full">
          {t('social.post')}
        </Button>
      </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{t('social.feed')}</h2>
        {social.posts.length === 0 ? (
          <Empty
            emoji="✨"
            title={t('social.empty')}
            hint={t('social.emptyHint')}
            actionLabel={t('travel.toAssist')}
            onAction={() => navigate('/')}
          />
        ) : (
          <ul className="space-y-3">
            {social.posts.map((post) => {
              const liked = post.likes.includes(actor.id)
              return (
                <li key={post.id} className="rounded-2xl border border-border bg-surface-2 p-4">
                  <p className="text-xs text-muted">
                    {post.authorName} · {post.authorKind === 'company' ? t('role.company') : t('role.seeker')} ·{' '}
                    {formatDateTime(post.createdAt)}
                    {post.featured ? (
                      <>
                        {' '}
                        · <Badge tone="violet">{t('social.featured')}</Badge>
                      </>
                    ) : null}
                  </p>
                  <p className="mt-2 text-sm text-ink whitespace-pre-wrap">{post.body}</p>
                  {post.listingId && (
                    <Link
                      to={`/listings/${post.listingId}`}
                      className="mt-2 inline-block text-xs text-[var(--theme-accent)] hover:underline"
                    >
                      {t('social.openOffer')} →
                    </Link>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <button
                      type="button"
                      className={cn('inline-flex items-center gap-1', liked && 'text-rose-300')}
                      onClick={() => toggleLike(post.id, ensureUser().id)}
                    >
                      <Heart size={14} fill={liked ? 'currentColor' : 'none'} /> {post.likes.length}
                    </button>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle size={14} /> {post.comments.length}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => void sharePost(post.body, post.authorName)}
                    >
                      <Share2 size={14} /> {t('social.share')}
                    </button>
                    {!kids && post.authorId !== actor.id && (
                      <SocialDmAction
                        meId={actor.id}
                        meName={actor.name}
                        otherId={post.authorId}
                        otherName={post.authorName}
                        onNote={(msg) => {
                          setDmNote(msg)
                          window.setTimeout(() => setDmNote(null), 2800)
                        }}
                      />
                    )}
                  </div>
                  {post.comments.length > 0 && (
                    <ul className="mt-2 space-y-1 border-t border-border/60 pt-2">
                      {post.comments.map((c) => (
                        <li key={c.id} className="text-xs">
                          <span className="font-medium text-neutral-200">{c.authorName}: </span>
                          <span className="text-muted">{c.body}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      const me = ensureUser()
                      addComment(post.id, me.id, me.name, commentDraft[post.id] || '')
                      setCommentDraft((d) => ({ ...d, [post.id]: '' }))
                    }}
                  >
                    <input
                      value={commentDraft[post.id] || ''}
                      onChange={(e) => setCommentDraft((d) => ({ ...d, [post.id]: e.target.value }))}
                      placeholder={t('social.comment')}
                      className="min-h-10 flex-1 rounded-xl border border-border bg-surface-3 px-3 text-sm"
                    />
                    <Button type="submit" size="sm" variant="secondary" disabled={!commentDraft[post.id]?.trim()}>
                      {t('social.send')}
                    </Button>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function SocialDmAction({
  meId,
  meName,
  otherId,
  otherName,
  onNote,
}: {
  meId: string
  meName: string
  otherId: string
  otherName: string
  onNote: (msg: string) => void
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { loginDemo } = useAuth()
  const [perm, setPerm] = useState<SocialDmPermission>(() => getSocialDmPermission(meId, otherId))

  useEffect(() => {
    return subscribeSocialDm(() => setPerm(getSocialDmPermission(meId, otherId)))
  }, [meId, otherId])

  const ensure = () => {
    loginDemo()
    return { id: meId || DEMO_USER_ID, name: meName || 'Alex Müller' }
  }

  if (perm === 'accepted') {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 text-[var(--theme-accent)]"
        onClick={() => {
          const me = ensure()
          const thread = openAcceptedSocialChat({
            meId: me.id,
            meName: me.name,
            otherId,
            otherName,
          })
          if (thread) navigate(chatHref(thread.id))
        }}
      >
        <MessageSquare size={14} /> {t('chat.open')}
      </button>
    )
  }

  if (perm === 'outgoing') {
    return <span className="inline-flex items-center gap-1 opacity-80">{t('chat.requestSent')}</span>
  }

  if (perm === 'incoming') {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 text-[var(--theme-accent)]"
        onClick={() => navigate(chatHref())}
      >
        <MessageSquare size={14} /> {t('chat.requests')}
      </button>
    )
  }

  if (perm === 'declined') {
    return <span className="inline-flex items-center gap-1 opacity-60">{t('chat.declined')}</span>
  }

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-[var(--theme-accent)]"
      onClick={() => {
        const me = ensure()
        requestSocialDm({
          meId: me.id,
          meName: me.name,
          otherId,
          otherName,
          note: t('chat.requestDefaultNote'),
        })
        setPerm('outgoing')
        onNote(t('chat.requestSent'))
      }}
    >
      <MessageSquare size={14} /> {t('chat.request')}
    </button>
  )
}
