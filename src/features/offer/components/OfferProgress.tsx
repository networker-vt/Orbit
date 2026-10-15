/** Calm top progress for the /angebot flow (Sie-Form). */
const STEPS = [
  { id: 'profile', label: 'Firmenprofil' },
  { id: 'customer', label: 'Kunde' },
  { id: 'lines', label: 'Positionen' },
  { id: 'offer', label: 'Angebot' },
  { id: 'invoice', label: 'Rechnung' },
] as const

export type OfferProgressId = (typeof STEPS)[number]['id']

export function OfferProgress({ current }: { current: OfferProgressId }) {
  const idx = STEPS.findIndex((s) => s.id === current)
  return (
    <nav aria-label="Fortschritt Angebot" className="space-y-2">
      <ol className="flex flex-wrap gap-1.5 text-xs">
        {STEPS.map((step, i) => {
          const done = i < idx
          const active = i === idx
          return (
            <li
              key={step.id}
              className={
                active
                  ? 'rounded-lg bg-cyan-500/20 px-2.5 py-1.5 font-semibold text-cyan-100'
                  : done
                    ? 'rounded-lg px-2.5 py-1.5 text-ink/80'
                    : 'rounded-lg px-2.5 py-1.5 text-muted'
              }
              aria-current={active ? 'step' : undefined}
            >
              <span className="sr-only">
                {active ? 'Aktuell: ' : done ? 'Erledigt: ' : 'Offen: '}
              </span>
              {i + 1}. {step.label}
              {i < STEPS.length - 1 ? (
                <span className="ml-1.5 text-muted" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
      <p className="text-sm text-muted">
        Firmenprofil → Kunde → Positionen → Angebot → Rechnung
      </p>
    </nav>
  )
}
