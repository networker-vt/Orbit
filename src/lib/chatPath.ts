/** Canonical Orbit Chat hub (also aliased as `/chat`). */
export function chatHref(threadId?: string) {
  return threadId ? `/social/chat/${threadId}` : '/social/chat'
}
