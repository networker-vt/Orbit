# Orbit — iOS / TestFlight

Native shell only. The site stays on GitHub Pages. This repo has **no** Google Play / `android/` project. Nothing in this repo is an App Store submission until someone runs the workflow below.

| | |
|---|---|
| App name | Orbit |
| Bundle ID | `app.orbit.companion` |
| Operator | Mirco Küßner, private person (see Impressum) |
| Web dir | `dist` (Vite) |
| Pages base | `/eventlogistik-event-os/` (`npm run build`, `npm run deploy:pages`) |
| Native base | `/` (`npm run build:ios`, `npm run cap:sync`) |
| Workflow | [`.github/workflows/ios-testflight.yml`](../.github/workflows/ios-testflight.yml) |

`app.orbit.companion` does not claim a company. Register that exact id in the Apple Developer portal before the first upload. To use another id you control, change it in `capacitor.config.json` **and** the Xcode target together, then `npm run cap:sync`, before Archive.

No `.p8`, certificate, or provisioning profile is committed. GitHub Actions reads the four secrets below at runtime and deletes the key file from the runner afterwards.

## GitHub Actions (kein Mac)

Nach dem Merge dieses Workflows und den vier Secrets: **Actions → iOS TestFlight → Run workflow**. Ein macOS-Runner macht `npm ci`, `npm run cap:sync` (Vite-Base `/`), archiviert die Capacitor-App und lädt ein **Internal Testing**-Build hoch. Ein Tag `ios-*` (Beispiel `ios-2.9.0`) macht dasselbe. Es gibt keinen Lauf bei jedem Push. **GitHub Pages wird nicht deployt.**

### Einmalig bei Apple (iPhone reicht)

