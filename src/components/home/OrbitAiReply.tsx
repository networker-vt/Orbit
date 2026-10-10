import { cn } from '../../lib/utils'

type Props = {
  text: string
  blocked?: boolean
  className?: string
}

export function OrbitAiReply({ text, blocked, className }: Props) {
  if (!text) return null
  return (
    <p
      role="status"
      data-orbit-ai-reply={blocked ? 'blocked' : '1'}
      className={cn(
        'rounded-2xl border px-3 py-2 text-sm',
        blocked
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
          : 'border-border bg-surface-2/80 text-ink',
        className,
      )}
    >
      {text}
    </p>
  )
}
