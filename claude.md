# Natis Fine Creation — Projektdokumentation & Sicherheitsregeln

## Projektübersicht

Private, nicht-kommerzielle Kunst-Galerie Website für [@natisfinecreation](https://www.instagram.com/natisfinecreation/).
Die dargestellten Kunstwerke dienen ausschließlich zur Inspiration und stehen nicht zum Verkauf.

- **Runtime:** Bun
- **Framework:** Hono
- **Daten:** JSON-Dateien (kein externer Datenbankserver)
- **Hosting:** beliebiger HTTPS-fähiger Hoster/Server (kein MySQL erforderlich)
- **Backup:** GitHub Repository (nur öffentliche Daten)

---

## KRITISCH: Sensible Daten — NIEMALS auf GitHub

### Diese Dateien dürfen NIEMALS auf GitHub landen:

| Datei | Inhalt | Schutz |
|---|---|---|
| `.env` | GitHub-Token, Passwörter, JWT-Secret, E-Mail | `.gitignore` + nie committen |
| `data/credentials.json` | Login-E-Mail, Passwort-Hash | `.gitignore` + `skipSync = true` |
| `data/messages.json` | Private Nachrichten: Namen, E-Mail-Adressen, Nachrichteninhalte | `.gitignore` + `skipSync = true` |

### Was SIND sensible Daten (Beispiele):

- **Namen** von Personen, die das Kontaktformular nutzen
- **E-Mail-Adressen** von Kontaktanfragen
- **Nachrichteninhalte** (persönliche Anfragen, Ideen, etc.)
- **Login-Zugangsdaten** (E-Mail, Passwort-Hashes)
- **GitHub Personal Access Token** (ghp_...)
- **JWT-Secret** für Session-Verwaltung

### Dreifacher Schutz:

1. **`.gitignore`** — Git ignoriert die Dateien komplett
2. **`skipSync = true`** — `saveMessages()` und `saveCredentials()` lösen keinen GitHub-Push aus
3. **Pfad-Blockierung** — Server blockiert HTTP-Zugriff auf `/data/`, `/.env`, `/credentials` mit 403

### Bei Code-Änderungen IMMER prüfen:

- `saveMessages()` muss `skipSync = true` verwenden
- `saveCredentials()` muss `skipSync = true` verwenden
- Neue Dateien mit persönlichen Daten müssen in `.gitignore` eingetragen werden
- `git ls-files data/messages.json` muss leer sein
- `git ls-files data/credentials.json` muss leer sein

---

## Was auf GitHub gespeichert wird (nur öffentliche Daten)

| Datei | Inhalt | Warum OK |
|---|---|---|
| `data/settings.json` | Website-Texte, Farben, Links | Öffentlich auf der Website sichtbar |
| `data/categories.json` | Galerie-Kategorien | Öffentlich |
| `data/gallery.json` | Bild-Metadaten (Titel, Dateinamen) | Öffentlich |
| `uploads/` | Hochgeladene Bilder (Kunstwerke) | Öffentlich auf der Website, dienen als Backup in GitHub |
| Code-Dateien (`src/`, `public/`) | Quellcode | Kein sensibles Material |

---

## Nachrichten-System

- Nachrichten werden über das Kontaktformular gesendet (`POST /api/contact`)
- Spam-Schutz: Honeypot-Feld + Mathe-Captcha + Rate-Limiting (3/Stunde pro IP)
- Pflicht: Datenschutz-Checkbox
- Speicherung: **nur lokal** in `data/messages.json`
- **Kein GitHub-Sync** — Nachrichten verlassen nie den Server
- Admin kann: Nachrichten lesen, als gelesen markieren, löschen, per E-Mail antworten
- Löschen ist **sofort und endgültig** — gelöschte Nachrichten sind unwiederbringlich weg

---

## Admin-Bereich

### Login
- URL: `/login`
- Ein einziger Owner-Login (kein Multi-User)
- JWT-Token in HttpOnly-Cookie (secure auf HTTPS/Netlify)
- Rate-Limiting: 5 Versuche pro 15 Minuten

### Bearbeitbare Bereiche (alles unter /admin):

| Bereich | Was kann geändert werden |
|---|---|
| **Inhalte → Hero** | Titel, Untertitel, Button-Text, Button-Link |
| **Inhalte → Über mich** | Titel, Text, Profilbild (auto-resize) |
| **Inhalte → Galerie-Texte** | Galerie-Titel, Untertitel |
| **Inhalte → Kontakt-Texte** | Kontakt-Titel, Untertitel |
| **Inhalte → Aufträge** | Auftrags-Titel, Text |
| **Inhalte → Links** | Social Media Links, eigene Navigation-Links |
| **Inhalte → Branding** | Website-Name, Tagline, Logo (auto-resize), Farben, Footer, SEO |
| **Galerie → Upload** | Bilder hochladen mit Titel, Beschreibung, Kategorie |
| **Galerie → Verwalten** | Bilder bearbeiten, löschen, nach Kategorie filtern |
| **Galerie → Kategorien** | Kategorien erstellen, löschen |
| **Nachrichten** | Kontaktanfragen lesen, antworten (mailto), löschen |
| **Einstellungen → Konto** | E-Mail und Passwort ändern |
| **Einstellungen → Kontaktformular** | Empfänger-E-Mail-Adresse ändern |
| **Einstellungen → Impressum** | Name, Adresse, PLZ, Stadt, Land, E-Mail, Telefon |
| **Einstellungen → Datenschutz** | Zusätzlicher Text am Ende der Datenschutzerklärung |

### Änderungen werden SOFORT übernommen
Jede Änderung im Admin-Bereich wird direkt in die JSON-Datei geschrieben. Beim nächsten Seitenaufruf eines Besuchers wird die aktuelle Version angezeigt. Kein Cache, kein Delay.

---

## Bild-Upload & Auto-Resize

Bilder werden vor dem Upload im Browser automatisch verkleinert:

| Typ | Max. Größe | Qualität |
|---|---|---|
| Logo | 400 × 400 px | 85% JPEG |
| Profilbild | 800 × 1200 px | 85% JPEG |
| Galerie | 1920 × 1920 px | 85% JPEG |

CSS `object-fit: cover` sorgt dafür, dass jedes Bild im richtigen Seitenverhältnis angezeigt wird.

### Favicon

- Das hochgeladene **Logo** im Admin-Bereich wird automatisch:
  - als normales Logo in Navigation, Footer, Hero verwendet
  - als **Favicon** (`/favicon.ico`) und Apple Touch Icon genutzt
- Es ist kein separates Favicon-Upload nötig.

---

## Sicherheit

### HTTP Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy: default-src 'self'; script-src 'self'; ...`

### Blockierte Pfade (403 Forbidden)
`/.git`, `/.env`, `/data/`, `/.gitignore`, `/tsconfig`, `/src/`, `/node_modules/`, `/package.json`, `/bun.lock`, `/credentials`, `/askpass`, `/dockerfile`, `/railway.json`, `/.dockerignore`, `/claude.md`

### Auth für API
- Admin-Seiten: Redirect zu `/login` bei fehlender Auth
- Admin-API (`/api/admin/*`): JSON 401 bei fehlender Auth (kein Redirect)
- Cookie: `HttpOnly`, `secure` auf Produktion/Netlify, `SameSite: Lax`

### GitHub-Token
- Nur in `.env` gespeichert (nie committed)
- Git-Operationen nutzen `askpass.js` Skript mit Umgebungsvariable
- Alle Git-Ausgaben werden sanitized (`***TOKEN***`)
- Token ist nie im Frontend sichtbar

---

## Rechtliches

### Impressum
- Basiert auf **§ 5 DDG** (Digitale-Dienste-Gesetz, seit 2024)
- Hinweis: **Private, nicht-kommerzielle Website**
- Kunstwerke: **Nur zur Inspiration, kein Verkauf**
- Kontaktformular: **Nur persönlicher Austausch, kein Gewerbe**
- Admin editiert nur: Name, Adresse, PLZ, Stadt, Land, E-Mail, Telefon
- Kein USt-IdNr-Feld (nicht relevant für Privat)

### Datenschutzerklärung
- DSGVO-konform für private Website
- Hosting: aktuell allgemeine Beschreibung eines Cloud-Hosters (konkret im Code: Railway), immer mit SSL/TLS
- Keine Tracking-Cookies, keine Analyse, kein Profiling
- Kontaktformular: Einwilligung über Checkbox (Art. 6 Abs. 1 lit. a DSGVO)
- Abschnitt 5: "Keine kommerzielle Nutzung"
- IT-Recht Kanzlei Banner am Ende (Stand: 17.03.2026, 20:13:05)

> Hinweis: Auch wenn im Code Railway als Beispiel-Hoster erwähnt wird, ist die App nicht fest an Railway gebunden. Jeder HTTPS-fähige Server, auf dem Bun läuft, ist möglich. Es werden trotzdem **nie** sensible Daten an GitHub übertragen.

---

## GitHub-Sync

- **Asynchron** — blockiert keine Seitenauslieferung
- **Debounced** (2 Sekunden) — mehrere Änderungen werden gebündelt
- Nur öffentliche Daten werden gepusht
- Bei Push-Fehler: automatischer Pull + Retry
- Repository: `Frau-Hadler/photo-web` (Branch: `main`)

> Wichtig: Es gibt **keine** Anbindung an MySQL oder andere externe Datenbanken. Alle Daten bleiben in lokalen JSON-Dateien und im GitHub-Repo (nur öffentliche Inhalte). Eventuell vorhandene MySQL-Services auf Railway werden von dieser App nicht genutzt.

---

## Hosting & Deployment (Railway + eigene Domain)

### Laufzeit-Umgebung

- Produktiv wird die App auf **Railway** als Bun-Server betrieben.
- Die Standard-URL sieht z.B. so aus: `https://photo-web-production-XXXXX.up.railway.app/`.
- Über Railway können **benutzerdefinierte Domains** (z.B. `https://deinedomain.de`) hinterlegt werden.

### HTTPS

- Railway stellt automatisch ein **TLS/HTTPS-Zertifikat** für:
  - die `*.up.railway.app`-Domain
  - alle in Railway hinterlegten Custom Domains
- Die App ist damit **immer über HTTPS** erreichbar, z.B.:
  - `https://photo-web-production-XXXXX.up.railway.app/`
  - `https://deinedomain.de/`

### Daten-Fluss & Speicherort (Produktion)

- **Kontakt-Nachrichten**
  - Formular sendet `POST /api/contact` an den Railway-Server.
  - Speicherung erfolgt **nur auf dem Server** in `data/messages.json`.
  - Kein Versand an externe Dienste, kein Upload zu GitHub, kein E-Mail-Speicher.

- **Login-/Kontodaten**
  - Admin-Login-Daten werden in `data/credentials.json` auf dem Server gespeichert.
  - Änderungen über **„Einstellungen → Konto“** werden direkt in dieser Datei aktualisiert.
  - `saveCredentials()` setzt immer `skipSync = true` → **kein GitHub-Push**.

### Git & sensible Dateien (Sicherheitscheck)

- Vor jedem Deploy sollten lokal im Projektordner diese Befehle leer bleiben:

```bash
git ls-files .env data/credentials.json data/messages.json
```

- Wenn keine Ausgabe kommt, sind diese Dateien **nicht** im Git-Repository.
- Dadurch bleiben:
  - `.env` (GitHub-Token, Secrets)
  - `data/credentials.json` (Login)
  - `data/messages.json` (Nachrichten)

  ausschließlich lokal bzw. auf dem Railway-Server und werden **niemals** auf GitHub gespeichert.

### Custom Domain auf Railway

- Custom Domain wird in Railway im Tab „Networking“/„Domains“ eingetragen.
- Railway zeigt die notwendigen **DNS-Einträge** (meist CNAME) an.
- Nach Setzen der DNS-Einträge beim Domain-Anbieter:
  - Railway validiert die Domain.
  - erstellt automatisch ein HTTPS-Zertifikat (Let's Encrypt).
  - leitet alle Anfragen auf den Bun-Server dieser App.

Damit ist dokumentiert:

- Wo der Server läuft (Railway, Bun).
- Wo Nachrichten und Login-Daten gespeichert werden (lokale JSON-Dateien, nicht GitHub).
- Dass alle produktiven Domains per HTTPS abgesichert sind.

---

## Daten-Persistenz bei Restarts & Deploys

- Alle Inhalte, die im Admin-Bereich geändert werden (Texte, Farben, Links, Galerie, Kategorien, Impressum, Datenschutz, Nachrichten, Login-Daten etc.), landen in den JSON-Dateien unter `data/` bzw. in `uploads/`.
- Diese Dateien liegen direkt im Dateisystem des Railway-Services und bleiben bei einem:
  - **Restart** des Services,
  - **neuen Deploy** aus GitHub
  erhalten, solange:
  - das Railway-Projekt nicht gelöscht wird und
  - die Dateien nicht manuell entfernt/überschrieben werden.

- Ein Neustart („Restart“) des Railway-Services:
  - setzt nur den Bun-Prozess neu auf,
  - verliert **keine** in `data/*.json` gespeicherten Admin-Änderungen oder hochgeladenen Bilder.

- Kritische Datenverluste können nur entstehen durch:
  - Löschen des Railway-Projekts oder des Dateisystems,
  - manuelles Löschen/Überschreiben der Dateien `data/*.json` oder `uploads/` im Container,
  - Einspielen eines Backups/Deploys, das alte Daten bewusst überschreibt.

Für den normalen Betrieb gilt:

- **Admin-Änderungen sind dauerhaft**, auch nach Restart oder neuem Deploy.
- Änderungen gehen nur verloren, wenn jemand aktiv Dateien löscht oder das Projekt zerstört.

---

## Sicheres Update der Website (Design/Code ändern ohne Datenverlust)

Ziel: Design, Layout oder Funktionen der Website anpassen, **ohne** dass:

- Login-Daten (`data/credentials.json`)
- Nachrichten (`data/messages.json`)
- Galerie-Inhalte (`data/gallery.json`, `uploads/`)
- Einstellungen (`data/settings.json`, `data/categories.json`)

verloren gehen.

### 1. Was darf geändert werden?

Unkritisch (gehört in Git, wird per GitHub-Sync/Deploy verteilt):

- Alles unter `src/` (Server, Seiten, Admin-HTML, API-Logik)
- Alles unter `public/` (CSS, JS, statische Assets)
- Konfiguration: `package.json`, `tsconfig.json`, `Dockerfile`, `railway.json`, `.dockerignore`

Kritisch (bleibt NUR lokal/auf Server, nicht in Git ändern oder löschen):

- `.env`
- `data/credentials.json`
- `data/messages.json`
- Alle produktiven Dateien in `data/` und `uploads/` (Inhalte)

### 2. Standard-Workflow: Design/Code anpassen

1. **Lokal entwickeln**
   - Änderungen in `src/*` und `public/*` vornehmen (z.B. CSS, HTML-Templates, Admin-Ansichten).
   - Lokal testen mit:
     ```bash
     bun --watch run src/index.ts
     ```

2. **Git-Status prüfen (keine sensiblen Dateien in Git)**
   - Im Projektordner ausführen:
     ```bash
     git ls-files .env data/credentials.json data/messages.json
     ```
   - Ausgabe muss leer sein.

3. **Änderungen committen & zu GitHub pushen**
   - Nur Code-/Asset-Dateien committen:
     ```bash
     git add src public package.json tsconfig.json Dockerfile railway.json .dockerignore
     git commit -m "Update Design/Layouts"
     git push origin main
     ```

4. **Railway-Deploy**
   - Railway ist mit dem GitHub-Repo verbunden.
   - Nach `git push` startet Railway automatisch einen neuen Deploy.
   - Alternativ im Railway-Dashboard manuell „Redeploy“ auslösen.

Wichtig:

- Railway nutzt den neuen Code/Styles aus GitHub.
- Die JSON-Daten (`data/*.json`) und Uploads auf dem Railway-Server bleiben unverändert → **keine Daten gehen verloren**.

### 3. Was man NICHT tun darf

- `data/*.json` oder `uploads/` im Git-Repository versionieren oder überschreiben.
- Im Railway-Container in Produktion Dateien unter `data/` oder `uploads/` manuell löschen, außer bewusst beim Aufräumen/Reset.
- `.env` jemals committen oder ins Repo hochladen.

### 4. Kurz-Zusammenfassung für zukünftige Änderungen

- **Design/Code ändern:** nur in `src/` und `public/`.
- **Vor Deploy:** immer `git ls-files .env data/credentials.json data/messages.json` prüfen (muss leer sein).
- **Deploy:** Änderungen zu GitHub pushen → Railway deployed automatisch neuen Code.
- **Daten:** bleiben in `data/*.json` und `uploads/` und sind unabhängig vom Code-Deploy.

---

## Dateistruktur

```
natisfinecreation/
├── .env                    ← SENSIBEL (nie auf GitHub)
├── .gitignore              ← Schützt sensible Dateien
├── claude.md               ← Diese Dokumentation
├── package.json
├── tsconfig.json
├── data/
│   ├── settings.json       ← Öffentliche Website-Einstellungen
│   ├── categories.json     ← Öffentliche Kategorien
│   ├── gallery.json        ← Öffentliche Bild-Metadaten
│   ├── credentials.json    ← SENSIBEL (nie auf GitHub)
│   └── messages.json       ← SENSIBEL (nie auf GitHub)
├── uploads/                ← Hochgeladene Bilder (öffentlich)
├── Dockerfile              ← Optionales Deployment-File (nicht öffentlich abrufbar)
├── railway.json            ← Optionale Railway-Konfiguration (nicht öffentlich abrufbar, Nutzung optional)
├── .dockerignore           ← Docker-Build-Konfiguration
├── src/
│   ├── index.ts            ← Hauptserver, Routing, Security-Middleware
│   ├── api.ts              ← Alle API-Endpunkte
│   ├── auth.ts             ← JWT-Auth, Cookies, Middleware
│   ├── storage.ts          ← JSON-Datenspeicherung
│   ├── pages.ts            ← Öffentliche HTML-Seiten
│   ├── admin-pages.ts      ← Admin-Panel HTML
│   └── github-sync.ts      ← Git-Synchronisation
└── public/
    ├── css/style.css        ← Öffentliches Design
    ├── css/admin.css        ← Admin-Design
    ├── js/main.js           ← Öffentliches JavaScript
    └── js/admin.js          ← Admin-JavaScript
```

---

## Befehle

```bash
# Entwicklung (mit Auto-Reload)
bun --watch run src/index.ts

# Produktion
bun run src/index.ts

# Abhängigkeiten installieren
bun install
```

---

## CHECKLISTE vor jedem Deploy

- [ ] `.env` ist NICHT in Git: `git ls-files .env` (muss leer sein)
- [ ] `data/credentials.json` ist NICHT in Git
- [ ] `data/messages.json` ist NICHT in Git
- [ ] Kein Token in Git-History: `git log --all -p | findstr "ghp_"` (muss leer sein)
- [ ] Alle Admin-Formulare getestet
- [ ] Kontaktformular funktioniert
- [ ] Nachrichten werden empfangen und können gelöscht werden
- [ ] Impressum-Daten korrekt eingetragen
- [ ] Sensible Pfade blockiert (/.env, /data/, /src/)
