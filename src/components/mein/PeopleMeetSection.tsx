import { Link } from 'react-router-dom'
import { hasConfirmedAdult } from '../../lib/ageGate'

/**
 * People-meeting lives under Ich, apart from jobs.
 * There is no real match list, so the screen stays empty.
 * Contact details are not shown. The 18+ registration flag is required.
 */
export function PeopleMeetSection() {
  const open = hasConfirmedAdult()

  return (
    <section className="space-y-2 rounded-2xl border border-border bg-surface-2 p-4" id="menschen">
      <h2 className="text-lg font-semibold">Menschen treffen</h2>
      <p className="text-xs text-muted">
        Eigener Bereich, getrennt von Berufen. Nur ab 18. Keine öffentlichen Kontaktdaten.
      </p>
      {open ? (
        <p className="text-sm text-muted">
          Noch keine echten Treffen. Allda zeigt hier keine Beispielpersonen. Melden bleibt auf Profilen
          möglich.
        </p>
      ) : (
        <p className="text-sm text-muted">
          Dieser Bereich bleibt zu, bis du bei der Anmeldung bestätigt hast, dass du mindestens 18 bist.{' '}
          <Link to="/auth" className="text-[var(--theme-accent)] hover:underline">
            Zur Anmeldung
          </Link>
        </p>
      )}
    </section>
  )
}
