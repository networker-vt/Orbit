import { Camera, FileDown, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { analyzeOfferInput, getOfferAiMode } from './aiProvider'
import { OfferBetaBanner, OfferTaxDisclaimer } from './components/OfferBetaBanner'
import { OfferTextInput } from './components/OfferTextInput'
import { OfferLineEditor } from './components/OfferLineEditor'
import { downloadBlob, exportXRechnungXml, exportZugferdPdf } from './einvoiceExport'
import { listenOnlineDrain, pendingAiCount, queueAiJob } from './offerAiQueue'
import { OfferBusinessGate } from './components/OfferBusinessGate'
import {
  getBusinessConsent,
  listOffers,
  newOfferId,
  saveOffer,
  setBusinessConsentAccepted,
} from './offerDb'
import { defaultInvoiceDraft } from './testData'
import type { InvoiceDraft, OfferLineItem, StoredOffer } from './types'
import { lineTotals, validateUstg14 } from './ustg14'

function lineId() {
  return `ln-${Math.random().toString(36).slice(2, 10)}`
}

export function AngebotPage() {
  const [consentReady, setConsentReady] = useState<boolean | null>(null)

  useEffect(() => {
    void getBusinessConsent().then((record) => setConsentReady(record?.accepted === true))
  }, [])

  if (consentReady === null) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center text-sm text-muted" aria-live="polite">
        Wird geladen…
      </div>
    )
  }

  if (!consentReady) {
    return (
      <OfferBusinessGate
        onAccepted={() => {
          void setBusinessConsentAccepted().then(() => setConsentReady(true))
        }}
      />
    )
  }

  return <AngebotFlow />
}

