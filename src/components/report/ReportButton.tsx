import { useState } from 'react'
import { Flag } from 'lucide-react'
import { Button } from '../ui/Button'
import { useI18n } from '../../lib/i18n'
import {
  REPORT_REASONS,
  reportMailto,
  submitContentReport,
  validateReport,
  type ReportReason,
  type ReportTargetKind,
} from '../../lib/reports'

export function ReportButton({
  targetKind,
  targetId,
  className,
}: {
  targetKind: ReportTargetKind
  targetId: string
  className?: string
}) {
  const { resolved } = useI18n()
  const de = resolved === 'de'
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [description, setDescription] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [truthful, setTruthful] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [mailHref, setMailHref] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const close = () => {
    setOpen(false)
    setDone(false)
    setMailHref(null)
    setError(null)
  }

  const submit = async () => {
    const input = { targetKind, targetId, reason, description, name, email, truthful }
    const problem = validateReport(input)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    try {
      const saved = await submitContentReport(input)
      const href = reportMailto(saved)
      setMailHref(href)
      setDone(true)
      // Keep the reviewer/user in-app; they tap the mailto link when ready.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Meldung fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={
          className ??
          'inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-xs text-muted hover:text-ink'
        }
        onClick={() => setOpen(true)}
      >
        <Flag size={14} aria-hidden />
        {de ? 'Inhalt melden' : 'Report content'}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-surface-2 p-4"
          >
            <h2 id="report-title" className="text-lg font-semibold">
              {de ? 'Inhalt melden' : 'Report content'}
            </h2>
            {done ? (
              <>
                <p className="text-sm text-neutral-200">
                  {de
                    ? 'Danke. Die Meldung liegt auf diesem Gerät. Optional kannst du sie per E-Mail an den Betreiber schicken.'
                    : 'Thanks. The report is stored on this device. Optionally email it to the operator.'}
                </p>
                {mailHref && (
                  <a
                    href={mailHref}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan/40 bg-cyan/10 px-3 text-sm font-medium text-cyan"
                  >
                    {de ? 'E-Mail an Support öffnen' : 'Open email to support'}
                  </a>
                )}
                <Button type="button" onClick={close}>
                  OK
                </Button>
              </>
            ) : (
              <>
                <label className="block text-sm">
                  {de ? 'Grund' : 'Reason'}
                  <select
                    className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface-3 px-3"
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ReportReason | '')}
                  >
                    <option value="">{de ? 'Bitte wählen' : 'Please choose'}</option>
                    {REPORT_REASONS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {de ? item.de : item.en}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  {de ? 'Beschreibung' : 'Description'}
                  <textarea
                    className="mt-1 min-h-24 w-full rounded-xl border border-border bg-surface-3 px-3 py-2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  {de ? 'Name (optional)' : 'Name (optional)'}
                  <input
                    className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface-3 px-3"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  {de ? 'E-Mail (optional)' : 'Email (optional)'}
                  <input
                    type="email"
                    className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface-3 px-3"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="flex min-h-11 items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={truthful}
                    onChange={(e) => setTruthful(e.target.checked)}
                  />
                  <span>{de ? 'Meine Angaben stimmen' : 'My information is correct'}</span>
                </label>
                {error && <p className="text-sm text-amber-200">{error}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={busy} onClick={() => void submit()}>
                    {de ? 'Meldung senden' : 'Send report'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={close}>
                    {de ? 'Abbrechen' : 'Cancel'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
