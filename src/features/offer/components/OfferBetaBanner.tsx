import { useLocation } from 'react-router-dom'
import { LEGAL } from '../../../lib/legal'

export function OfferBetaBanner({ step }: { step: 1 | 2 }) {
  const { pathname, search } = useLocation()
  const route = `${pathname}${search}`
  const subject = encodeURIComponent(`Beta-Fehler Angebot & E-Rechnung (${route}, Schritt ${step})`)
  const body = encodeURIComponent(
    `Route: ${route}\nSchritt: ${step}\n\nBitte beschreiben Sie den Fehler:\n`,
  )
  const mailHref = `mailto:${LEGAL.email}?subject=${subject}&body=${body}`

  return (
    <div
      className="rounded-xl border-2 border-amber-400/50 bg-amber-500/15 px-3 py-2.5 text-sm text-amber-50"
      role="status"
    >
      <p className="font-semibold tracking-tight">Beta – Testversion</p>
      <p className="text-xs text-amber-100/90">Fehler sind möglich</p>
      <a
        href={mailHref}
        className="mt-2 inline-flex min-h-12 items-center text-sm font-medium text-cyan-200 underline underline-offset-2"
      >
        Fehler melden
      </a>
    </div>
  )
}

export function OfferTaxDisclaimer() {
  return (
    <p className="rounded-xl border border-border bg-surface-3/80 px-3 py-2 text-xs text-muted">
      Bei Steuerfragen fragen Sie Ihre Steuerberatung. Die App wählt keinen Steuersatz und keine § 13b-Regelung
      automatisch.
    </p>
  )
}