function AngebotFlow() {
  const [step, setStep] = useState<1 | 2>(1)
  const [offer, setOffer] = useState<StoredOffer | null>(null)
  const [invoice, setInvoice] = useState<InvoiceDraft>(() => defaultInvoiceDraft())
  const [busy, setBusy] = useState(false)
  const [queueCount, setQueueCount] = useState(pendingAiCount())
  const [exportBusy, setExportBusy] = useState(false)
  const [exportErrors, setExportErrors] = useState<string[]>([])
  const cameraRef = useRef<HTMLInputElement>(null)
  const [lastInputPreview, setLastInputPreview] = useState('')

  useEffect(() => {
    return listenOnlineDrain((n) => {
      if (n > 0) setQueueCount(pendingAiCount())
    })
  }, [])

  const persist = useCallback(async (next: StoredOffer) => {
    await saveOffer(next)
    setOffer(next)
  }, [])

  const runAnalysis = async (kind: 'photo' | 'dictation', file?: File, transcript?: string) => {
    setBusy(true)
    setExportErrors([])
    try {
      const id = offer?.id ?? newOfferId()
      const base: StoredOffer = offer ?? {
        id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        captureKind: kind,
        title: 'Neues Angebot',
        lines: [],
        servicePeriodStart: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
        servicePeriodEnd: new Date().toISOString().slice(0, 10),
        synced: false,
      }

      if (!navigator.onLine) {
        queueAiJob({
          id: `job-${Date.now()}`,
          offerId: id,
          inputKind: kind,
          createdAt: Date.now(),
          payload: {
            fileName: file?.name,
            transcript,
          },
        })
        await persist({ ...base, title: 'Analyse ausstehend (offline)', updatedAt: Date.now() })
        setQueueCount(pendingAiCount())
        return
      }

      const result = await analyzeOfferInput(
        kind === 'photo' && file
          ? { kind: 'photo', file }
          : { kind: 'dictation', transcript: transcript ?? '' },
      )
      const lines: OfferLineItem[] = result.lines.map((l) => ({
        ...l,
        id: lineId(),
        confirmed: false,
      }))
      await persist({
        ...base,
        title: result.title,
        lines,
        updatedAt: Date.now(),
        captureKind: kind,
      })
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void listOffers().then((rows) => {
      if (rows[0] && !offer) setOffer(rows[0])
    })
  }, [offer])

  const allConfirmed = offer?.lines.every((l) => l.confirmed) && (offer?.lines.length ?? 0) > 0

  const goStep2 = () => {
    if (!allConfirmed || !offer) return
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateLine = (line: OfferLineItem) => {
    if (!offer) return
    void persist({
      ...offer,
      lines: offer.lines.map((l) => (l.id === line.id ? line : l)),
      updatedAt: Date.now(),
    })
  }

  const confirmLine = (line: OfferLineItem) => {
    updateLine({ ...line, confirmed: true })
  }

  const ustgIssues =
    offer && step === 2 ? validateUstg14(offer, invoice, offer.lines) : []

  const doExport = async (kind: 'xml' | 'pdf') => {
    if (!offer) return
    const issues = validateUstg14(offer, invoice, offer.lines)
    if (issues.length > 0) {
      setExportErrors(issues.map((i) => i.labelDe))
      return
    }
    setExportBusy(true)
    setExportErrors([])
    try {
      if (kind === 'xml') {
        const xml = await exportXRechnungXml(offer, invoice, offer.lines)
        downloadBlob(`${invoice.invoiceNumber}.xml`, new Blob([xml], { type: 'application/xml' }))
      } else {
        const pdf = await exportZugferdPdf(offer, invoice, offer.lines)
        downloadBlob(
          `${invoice.invoiceNumber}-zugferd.pdf`,
          new Blob([Uint8Array.from(pdf)], { type: 'application/pdf' }),
        )
      }
    } catch (err) {
      setExportErrors([err instanceof Error ? err.message : 'Export fehlgeschlagen'])
    } finally {
      setExportBusy(false)
    }
  }

  const totals = offer ? lineTotals(offer.lines) : { net: 0, tax: 0, gross: 0 }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 pb-32 pt-1">
      <OfferBetaBanner step={step} />

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Angebot & E-Rechnung</h1>
        <p className="text-sm text-muted">
          Schritt {step} von 2 · KI-Modus: {getOfferAiMode()} (Testdaten)
        </p>
            {queueCount > 0 && (
          <p className="text-sm text-amber-200">
            {queueCount} Analyse(n) warten auf Netz — die Verarbeitung setzt automatisch fort, sobald Sie wieder
            online sind.
          </p>
        )}
      </header>

      {step === 1 && (
        <>
          <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4">
            <h2 className="text-lg font-semibold">Angebot per Foto oder Text</h2>
            <p className="text-sm text-muted">Bitte keine Personen fotografieren, nur Räume und Technik.</p>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="min-h-14 w-full"
              disabled={busy}
              onClick={() => cameraRef.current?.click()}
            >
              <Camera size={20} aria-hidden />
              Foto aufnehmen
            </Button>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void runAnalysis('photo', f)
              }}
            />
            <OfferTextInput
              disabled={busy}
              onAnalyzeText={(text) => {
                setLastInputPreview(text)
                void runAnalysis('dictation', undefined, text)
              }}
            />
            {lastInputPreview && (
              <p className="text-xs text-muted">Eingabe: „{lastInputPreview.slice(0, 120)}“</p>
            )}
            {busy && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="animate-spin" size={16} aria-hidden />
                KI analysiert…
              </p>
            )}
          </section>

          {offer && offer.lines.length > 0 && (
            <section className="space-y-3">
              <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100">
                Von KI erstellt – bitte prüfen (Art. 50 KI-VO)
              </div>
              <h2 className="text-lg font-semibold">{offer.title}</h2>
              <div className="grid gap-3">
                {offer.lines.map((line) => (
                  <OfferLineEditor
                    key={line.id}
                    line={line}
                    onChange={updateLine}
                    onConfirm={() => confirmLine(line)}
                  />
                ))}
              </div>
              <label className="block text-sm">
                Leistungszeitraum von
                <input
                  type="date"
                  className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3"
                  value={offer.servicePeriodStart}
                  onChange={(e) =>
                    void persist({ ...offer, servicePeriodStart: e.target.value, updatedAt: Date.now() })
                  }
                />
              </label>
              <label className="block text-sm">
                Leistungszeitraum bis
                <input
                  type="date"
                  className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3"
                  value={offer.servicePeriodEnd}
                  onChange={(e) =>
                    void persist({ ...offer, servicePeriodEnd: e.target.value, updatedAt: Date.now() })
                  }
                />
              </label>
            </section>
          )}
        </>
      )}

      {step === 2 && offer && (
        <>
          <OfferTaxDisclaimer />
          <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4">
            <h2 className="text-lg font-semibold">Rechnungsdaten (§ 14 UStG)</h2>
            <PartyFields
              label="Leistender Unternehmer"
              party={invoice.seller}
              onChange={(seller) => setInvoice({ ...invoice, seller })}
              showTax
            />
            <PartyFields
              label="Leistungsempfänger"
              party={invoice.buyer}
              onChange={(buyer) => setInvoice({ ...invoice, buyer })}
            />
            <label className="block text-sm">
              Rechnungsnummer
              <input
                className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3 text-base"
                value={invoice.invoiceNumber}
                onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Rechnungsdatum
                <input
                  type="date"
                  className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3"
                  value={invoice.issueDate}
                  onChange={(e) => setInvoice({ ...invoice, issueDate: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Fällig am
                <input
                  type="date"
                  className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3"
                  value={invoice.dueDate}
                  onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })}
                />
              </label>
            </div>
            <label className="block text-sm">
              IBAN (SEPA)
              <input
                className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3 text-base"
                value={invoice.iban}
                onChange={(e) => setInvoice({ ...invoice, iban: e.target.value })}
              />
            </label>
            <p className="text-sm text-muted">
              Summe netto {totals.net.toFixed(2)} € · USt {totals.tax.toFixed(2)} € · Brutto{' '}
              {totals.gross.toFixed(2)} €
            </p>
            {ustgIssues.length > 0 && (
              <ul className="space-y-1 text-sm text-amber-200">
                {ustgIssues.map((issue) => (
                  <li key={issue.field}>Fehlt: {issue.labelDe}</li>
                ))}
              </ul>
            )}
            {exportErrors.length > 0 && (
              <ul className="space-y-1 text-sm text-rose-200">
                {exportErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <div className="fixed inset-x-0 bottom-[calc(var(--nav-height,0px)+env(safe-area-inset-bottom))] z-40 border-t border-border bg-surface-1/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          {step === 1 ? (
            <Button type="button" size="lg" className="min-h-14 w-full" disabled={!allConfirmed} onClick={goStep2}>
              Weiter zur E-Rechnung
            </Button>
          ) : (
            <>
              <Button
                type="button"
                size="lg"
                className="min-h-14 w-full"
                disabled={exportBusy || ustgIssues.length > 0}
                onClick={() => void doExport('xml')}
              >
                <FileDown size={18} aria-hidden />
                XRechnung (UBL) herunterladen
              </Button>
              <Button
                type="button"
                size="lg"
                variant="secondary"
                className="min-h-14 w-full"
                disabled={exportBusy || ustgIssues.length > 0}
                onClick={() => void doExport('pdf')}
              >
                <FileDown size={18} aria-hidden />
                ZUGFeRD / Factur-X (PDF) herunterladen
              </Button>
              <Button type="button" variant="ghost" className="min-h-12 w-full" onClick={() => setStep(1)}>
                Zurück zu Schritt 1
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PartyFields({
  label,
  party,
  onChange,
  showTax,
}: {
  label: string
  party: InvoiceDraft['seller']
  onChange: (p: InvoiceDraft['seller']) => void
  showTax?: boolean
}) {
  return (
    <fieldset className="space-y-2 rounded-xl border border-border/80 p-3">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      {(['name', 'street', 'postCode', 'city', 'email'] as const).map((key) => (
        <label key={key} className="block text-sm capitalize">
          {key === 'postCode' ? 'PLZ' : key === 'email' ? 'E-Mail' : key === 'name' ? 'Name' : key === 'street' ? 'Straße' : 'Ort'}
          <input
            className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3 text-base"
            value={party[key]}
            onChange={(e) => onChange({ ...party, [key]: e.target.value })}
          />
        </label>
      ))}
      {showTax && (
        <>
          <label className="block text-sm">
            USt-IdNr.
            <input
              className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3"
              value={party.vatId}
              onChange={(e) => onChange({ ...party, vatId: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Steuernummer (alternativ)
            <input
              className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3"
              value={party.taxNumber}
              onChange={(e) => onChange({ ...party, taxNumber: e.target.value })}
            />
          </label>
        </>
      )}
    </fieldset>
  )
}
