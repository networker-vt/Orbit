import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import {
  applyCustomerToInvoice,
  emptyCustomer,
  leitwegPortalHints,
  validateLeitweg,
} from '../customers'
import { listCustomers, newCustomerId, saveCustomer } from '../offerDb'
import type { InvoiceDraft, StoredCustomer } from '../types'

const fieldClass =
  'mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-3 px-3 text-base text-ink'

export function CustomerPanel({
  invoice,
  onApply,
}: {
  invoice: InvoiceDraft | null
  onApply: (draft: InvoiceDraft, customer: StoredCustomer) => void
}) {
  const [customers, setCustomers] = useState<StoredCustomer[]>([])
  const [form, setForm] = useState(emptyCustomer())
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const hints = leitwegPortalHints()

  const reload = async () => setCustomers(await listCustomers())

  useEffect(() => {
    void reload()
  }, [])

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const save = async () => {
    const issues = validateLeitweg(form)
    setErrors(issues.map((i) => i.labelDe))
    if (issues.length) return
    const now = Date.now()
    const customer: StoredCustomer = {
      id: newCustomerId(),
      createdAt: now,
      updatedAt: now,
      ...form,
      leitwegId: form.leitwegId.trim(),
    }
    await saveCustomer(customer)
    await reload()
    setStatus('Kunde gespeichert.')
    setForm(emptyCustomer())
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface-2 p-4" aria-labelledby="customer-heading">
      <h2 id="customer-heading" className="text-lg font-semibold text-ink">
        Kunden
      </h2>
      <p className="text-sm text-muted">Kunden anlegen und wiederverwenden (nur auf diesem Gerät).</p>

      <label className="block text-sm text-ink">
        Name
        <input className={fieldClass} value={form.name} onChange={(e) => set('name', e.target.value)} />
      </label>
      <label className="block text-sm text-ink">
        Straße
        <input className={fieldClass} value={form.street} onChange={(e) => set('street', e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm text-ink">
          PLZ
          <input
            className={fieldClass}
            inputMode="numeric"
            value={form.postCode}
            onChange={(e) => set('postCode', e.target.value)}
          />
        </label>
        <label className="block text-sm text-ink">
          Ort
          <input className={fieldClass} value={form.city} onChange={(e) => set('city', e.target.value)} />
        </label>
      </div>
      <label className="block text-sm text-ink">
        E-Mail
        <input
          className={fieldClass}
          type="email"
          inputMode="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
        />
      </label>

      <label className="flex min-h-12 items-start gap-3 text-sm text-ink">
        <input
          type="checkbox"
          className="mt-1 size-5 accent-[var(--theme-accent,#0f766e)]"
          checked={form.publicBuyer}
          onChange={(e) => set('publicBuyer', e.target.checked)}
        />
        öffentlicher Auftraggeber
      </label>

      {form.publicBuyer ? (
        <div className="space-y-2 rounded-xl border border-border bg-surface-3/60 p-3">
          <label className="block text-sm text-ink">
            Leitweg-ID (Pflicht, XRechnung BT-10)
            <input
              className={fieldClass}
              inputMode="text"
              value={form.leitwegId}
              onChange={(e) => set('leitwegId', e.target.value)}
            />
          </label>
          <p className="text-sm text-muted">{hints.bund}</p>
          <p className="flex flex-wrap gap-3 text-sm">
            <a
              href={hints.zreUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center text-cyan-200 underline underline-offset-2"
            >
              Bund ZRE
            </a>
            <a
              href={hints.ozgReUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center text-cyan-200 underline underline-offset-2"
            >
              OZG-RE
            </a>
          </p>
          <p className="text-sm text-muted">{hints.land}</p>
        </div>
      ) : null}

      <div aria-live="polite" className="text-sm">
        {status ? <p className="text-cyan-200">{status}</p> : null}
        {errors.length > 0 ? (
          <ul className="text-rose-200">
            {errors.map((e) => (
              <li key={e}>Fehlt: {e}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <Button type="button" size="lg" className="min-h-14 w-full" onClick={() => void save()}>
        Kunde speichern
      </Button>

      {customers.length > 0 ? (
        <ul className="space-y-2">
          {customers.map((c) => (
            <li key={c.id} className="rounded-xl border border-border p-3 text-sm">
              <p className="font-semibold text-ink">
                {c.name}
                {c.publicBuyer ? ' · öffentlicher Auftraggeber' : ''}
              </p>
              <p className="text-muted">
                {c.postCode} {c.city}
                {c.leitwegId ? ` · Leitweg ${c.leitwegId}` : ''}
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-2 min-h-12 w-full"
                disabled={!invoice}
                onClick={() => {
                  if (!invoice) return
                  onApply(applyCustomerToInvoice(invoice, c), c)
                  setStatus(`Kunde „${c.name}“ in Rechnung übernommen.`)
                }}
              >
                In Rechnung übernehmen
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
