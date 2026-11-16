# Agent notes

Home Operations is a local, single-user **house O&M manual**: an appliance register, service history,
maintenance schedule, notes, manuals and photos. Human-facing documentation lives in `README.md`;
this file is about keeping changes safe and consistent.

## Before calling a change done

```bash
npm run check    # svelte-check / TypeScript
npm run build    # production build
```

Both must pass. Exercise the affected flow against a real server (`npm run dev` on port 5180), not
only through type checking. For print changes, open `/print/doc` and check the browser print
preview.

## Docs are part of the feature

`/llms.txt`, the OpenAPI schema and the `/api` page are written by hand, so a new or changed
endpoint does not update them automatically. Treat this as part of "done":

| If you change… | Also update |
| --- | --- |
| an endpoint, body, field or response shape | `src/routes/llms.txt/+server.ts`, `src/lib/server/openapi.ts`, the tables and examples in `src/routes/api/+page.svelte` and `README.md` |
| appliance, service or maintenance behaviour | `/llms.txt` ("Rules for AI agents" and "Notes"), the skill below |
| an API auth or environment option | `src/lib/server/config.ts`, `.env.example`, `README.md` "Configuration", `/api` page |
| the add-on package, image or options | `config.yaml`, `repository.yaml`, `Dockerfile`, `DOCS.md`, `README.md` "Home Assistant add-on", `CHANGELOG.md` |
| the version number | `package.json`, `config.yaml`, `src/lib/server/config.ts` (`appVersion`) — all three, independently |
| the external skill workflow | `~/.config/opencode/skills/home-operations/SKILL.md` and its `scripts/ho.sh` |

The API is deliberately small. Keep `/llms.txt` ordered by what an agent should do: call
`/meta`, search, create, re-read. Prefer one working `curl` per concept over prose.

## Data is the point

This app exists so a household can rely on it, possibly in an emergency. Treat these as hard
constraints:

- Never delete or rewrite `data/` as part of a code change. Use a throwaway `DATA_DIR` for tests.
- Attachments are BLOBs inside SQLite. They must stay in the database so safety copies and JSON
  backups are complete. If you change that, add file copying to both.
- Backups must round-trip: a file exported by this version must import cleanly, and older backups
  must keep importing. Extend `parseBackup` with defaults rather than rejecting old files.
- A restore makes a safety copy first, and the import is transactional. Keep both behaviours.
- The one-off house-structure migration is gated by `structure_version` and a check for existing
  house sections. Do not remove the gate: without it, a restore or restart can move every page
  into Unsorted.
- Appliance saves go through `updatePage()` (so notes keep revisions) and then update the
  structured columns. Do not bypass that ordering.
- Logging a service updates the appliance's next-due date. Editing an appliance must not silently
  wipe an existing service schedule unless the user cleared it.

## API rules

- API writes must go through the same server functions as the UI (`createAppliance`,
  `updateAppliance`, `addServiceRecord`, `updatePage`, …). Do not duplicate business rules in a
  route handler.
- The API never accepts passwords or secrets; keep it that way in docs and examples.
- `POST /appliances` must keep working with only `make` and `model`, generating a name and picking
  a section from the category. That is the "populate from a model" path.
- Partial updates must preserve fields that were not sent. In particular, an omitted
  `service_next_due` must not silently clear an appliance's schedule; an explicit `null` is what
  asks for recalculation.
- Attachment uploads are multipart; the production entrypoint supplies a same-origin header for
  key-less CLI requests so SvelteKit's CSRF check does not reject them. Keep that behaviour.

## Print output

Printing is a core feature. Appliance pages print a specification table and service history, and
`/maintenance` prints a schedule. Keep the printed view in step with the screen: if you add a field
to the register or service record, decide whether it belongs on paper and update
`src/routes/print/doc/+page.svelte` accordingly.

## Conventions

- Svelte 5 runes, hand-written CSS in `src/app.css`, inline SVG in `src/lib/icons.ts`. Prefer an
  existing pattern over adding a dependency.
- Server data access is plain `node:sqlite` through the helpers in `src/lib/server/db.ts`. Append a
  migration to `migrations`; never edit an applied migration.
- Markdown rendering lives in `src/lib/markdown.ts` and is shared by server and browser. It escapes
  raw HTML and allows only http(s), mailto, tel and in-app links. Keep manual URLs restricted to
  http(s) as well.
- User-facing copy is plain English, written for someone who is not technical and may be reading it
  under stress. Avoid jargon in the UI.
- Dates in the UI use `en-GB` formatting and date-only values from `src/lib/format.ts`.
- Never put a password or secret in an example, seed page or help text.

## Testing without touching the real manual

```bash
DATA_DIR=/tmp/home-operations-test npm run dev
```

Add an appliance, upload a PDF and a photo, log a service, add a standing task, print the manual and
the schedule, download a backup, edit the JSON, import it, and verify counts and attachment bytes.
Delete the temporary directory afterwards.
