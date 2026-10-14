# Angebot & E-Rechnung (Beta)

Schritte 1–2: Angebot per Foto/Diktat (Mock-KI) und Export als XRechnung (UBL) sowie ZUGFeRD/Factur-X (PDF/A-3 mit eingebetteter XML).

## Route

In der App: **`/angebot`** (Kachel unter **Mehr**).

## Ablauf

1. **Schritt 1:** Foto oder Halten-zum-Diktieren → Mock-KI erzeugt Positionen → jede Position prüfen und bestätigen (Steuersatz manuell wählen). Angebote liegen in **IndexedDB**; ohne Netz wird die KI-Analyse in eine Warteschlange gelegt.
2. **Schritt 2:** Rechnungsstammdaten (§ 14 UStG) ergänzen → Download **XRechnung-XML** oder **ZUGFeRD-PDF** (kein Versand in der Beta).

## Bibliothek & Lizenz

| Komponente | Paket | Lizenz |
|------------|--------|--------|
| E-Rechnung (UBL, Factur-X/XRechnung, PDF/A-3) | [`@e-invoice-eu/core`](https://github.com/gflohr/e-invoice-eu/tree/main/packages/core) | WTFPL |
| PDF-Hülle für ZUGFeRD | [`@cantoo/pdf-lib`](https://github.com/cantoo-scribe/pdf-lib) (Transitive Abhängigkeit) | MIT |

Es wird **kein handgeschriebenes Rechnungs-XML** erzeugt; die UBL-Struktur baut `buildEInvoiceUbl()` in `einvoiceMapper.ts` und übergibt sie an `@e-invoice-eu/core`.

## KI-Schnittstelle

`aiProvider.ts` — aktuell nur **`mock`** mit anonymisierten Testpositionen. Kein Live-API-Aufruf bis AVV/DPF.

## Validierung (CI)

```bash
npm run validate:einvoice
```

Lädt bei Bedarf den **KoSIT Validator** und die **XRechnung-Konfiguration** und prüft drei Fixture-Dateien unter `fixtures/einvoice/`.
