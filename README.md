# Home Operations

A self-hosted **operations & maintenance manual for a house**: what the appliances are, how the
systems work, when they need servicing, where the manuals and receipts are, and what to do when
something stops working.

It is designed to be useful to the person who lives there now, and to anyone who has to take over
later — including a partner, a house-sitter, or an engineer standing in front of the boiler.

- **Appliance register** — make, model, serial, location, warranty, supplier, service interval,
  next due date, operation notes, manuals and photos.
- **Service history** — each visit, repair or inspection, with cost and notes. The next due date
  updates automatically when a service is logged.
- **Maintenance schedule** — appliance servicing plus standing house tasks (alarms, gutters,
  filters), overdue and due-soon lists, a year-ahead calendar and a printable schedule.
- **Uploads** — PDF manuals, photos of data plates and stopcocks, receipts and warranties, stored
  inside the database so backups include them.
- **Print-ready output** — page, section, appliance, register, schedule or the whole manual, with
  cover, contents, section dividers and optional note space.
- **Backups** — one JSON file containing everything, including the attached files, plus a
  human-readable Markdown export and database safety copies.

It runs locally on one machine, with no account and no cloud service.

---

## Requirements

- Node.js 22.13 or newer (the app uses Node's built-in SQLite).
- A modern browser.

## Start it

```bash
cd ~/Projects/knowledgebase
npm install          # only the first time
npm run build        # only after code changes
npm start
```

Open <http://localhost:3000>.

Or use the included script, which builds if needed, starts the server and opens the browser:

```bash
./start.sh
```

There is also a **Home Operations** entry in the application menu. For development:

```bash
npm run dev          # http://127.0.0.1:5180
```

## Home Assistant add-on

This repository is a Home Assistant add-on repository (`repository.yaml` and
`config.yaml`). The add-on runs the same server, stores everything in `/data`
and appears in the Home Assistant sidebar through ingress.

1. **Settings → Add-ons → Add-on store → ⋮ → Repositories**
2. Add `https://github.com/David-Woodthorpe/homeoperations`
3. Install **Home Operations**, start it and turn on **Show in sidebar**.

Options:

| Option | Default | Description |
| --- | --- | --- |
| `api_key` | *(empty)* | Require a bearer/X-Api-Key for `/api/v1` (except `/health`). |
| `public_url` | *(empty)* | Stable public URL used in `/llms.txt` and API examples. Leave empty for ingress. |

Ingress needs no exposed port. For API clients and AI agents, enable the optional
`3000/tcp` port and set `api_key` first. The API is then at
`http://<home-assistant-host>:3000/api/v1`.

Home Assistant snapshots stop the add-on first (`backup: cold`), so the SQLite
database is copied safely. See [DOCS.md](DOCS.md) for ingress behaviour, upload
limits and troubleshooting.

## Docker

```bash
docker compose up -d --build
```

Or build and run manually:

```bash
docker build -t home-operations .
docker run -d --name home-operations -p 3000:3000 \
  -v home-operations-data:/data home-operations
```

Set `HOME_OPERATIONS_API_KEY` and `PUBLIC_BASE_URL` in the environment or a
`.env` file if needed. The image stores everything under `/data`.

## First use

The first run creates the house sections: House Essentials, Heating & Hot Water, Ventilation & Air,
Electrical, Water & Drainage, Kitchen, Laundry & Utility, Smart Home & Network, Security & Alarms,
Garden & Exterior, Maintenance Schedule, Service Contacts, Warranties & Receipts, and Unsorted.

Start with the things that would stop the house working:

1. **House Essentials** — stopcock, consumer unit, gas meter, water meter, router, alarm panel.
2. **Heating & Hot Water** — the boiler or heat pump, cylinder, controls and service history.
3. **Smart Home & Network** — hub, router, accounts, recovery, and what works when the internet is
   down.
4. **Security & Alarms** — alarm, cameras, locks, smoke/CO alarms and key locations.

### Adding an appliance

**Add appliance** asks for the name, category, location, make, model, serial number, install and
warranty dates, supplier and manual link. A service interval produces a next-due date; leave the
date blank to start the clock from today.

After saving, add:

- **Operation notes** — controls, normal display, reset procedure, fault codes, filters, seasonal
  settings, shutdown steps.
- **Manuals and photos** — attach the PDF manual, a photo of the data plate, or the receipt.
- **Service history** — log the last visit even if it predates this manual.

### Standing tasks

Not everything is an appliance. Use **Maintenance → Add a standing task** for jobs such as testing
smoke alarms, cleaning gutters, replacing MVHR filters or checking the water softener. Give it an
interval and press **Done** when complete; the next date moves forward.

## Printing

- **Print & export** — choose pages or whole sections for the binder copy. Options include cover,
  contents, section dividers, updated dates and ruled note space.
- **Appliance pages** print their specification table and service history automatically.
- **Appliances → Print register** prints the full register as a table.
- **Maintenance → Print schedule** prints overdue work, the next twelve months and standing tasks.
- In the print dialog, choose A4, and tick **Headers and footers** for page numbers. Choose
  “Save as PDF” to keep a digital copy as well.

## Backups and files

Everything lives in one SQLite database under `data/`.

- **Full backup** — a JSON file containing sections, pages, revisions, appliances, service history,
  maintenance tasks and **the attached files themselves** (base64 encoded). This is the file to
  keep for a complete restore.
- **Plain Markdown** — every page and appliance with specifications and service history, as one
  readable file. Attached PDFs and photos are not included.
- **Safety copies** — consistent database copies taken with `VACUUM INTO`. One is made
  automatically before every restore; the eight most recent are kept and can be downloaded from
  the Backup page.

Restoring replaces the current manual. It requires a confirmation tick, and a safety copy of the
current database is made first.

### Where the data lives

```
data/
  home-operations.db        the manual, including attached files
  safety-copies/       automatic and manual database copies
```

Keep a recent JSON backup somewhere other than this computer. A printed copy is the backup that
needs no computer at all.

### File limits

- Each attachment: 25 MB.
- Backups and uploads: 512 MB per request by default (`BODY_SIZE_LIMIT`).
- Allowed attachments: PDF, JPEG/PNG/WebP/GIF/HEIC/AVIF/TIFF, plain text/CSV, Word, Excel and ZIP.
  SVG and HTML are deliberately not accepted.

## API and AI agents

Home Operations exposes a local JSON API at `/api/v1`, designed for scripts and AI agents as well as
the browser UI.

- **`/llms.txt`** — the canonical agent guide: rules, endpoints, shapes, research workflow.
- **`/api/v1/openapi.json`** — OpenAPI 3 schema.
- **`/api`** — human-readable endpoint list and examples.

Start with `GET /api/v1/meta` for section ids, categories and statistics. An agent can answer
questions such as “what is overdue?”, “when was the boiler last serviced?”, or “where is the
stopcock?”, and can populate an appliance from a make and model:

```bash
curl -X POST http://localhost:3000/api/v1/appliances \
  -H 'Content-Type: application/json' \
  -d '{"make":"Vaillant","model":"ecoTEC plus 630","category":"Heating",
       "location":"Airing cupboard","service_interval_months":12}'
```

The name is generated as “Vaillant ecoTEC plus 630” when omitted; the section is chosen from the
category. Attach a manual with multipart `POST /api/v1/attachments`, then log a service with
`POST /api/v1/appliances/{id}/service`.

Authentication is optional. Set `HOME_OPERATIONS_API_KEY` to require
`Authorization: Bearer <key>` or `X-Api-Key: <key>` on everything except `/health`.
`PUBLIC_BASE_URL` changes the origin used in generated docs.

An OpenCode skill lives at `~/.config/opencode/skills/home-operations/SKILL.md` with a `ho.sh` wrapper.
It encodes the working conventions — search before creating, verify a model and its manual, never
guess a serial number, leave unknown dates blank, and report what changed.

## Privacy and access

- The app has no login. By default it listens on `127.0.0.1`, so only this computer can reach it.
- Content and attachments are **not encrypted**. Anyone with access to this computer account or the
  `data/` folder can read them.
- Do not put the app on the public internet. `HOST=0.0.0.0` exposes it to your local network; only
  do that on a network you trust.
- Do not store passwords in appliance notes. Keep them in a password manager, and record **where
  the recovery kit or emergency access is kept** here instead.

## Configuration

Optional settings go in `.env` (see `.env.example`) or the environment.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port for `npm start`. |
| `HOST` | `127.0.0.1` | Listen address. `0.0.0.0` allows LAN access. |
| `DATA_DIR` | `./data` | Database and safety copies. |
| `SEED_SECTIONS` | `1` | Set to `0` to start with no sections. |
| `BODY_SIZE_LIMIT` | `512M` | Maximum request size for backups and uploads. |
| `HOME_OPERATIONS_API_KEY` | empty | Require a bearer key on `/api/v1` (except `/health`). |
| `PUBLIC_BASE_URL` | request origin | Origin used in `/llms.txt` and API examples. |

## Development

```bash
npm run dev      # dev server on http://127.0.0.1:5180
npm run check    # svelte-check / TypeScript
npm run build    # production build into build/
npm start        # production server via server.js
```

The UI is deliberately dependency-light: Svelte 5 runes, hand-written CSS, inline SVG icons and
`marked` for Markdown. The server uses Node's `node:sqlite`; schema changes are appended to the
`migrations` array in `src/lib/server/db.ts` and applied through `schema_migrations`.

### Project layout

```
src/
  app.css                       tokens, layout, screen and print styles
  lib/
    components/
      PageEditor.svelte          Markdown editor, toolbar and live preview
      ApplianceForm.svelte       register fields plus operation notes
      Attachments.svelte         uploads and file list
      ServiceHistory.svelte      service log and add form
    markdown.ts                  shared Markdown renderer (server and browser)
    icons.ts                     inline SVG paths
    seed-sections.ts             house structure and category suggestions
    server/
      db.ts                      connection, migrations, house structure migration
      pages.ts                   pages, search, revisions, backlinks
      sections.ts                sections and ordering
      appliances.ts              register, warranties, service records
      maintenance.ts             standing tasks, schedule and month grouping
      attachments.ts             attachments stored as SQLite BLOBs
      backup.ts                  JSON/Markdown export, import and safety copies
      api-schemas.ts             zod validation for the agent API
      api-appliances.ts          section resolution and appliance merge logic
      api-serialize.ts           API response shapes and computed status
      http.ts / errors.ts        JSON responses and API errors
      openapi.ts                 OpenAPI 3 schema for /api/v1
  routes/
    +page.svelte                 overview: due work, warranties, recent changes
    appliances/                  register, add, detail, edit
    maintenance/                 schedule, tasks, printing
    sections/                    section list and section pages
    pages/                       notes, editor, history, downloads
    search/                      full-text search
    print/                       print chooser and clean print document
    attachments/                 file serving for the UI
    backup/                      backup, restore, safety copies
    settings/                    book title and cover details
    help/                        this guide, in the app
    api/                         human API documentation
    api/v1/                      JSON API for scripts and AI agents
    llms.txt/                    agent guide (plain text)
server.js                        production HTTP entrypoint
Dockerfile, compose.yaml         Docker image and local compose file
config.yaml, repository.yaml     Home Assistant add-on metadata
DOCS.md                          add-on installation, ingress and options
CHANGELOG.md                     add-on release notes
```

### Notes for future maintainers

- Run `npm run check` and `npm run build` before considering a change finished.
- Print output is a normal HTML route (`/print/doc`), not a PDF service. Appliance specs and service
  history are rendered there explicitly; keep that in step with the detail page.
- Attachments are BLOBs in SQLite, not files on disk. That is what makes safety copies and JSON
  backups complete. Keep per-file and request limits in mind if that changes.
- The house-structure migration runs once, gated by `structure_version` and a check for existing
  house sections. Backups carry the flag only when they already use the house structure; older
  backups are moved into Unsorted on restore.
- Markdown escapes raw HTML and allows only http(s), mailto, tel and in-app links. Manual URLs are
  similarly restricted when displayed.
- Do not add tracking, external fonts or CDN assets. The app should work fully offline.
