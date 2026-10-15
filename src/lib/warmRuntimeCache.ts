/**
 * Prefetch heavy optional tool chunks into the SW runtime cache after first paint.
 * Wi‑Fi (or unknown ethernet-like) only; respects navigator.connection.saveData.
 * E-invoice (+ later PDF tools) stay out of the precache budget.
 */

type NetworkInformation = {
  saveData?: boolean
  type?: string
  effectiveType?: string
}

function connection(): NetworkInformation | undefined {
  const nav = navigator as Navigator & { connection?: NetworkInformation; mozConnection?: NetworkInformation }
  return nav.connection ?? nav.mozConnection
}

/** True when background prefetch should run (not on save-Data / cellular if detectable). */
export function shouldWarmRuntimeCache(): boolean {
  if (typeof navigator === 'undefined') return false
  const c = connection()
  if (c?.saveData) return false
  // Prefer Wi‑Fi / ethernet; if the API is missing, still warm (desktop browsers).
  if (c?.type && c.type !== 'wifi' && c.type !== 'ethernet' && c.type !== 'other') {
    return false
  }
  return true
}

let warmed = false

/**
 * Background-import the e-invoice core (and pdf-lib for ZUGFeRD / later tools).
 * `@vite-ignore` keeps these off the entry modulepreload list.
 */
export function warmEInvoiceRuntimeCache(): void {
  if (warmed) return
  if (!shouldWarmRuntimeCache()) return
  warmed = true

  const run = () => {
    void import(/* @vite-ignore */ '@e-invoice-eu/core').catch(() => {
      // Offline or blocked — leave chunk uncached; export UI shows a clear hint.
    })
    void import(/* @vite-ignore */ '@cantoo/pdf-lib').catch(() => {})
  }

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => run(), { timeout: 8000 })
  } else {
    setTimeout(run, 2500)
  }
}

/** User-facing hint when an optional chunk is missing offline. */
export const OFFLINE_CHUNK_HINT =
  'Dieses Modul ist noch nicht offline verfügbar. Bitte die App einmal online öffnen (WLAN), dann erneut versuchen.'
