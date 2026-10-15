import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { OfferBetaBanner } from './OfferBetaBanner'

type Props = {
  onAccepted: () => void
}

export function OfferBusinessGate({ onAccepted }: Props) {
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)

  return (
    <div className="mx-auto flex min-h-[32rem] max-w-lg flex-col gap-5 pb-scroll-chrome">
      <OfferBetaBanner step={1} />
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Angebot & E-Rechnung</h1>
        <p className="text-sm text-muted">
          Bevor Sie starten, bestätigen Sie bitte, dass Sie diese Funktion für Ihren Betrieb nutzen möchten.
        </p>
      </header>
      <label className="flex min-h-14 items-start gap-3 rounded-2xl border border-border bg-surface-2 p-4 text-sm leading-relaxed text-ink">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span>Ich nutze das für meinen Betrieb (§ 14 BGB).</span>
      </label>
      <Button
        type="button"
        size="lg"
        className="min-h-14 w-full"
        disabled={!checked || busy}
        onClick={() => {
          setBusy(true)
          onAccepted()
        }}
      >
        Weiter
      </Button>
    </div>
  )
}
