import { useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { BACKUP_ARCHIVE_HINT, exportBackupZip, importBackupZip } from '../backup'
import { downloadBlob } from '../einvoiceExport'

export function OfferBackupPanel({ onImported }: { onImported?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const doExport = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const blob = await exportBackupZip()
      downloadBlob(`orbit-angebot-backup-${new Date().toISOString().slice(0, 10)}.zip`, blob)
      setMessage('Sicherung erstellt.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sicherung fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  const doImport = async (file: File) => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await importBackupZip(file)
      setMessage(
        `Importiert: ${result.offers} Angebote, ${result.invoices} Rechnungen (Zähler: ${result.counterLastSeq}).`,
      )
      onImported?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4" aria-labelledby="backup-heading">
      <h2 id="backup-heading" className="text-lg font-semibold text-ink">
        Alles sichern
      </h2>
      <p className="text-sm text-muted">{BACKUP_ARCHIVE_HINT}</p>
      <Button
        type="button"
        size="lg"
        className="min-h-14 w-full"
        disabled={busy}
        onClick={() => void doExport()}
      >
        Alles sichern (ZIP)
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="min-h-14 w-full"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
      >
        Sicherung importieren
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".zip,.json,application/zip,application/json"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void doImport(f)
          e.target.value = ''
        }}
      />
      <div aria-live="polite" className="text-sm">
        {message ? <p className="text-cyan-200">{message}</p> : null}
        {error ? <p className="text-rose-200">{error}</p> : null}
      </div>
    </section>
  )
}
