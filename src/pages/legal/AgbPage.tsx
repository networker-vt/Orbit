import { Link } from 'react-router-dom'
import { LEGAL } from '../../lib/legal'
import { LegalLayout } from './LegalLayout'

export function AgbPage() {
  return (
    <LegalLayout title="Allgemeine Geschäftsbedingungen (AGB)">
      <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <strong>Startklar, aber nicht anwaltlich geprüft.</strong> Für den Marktplatz
        (Angebote und Gesuche — Reise, Services, B2B, Jobs und mehr)
        braucht es vor kommerziellem Betrieb eine fachliche AGB-Prüfung — Haftungs-,
        Vermittlungs- und Entgeltregeln sind hier bewusst vorsichtig formuliert und können
        sich ändern.
      </p>

      <h2>§ 1 Geltungsbereich und Rolle</h2>
      <p>
        Diese Bedingungen gelten für die Nutzung von {LEGAL.brand}, betrieben von {LEGAL.operatorName}
        , {LEGAL.street}, {LEGAL.zip} {LEGAL.city} ({LEGAL.form}). {LEGAL.operatorName} ist
        Vermittler: Die Plattform zeigt Angebote und Gesuche und stellt Kontakt her. Ein Vertrag
        über eine Leistung (Job, Fahrt, Miete, Dienst) kommt zwischen den Nutzerinnen und Nutzern
        zustande, nicht mit dem Betreiber.
      </p>

      <h2>§ 2 Wer mitmachen darf</h2>
      <p>
        Marktplatz-Konten (Inserate, Chat, Jobs, Wallet) sind Personen ab 18 Jahren vorbehalten.
        Mit der Anmeldung bestätigst du das. Es gibt keine vollwertigen Kinder-Konten mit Credits
        oder Adult-Funktionen.
      </p>
      <p>
        <strong>Orbit Kids</strong> (wenn in der App eingeschaltet) ist ein eingeschränkter Modus
        hinter einer Eltern-PIN: Campus und Assist ohne Wallet, ohne öffentlichen Chat und ohne
        Adult-Buchung. Eltern richten PIN und Altersband auf dem Gerät ein. Das ersetzt keine
        zertifizierte Jugendschutz- oder Elternkontroll-Software.
      </p>

      <h2>§ 3 Nutzung und verbotene Inhalte</h2>
      <p>Du stellst nur Inhalte ein, zu denen du berechtigt bist. Verboten sind insbesondere:</p>
      <ul>
        <li>rechtswidrige, beleidigende oder irreführende Inhalte,</li>
        <li>Inhalte, die Minderjährige sexualisieren oder gefährden,</li>
        <li>Spam, Betrug und das Ausgeben eines privaten Angebots als gewerblich oder umgekehrt.</li>
      </ul>

      <h2>§ 4 Moderation, Sperre, Meldung</h2>
      <p>
        Jedes Inserat, jedes Profil und jede Nachricht kann gemeldet werden. Der Betreiber prüft
        Meldungen nach den hier beschriebenen Regeln (Digital Services Act Art. 14). Offensichtlich
        rechtswidrige Inhalte werden entfernt. Das Konto kann gesperrt werden, wenn diese Regeln
        schwer oder wiederholt verletzt werden. Eine Entscheidung dazu wird begründet, soweit ein
        Kontaktweg angegeben wurde.
      </p>
      <p>
        Beschwerde (Art. 20 DSA): Wenn du mit einer Entfernung oder Sperre nicht einverstanden bist,
        schreib an <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Die Beschwerde wird von
        einer Person geprüft, die nicht an der ersten Entscheidung beteiligt war, soweit das bei
        einer einzelnen betreibenden Person möglich ist — sonst erneut und mit kurzer Begründung.
      </p>

      <h2>§ 5 Rechte an Inhalten</h2>
      <p>
        Du behältst die Rechte an deinen Texten und Bildern. Du räumst dem Betreiber ein einfaches
        Nutzungsrecht ein, die Inhalte in der App anzuzeigen, solange das Inserat oder die Nachricht
        gespeichert ist. Das Recht endet, wenn du den Inhalt löschst, soweit keine Kopie für eine
        gesetzliche Pflicht nötig bleibt.
      </p>

      <h2>§ 6 Kennzeichnung und Ranking</h2>
      <p>
        Inserate sind als privat oder gewerblich gekennzeichnet. Gewerbliche Inserate nennen Name,
        Anschrift, E-Mail und Telefon.         Die Reihenfolge erklärt die Seite <Link to="/ranking">Ranking</Link>. Bezahlte Hervorhebung ist in
        der öffentlichen Version aus und ändert die Reihenfolge nicht.
      </p>

      <h2>§ 7 Konto beenden</h2>
      <p>
        Du kannst die Nutzung jederzeit beenden, indem du die lokalen Daten im Browser löschst und
        uns schreibst, falls ein optionales Konto auf einem Server liegt. Der Betreiber kann ein
        Konto beenden, wenn diese Bedingungen verletzt werden oder der Betrieb endet. Dann werden
        die zugehörigen Server-Daten gelöscht, soweit kein Gesetz etwas anderes verlangt.
      </p>

      <h2>§ 8 Änderung</h2>
      <p>
        Diese Bedingungen können geändert werden, wenn sich die App oder das Recht ändert. Die neue
        Fassung steht auf dieser Seite. Für die weitere Nutzung gilt die Fassung, die beim nächsten
        Besuch angezeigt wird. Wesentliche Änderungen, die ein bestehendes Konto betreffen, werden
        per E-Mail angekündigt, sobald ein echter Kontodienst läuft.
      </p>

      <h2>§ 9 Haftung</h2>
      <p>
        Für eigene Inhalte haftet der Betreiber nach den gesetzlichen Regeln. Für fremde Inhalte
        gilt die Haftungsprivilegierung des DDG, sobald ein Hinweis eingeht und der Inhalt geprüft
        wird. Verträge zwischen Nutzerinnen und Nutzern verantwortet der Betreiber nicht.
      </p>
    </LegalLayout>
  )
}
