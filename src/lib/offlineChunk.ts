/**
 * Shared copy + detection for missing/failed dynamic chunks (offline / SW miss).
 * One place — import from here in feature UIs and warm helpers.
 */

export const OFFLINE_CHUNK_HINT =
  'Dieses Modul ist noch nicht offline verfügbar. Bitte die App einmal online öffnen (WLAN), dann erneut versuchen.'

/** True for Vite/Rolldown dynamic-import network failures (not generic app errors). */
export function isChunkLoadError(err: unknown): boolean {
  if (err == null) return false
  const msg =
    err instanceof Error
      ? `${err.name}: ${err.message}`
      : typeof err === 'string'
        ? err
        : String(err)
  if (/Failed to fetch dynamically imported module/i.test(msg)) return true
  if (/Importing a module script failed/i.test(msg)) return true
  if (/error loading dynamically imported module/i.test(msg)) return true
  if (/Loading chunk [\w.-]+ failed/i.test(msg)) return true
  // Chromium often surfaces a bare TypeError when the chunk fetch fails.
  if (err instanceof TypeError && /fetch|network|load/i.test(msg)) return true
  return false
}
