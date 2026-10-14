# Eden-Fork von Kaneo

Dieser Fork (`schadila/kaneo`, Branch **`eden`**) erweitert
[Kaneo](https://github.com/usekaneo/kaneo) für das Eden-Music-Team um ein
Wiki, Projekt-Docs, ein persönliches Dashboard und deutlichere Task-Listen.
Betrieben wird er über das Repo
[schadila/team.edenmusic.ch](https://github.com/schadila/team.edenmusic.ch)
(Docker-Compose, Image-Build, VPS-Deploy).

| | |
|---|---|
| Basis | Kaneo **v2.46.2** (`upstream` = `usekaneo/kaneo`) |
| Arbeitsbranch | `eden` (nicht `main` — `main` bleibt ein Spiegel von upstream) |
| Image | `ghcr.io/schadila/kaneo-eden:<commit-sha>` (öffentlich) |
| Gebaut von | `team.edenmusic.ch/.github/workflows/build-kaneo.yml` |

GitHub Actions sind im Fork **bewusst nicht aktiviert**: die ~27 Upstream-
Workflows (Release, Nightly, Site-Deploy …) würden sonst mitlaufen und mangels
Secrets fehlschlagen. Das Image wird deshalb im Betriebs-Repo gebaut.

## Inhalt

1. [Funktionen](#funktionen)
2. [Architektur](#architektur)
3. [API](#api)
4. [Datenbank](#datenbank)
5. [Rechte](#rechte)
6. [Frontend](#frontend)
7. [Dateien](#dateien)
8. [Entwickeln & Testen](#entwickeln--testen)
9. [Ausrollen](#ausrollen)
10. [Upstream-Updates mergen](#upstream-updates-mergen)
11. [Bekannte Grenzen / Ideen](#bekannte-grenzen--ideen)

## Funktionen

**Wiki (pro Workspace)** — Sidebar → „Wiki“ (`/dashboard/workspace/:id/wiki`).
Verschachtelte Seiten (Seitenbaum links, Seite rechts), gemeinsames Wissen für
den ganzen Workspace. Seiten per **Drag & Drop** umsortieren und verschachteln
(oberes/unteres Viertel einer Zeile = davor/danach, Mitte = als Unterseite,
Ablagezone unter dem Baum = oberste Ebene); Alternative ohne Maus:
„…“ → Nach oben / Nach unten.

**Docs (pro Projekt)** — im Projekt neben „Tasks | Backlog“ der Reiter „Docs“
(`…/project/:projectId/docs`). Eigener Seitenbaum je Projekt, nur für Leute
mit Zugriff auf das Projekt sichtbar.

**Editor** — derselbe Tiptap-Editor wie bei Task-Beschreibungen: Markdown,
`/`-Befehle (Text, Überschrift, Listen, To-dos, Zitat, Code-Block,
Tabelle; Mermaid-Diagramme über Code-Block-Sprache),
Formatierungsleiste bei Markierung, Links, Code-Highlighting, Bilder per URL.
Speichert automatisch (700 ms Debounce, gleiche Save-Queue wie Beschreibungen).

**@-Erwähnungen in Seiten** — `@` öffnet die Personenauswahl (Wiki:
Workspace-Mitglieder, Docs: Projektmitglieder). Neu Erwähnte bekommen eine
Benachrichtigung `page_mention` (Inbox, Dashboard, E-Mail/Webhook je nach
Einstellung). Benachrichtigt wird nur, wer *neu* hinzukommt, nicht der Autor
selbst und nur, wer die Seite sehen darf.

**Persönliches Dashboard** (`/dashboard/me`, Startseite nach Login,
Sidebar → „Mein Dashboard“) — workspace-übergreifend:
- *Meine offenen Aufgaben*: alle zugewiesenen offenen Tasks aller Workspaces,
  gruppiert nach Überfällig / Heute / Diese Woche / Später / Ohne Datum
- *Erwähnungen & Inbox*: Benachrichtigungen aller Workspaces, Filter
  Ungelesen / Erwähnungen / Alle, „Alle gelesen“, Klick öffnet Task bzw. Seite
- *Zuletzt bearbeitete Seiten*: eigene zuletzt erstellte/bearbeitete Seiten

**Task-Vorlagen (pro Workspace)** — Einstellungen → „Task-Vorlagen“
(`/dashboard/settings/workspace/templates`). Eine Vorlage ist eine Liste von
Tasks mit Titel, Priorität, Labels und Fälligkeit „N Tage nach Start“. Im
Projekt (alle Task-Ansichten, Toolbar) „Vorlage anwenden“: Vorlage, Startdatum,
Spalte und Zuständige wählen, Vorschau mit berechneten Fälligkeiten, dann
werden alle Tasks auf einmal angelegt.

**Task-Listen mit mehr Akzent** (Projekt-Listenansicht, „Meine Aufgaben“,
Home „Up next“, Dashboard) — farbiger Prioritätsbalken links (dringend rot,
hoch orange, mittel gelb, niedrig blau), kräftigere Titel, höhere Zeilen,
Fälligkeit als farbiger Badge, Labels als Chips, erledigte Tasks
durchgestrichen, deutlichere Zähler in Spalten-Überschriften.

**Kleinigkeiten** — Wechsel von „Docs“ zurück auf „Tasks“/„Backlog“ und
Projektwechsel bleiben im jeweiligen Reiter.

## Architektur

```
Browser (React, TanStack Router/Query)
  ├─ /dashboard/me ──► GET /api/task/assigned?workspaceId=…  (1× pro Workspace)
  │                 ├► GET /api/notification                 (ohne workspaceId = alle)
  │                 └► GET /api/page/recent
  ├─ /wiki, /docs ─► GET/POST/PUT/DELETE /api/page/…
  └─ Inbox ────────► page_mention-Benachrichtigungen (resourceType "workspace")

Hono-API (apps/api/src/page/)
  ├─ page-access.ts        Seite → Workspace-/Projekt-Zugriff prüfen
  ├─ controllers/*         CRUD, Seitenbaum, „recent“
  ├─ notify-page-mentions  @-Erwähnungen → createNotification()
  └─ migrate-page-table    legt Tabelle `page` beim Start idempotent an

PostgreSQL: Tabelle `page` (Fork-eigen, nicht im Drizzle-Journal)
```

Grundsätze, damit der Fork mergebar bleibt:
- Neuer Code in **eigenen Ordnern** (`page/`, `pages/`, `my-dashboard/`);
  bestehende Kaneo-Dateien nur zum Einhängen angefasst (Routen-Registrierung,
  Sidebar, Docs-Reiter, Notification-Texte, Listen-Styling).
- **Keine neuen Rechte-Ressourcen** (siehe [Rechte](#rechte)) — sonst müssten
  gespeicherte Rollen in allen Workspaces migriert werden.
- **Keine Drizzle-Migration** für Fork-Tabellen (siehe [Datenbank](#datenbank)).

## API

Alle Routen unter `/api/page`, OpenAPI-Tag „Pages“ (`apps/docs/openapi.json`).

| Methode | Pfad | Zweck | Zugriff |
|---|---|---|---|
| GET | `/page/workspace/{workspaceId}` | Seitenbaum (ohne Inhalt) des Wikis; mit `?projectId=` die Docs eines Projekts | Workspace-Mitglied (+ Projektzugriff) |
| GET | `/page/recent` | eigene zuletzt erstellte/bearbeitete Seiten aller Workspaces (max. 10) | eigene Mitgliedschaften + Projektzugriff |
| GET | `/page/{id}` | Seite inkl. Markdown-Inhalt | Workspace-Mitglied (+ Projektzugriff) |
| POST | `/page` | Seite anlegen (`workspaceId`, optional `projectId`, `parentId`, `title`) | + `task:update` |
| PUT | `/page/{id}` | `title`, `icon`, `content` ändern | + `task:update` |
| PUT | `/page/{id}/move` | `{ parentId: string\|null, index }` — umhängen/umsortieren im selben Wiki bzw. denselben Docs | + `task:update` |
| DELETE | `/page/{id}` | Seite **inkl. aller Unterseiten** löschen | + `task:update` |

Task-Vorlagen unter `/api/task-template`, OpenAPI-Tag „Task templates“:

| Methode | Pfad | Zweck | Zugriff |
|---|---|---|---|
| GET | `/task-template/workspace/{workspaceId}` | Vorlagen des Workspaces | Workspace-Mitglied |
| POST | `/task-template` | anlegen (`workspaceId`, `name`, `description`, `items[]`) | + `task:update` |
| PUT | `/task-template/{id}` | ersetzen (`name`, `description`, `items[]`) | + `task:update` |
| DELETE | `/task-template/{id}` | löschen (erzeugte Tasks bleiben) | + `task:update` |
| POST | `/task-template/{id}/apply` | Tasks anlegen: `projectId`, optional `status` (Spalten-Slug, Default erste Spalte), `startDate` (ISO; Web schickt lokale 12:00), `assigneeId` | + `task:create`, Projektzugriff |

`items[]`: `{ title, description?, priority, dueOffsetDays: int|null, labels: string[] }`
(max. 100). „Anwenden“ ruft pro Eintrag Kaneos eigenes `createTask` auf
(Nummer, Aktivität, Events, Integrationen wie von Hand) und hängt Labels über
`createLabel` an — Zuordnung über den **Namen** der Workspace-Labels, unbekannte
Namen werden übersprungen.

Hinweise:
- `/page/recent` ist vor `/page/{id}` registriert (sonst würde „recent“ als ID
  gelesen).
- `move`: Transaktion mit Advisory-Lock pro Baum, Zyklus-Prüfung per
  rekursivem CTE („in die eigene Unterseite“ → 400), Geschwister werden
  neu durchnummeriert, deren `updated_at` bleibt unverändert.
- Eine Unterseite übernimmt immer Workspace und Projekt der Elternseite;
  abweichende `projectId` → 400.
- Neue Seiten werden ans Ende ihrer Geschwister gehängt (`position`).
- Inhalt max. 1 MB, Titel max. 500 Zeichen.

Benachrichtigung `page_mention`:
```jsonc
{
  "type": "page_mention",
  "resourceType": "workspace",       // bestehender Typ → Kaneos Zugriffsregeln greifen
  "resourceId": "<workspaceId>",
  "title": "Anna mentioned you",     // Fallback für E-Mail/Webhook
  "content": "Anna mentioned you in: Onboarding",
  "eventData": { "pageId", "pageTitle", "projectId", "workspaceId", "mentionerName" }
}
```
Das Web rendert daraus lokalisierte Texte (`notifications:events.page_mention`).

## Datenbank

Tabelle `page`:

| Spalte | Typ | |
|---|---|---|
| `id` | text PK | cuid2 |
| `workspace_id` | text NOT NULL | FK `workspace` (cascade) |
| `project_id` | text NULL | NULL = Wiki; FK (`workspace_id`,`project_id`) → `project` (cascade) |
| `parent_id` | text NULL | FK `page` (cascade → Unterseiten werden mitgelöscht) |
| `title` | text | |
| `icon` | text NULL | Emoji (API vorhanden, noch keine UI) |
| `content` | text | Markdown, Erwähnungen als `<kaneo-mention id="…">` |
| `position` | integer | Reihenfolge unter Geschwistern |
| `created_by`, `updated_by` | text NULL | FK `user` (set null) |
| `created_at`, `updated_at` | timestamp (UTC) | |

Indizes: (`workspace_id`, `project_id`), (`parent_id`).

Tabelle `task_template`: `id`, `workspace_id` (FK cascade), `name`,
`description`, `items` (jsonb, siehe API), `created_by`/`updated_by`
(FK user, set null), `created_at`/`updated_at`; Index (`workspace_id`).

**Warum keine Drizzle-Migration?** Fork-Migrationen würden die Nummerierung
von Kaneo belegen (`0064_…`). Beim nächsten Upstream-Merge kollidiert das
Journal — schlimmer: Drizzle wendet nur Migrationen an, die *neuer* als die
zuletzt angewendete sind; eine ältere Upstream-Migration würde in Prod
**still übersprungen**. Deshalb:

- `page/page-table.ts` definiert die Tabelle für Drizzle-Queries, ist aber
  **nicht** in `database/schema.ts` (drizzle-kit sieht sie nie).
- `page/migrate-page-table.ts` und `task-template/migrate-task-template-table.ts`
  legen die Tabellen beim API-Start nach den Kaneo-Migrationen mit
  `CREATE TABLE/INDEX IF NOT EXISTS` an (Advisory-Lock gegen parallele
  Instanzen). Einstieg: `eden-migrations.ts` → `runEdenMigrations()`. Spätere Änderungen dort anhängen
  (`ALTER TABLE … ADD COLUMN IF NOT EXISTS …`).
- **Nie** `db:generate` mit `page`/`task_template` in `schema.ts` laufen lassen.

Backups: `page` liegt in derselben DB wie Kaneo, `deploy-prod.sh` sichert sie
mit dem normalen `pg_dump`.

## Rechte

Keine neue Ressource im Rollen-Statement — Seiten nutzen die Task-Rechte:

| Aktion | Benötigt |
|---|---|
| Wiki/Docs lesen | Workspace-Mitglied; bei Docs zusätzlich Projektzugriff (eingeschränkte Mitglieder sehen nur freigegebene Projekte) |
| Seiten anlegen/bearbeiten/verschieben/löschen | `task:update` (Built-in: member, admin, owner — **nicht** viewer) |
| Vorlagen sehen | Workspace-Mitglied |
| Vorlagen anlegen/bearbeiten/löschen | `task:update` |
| Vorlage anwenden | `task:create` + Projektzugriff |

Im Web: `useWorkspacePermission().canUpdateTasks()`. API-Keys mit Scope
brauchen ebenfalls `task:update`.

## Frontend

Routen:
- `/dashboard/me` — `routes/_layout/_authenticated/dashboard/me.tsx`
- `/dashboard/settings/workspace/templates` — `…/settings/workspace/templates.tsx`
- `/dashboard/workspace/$workspaceId/wiki?page=<id>` — `…/$workspaceId/wiki.tsx`
- `/dashboard/workspace/$workspaceId/project/$projectId/docs?page=<id>` — `…/$projectId/docs.tsx`
- `/dashboard` leitet nach Login auf `/dashboard/me` (statt letzter Workspace;
  setzt bei Bedarf einen aktiven Workspace für die Sidebar)

Wichtige Bausteine:
- `components/pages/pages-workspace.tsx` — zweispaltiges Layout (Baum + Seite),
  von Wiki und Docs gemeinsam genutzt
- `components/pages/page-editor.tsx` — schlanker Seiten-Editor auf Basis von
  `createEditorExtensions` (+ `KaneoMention`, `MentionSuggestion`);
  per `key={pageId}` neu gemountet, `initialMarkdown` nur beim Mount gelesen
- `components/pages/page-save-queue.ts` — eigene Instanz von Kaneos
  `createDescriptionSaveQueue` (Debounce/Coalescing, Status „Speichern…“)
- `components/my-dashboard/use-all-assigned-tasks.ts` — `useQueries` über alle
  Workspaces, gleicher Query-Key wie Kaneos „Meine Aufgaben“
  (`["assigned-tasks", id, { countOnly: false }]`), damit Invalidierungen
  greifen
- `components/pages/page-tree.tsx` — dnd-kit (`useDraggable`/`useDroppable`
  pro Zeile, `DragOverlay`, Root-Ablagezone); Zielberechnung rein in
  `page-move.ts` (`resolveDrop`, `resolveStep`, `applyMove` für das
  optimistische Update) und `drop-zone.ts`, beide mit Tests
- `components/task-templates/` — Einstellungsseite, Formular
  (`template-draft.ts` mit Tests), `apply-template-dialog.tsx`,
  `apply-template-button.tsx` (in `project-layout.tsx` eingehängt, nicht in Docs)
- `lib/priority-accent.ts` — Prioritätsbalken (`before:`-Pseudo-Element)
- `components/my-work/due-date-badge.tsx` — Fälligkeit als farbiger Badge

Query-Keys: `["pages", workspaceId, projectId|null]`, `["page", id]`,
`["pages", "recent"]`, `["notifications", "all-workspaces"]`.

Übersetzungen: `workspace.pages.*`, `workspace.dashboard.*`,
`notifications.events.page_mention.*` — Quelle `i18n/en-US.json`, Deutsch
gepflegt in `de-DE.json`, übrige Sprachen per `pnpm i18n:check:fix` mit
Englisch aufgefüllt.

## Dateien

Neu (Fork-eigen):
```
apps/api/src/page/                     API-Modul (Routen, Controller, Zugriff,
                                       Tabelle, Startup-Migration, Erwähnungen)
apps/api/src/task-template/            Vorlagen-API (inkl. apply, Tabelle, Migration)
apps/api/src/eden-migrations.ts        Einstieg für Fork-Tabellen beim Start
apps/web/src/components/task-templates/ Vorlagen-UI
apps/web/src/components/pages/         Wiki/Docs-UI
apps/web/src/components/my-dashboard/  Dashboard-UI
apps/web/src/fetchers/{page,task-template}/
apps/web/src/hooks/{queries,mutations}/{page,task-template}/
apps/web/src/lib/priority-accent.ts
apps/web/src/components/my-work/due-date-badge.tsx
apps/web/src/routes/…/dashboard/me.tsx, …/wiki.tsx, …/docs.tsx
EDEN.md
```

Geänderte Kaneo-Dateien (bei Upstream-Merges auf Konflikte achten):
```
apps/api/src/index.ts                       Router + runEdenMigrations einhängen
apps/api/src/notification/response.ts       Typ page_mention in der Beschreibung
apps/web/src/components/nav-main.tsx        Sidebar: Mein Dashboard, Wiki
apps/web/src/components/common/project-layout.tsx           Docs-Reiter, „Vorlage anwenden“
apps/web/src/components/common/project-layout.test.tsx      Mock für den Vorlagen-Button
apps/web/src/components/settings/nav/build-settings-nav.ts  Link „Task-Vorlagen“ (+ Test)
apps/web/src/components/project/views/project-scope-toggle.tsx
apps/web/src/components/project/views/use-go-to-project-view.ts
apps/web/src/components/inbox/inbox-detail.tsx              „Seite öffnen“
apps/web/src/components/inbox/notification-icon.tsx
apps/web/src/components/notification/notification-text.ts
apps/web/src/components/list-view/task-row.tsx              Listen-Styling
apps/web/src/components/list-view/list-column-section.tsx
apps/web/src/components/my-work/assigned-task-row.tsx
apps/web/src/routes/_layout/_authenticated/dashboard/index.tsx  Login-Ziel
apps/web/src/routeTree.gen.ts               generiert
apps/docs/openapi.json                      generiert
i18n/*.json
```

## Entwickeln & Testen

Voraussetzungen: Node 24 (`nvm use 24`), pnpm 10.32 (`corepack enable`).

```bash
pnpm install --frozen-lockfile
pnpm exec vp check --fix <pfade>          # Lint + Format
pnpm --filter @kaneo/api typecheck
pnpm --filter @kaneo/web typecheck
pnpm --filter @kaneo/api test
pnpm --filter @kaneo/web exec vp test run
pnpm i18n:check                            # alle Sprachen vollständig?
pnpm openapi:check:fix                     # nach API-Änderungen
pnpm --filter @kaneo/web build             # erzeugt auch routeTree.gen.ts
```

Stand beim Commit `938a25a`: API 1166 Tests, Web 1528 Tests grün, beide
Typechecks sauber.

Lokal laufen Fork und Betriebs-Repo gegen **dieselbe** Postgres-DB aus
`team.edenmusic.ch` (Port `127.0.0.1:5433`):

- `pnpm dev` hier → http://localhost:5173 (Hot-Reload). `.env` im Fork-Root
  (gitignored) zeigt mit `DATABASE_URL=…@localhost:5433/kaneo` und demselben
  `AUTH_SECRET` auf diese DB.
- `team.edenmusic.ch/scripts/local-fork.sh` baut das Docker-Image aus diesem
  Checkout und startet es auf http://localhost:8083 (`--release` = zurück auf
  die eingetragene Version).

Achtung: Ein Kaneo-Upgrade migriert die DB; zurück geht es nur per Backup.
Der ganze Ablauf Lokal → Stage → Prod: `team.edenmusic.ch/docs/ENTWICKLUNG.md`.

## Ausrollen

1. Auf `eden` committen und pushen.
2. In `team.edenmusic.ch`: `./scripts/set-kaneo-version.sh` setzt den Tag in
   `deploy/compose.base.yml` auf den **vollen** SHA von `origin/eden`;
   committen, auf `stage` pushen.
3. `deploy-stage.yml` → `build-kaneo.yml` baut `ghcr.io/schadila/kaneo-eden:<sha>`
   (amd64 + arm64, ~10 min beim ersten Mal, danach mit GHA-Cache schneller),
   falls noch nicht vorhanden, prüft die öffentliche Abrufbarkeit, dann
   SSH-Deploy.
4. Auf stage prüfen, `stage` → `main` mergen → Prod (Image existiert schon,
   `deploy-prod.sh` macht vorher `pg_dump`).

Details zum Server: `team.edenmusic.ch/docs/VPS_DEPLOYMENT.md`.

## Upstream-Updates mergen

```bash
git fetch upstream --tags
git checkout eden
git merge vX.Y.Z            # z. B. v2.47.0
# Konflikte: meist nur in den „geänderten Kaneo-Dateien“ oben
pnpm install --frozen-lockfile
pnpm --filter @kaneo/web build          # routeTree.gen.ts neu erzeugen
pnpm openapi:check:fix
pnpm i18n:check:fix
# Tests/Typechecks wie oben, dann committen, pushen, ausrollen
```

Checkliste nach dem Merge:
- Neue Upstream-Migrationen dürfen keine Tabelle `page` anlegen (sonst
  Namenskonflikt → Fork-Tabelle umbenennen).
- Hat upstream Rollen/Rechte geändert? `PAGE_WRITE` in `page/index.ts` prüfen.
- Hat upstream eigene Wiki/Docs-Funktionen bekommen? Dann abwägen, ob der
  Fork-Teil ersetzt werden kann.

## Bekannte Grenzen / Ideen

- Keine Bild-/Datei-Uploads in Seiten (Kaneo-Assets hängen an Tasks und
  brauchen S3; Bilder per URL gehen).
- Kein gleichzeitiges Live-Bearbeiten: letzte Speicherung gewinnt, kein
  WebSocket-Update für Seiten.
- Seiten erscheinen nicht in der Kaneo-Suche.
- Icon-Feld ohne UI.
- Dashboard: „Meine Aufgaben“ max. 100 Tasks pro Workspace (Limit der
  Kaneo-API; der Zähler zeigt trotzdem die Gesamtzahl).
- Erwähnungs-Benachrichtigungen haben keine eigene Einstellung (immer an).
- Seiten nur innerhalb desselben Wikis bzw. derselben Projekt-Docs
  verschiebbar (nicht zwischen Wiki und Projekten).
- Drag & Drop im Seitenbaum nur mit Maus/Touch; Tastatur über das „…“-Menü.
- Vorlagen: keine Unteraufgaben/Checklisten pro Task, keine Zuständigen pro
  Eintrag (eine Person für alle beim Anwenden), Labels nur über den Namen.
