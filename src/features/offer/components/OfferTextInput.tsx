import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { isOfferDictationOn } from '../offerFeatureFlags'
import { HoldToDictateButton } from './HoldToDictateButton'

type Props = {
  disabled?: boolean
  onAnalyzeText: (text: string) => void
}

export function OfferTextInput({ disabled, onAnalyzeText }: Props) {
  const [draft, setDraft] = useState('')
  const dictationEnabled = isOfferDictationOn()

  const submitTyped = () => {
    const text = draft.trim()
    if (!text || disabled) return
    onAnalyzeText(text)
  }

  return (
    <div className="space-y-3 rounded-xl border border-[var(--theme-accent)]/30 bg-surface-3/40 p-3">
      <label className="block text-sm font-semibold text-ink" htmlFor="offer-type-input">
        Angebot eintippen
      </label>
      <p className="text-xs text-muted">
        Ihr Text bleibt auf diesem Gerät und wird von der Mock-KI in Positionen umgewandelt — ohne Cloud-Diktat.
      </p>
      <textarea
        id="offer-type-input"
        rows={4}
        className="min-h-28 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-base text-ink"
        placeholder="z. B. 12 LED-PAR, 6 Stunden Montage, Transport pauschal …"
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
      />
      <Button
        type="button"
        size="lg"
        className="min-h-14 w-full"
        disabled={disabled || draft.trim().length === 0}
        onClick={submitTyped}
      >
        Mock-KI starten
      </Button>
      {dictationEnabled ? (
        <>
          <p className="text-sm font-medium text-ink">Optional: Diktat (Browser-Anbieter, nur mit Flag)</p>
          <HoldToDictateButton
            disabled={disabled}
            onTranscript={(text) => {
              setDraft(text)
              onAnalyzeText(text)
            }}
          />
        </>
      ) : (
        <p className="text-xs text-muted">
          Sprachdiktat ist in dieser Beta deaktiviert. Sie können Ihr Angebot oben eintippen oder ein Foto nutzen.
        </p>
      )}
    </div>
  )
}
