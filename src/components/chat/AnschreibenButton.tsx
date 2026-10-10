import { MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useAuth } from '../../lib/auth'
import { chatHref } from '../../lib/chatPath'
import { openListingChat, type ChatContextSource } from '../../lib/contextualChat'
import { useI18n } from '../../lib/i18n'
import { kidsHidePublicChat } from '../../lib/kids'
import type { Listing } from '../../types'

export function AnschreibenButton({
  listing,
  source = 'listing',
  note,
  variant = 'primary',
  size = 'md',
  className,
  fullWidth,
}: {
  listing: Listing
  source?: ChatContextSource
  note?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullWidth?: boolean
}) {
  const { t } = useI18n()
  const { user, loginDemo } = useAuth()
  const navigate = useNavigate()

  if (kidsHidePublicChat()) return null
  if (user && user.id === listing.ownerId) return null

  const run = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    let meId = user?.id
    let meName = user?.name
    if (!meId || !meName) {
      loginDemo()
      meId = 'user-demo-1'
      meName = 'Alex Müller'
    }
    if (meId === listing.ownerId) return
    const thread = openListingChat({
      meId,
      meName,
      listing,
      note,
      source,
    })
    navigate(chatHref(thread.id))
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className ?? (fullWidth ? 'w-full' : undefined)}
      onClick={run}
    >
      <MessageSquare size={size === 'sm' ? 14 : 16} /> {t('chat.anschreiben')}
    </Button>
  )
}