1. [Apple Developer](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles** → **Identifiers** → **+** → App IDs → App → Bundle ID **explizit** `app.orbit.companion`.
2. [App Store Connect](https://appstoreconnect.apple.com/) → **Apps** → **+** → **Neue App** → iOS, Name `Orbit`, Bundle-ID oben, SKU z. B. `orbit-companion`. Die App-Zeile muss existieren, bevor der erste Lauf die Build-Nummer lesen kann.
3. **Business / Verträge:** den aktuellen Free-Apps-Vertrag (und falls Apple ihn verlangt, Paid Apps) annehmen. Ohne aktiven Vertrag lehnt der Upload ab, auch bei einer kostenlosen App.
4. **Users and Access → Integrations → App Store Connect API** (Team Keys, nicht ein einzelner Nutzer-Key ohne Admin):
   - **Issuer ID** oben auf der Seite kopieren (UUID).
   - **+** → Name `GitHub Actions` → Zugriff **Admin** (nicht App Manager, nicht Developer — Cloud-Signing legt das Distribution-Zertifikat an).
   - **Key ID** (10 Zeichen) notieren.
   - `AuthKey_XXXXXXXXXX.p8` **einmal** laden. Apple zeigt die Datei kein zweites Mal. Weg = Key widerrufen, neuen anlegen, die drei Key-Secrets tauschen. Die Team ID bleibt.
5. **Team ID** (10 Zeichen, nicht die Key ID): [developer.apple.com/account](https://developer.apple.com/account) → **Membership**.

Privacy-URL: https://networker-vt.github.io/eventlogistik-event-os/privacy  
Support-URL: https://networker-vt.github.io/eventlogistik-event-os/support  
Impressum: https://networker-vt.github.io/eventlogistik-event-os/impressum

### Repository-Secrets

GitHub → Repo **Settings → Secrets and variables → Actions → Repository secrets**. Keine Environment-Secrets. Ein öffentliches Repo zeigt diese Werte nicht an; Actions maskiert sie in den Logs. Nicht committen.

| Name | Inhalt |
|---|---|
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID, 10 Zeichen, von der Key-Zeile |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID, UUID, oben auf der API-Key-Seite |
| `APPLE_TEAM_ID` | Team ID, 10 Zeichen, aus Membership |
| `APP_STORE_CONNECT_API_KEY` | Das `.p8` als **eine Zeile Base64**, ohne `BEGIN`-Zeile |

`APP_STORE_CONNECT_API_KEY` ist Base64 der gesamten Datei, eine Zeile, keine Zeilenumbrüche. Am Rechner:

```bash
base64 < AuthKey_XXXXXXXXXX.p8 | tr -d '\n'
```

Auf dem iPhone, ohne Webseite: **Kurzbefehle** → neuer Kurzbefehl → Datei `AuthKey_….p8` aus Downloads → Aktion **Base64-Codierung** / **Base64 Encode**, Modus Codieren, Zeilenumbrüche **Keine** → **In die Zwischenablage**. Diesen einen String in das Secret kleben.

Der Workflow akzeptiert auch den rohen PEM-Text (`-----BEGIN PRIVATE KEY-----` bis `-----END PRIVATE KEY-----`), falls die Datei direkt eingefügt wird. Vorgabe bleibt die eine Base64-Zeile, weil GitHub-Secret-Felder Zeilenumbrüche manchmal verfälschen.

Es gibt **keine** weiteren Secrets. Kein Match-Repo, kein `.p12`, kein Provisioning Profile. Xcode **Cloud Signing** legt beim Export das Distribution-Zertifikat an und verwendet es wieder. Das Archiv selbst ist unsigniert: automatisches Signieren schon beim Archivieren würde auf jedem frischen Runner ein neues Apple-Development-Zertifikat erzeugen und das Kontingent vollmachen.

Fehlt ein Secret oder hat es die falsche Form (Key ID / Team ID / UUID / Base64), bricht der Ubuntu-Job ab, **bevor** ein Mac startet. Die Meldung nennt den Secret-Namen und verweist hierher. Werte stehen nicht im Log.

### Lauf

1. PR mergen. **Run workflow** gibt es erst, wenn die Datei auf `main` liegt.
2. **Actions → iOS TestFlight → Run workflow**. Branch `main`. Optionales „What to Test“ leer lassen, dann wartet der Job nicht auf Apples Verarbeitung. Ein ausgefülltes Notizfeld lässt den Job warten, bis der Build in App Store Connect sichtbar ist, nur um die Notiz zu setzen.
3. Der Mac-Job: Xcode 26 (Pflicht für Uploads seit 2026-04-28), `npm ci`, `npm run cap:sync`, Prüfung dass `dist/index.html` nicht die Pages-Base `/eventlogistik-event-os/` enthält, Fastlane, Upload.
4. Marketing-Version = `version` in `package.json` (aktuell 2.9.1). **Build** (`CFBundleVersion`) = letzte TestFlight-Build-Nummer + 1. Die `1` im Xcode-Projekt wird nicht hochgeladen und nicht committet. Dieselbe Build-Nummer darf nicht zweimal hoch.
5. IPA bleibt 7 Tage als Actions-Artifact (`orbit-ios-<run>`), falls der Upload scheitert und die Datei schon existiert.

### Danach auf dem iPhone

Apple verarbeitet den Build oft 5–30 Minuten. Dann: App Store Connect → **TestFlight → Internal Testing**, und die App **TestFlight** auf dem iPhone → Orbit. Der Account Holder ist interner Tester. Kein Beta App Review. Ein öffentlicher Link ist das nicht.

`Info.plist` setzt `ITSAppUsesNonExemptEncryption = false` (nur HTTPS). Fragt App Store Connect trotzdem „Missing Compliance“, **No** / keine nicht-ausgenommene Verschlüsselung antworten.

Interne Tester einladen: App Store Connect → Users and Access, Rolle mit TestFlight-Zugriff. Ein öffentlicher TestFlight-Link braucht Beta App Review und ist hier nicht enthalten.

### Wenn der Lauf rot ist

| Meldung | Tun |
|---|---|
| `Missing GitHub Actions secrets` | Die vier Namen exakt so anlegen. Nicht in `.env`. |
| Key ID / Issuer ID / Team ID form | Die drei Werte nicht vertauschen. Team ID ist Membership, Issuer ID hat Bindestriche. |
| `did not decode to a .p8` | Base64 neu erzeugen, eine Zeile, die ganze Datei. |
| `Could not find an app` | App in App Store Connect mit `app.orbit.companion` anlegen. Key-Rolle **Admin**. |
| Vertrag / agreement / PLA | Business-Verträge in App Store Connect annehmen. |
| `maximum number of certificates` | Ungenutzte **Apple Development**-Zertifikate unter developer.apple.com → Certificates widerrufen. Diesen Workflow nicht auf „automatic beim Archivieren“ umbauen. |
| Pages-Base im iOS-Build | `npm run cap:sync` muss `CAPACITOR=1` behalten. `npm run build` ist nur Pages. |

## GitHub Actions (no Mac)

After this workflow is on `main` and the four secrets exist: **Actions → iOS TestFlight → Run workflow**. A macOS runner runs `npm ci`, `npm run cap:sync` (Vite base `/`), archives the Capacitor app, and uploads an **Internal Testing** build. A tag `ios-*` (for example `ios-2.9.0`) does the same. It does not run on every push. **It does not deploy GitHub Pages.**

### Once, in Apple (an iPhone is enough)

1. [Apple Developer](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles** → **Identifiers** → **+** → App IDs → App → explicit bundle id `app.orbit.companion`.
2. [App Store Connect](https://appstoreconnect.apple.com/) → **Apps** → **+** → **New App** → iOS, name Orbit, that bundle id, SKU such as `orbit-companion`. The app record must exist before the first run can read a build number.
3. **Business / Agreements:** accept the current Free Apps agreement (and Paid Apps if Apple asks). Upload fails without an active agreement, including for a free app.
4. **Users and Access → Integrations → App Store Connect API** (team keys):
   - Copy the **Issuer ID** at the top of the page (a UUID).
   - **+** → name `GitHub Actions` → access **Admin**. App Manager and Developer cannot create the distribution certificate cloud signing needs.
   - Note the **Key ID** (10 characters).
   - Download `AuthKey_XXXXXXXXXX.p8` **once**. Apple does not show it again. If it is lost, revoke the key, create another, and replace the three key secrets. The Team ID stays.
5. **Team ID** (10 characters, not the Key ID): [developer.apple.com/account](https://developer.apple.com/account) → **Membership**.

Privacy URL: https://networker-vt.github.io/eventlogistik-event-os/privacy  
Support URL: https://networker-vt.github.io/eventlogistik-event-os/support  
Impressum: https://networker-vt.github.io/eventlogistik-event-os/impressum

### Repository secrets

GitHub → **Settings → Secrets and variables → Actions → Repository secrets**. Not environment secrets. A public repo does not display these values; Actions masks them in logs. Do not commit them.

| Name | Value |
|---|---|
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID, 10 characters, from the key row |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID UUID at the top of the API keys page |
| `APPLE_TEAM_ID` | Team ID, 10 characters, from Membership |
| `APP_STORE_CONNECT_API_KEY` | The `.p8` as **one line of base64**, no `BEGIN` line |

`APP_STORE_CONNECT_API_KEY` is the whole file, base64, one line, no line breaks. On a computer:

```bash
base64 < AuthKey_XXXXXXXXXX.p8 | tr -d '\n'
```

On an iPhone, without a website: **Shortcuts** → new shortcut → the `AuthKey_….p8` file from Downloads → **Base64 Encode**, mode Encode, line breaks **None** → **Copy to Clipboard**. Paste that single string into the secret.

The workflow also accepts the raw PEM (`-----BEGIN PRIVATE KEY-----` through `-----END PRIVATE KEY-----`) if the file is pasted as text. The required documented form is one base64 line, because GitHub’s secret field sometimes corrupts newlines.

There are **no** other secrets. No Match repo, no `.p12`, no provisioning profile. Xcode **cloud signing** creates the distribution certificate at export time and reuses it. The archive itself is unsigned: automatic signing during archive would mint a new Apple Development certificate on every fresh runner and hit the certificate cap.

If a secret is missing or the wrong shape (Key ID / Team ID / UUID / base64), the Ubuntu job fails **before** a Mac starts. The message names the secret and points here. Values are not printed.

### Run

1. Merge the PR. **Run workflow** appears only after the file is on `main`.
2. **Actions → iOS TestFlight → Run workflow**. Branch `main`. Leave the optional “What to Test” note empty so the job does not wait for Apple to list the build. A note makes the job wait until the build is visible, only to save that note.
3. The Mac job selects Xcode 26 (required for uploads since 2026-04-28), runs `npm ci` and `npm run cap:sync`, checks that `dist/index.html` does not contain the Pages base `/eventlogistik-event-os/`, then Fastlane uploads.
4. Marketing version = `version` in `package.json` (currently 2.9.1). **Build** (`CFBundleVersion`) = latest TestFlight build number + 1. The `1` in the Xcode project is not what gets uploaded, and it is not committed. The same build number cannot be uploaded twice.
5. The IPA is kept 7 days as an Actions artifact (`orbit-ios-<run>`) when export produced a file.

### On the iPhone afterwards

Apple often processes the build for 5–30 minutes. Then: App Store Connect → **TestFlight → Internal Testing**, and the **TestFlight** app on the iPhone → Orbit. The account holder is an internal tester. No Beta App Review. This is not a public link.

`Info.plist` sets `ITSAppUsesNonExemptEncryption = false` (HTTPS only). If App Store Connect still shows “Missing Compliance”, answer **No**.

Invite internal testers under Users and Access with a role that can use TestFlight. A public TestFlight link needs Beta App Review and is out of scope.

### When the run is red

| Message | What to do |
|---|---|
| `Missing GitHub Actions secrets` | Create the four names exactly. Not in `.env`. |
| Key ID / Issuer ID / Team ID shape | Do not swap them. Team ID is Membership. The Issuer ID has dashes. |
| `did not decode to a .p8` | Regenerate base64, one line, the whole file. |
| `Could not find an app` | Create the App Store Connect app with `app.orbit.companion`. Key role **Admin**. |
| Agreement / PLA | Accept the agreements under Business in App Store Connect. |
| `maximum number of certificates` | Revoke unused **Apple Development** certificates at developer.apple.com → Certificates. Do not switch this archive step back to automatic signing. |
| Pages base inside the iOS build | `npm run cap:sync` must keep `CAPACITOR=1`. `npm run build` is Pages only. |

## Auf einem Mac (optional)

Dieselbe App lässt sich lokal archivieren. Der Actions-Weg oben ersetzt das, wenn kein Mac da ist.

- Mac mit aktuellem Xcode und ein bezahltes **Apple Developer Program** auf Mirco Küßners Apple-ID.
- Im Projektroot: `npm ci`, danach `npm run cap:sync`. Das baut mit Vite-Base `/` und kopiert `dist` nach `ios/`. Ohne diesen Schritt ist die WebView leer.
- Xcode: `ios/App/App.xcodeproj` öffnen, oder `npx cap open ios` (nur macOS). Das Shared Scheme `App` liegt im Repo.
- **Signing & Capabilities:** Team = Mircos Apple-Team. Automatically manage signing an. Bundle-ID `app.orbit.companion` lassen, solange sie im Developer-Portal angelegt ist.
- **General:** Display Name `Orbit`. Version an `package.json` halten (aktuell 2.9.1). **Build** bei jedem Upload um 1 erhöhen. Gleicher Build darf nicht zweimal hochgeladen werden. Der Actions-Lauf setzt die Build-Nummer selbst.
- **Product → Archive**. Im Organizer: **Distribute App → App Store Connect → Upload**.
- [App Store Connect](https://appstoreconnect.apple.com/): App anlegen (Bundle-ID oben), dann **TestFlight → Internal Testing**. Interne Tester sind das Team; kein Beta-Review.
- `Info.plist` enthält nur `NSCameraUsageDescription`. Die Web-App öffnet die Kamera (Foto-Upload, Kabine, Entdecker, Interview-Vorschau). Kein Mikrofon, kein Standort, kein Tracking.
- Store-Text: Marktplatz. Keine ORB-, Token- oder Krypto-Claims.
- Kein Play Store in diesem Stand. `npm run build` bleibt der Pages-Build.

### Icons und Splash (Xcode Asset Catalog)

- App-Icon kommt aus `public/icons/icon-1024.png` (1024×1024, RGB, ohne Alpha) in `ios/App/App/Assets.xcassets/AppIcon.appiconset`.
- Wenn Xcode einen leeren 1024-Slot zeigt: dieselbe PNG auf den **App Store / iOS** Slot ziehen.
- Splash: `ios/App/App/Assets.xcassets/Splash.imageset` nutzt `public/icons/splash-1290x2796.png` auf Hintergrund `#F7F6F3`. Das ist ein iPhone-Portrait, keine komplette Geräte-Matrix.
- Anderes Launch-Bild: in Xcode **Assets.xcassets → Splash** ersetzen. `public/icons/splash-750x1334.png` und `splash-1290x2796.png` bleiben die PWA-Startup-Bilder und werden vom Asset-Catalog nicht automatisch in jede Größe geschnitten.
- `apple-touch-icon.png` (180×180) ist das Web-Icon. Für den Store zählt der 1024er Slot.

### Weiterhin nur mit Mircos Apple-Account

- Developer-Programm, die App in App Store Connect, Agreements.
- Der Actions-Lauf signiert per API-Key (Cloud Signing). Zertifikate liegen nicht im Repo und nicht in den Secrets.
- Export-Compliance: die App setzt `ITSAppUsesNonExemptEncryption = false` (nur HTTPS).
- Interne Tester einladen. Ein öffentlicher TestFlight-Link braucht zusätzlich Beta App Review — nicht Teil dieses Workflows.

## On a Mac (optional)

The same app can be archived locally. The Actions path above is the one that does not need a Mac.

- Mac, current Xcode, paid Apple Developer Program on Mirco Küßner’s Apple ID.
- From the repo root: `npm ci`, then `npm run cap:sync`. That builds with Vite base `/` and copies `dist` into `ios/`. Skip it and the WebView is empty.
- Open `ios/App/App.xcodeproj`, or `npx cap open ios` on macOS. The shared `App` scheme is in the repo.
- **Signing & Capabilities:** Team = Mirco’s Apple team, automatically manage signing. Keep bundle id `app.orbit.companion` once it exists in the developer portal.
- **General:** display name Orbit. Keep the marketing version aligned with `package.json` (currently 2.9.1). Bump **Build** by 1 on every manual upload. The Actions run picks the build number itself.
- **Product → Archive**, then Organizer → **Distribute App → App Store Connect → Upload**.
- In App Store Connect, create the app with that bundle id, then **TestFlight → Internal Testing**.
- `Info.plist` has `NSCameraUsageDescription` only, because the web app already opens the camera. No microphone, location, or tracking usage strings.
- Store copy is a marketplace. No ORB, token, or crypto claims.
- No Play Store in this change. `npm run build` is still the GitHub Pages build.

### Icons and splash

- The app icon is `public/icons/icon-1024.png` in `AppIcon.appiconset`. If the 1024 slot is empty, drop that PNG onto it.
- Splash uses `public/icons/splash-1290x2796.png` on `#F7F6F3`. It is one phone portrait, not every device size. Replace **Assets.xcassets → Splash** in Xcode if you want a different launch image.
- `apple-touch-icon.png` stays the web icon. The store uses the 1024 slot.

### Still needs Mirco’s Apple account

- The Developer Program, the App Store Connect record, and agreements.
- The Actions run signs with the API key (cloud signing). Certificates are not in the repo and not in the secrets.
- Confirm export compliance if asked (`ITSAppUsesNonExemptEncryption` is already false).
- Invite internal testers. A public TestFlight link needs Beta App Review and is out of scope here.
