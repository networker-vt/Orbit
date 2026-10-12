import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Hash, Heart, MessageCircle, MessageSquare, Plus, Share2, Sparkles } from 'lucide-react'
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
  getActiveSearchPrefs,
  getSocial,
  listSearchTermChats,
  openSearchTermChat,
  rankPostsBySearchPrefs,
  subscribeSocial,
  suggestSearchTerms,
  toggleLike,
  toggleSearchPref,
  topicLabelFromThread,
} from '../lib/social'
import { getPrefs, subscribePrefs } from '../lib/prefs'
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

const HERO_SRC = `${import.meta.env.BASE_URL}social/orbit-social-hero.jpg`
const HERO_CREDIT = 'Photo: Helena Lopes / Unsplash (Unsplash License)'

export function SocialPage() {
  const { t } = useI18n()
  const { user, loginDemo } = useAuth()
  const navigate = useNavigate()
  useStoreVersion()
  const [social, setSocial] = useState(getSocial)
  const [prefs, setPrefs] = useState(getPrefs)
  const [draft, setDraft] = useState('')
  const [customTerm, setCustomTerm] = useState('')
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [shareId, setShareId] = useState('')
  const [feature, setFeature] = useState(false)
  const [credits, setCredits] = useState(getCredits)
  const [kids, setKids] = useState(kidsHideSocialChat)
  const [shareNote, setShareNote] = useState<string | null>(null)
  const [heroReady, setHeroReady] = useState(false)
  const [dmNote, setDmNote] = useState<string | null>(null)
  const [dmTick, setDmTick] = useState(0)

  useEffect(() => subscribeSocial(() => setSocial(getSocial())), [])
  useEffect(() => subscribePrefs(() => setPrefs(getPrefs())), [])
  useEffect(() => subscribeCredits(() => setCredits(getCredits())), [])
  useEffect(() => subscribeKids(() => setKids(kidsHideSocialChat())), [])
  useEffect(() => subscribeSocialDm(() => setDmTick((n) => n + 1)), [])
  void dmTick

  const actor = user ?? { id: DEMO_USER_ID, name: 'Alex Müller' }
  const listings = store.listListings({}).slice(0, 8)
  const activePrefs = useMemo(() => getActiveSearchPrefs(prefs), [prefs, social.searchPrefs])
  const suggestions = useMemo(() => suggestSearchTerms(prefs), [prefs, social.searchPrefs])
  const rankedFeed = useMemo(
    () => rankPostsBySearchPrefs(social.posts, activePrefs),
    [social.posts, activePrefs],
  )
  const topicChats = useMemo(
    () => (user ? listSearchTermChats(user.id) : []),
    [user, social, social.posts],
  )

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
      topics: activePrefs.slice(0, 4),
    })
    setDraft('')
    setShareId('')
    setFeature(false)
  }

  const sharePost = async (body: string, author: string) => {
    const text = `${author}: ${body}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Allda Social', text })
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

  const openTermChat = (term: string) => {
    const me = ensureUser()
    const thread = openSearchTermChat({ meId: me.id, meName: me.name, term })
    navigate(chatHref(thread.id))
  }

  const addCustomChip = () => {
    const term = customTerm.trim()
    if (!term) return
    toggleSearchPref(term)
    setCustomTerm('')
  }

  return (
    <div className="orbit-social mx-auto max-w-lg space-y-5 pb-scroll-chrome">
      <section
        className={cn(
          'orbit-social-hero relative -mx-4 md:-mx-6',
          heroReady && 'orbit-social-hero--ready',
        )}
        aria-label="Allda Social"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <img
            src={HERO_SRC}
            alt=""
            className="orbit-social-hero__img absolute inset-0 h-full w-full object-cover"
            width={1600}
            height={900}
            onLoad={() => setHeroReady(true)}
          />
          <div className="orbit-social-hero__wash absolute inset-0" />
        </div>
        <div className="relative flex min-h-[240px] flex-col justify-end px-5 pb-5 pt-20 sm:min-h-[280px]">
          <p className="orbit-social-hero__brand text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-teal-100/90">
            {t('social.kicker')}
          </p>
          <h1 className="orbit-social-hero__title mt-1 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            {t('social.title')}
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/85">{t('social.lead')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SpeakButton
              compact
              text={`${t('social.title')}. ${t('social.lead')}`}
              className="!border-white/25 !bg-black/25 !text-white"
            />
            {!kids && (
              <Button
                variant="secondary"
                size="sm"
                className="border-white/30 bg-white/15 text-white hover:bg-white/25"
                onClick={() => navigate(chatHref())}
              >
                <MessageSquare size={14} /> {t('chat.brand')}
              </Button>
            )}
          </div>
          <p className="mt-3 text-[10px] text-white/55">{HERO_CREDIT}</p>
        </div>
      </section>

      <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
        {t('social.demo')}
      </p>
      <p className="rounded-2xl border border-border bg-surface-2 px-3 py-2 text-xs text-muted" data-social-dm-consent>
        {t('social.dmConsent')}
      </p>
      {(shareNote || dmNote) && (
        <p className="text-xs text-[var(--theme-accent)]" role="status">
          {dmNote ?? shareNote}
        </p>
      )}

      <section className="space-y-3" aria-labelledby="social-prefs-heading">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="social-prefs-heading" className="text-sm font-semibold">
              {t('social.prefsTitle')}
            </h2>
            <p className="mt-0.5 text-xs text-muted">{t('social.prefsLead')}</p>
          </div>
          <Sparkles size={16} className="mt-0.5 shrink-0 text-[var(--theme-accent)]" aria-hidden />
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((term) => {
            const on = activePrefs.some((t) => t.toLowerCase() === term.toLowerCase())
            return (
              <button
                key={term}
                type="button"
                onClick={() => toggleSearchPref(term)}
                aria-pressed={on}
                className={cn(
                  'min-h-9 rounded-full border px-3 text-xs font-medium transition',
                  on
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]'
                    : 'border-border bg-surface-2 text-ink-soft hover:border-[var(--theme-accent)]/50',
                )}
              >
                #{term}
              </button>
            )
          })}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            addCustomChip()
          }}
        >
          <input
            value={customTerm}
            onChange={(e) => setCustomTerm(e.target.value)}
            placeholder={t('social.prefsAdd')}
            className="min-h-10 flex-1 rounded-xl border border-border bg-surface-3 px-3 text-sm"
            aria-label={t('social.prefsAdd')}
          />
          <Button type="submit" size="sm" variant="secondary" disabled={!customTerm.trim()}>
            <Plus size={14} /> {t('social.prefsAddBtn')}
          </Button>
        </form>
      </section>

      {!kids && (
        <section className="space-y-3" aria-labelledby="social-chats-heading">
          <div>
            <h2 id="social-chats-heading" className="text-sm font-semibold">
              {t('social.chatsTitle')}
            </h2>
            <p className="mt-0.5 text-xs text-muted">{t('social.chatsLead')}</p>
          </div>
          <ul className="space-y-2">
            {(activePrefs.length ? activePrefs : suggestions.slice(0, 4)).map((term) => {
              const open = topicChats.find(
                (th) => topicLabelFromThread(th)?.toLowerCase() === term.toLowerCase(),
              )
              return (
                <li key={term}>
                  <button
                    type="button"
                    onClick={() => openTermChat(term)}
                    className="flex w-full min-h-12 items-center gap-3 rounded-2xl border border-border bg-surface-2 px-3 py-2.5 text-left transition hover:border-[var(--theme-accent)]/40"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-accent)]/12 text-[var(--theme-accent)]">
                      <Hash size={16} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">#{term}</span>
                      <span className="block truncate text-xs text-muted">
                        {open?.lastMessage || t('social.chatsOpen')}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-[var(--theme-accent)]">
                      {open ? t('social.chatsContinue') : t('social.chatsStart')}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {topicChats.length > 0 && (
            <p className="text-xs text-muted">
              {t('social.chatsCount').replace('{n}', String(topicChats.length))}
            </p>
          )}
        </section>
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
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">{t('social.feed')}</h2>
          {activePrefs.length > 0 && (
            <p className="text-xs text-muted">{t('social.feedRanked')}</p>
          )}
        </div>
        {rankedFeed.length === 0 ? (
          <Empty
            emoji="✨"
            title={t('social.empty')}
            hint={t('social.emptyHint')}
            actionLabel={t('travel.toAssist')}
            onAction={() => navigate('/')}
          />
        ) : (
          <ul className="space-y-3">
            {rankedFeed.map((post) => {
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
                  {post.topics && post.topics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {post.topics.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          className="rounded-full bg-[var(--theme-accent)]/10 px-2 py-0.5 text-[11px] text-[var(--theme-accent)]"
                          onClick={() => {
                            if (!activePrefs.some((x) => x.toLowerCase() === topic.toLowerCase())) {
                              toggleSearchPref(topic)
                            }
                            if (!kids) openTermChat(topic)
                          }}
                        >
                          #{topic}
                        </button>
                      ))}
                    </div>
                  )}
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
