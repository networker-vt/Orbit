import { Link } from 'react-router-dom'
import { LEGAL, LEGAL_ADDRESS_LINE } from '../../lib/legal'
import { LegalLayout } from './LegalLayout'

/** Store support URL. Both languages on one page so the link does not depend on locale. */
export function SupportPage() {
  return (
    <LegalLayout title="Support">
      <p className="rounded-xl border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">
        {LEGAL.operatorName} betreibt Allda als <strong>natürliche Person</strong>. Es gibt keine Firma,
        kein Support-Team und keine zugesagte Antwortzeit.
      </p>

      <h2>Kontakt</h2>
      <p>
        {LEGAL.operatorName}
        <br />
        {LEGAL_ADDRESS_LINE}, {LEGAL.country}
        <br />
        E-Mail: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>

      <h2>Wobei diese Adresse hilft</h2>
      <ul>
        <li>Fragen zur App Allda (PWA).</li>
        <li>Fehlermeldungen: was du getippt hast, welche Seite, was stattdessen passiert ist.</li>
        <li>
          Datenschutz: Auskunft oder Löschung. Lokale Demo-Daten liegen im Browser — Speicher leeren
          entfernt sie auf dem Gerät. Eine Kopie auf einem Server gibt es nur, wenn du selbst ein
          optionales Konto anbindest.
        </li>
      </ul>

      <h2>Was Support nicht ist</h2>
      <ul>
        <li>Kein Reisebüro, keine Airline, keine Bahn, kein Hotel.</li>
        <li>Keine Zahlungsstelle. Allda bewegt kein echtes Geld; Wallet und Credits sind Demo.</li>
        <li>Kein Anspruch auf eine Frist. Antwort nach Kapazität einer Privatperson.</li>
        <li>
          Allda Kids (wenn eingeschaltet): Fragen zur Eltern-PIN und zum Altersband — keine
          zertifizierte Kinderschutz-Hotline.
        </li>
      </ul>

      <h2>Kontaktstelle für Nutzer und Behörden</h2>
      <p>
        Meldungen zu Inhalten nimmst du in der App über „Inhalt melden“ auf (Inserat, Profil,
        Nachricht) oder per E-Mail an <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Dieselbe
        Adresse ist die Kontaktstelle für Nutzerinnen, Nutzer und Behörden (Deutsch und Englisch).
      </p>
      <p>
        So werden Meldungen bearbeitet: Sie liegen zuerst auf dem Gerät, das sie absendet, und —
        wenn ein Kontodienst verbunden ist — zusätzlich dort. {LEGAL.operatorName} liest Grund und
        Beschreibung, entfernt offensichtlich rechtswidrige Inhalte und sperrt bei schweren oder
        wiederholten Verstößen das Konto. Wenn ein Name oder eine E-Mail angegeben wurde, gibt es
        eine kurze Rückmeldung. Eine Beschwerde gegen die Entscheidung geht an dieselbe Adresse
        (siehe AGB, Art. 20 DSA). Es gibt keine feste Frist; es ist eine einzelne Person.
      </p>

      <h2>English</h2>
      <p>
        {LEGAL.operatorName} runs Allda as a <strong>private individual</strong>, not a company. There
        is no support team and no promised reply time.
      </p>
      <p>
        Write to <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> ({LEGAL_ADDRESS_LINE}, Germany)
        about the Allda app, a bug, or a privacy request. Local data stays in the browser until
        you clear site data. Allda does not sell tickets and does not take payment — wallet and
        credits are demo stubs. Allda Kids (when enabled) is a parental-PIN mode, not a certified
        safety hotline.
      </p>
      <p>
        Contact point for users and authorities (German and English):{' '}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Use “Report content” on a listing,
        profile or message, or write to that address. Reports are stored on the device (and on the
        account service when one is connected), reviewed by {LEGAL.operatorName}, and illegal
        content is removed. A short reply is sent when you leave an email. Complaints about a
        removal or block use the same address.
      </p>

      <nav className="flex flex-wrap gap-3 text-sm">
        <Link to="/impressum">Impressum</Link>
        <Link to="/privacy">Datenschutz / Privacy</Link>
        <Link to="/">Zur App</Link>
      </nav>
    </LegalLayout>
  )
}
