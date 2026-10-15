# Angebot & E-Rechnung (Beta)

Schritte 1–2 plus Firmenprofil, Backup, Teilen und §‑14‑Vollständigkeit. Angebot per Foto/Text (Mock-KI) → **Angebot → Rechnung** → Export als XRechnung (UBL) sowie ZUGFeRD/Factur-X (PDF/A-3 mit eingebetteter XML).

## Feature-Flag `offerBeta` (Standard: aus)

Die Kachel unter **Mehr** und die Route **`/angebot`** sind nur sichtbar, wenn das Flag **`offerBeta`** aktiv ist.

**Production / Pages-Build:**

```bash
VITE_FLAG_OFFER_BETA=1
```

**Lokale Entwicklung (zusätzlich oder alternativ):**

```javascript
localStorage.setItem('orbit_flag_offerBeta', '1')
```

Danach Seite neu laden. Ohne Flag leitet `/angebot` auf die Startseite um.

## Diktat vs. Text (`offerDictation`, Standard: aus)

In der Beta ist **kein Browser-Diktat** aktiv (kein `webkitSpeechRecognition` / Cloud-Speech). Stattdessen nutzen Sie das Feld **„Angebot eintippen“**.

Optional: `VITE_FLAG_OFFER_DICTATION=1` bzw. `localStorage.setItem('orbit_flag_offerDictation','1')`.

## Erstnutzung (§ 14 BGB)

Pflicht-Checkbox **„Ich nutze das für meinen Betrieb (§ 14 BGB).“** — Zustimmung offline in IndexedDB (`orbit-offers` / `meta`).

## Firmenprofil (gerätelokal)

Unter **Firmenprofil**: Name, Anschrift, Steuernr. **oder** USt-IdNr., IBAN/BIC, Logo, Checkbox **Kleinunternehmer**.

- Hinweistext (exakt): **„Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.“**
- Die App prüft den Kleinunternehmer-Status **nicht**.
- Profil wird in jedes Angebot/jede Rechnung übernommen.
- Fehlende §‑14‑Pflichtfelder blockieren den Export und nennen das Feld.

## Ablauf

Fortschritt oben: **Firmenprofil → Kunde → Positionen → Angebot → Rechnung** (Sie-Form).

1. **Positionen & Angebot:** Foto oder **Angebot eintippen** → Mock-KI (sichtbar **„Beispiel, keine echte Auswertung“**) → Positionen prüfen. IndexedDB; Offline-Warteschlange für KI.
2. **Rechnung:** § 14 UStG ergänzen → XRechnung / ZUGFeRD. ZIP/PDF/QR erst bei Klick (dynamic import).

## Angebot → Rechnung

Ein Tipp vergibt eine **fortlaufende, eindeutige Rechnungsnummer** und das Datum, kopiert die Positionen. Import einer Sicherung **setzt den Zähler nie zurück** und erzeugt keine Duplikate (Merge: `max(aktuell, importiert)`).

## § 14 Abs. 4 UStG

Geprüft u. a.: Leistungsdatum/-zeitraum, Menge+Art, Entgelt je Steuersatz, Steuerbetrag; Steuernr. **oder** USt-IdNr. reicht. Steuersatz wird **nie automatisch** gesetzt.

Privatperson + Bau/Grundstück-Leistung → Pflichtsatz: **„Bitte bewahren Sie diese Rechnung zwei Jahre auf.“**

## Export & GoBD-Praxis

Exportierte Rechnungen sind **nur lesbar**. Änderungen nur über **Storno + neue Rechnung**. Die App behauptet **keine** „GoBD-Konformität“.

## Alles sichern / Import

ZIP mit JSON + XML/PDF je exportierter Rechnung. Hinweis (exakt): **„Bitte sichern Sie Ihre Daten regelmäßig. Die App ersetzt keine revisionssichere Archivierung.“**

JSZip und E-Rechnungs-/PDF-Bibliotheken werden **nur per Klick dynamisch geladen**, nicht beim Laden von `/angebot`.

## Als PDF teilen

Web Share API / iOS Share Sheet für die ZUGFeRD-PDF (Fallback: Download).

## Rechtliches

Links **Impressum** und **Datenschutz** im Offer-Footer und unter **Mehr**.

## Import-Grenze

`src/features/offer/**` importiert nur interne Module, Shared UI (`components/ui`) und optional `AuthPage`. CI: `scripts/offer-boundary.test.mjs`.

## Bibliothek & Lizenz

| Komponente | Paket | Lizenz |
|------------|--------|--------|
| E-Rechnung | [`@e-invoice-eu/core`](https://github.com/gflohr/e-invoice-eu) | WTFPL |
| PDF-Hülle | [`@cantoo/pdf-lib`](https://github.com/cantoo-scribe/pdf-lib) | MIT |
| ZIP-Backup | [`jszip`](https://stuk.github.io/jszip/) (dynamic import) | MIT / GPL |

## Validierung

```bash
npm test
npm run validate:einvoice
```

Fixtures unter `fixtures/einvoice/` (inkl. öffentlicher Auftraggeber mit Leitweg-ID). Round-Trip: Export→Import identisch (`backup.test.ts`).

## Kunden & Leitweg-ID

Kunden anlegen/wiederverwenden. Checkbox **öffentlicher Auftraggeber** → Pflicht **Leitweg-ID** als XRechnung BuyerReference (BT-10); ohne ID kein Export. Hinweise mit Links zu Bund ZRE/OZG-RE bzw. Land/Kommune-Portal — **kein Upload** aus der App.

## Materialliste, Status, GiroCode, Fotos

- Leistungs-/Materialliste mit Festpreisen → Antippen übernimmt Positionen (Steuersatz manuell).
- Rechnungsstatus: offen / bezahlt / überfällig + lokale Erinnerung (gerätelokal).
- **GiroCode** (EPC-QR) auf der PDF: IBAN aus Firmenprofil, Betrag = Rechnungsbetrag, Verwendungszweck = Rechnungsnummer. Kein QR **nur bei 0 €**; Kleinunternehmer erhalten den QR normal (Betrag ohne USt). `qrcode` nur per Dynamic Import.
- Baustellenfotos am Auftrag; erstes Foto: **„Achten Sie auf Personen und Kennzeichen im Bild.“**
