import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { Button } from '../ui/Button'
import { AnschreibenButton } from '../chat/AnschreibenButton'
import { useAuth } from '../../lib/auth'
import { applyInterest, alreadyApplied } from '../../lib/apply'
import { chatHref } from '../../lib/chatPath'
import { useI18n } from '../../lib/i18n'
import { isFlagOn } from '../../lib/flags'
import type { Listing } from '../../types'

export function InteresseButton({ listing }: { listing: Listing }) {
  const { t } = useI18n()
  const { user, loginDemo, profile } = useAuth()
  const navigate = useNavigate()
  const [done, setDone] = useState<{ interviewId: string; threadId?: string } | null>(null)
  const applied = user ? alreadyApplied(listing.id, user.id) : false

  const run = () => {
    let requesterId = user?.id
    let requesterName = user?.name
    if (!requesterId || !requesterName) {
      loginDemo()
      requesterId = 'user-demo-1'
      requesterName = 'Alex Müller'
    }
    if (requesterId === listing.ownerId) {
      alert('Eigenes Inserat — Interesse nicht nötig.')
      return
    }
    const result = applyInterest({
      listing,
      requesterId,
      requesterName,
      city: profile?.city,
    })
    setDone({
      interviewId: result.interviewId,
      threadId: result.thread?.id,
    })
  }

  if (done || applied) {
    return (
      <div className="space-y-3 rounded-2xl border border-[var(--theme-accent)]/35 bg-[var(--theme-accent)]/10 p-4">
        <h2 className="font-semibold text-ink">{t('apply.sent')}</h2>
        <p className="text-sm text-neutral-300">{t('apply.sentHint')}</p>
        <div className="flex flex-wrap gap-2">
          {done?.threadId && (
            <Button onClick={() => navigate(chatHref(done.threadId))}>{t('chat.anschreiben')}</Button>
          )}
          {isFlagOn('interview') && (
          <Button
            variant="secondary"
            onClick={() => navigate(`/interview/${done?.interviewId ?? 'iv-demo-1'}`)}
          >
            {t('apply.interview')}
          </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-surface-2 p-4">
      <h2 className="font-semibold">{t('apply.oneTap')}</h2>
      <p className="text-sm text-muted">{t('apply.shares')}</p>
      <div className="flex flex-wrap gap-2">
        <Button className="w-full md:w-auto" size="lg" onClick={run}>
          <Heart size={18} fill="currentColor" /> {t('apply.interest')}
        </Button>
        <AnschreibenButton listing={listing} source="job" variant="secondary" size="lg" />
      </div>
    </div>
  )
}
