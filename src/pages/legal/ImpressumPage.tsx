import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LEGAL, LEGAL_ADDRESS_LINE, copyrightLine, isLegalPlaceholder } from '../../lib/legal'
import { LegalLayout } from './LegalLayout'

export function ImpressumPage() {
  const [sent, setSent] = useState(false)

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const message = String(data.get('message') || '').trim()
    const name = String(data.get('name') || '').trim()
    if (!message) return
    const subject = encodeURIComponent('Orbit Kontaktformular')
    const body = encodeURIComponent(`${name ? `Name: ${name}\n\n` : ''}${message}`)
    setSent(true)
    window.location.href = `mailto:${LEGAL.email}?subject=${subject}&body=${body}`
  }

  return (
    <LegalLayout title="Impressum">
      <p className="rounded-xl border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">
        Angaben einer <strong>natürlichen Person</strong> ({LEGAL.form}). Es besteht{' '}
        <strong>kein Handelsregistereintrag</strong> und keine GmbH. Stand: {LEGAL.year}.
      </p>

      <h2>Angaben gemäß § 5 DDG (ehem. TMG)</h2>
      <p>
        <strong>{LEGAL.operatorName}</strong>
        <br />
        {LEGAL.brand} — Marktplatz für jeden Job und jeden Auftrag (privat betrieben)
        <br />
        {LEGAL.street}
        <br />
        {LEGAL.zip} {LEGAL.city}
        <br />
        {LEGAL.country}
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail:{' '}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        {!isLegalPlaceholder(LEGAL.phone) && (
          <>
            <br />
            Telefon: {LEGAL.phone}
          </>
        )}
        <br />
        Anschrift: {LEGAL_ADDRESS_LINE}
      </p>
      <form onSubmit={send} className="space-y-2 rounded-xl border border-border p-3">
        <p className="text-sm font-medium">Kontaktformular</p>
        <label className="block text-sm">
          Name (optional)
          <input name="name" className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface-3 px-3" />
        </label>
        <label className="block text-sm">
          Nachricht
          <textarea name="message" required className="mt-1 min-h-24 w-full rounded-xl border border-border bg-surface-3 px-3 py-2" />
        </label>
        <button type="submit" className="min-h-11 rounded-xl bg-cyan px-4 text-sm font-semibold text-black">
          Nachricht senden
        </button>
        {sent && <p className="text-sm text-neutral-200">Dein E-Mail-Programm öffnet sich mit der Nachricht.</p>}
      </form>
      <p>
        <Link to="/privacy">Datenschutz / Privacy</Link>
        {' · '}
        <Link to="/support">Support</Link>
        {' · '}
        <Link to="/agb">AGB</Link>
      </p>

      {!isLegalPlaceholder(LEGAL.tradeStatus) && (
        <>
          <h2>Gewerbe</h2>
          <p>
            {LEGAL.tradeStatus} Solange Orbit ohne Gewinnabsicht privat betrieben wird, bleibt der Hinweis
            „privat betrieben“ stehen. Sobald eine Gewinnabsicht besteht, diesen Hinweis entfernen und die
            Gewerbeangaben nachtragen.
          </p>
        </>
      )}

      <h2>Register & Umsatzsteuer</h2>
      <p>
        Kein Eintrag im Handelsregister (keine Kaufmannseigenschaft nach HGB / keine Kapitalgesellschaft).
        Eine Umsatzsteuer-Identifikationsnummer wurde nicht mitgeteilt. Soweit umsatzsteuerpflichtige
        Leistungen angeboten werden, gelten die gesetzlichen Vorschriften.
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        {LEGAL.operatorName}, {LEGAL_ADDRESS_LINE}
      </p>

      <h2>Streitbeilegung</h2>
      <p>
        Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <p className="text-sm text-muted">{copyrightLine()}</p>
    </LegalLayout>
  )
}
