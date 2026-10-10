import { Link } from 'react-router-dom'
import { isSupabaseConfigured } from '../../lib/supabase'
import { LEGAL, LEGAL_ADDRESS_LINE, isLegalPlaceholder } from '../../lib/legal'
import { LegalLayout } from './LegalLayout'

/**
 * Der frühere Kasten „Startklar für die öffentliche Demo…“ steht nicht mehr auf der Seite.
 * Er kommt erst zurück, wenn eine fachliche Prüfung da ist.
 */
export function DatenschutzPage() {
  return (
    <LegalLayout title="Datenschutz / Privacy">
      <p>
        Verantwortlich: {LEGAL.operatorName}, {LEGAL_ADDRESS_LINE}, {LEGAL.country}. E-Mail:{' '}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        {!isLegalPlaceholder(LEGAL.phone) ? `. Telefon: ${LEGAL.phone}.` : '.'}
      </p>
      <p>
        Orbit ist ein Marktplatz. Verträge über Jobs, Fahrten oder andere Leistungen kommen zwischen
        den Nutzerinnen und Nutzern zustande, nicht mit {LEGAL.operatorName}.
      </p>

      <h2>Welche Dienste wirklich laufen</h2>
      <ul>
        <li>
          <strong>GitHub Pages</strong> liefert die Web-App aus. Zweck: Betrieb der Seite.
          Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO. Empfänger: GitHub, Inc. (USA); Übermittlung
          auf Basis der Standardvertragsklauseln. Speicherdauer der Server-Logs: nach den Fristen
          von GitHub. Wir führen diese Logs nicht selbst.
        </li>
        <li>
          <strong>Speicher auf deinem Gerät</strong> (localStorage und der Cache der App). Zweck:
          Konto-Stub, Inserate, Nachrichten, Favoriten, Sprache, Altersbestätigung und Meldungen
          auf diesem Gerät zu halten. Rechtsgrundlage: § 25 Abs. 2 TDDDG (technisch erforderlich,
          kein Einwilligungsbanner) und Art. 6 Abs. 1 lit. b und lit. f DSGVO. Speicherdauer: bis
          du die Website-Daten in den Browser-Einstellungen löschst.
        </li>
        <li>
          <strong>Apple</strong> (Apple Inc. / Apple Distribution International Ltd.), wenn du die
          iOS-App installierst und öffnest. Zweck: Bereitstellung der App auf dem iPhone.
          Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Nutzung der App) und lit. f (sicherer
          Betrieb). Speicherdauer: nach den Regeln von Apple für App- und Gerätedaten. Die Web-App
          auf GitHub Pages sendet dadurch keine Daten an Apple.
        </li>
        {isSupabaseConfigured && (
          <li>
            <strong>Supabase</strong> speichert Konto und Inhalte, wenn die Verbindung in diesem
            Build eingeschaltet ist. Zweck: Anmeldung und Synchronisation. Rechtsgrundlage: Art. 6
            Abs. 1 lit. b DSGVO. Speicherdauer: bis zur Löschung, soweit keine gesetzliche Pflicht
            entgegensteht.
          </li>
        )}
      </ul>
      <h2>Kartenbilder</h2>
      <p>
        Die Kartenbilder lädt Ihr Browser von der OpenStreetMap Foundation (Großbritannien). Dabei erhält sie Ihre IP-Adresse und erkennt den Kartenausschnitt.{' '}
        <a href="https://osmfoundation.org/wiki/Privacy_Policy">https://osmfoundation.org/wiki/Privacy_Policy</a>
      </p>
      <p>
        Es gibt kein Analyse-Werkzeug und keine Werbung von Dritten. Wenn du einen Suchlink
        (bahn.de, Google Flights, Booking, Kayak) selbst öffnest, gilt die Datenschutzerklärung
        der jeweiligen Seite. Orbit ruft diese Seiten nicht im Hintergrund auf.
      </p>

      <h2>Was auf dem Gerät liegt</h2>
      <ul>
        <li>Anmelde-Stub, Profil, Inserate, Nachrichten, Favoriten: bis du den Speicher leerst.</li>
        <li>
          Altersbestätigung (mindestens 18 Jahre): Zeitpunkt der Bestätigung im localStorage, bis
          du den Speicher leerst. Es gibt kein eigenes Server-Feld dafür.
        </li>
        <li>
          Inhaltsmeldungen: Grund, Beschreibung, optional Name und E-Mail, bis du den Speicher
          leerst oder wir die Meldung nach der Prüfung löschen.
        </li>
        <li>Sprache und Darstellung: bis du sie änderst oder den Speicher leerst.</li>
      </ul>

      <h2>Firmendaten im Verzeichnis (Art. 14 DSGVO)</h2>
      <p>
        Im Firmenverzeichnis stehen Name, Ort und ein Link zur Website oder zu Dry-Hire. Quelle:
        öffentlich zugängliche Firmenangaben und dry-hire.com. Telefonnummern und E-Mail-Adressen
        der Firmen speichern wir in der App nicht. Zweck: ein Verzeichnis, um Veranstaltungstechnik
        zu finden. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem
        Verzeichnis öffentlich bekannter Geschäftsdaten). Empfänger: Besucherinnen und Besucher der
        App. Speicherdauer: bis die nächste Version den Eintrag entfernt oder ein Löschwunsch
        eingeht. Löschung und Berichtigung: E-Mail an{' '}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <h2>Alter</h2>
      <p>
        Orbit richtet sich an Personen ab 18 Jahren. Bei der Anmeldung bestätigst du das. Die
        Bestätigung liegt nur auf diesem Gerät.
      </p>

      <h2>Deine Rechte</h2>
      <p>
        Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch
        nach der DSGVO, außerdem Beschwerde bei einer Aufsichtsbehörde (für NRW: LDI NRW).
        Lokale Daten entfernst du selbst, indem du die Website-Daten löschst. Für alles andere
        reicht eine E-Mail an <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <h2>English</h2>
      <p>
        Controller: {LEGAL.operatorName}, {LEGAL_ADDRESS_LINE}, Germany. Email:{' '}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        {!isLegalPlaceholder(LEGAL.phone) ? `. Phone: ${LEGAL.phone}.` : '.'}
      </p>
      <p>
        Active services: GitHub Pages (hosting the web app), storage on your device (technically
        necessary under § 25 (2) TDDDG, no consent banner), and Apple when you use the iOS app.
        {isSupabaseConfigured ? ' Supabase stores the account when that connection is enabled.' : ''}{' '}
        Map images are loaded by your browser from the OpenStreetMap Foundation (United Kingdom).
        That request includes your IP address and identifies the map area (
        <a href="https://osmfoundation.org/wiki/Privacy_Policy">https://osmfoundation.org/wiki/Privacy_Policy</a>
        ). There is no analytics tool. Opening a search link (bahn.de, Google Flights, Booking, Kayak)
        is your request; that site then applies its own policy. Orbit does not call those sites in
        the background.
      </p>
      <p>
        Company directory (Art. 14 GDPR): name, city and a website or dry-hire link from public
        business sources. No company phone numbers or emails are stored in the app. Legal basis:
        legitimate interest in a directory of public business data. Deletion:{' '}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Orbit is for people aged 18 or over.
        You confirm that at sign-up; the confirmation stays on this device until you clear site
        data.
      </p>

      <nav className="flex flex-wrap gap-3 text-sm">
        <Link to="/impressum">Impressum</Link>
        <Link to="/support">Support</Link>
        <Link to="/agb">AGB</Link>
        <Link to="/ranking">Ranking</Link>
      </nav>
    </LegalLayout>
  )
}
