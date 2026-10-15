import { Camera, FileDown, Loader2, Share2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { analyzeOfferInput, getOfferAiMode } from './aiProvider'
import { OfferBetaBanner, OfferTaxDisclaimer } from './components/OfferBetaBanner'
import { OfferLegalFooter } from './components/OfferLegalFooter'
import { OfferProgress } from './components/OfferProgress'
import { OfferTextInput } from './components/OfferTextInput'
import { OfferLineEditor } from './components/OfferLineEditor'
import { CompanyProfileForm } from './components/CompanyProfileForm'
import { OfferBackupPanel } from './components/OfferBackupPanel'
import { CustomerPanel } from './components/CustomerPanel'
import { CatalogPanel } from './components/CatalogPanel'
import { SitePhotosPanel } from './components/SitePhotosPanel'
import { downloadBlob, exportXRechnungXml, exportZugferdPdf } from './einvoiceExport'
import { listenOnlineDrain, pendingAiCount, queueAiJob } from './offerAiQueue'
import { OfferBusinessGate } from './components/OfferBusinessGate'
import {
  getBusinessConsent,
  getCompanyProfile,
  listInvoices,
  listOffers,
  newOfferId,
  saveInvoice,
  saveOffer,
  setBusinessConsentAccepted,
} from './offerDb'
import {
  buildStoredInvoiceFromDraft,
  convertOfferToInvoiceDraft,
  markInvoiceExported,
  stornoAndNewInvoice,
} from './invoiceConvert'
import { applyProfileToInvoice } from './companyProfile'
import { sharePdfFile } from './sharePdf'
import type {
  CompanyProfile,
  InvoiceDraft,
  InvoicePaymentStatus,
  OfferLineItem,
  StoredInvoice,
  StoredOffer,
} from './types'
import { KLEINUNTERNEHMER_HINT, RETENTION_NOTE_PRIVATE_BAU } from './types'
import { lineTotals, taxBreakdown, validateUstg14 } from './ustg14'

function lineId() {
  return `ln-${Math.random().toString(36).slice(2, 10)}`
}

const fieldClass =
  'mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3 text-base text-ink'

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
  const [panel, setPanel] = useState<
    'flow' | 'profile' | 'backup' | 'invoices' | 'customers' | 'catalog' | 'photos'
  >('flow')
  const [offer, setOffer] = useState<StoredOffer | null>(null)
  const [invoice, setInvoice] = useState<InvoiceDraft | null>(null)
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [invoices, setInvoices] = useState<StoredInvoice[]>([])
  const [activeStored, setActiveStored] = useState<StoredInvoice | null>(null)
  const [busy, setBusy] = useState(false)
  const [queueCount, setQueueCount] = useState(pendingAiCount())
  const [exportBusy, setExportBusy] = useState(false)
  const [exportErrors, setExportErrors] = useState<string[]>([])
  const [statusMsg, setStatusMsg] = useState('')
  const cameraRef = useRef<HTMLInputElement>(null)
  const [lastInputPreview, setLastInputPreview] = useState('')

  const reloadMeta = useCallback(async () => {
    const [p, invs] = await Promise.all([getCompanyProfile(), listInvoices()])
    setProfile(p)
    setInvoices(invs)
    const due = invs.filter(
      (i) =>
        i.status === 'exported' &&
        i.paymentStatus !== 'bezahlt' &&
        i.reminderAt != null &&
        i.reminderAt <= Date.now(),
    )
    if (due.length > 0) {
      setStatusMsg(
        `Lokale Erinnerung: ${due.length} Rechnung(en) (${due.map((d) => d.invoiceNumber).join(', ')}).`,
      )
    }
  }, [])

  useEffect(() => {
    void reloadMeta()
  }, [reloadMeta])

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
  const readOnly = activeStored?.status === 'exported'

  const goToInvoice = async () => {
    if (!allConfirmed || !offer) return
    setExportBusy(true)
    setExportErrors([])
    try {
      const draft = await convertOfferToInvoiceDraft(offer, profile)
      setInvoice(draft)
      setActiveStored(null)
      setStep(2)
      setPanel('flow')
      setStatusMsg(`Rechnung ${draft.invoiceNumber} angelegt.`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setExportErrors([err instanceof Error ? err.message : 'Umwandlung fehlgeschlagen'])
    } finally {
      setExportBusy(false)
    }
  }

  const updateLine = (line: OfferLineItem) => {
    if (!offer || readOnly) return
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
    offer && invoice && step === 2 ? validateUstg14(offer, invoice, offer.lines, profile) : []

  const persistExported = async (kind: 'xml' | 'pdf' | 'share') => {
    if (!offer || !invoice) return
    const issues = validateUstg14(offer, invoice, offer.lines, profile)
    if (issues.length > 0) {
      setExportErrors(issues.map((i) => i.labelDe))
      return
    }
    if (readOnly && kind !== 'share' && kind !== 'pdf' && kind !== 'xml') return

    setExportBusy(true)
    setExportErrors([])
    setStatusMsg('')
    try {
      // Re-apply profile into seller before export
      const draft = profile ? applyProfileToInvoice(invoice, profile) : invoice
      setInvoice(draft)

      if (kind === 'xml') {
        const xml = await exportXRechnungXml(offer, draft, offer.lines)
        downloadBlob(`${draft.invoiceNumber}.xml`, new Blob([xml], { type: 'application/xml' }))
      } else {
        const pdf = await exportZugferdPdf(offer, draft, offer.lines, profile)
        if (kind === 'share') {
          await sharePdfFile(`${draft.invoiceNumber}-zugferd.pdf`, pdf)
        } else {
          downloadBlob(
            `${draft.invoiceNumber}-zugferd.pdf`,
            new Blob([Uint8Array.from(pdf)], { type: 'application/pdf' }),
          )
        }
      }

      if (!readOnly) {
        const stored = buildStoredInvoiceFromDraft(offer, draft, offer.lines, { status: 'exported' })
        const saved = await markInvoiceExported(stored)
        setActiveStored(saved)
        await reloadMeta()
        setStatusMsg('Rechnung exportiert — nur noch lesbar (Änderungen: Storno + neue Rechnung).')
      }
    } catch (err) {
      setExportErrors([err instanceof Error ? err.message : 'Export fehlgeschlagen'])
    } finally {
      setExportBusy(false)
    }
  }

  const doStorno = async () => {
    if (!activeStored || activeStored.status !== 'exported') return
    setExportBusy(true)
    try {
      const result = await stornoAndNewInvoice(activeStored, profile)
      setOffer(result.offerSlice)
      setInvoice(result.draft)
      setActiveStored(null)
      setStep(2)
      await reloadMeta()
      setStatusMsg(`Storno von ${result.cancelled.invoiceNumber}. Neue Nummer: ${result.draft.invoiceNumber}.`)
    } catch (err) {
      setExportErrors([err instanceof Error ? err.message : 'Storno fehlgeschlagen'])
    } finally {
      setExportBusy(false)
    }
  }

  const totals = offer ? lineTotals(offer.lines) : { net: 0, tax: 0, gross: 0 }
  const breakdown = offer ? taxBreakdown(offer.lines) : []

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 pb-36 pt-1">
      <OfferBetaBanner step={step} />

      <header className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Angebot & E-Rechnung</h1>
        <OfferProgress
          current={
            panel === 'profile'
              ? 'profile'
              : panel === 'customers'
                ? 'customer'
                : step === 2
                  ? 'invoice'
                  : offer?.lines.length
                    ? 'lines'
                    : 'offer'
          }
        />
        <p className="text-sm text-muted">
          KI-Modus: {getOfferAiMode()} — Ergebnis ist ein{' '}
          <span className="font-semibold text-amber-100">Beispiel, keine echte Auswertung</span>.
        </p>
        {queueCount > 0 && (
          <p className="text-sm text-amber-200" aria-live="polite">
            {queueCount} Analyse(n) warten auf Netz — die Verarbeitung setzt automatisch fort, sobald Sie wieder
            online sind.
          </p>
        )}
      </header>

      <nav className="grid grid-cols-2 gap-2" aria-label="Angebot-Bereiche">
        {(
          [
            ['flow', 'Angebot'],
            ['profile', 'Firmenprofil'],
            ['customers', 'Kunden'],
            ['catalog', 'Materialliste'],
            ['photos', 'Fotos'],
            ['backup', 'Sicherung'],
            ['invoices', 'Rechnungen'],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            type="button"
            variant={panel === id ? 'primary' : 'secondary'}
            className="min-h-12"
            onClick={() => setPanel(id)}
          >
            {label}
          </Button>
        ))}
      </nav>

      <div aria-live="polite" className="text-sm">
        {statusMsg ? <p className="text-cyan-200">{statusMsg}</p> : null}
        {exportErrors.length > 0 ? (
          <ul className="space-y-1 text-rose-200">
            {exportErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {panel === 'profile' && (
        <CompanyProfileForm
          initial={profile}
          onSaved={(p) => {
            setProfile(p)
            if (invoice) setInvoice(applyProfileToInvoice(invoice, p))
          }}
        />
      )}

      {panel === 'backup' && <OfferBackupPanel onImported={() => void reloadMeta()} />}

      {panel === 'customers' && (
        <CustomerPanel
          invoice={invoice}
          onApply={(draft) => {
            setInvoice(draft)
            setPanel('flow')
            setStep(2)
          }}
        />
      )}

      {panel === 'catalog' && (
        <CatalogPanel
          onAddLine={(line) => {
            if (!offer) {
              const id = newOfferId()
              const next: StoredOffer = {
                id,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                captureKind: 'dictation',
                title: 'Angebot aus Materialliste',
                lines: [line],
                servicePeriodStart: new Date().toISOString().slice(0, 10),
                servicePeriodEnd: new Date().toISOString().slice(0, 10),
                synced: false,
                sitePhotos: [],
              }
              void persist(next)
            } else {
              void persist({
                ...offer,
                lines: [...offer.lines, line],
                updatedAt: Date.now(),
              })
            }
            setPanel('flow')
            setStep(1)
            setStatusMsg('Position aus Materialliste übernommen.')
          }}
        />
      )}

      {panel === 'photos' && (
        <SitePhotosPanel
          photos={offer?.sitePhotos ?? []}
          onChange={(sitePhotos) => {
            if (!offer) {
              const id = newOfferId()
              void persist({
                id,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                captureKind: 'photo',
                title: 'Angebot mit Baustellenfotos',
                lines: [],
                servicePeriodStart: new Date().toISOString().slice(0, 10),
                servicePeriodEnd: new Date().toISOString().slice(0, 10),
                synced: false,
                sitePhotos,
              })
            } else {
              void persist({ ...offer, sitePhotos, updatedAt: Date.now() })
            }
          }}
        />
      )}

      {panel === 'invoices' && (
        <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4">
          <h2 className="text-lg font-semibold text-ink">Gespeicherte Rechnungen</h2>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted">Noch keine exportierten Rechnungen.</p>
          ) : (
            <ul className="space-y-2">
              {invoices.map((inv) => (
                <li key={inv.id} className="rounded-xl border border-border p-3 text-sm">
                  <p className="font-semibold text-ink">
                    {inv.invoiceNumber} · {inv.status === 'cancelled' ? 'storniert' : 'exportiert (nur lesen)'}
                  </p>
                  <p className="text-muted">
                    {inv.issueDate} · {inv.totals.gross.toFixed(2)} €
                  </p>
                  {inv.status === 'exported' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-2 min-h-12 w-full"
                      onClick={() => {
                        setActiveStored(inv)
                        setOffer({
                          id: inv.offerId,
                          createdAt: inv.createdAt,
                          updatedAt: inv.updatedAt,
                          captureKind: 'dictation',
                          title: `Rechnung ${inv.invoiceNumber}`,
                          lines: inv.lines,
                          servicePeriodStart: inv.servicePeriodStart,
                          servicePeriodEnd: inv.servicePeriodEnd,
                          synced: false,
                        })
                        setInvoice({
                          invoiceNumber: inv.invoiceNumber,
                          issueDate: inv.issueDate,
                          dueDate: inv.dueDate,
                          buyerReference: inv.buyerReference,
                          iban: inv.iban,
                          bic: inv.bic,
                          seller: inv.seller,
                          buyer: inv.buyer,
                          buyerIsPrivatePerson: inv.buyerIsPrivatePerson,
                          bauGrundstueckLeistung: inv.bauGrundstueckLeistung,
                          kleinunternehmer: inv.kleinunternehmer,
                          customerId: inv.customerId ?? null,
                          publicBuyer: inv.publicBuyer ?? false,
                          leitwegId: inv.leitwegId ?? '',
                        })
                        setStep(2)
                        setPanel('flow')
                      }}
                    >
                      Anzeigen
                    </Button>
                  ) : null}
                  {inv.status === 'exported' ? (
                    <div className="mt-2 space-y-2">
                      <label className="block text-sm text-ink">
                        Status
                        <select
                          className={fieldClass}
                          value={inv.paymentStatus ?? 'offen'}
                          onChange={(e) => {
                            const paymentStatus = e.target.value as InvoicePaymentStatus
                            const next = { ...inv, paymentStatus, updatedAt: Date.now() }
                            void saveInvoice(next).then(() => reloadMeta())
                          }}
                        >
                          <option value="offen">offen</option>
                          <option value="bezahlt">bezahlt</option>
                          <option value="ueberfaellig">überfällig</option>
                        </select>
                      </label>
                      <label className="block text-sm text-ink">
                        Lokale Erinnerung
                        <input
                          type="datetime-local"
                          className={fieldClass}
                          value={
                            inv.reminderAt
                              ? new Date(inv.reminderAt).toISOString().slice(0, 16)
                              : ''
                          }
                          onChange={(e) => {
                            const reminderAt = e.target.value
                              ? new Date(e.target.value).getTime()
                              : null
                            const next = { ...inv, reminderAt, updatedAt: Date.now() }
                            void saveInvoice(next).then(() => reloadMeta())
                          }}
                        />
                      </label>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {panel === 'flow' && step === 1 && (
        <>
          <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4">
            <h2 className="text-lg font-semibold text-ink">Angebot per Foto oder Text</h2>
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
              <p className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
                <Loader2 className="animate-spin" size={16} aria-hidden />
                KI analysiert…
              </p>
            )}
          </section>

          {offer && offer.lines.length > 0 && (
            <section className="space-y-3">
              <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100">
                Beispiel, keine echte Auswertung — bitte prüfen (Art. 50 KI-VO)
              </div>
              <h2 className="text-lg font-semibold text-ink">{offer.title}</h2>
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
              <label className="block text-sm text-ink">
                Leistungszeitraum von
                <input
                  type="date"
                  className={fieldClass}
                  value={offer.servicePeriodStart}
                  onChange={(e) =>
                    void persist({ ...offer, servicePeriodStart: e.target.value, updatedAt: Date.now() })
                  }
                />
              </label>
              <label className="block text-sm text-ink">
                Leistungszeitraum bis
                <input
                  type="date"
                  className={fieldClass}
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

      {panel === 'flow' && step === 2 && offer && invoice && (
        <>
          <OfferTaxDisclaimer />
          {readOnly ? (
            <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-50" role="status">
              Diese Rechnung ist nach dem Export nur noch lesbar. Änderungen nur über Storno + neue Rechnung.
            </p>
          ) : null}
          {invoice.kleinunternehmer ? (
            <p className="rounded-xl border border-border bg-surface-3/80 px-3 py-2 text-sm text-ink">
              {KLEINUNTERNEHMER_HINT}
            </p>
          ) : null}

          <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4">
            <h2 className="text-lg font-semibold text-ink">Rechnungsdaten (§ 14 Abs. 4 UStG)</h2>
            <PartyFields
              label="Leistender Unternehmer"
              party={invoice.seller}
              onChange={(seller) => setInvoice({ ...invoice, seller })}
              showTax
              disabled={readOnly}
            />
            <PartyFields
              label="Leistungsempfänger"
              party={invoice.buyer}
              onChange={(buyer) => setInvoice({ ...invoice, buyer })}
              disabled={readOnly}
            />

            <label className="flex min-h-12 items-center gap-3 text-sm text-ink">
              <input
                type="checkbox"
                className="size-5 accent-[var(--theme-accent,#0f766e)]"
                checked={invoice.publicBuyer}
                disabled={readOnly}
                onChange={(e) =>
                  setInvoice({
                    ...invoice,
                    publicBuyer: e.target.checked,
                    buyerIsPrivatePerson: e.target.checked ? false : invoice.buyerIsPrivatePerson,
                    buyerReference: e.target.checked ? invoice.leitwegId : invoice.buyerReference,
                  })
                }
              />
              öffentlicher Auftraggeber
            </label>
            {invoice.publicBuyer ? (
              <label className="block text-sm text-ink">
                Leitweg-ID (XRechnung BT-10)
                <input
                  className={fieldClass}
                  value={invoice.leitwegId}
                  disabled={readOnly}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      leitwegId: e.target.value,
                      buyerReference: e.target.value,
                    })
                  }
                />
              </label>
            ) : null}
            <label className="flex min-h-12 items-center gap-3 text-sm text-ink">
              <input
                type="checkbox"
                className="size-5 accent-[var(--theme-accent,#0f766e)]"
                checked={invoice.buyerIsPrivatePerson}
                disabled={readOnly || invoice.publicBuyer}
                onChange={(e) => setInvoice({ ...invoice, buyerIsPrivatePerson: e.target.checked })}
              />
              Leistungsempfänger ist Privatperson
            </label>
            <label className="flex min-h-12 items-center gap-3 text-sm text-ink">
              <input
                type="checkbox"
                className="size-5 accent-[var(--theme-accent,#0f766e)]"
                checked={invoice.bauGrundstueckLeistung}
                disabled={readOnly}
                onChange={(e) => setInvoice({ ...invoice, bauGrundstueckLeistung: e.target.checked })}
              />
              Leistung im Zusammenhang mit einem Grundstück (Bau)
            </label>
            {invoice.buyerIsPrivatePerson && invoice.bauGrundstueckLeistung ? (
              <p className="text-sm font-medium text-ink">{RETENTION_NOTE_PRIVATE_BAU}</p>
            ) : null}

            <label className="block text-sm text-ink">
              Rechnungsnummer
              <input className={fieldClass} value={invoice.invoiceNumber} readOnly disabled />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-ink">
                Rechnungsdatum
                <input
                  type="date"
                  className={fieldClass}
                  value={invoice.issueDate}
                  disabled={readOnly}
                  onChange={(e) => setInvoice({ ...invoice, issueDate: e.target.value })}
                />
              </label>
              <label className="block text-sm text-ink">
                Fällig am
                <input
                  type="date"
                  className={fieldClass}
                  value={invoice.dueDate}
                  disabled={readOnly}
                  onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })}
                />
              </label>
            </div>
            <label className="block text-sm text-ink">
              IBAN (SEPA)
              <input
                className={fieldClass}
                inputMode="text"
                spellCheck={false}
                value={invoice.iban}
                disabled={readOnly}
                onChange={(e) => setInvoice({ ...invoice, iban: e.target.value })}
              />
            </label>
            <label className="block text-sm text-ink">
              BIC
              <input
                className={fieldClass}
                inputMode="text"
                spellCheck={false}
                value={invoice.bic}
                disabled={readOnly}
                onChange={(e) => setInvoice({ ...invoice, bic: e.target.value })}
              />
            </label>

            <div className="space-y-1 text-sm text-ink">
              <p>
                Summe netto {totals.net.toFixed(2)} € · USt {totals.tax.toFixed(2)} € · Brutto{' '}
                {totals.gross.toFixed(2)} €
              </p>
              {breakdown.map((row) => (
                <p key={row.rate} className="text-muted">
                  Entgelt {row.rate}%: {row.net.toFixed(2)} € · Steuerbetrag: {row.tax.toFixed(2)} €
                </p>
              ))}
            </div>

            {ustgIssues.length > 0 && (
              <ul className="space-y-1 text-sm text-amber-200" aria-live="polite">
                {ustgIssues.map((issue) => (
                  <li key={`${issue.field}-${issue.labelDe}`}>Fehlt: {issue.labelDe}</li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <OfferLegalFooter />

      {panel === 'flow' && (
        <div className="fixed inset-x-0 bottom-[calc(var(--nav-height,0px)+env(safe-area-inset-bottom))] z-40 border-t border-border bg-surface-1/95 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-lg flex-col gap-2">
            {step === 1 ? (
              <Button
                type="button"
                size="lg"
                className="min-h-14 w-full"
                disabled={!allConfirmed || exportBusy}
                onClick={() => void goToInvoice()}
              >
                Angebot → Rechnung
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="lg"
                  className="min-h-14 w-full"
                  disabled={exportBusy || ustgIssues.length > 0}
                  onClick={() => void persistExported('xml')}
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
                  onClick={() => void persistExported('pdf')}
                >
                  <FileDown size={18} aria-hidden />
                  ZUGFeRD / Factur-X (PDF) herunterladen
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="tonal"
                  className="min-h-14 w-full"
                  disabled={exportBusy || ustgIssues.length > 0}
                  onClick={() => void persistExported('share')}
                >
                  <Share2 size={18} aria-hidden />
                  Als PDF teilen
                </Button>
                {readOnly ? (
                  <Button
                    type="button"
                    variant="danger"
                    className="min-h-12 w-full"
                    disabled={exportBusy}
                    onClick={() => void doStorno()}
                  >
                    Storno + neue Rechnung
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" className="min-h-12 w-full" onClick={() => setStep(1)}>
                  Zurück zu Positionen
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PartyFields({
  label,
  party,
  onChange,
  showTax,
  disabled,
}: {
  label: string
  party: InvoiceDraft['seller']
  onChange: (p: InvoiceDraft['seller']) => void
  showTax?: boolean
  disabled?: boolean
}) {
  return (
    <fieldset className="space-y-2 rounded-xl border border-border/80 p-3" disabled={disabled}>
      <legend className="px-1 text-sm font-semibold text-ink">{label}</legend>
      {(
        [
          ['name', 'Name', 'text'],
          ['street', 'Straße', 'text'],
          ['postCode', 'PLZ', 'numeric'],
          ['city', 'Ort', 'text'],
          ['email', 'E-Mail', 'email'],
        ] as const
      ).map(([key, lab, mode]) => (
        <label key={key} className="block text-sm text-ink">
          {lab}
          <input
            className={fieldClass}
            inputMode={mode}
            type={key === 'email' ? 'email' : 'text'}
            value={party[key]}
            disabled={disabled}
            onChange={(e) => onChange({ ...party, [key]: e.target.value })}
          />
        </label>
      ))}
      {showTax && (
        <>
          <label className="block text-sm text-ink">
            USt-IdNr.
            <input
              className={fieldClass}
              value={party.vatId}
              disabled={disabled}
              onChange={(e) => onChange({ ...party, vatId: e.target.value })}
            />
          </label>
          <label className="block text-sm text-ink">
            Steuernummer (alternativ)
            <input
              className={fieldClass}
              value={party.taxNumber}
              disabled={disabled}
              onChange={(e) => onChange({ ...party, taxNumber: e.target.value })}
            />
          </label>
        </>
      )}
    </fieldset>
  )
}
