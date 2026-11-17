import { apiKey, appVersion, publicBaseUrl } from '$lib/server/config';
import { MAX_ATTACHMENT_BYTES } from '$lib/server/attachments';
import { applianceStats } from '$lib/server/appliances';
import { maintenanceSummary } from '$lib/server/maintenance';
import { pageStats } from '$lib/server/pages';
import { listSections } from '$lib/server/sections';
import { getSettings } from '$lib/server/settings';
import { isoDate } from '$lib/format';
import { wrapApi } from '$lib/server/http';

export const GET = wrapApi(({ url }) => {
  const origin = publicBaseUrl || url.origin;
  const base = `${origin}/api/v1`;
  const settings = getSettings();
  const stats = pageStats();
  const appliances = applianceStats();
  const summary = maintenanceSummary();
  const sections = listSections();

  const auth = apiKey
    ? `Authentication is ENABLED. Send "Authorization: Bearer $HOME_OPERATIONS_API_KEY" (or "X-Api-Key: <key>") on every request except /health.`
    : `Authentication is currently disabled. If the owner sets HOME_OPERATIONS_API_KEY, send "Authorization: Bearer <key>".`;

  const skillLinks = `Building a skill for another agent? Read ${origin}/agent.md, use the ready-made
skill at ${origin}/skill.md, and discover the instance at
${origin}/.well-known/home-operations.json.`;

  const authCurl = apiKey
    ? `  -H "Authorization: Bearer $HOME_OPERATIONS_API_KEY" \\\n`
    : '';

  const sectionList = sections
    .map(
      (section) =>
        `- ${section.name} (id: ${section.id}, slug: ${section.slug}) — ${section.page_count} page(s), ${section.appliance_count} appliance(s)`
    )
    .join('\n');

  const text = `# Home Operations API

A self-hosted operations & maintenance manual for a house: appliances, systems,
service history, maintenance tasks, written procedures, manuals and photos.
Version: ${appVersion}
Base URL: ${base}
OpenAPI spec: ${base}/openapi.json
Human docs: ${origin}/api
Today: ${isoDate()}
Book: ${settings.book_title}

${auth}

${skillLinks}

Current instance: ${stats.appliances} appliances, ${stats.pages} pages,
${sections.length} sections, ${summary.overdue} overdue and ${summary.dueSoon} due soon.
Attachment limit: ${Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))} MB per file.

## Rules for AI agents

- Call GET /meta first. It returns every section id, category suggestions, statistics,
  maintenance counts and the docs links. Never invent or guess an id.
- Search before creating: GET /search?q=<words>, GET /appliances?q=<words>, or
  GET /pages?q=<words>. Check make, model and location before adding a duplicate.
- An appliance is a page with structured fields. Use /appliances for it, not /pages.
  /pages/{id} still returns its notes, but PATCH and DELETE are refused there.
- Name an appliance "Make Model Type" (for example "Vaillant ecoTEC plus 630 boiler").
  Put the bare values in make and model. Do not repeat the make twice.
- Use an existing section id from /meta. If section_id/section_slug is omitted, the API
  picks a sensible section from the category, then House Essentials.
- Given only a make and model, research before writing: verify the exact model, find the
  official manual, and look up the service interval, consumables and common faults. Do not
  guess the serial number, install date or warranty date — leave them empty and ask.
- Set service_interval_months only when it is meaningful (12 for a boiler service, 6 for
  filters). Leave service_next_due empty to start the clock from today.
- Attach manuals and photos with POST /attachments (multipart). A manual URL with no PDF
  is still useful, but prefer the real document.
- Log a service with POST /appliances/{id}/service. That updates the next-due date.
- Use /tasks for standing jobs that are not tied to one appliance (smoke alarms, gutters,
  filters). Mark them done with POST /tasks/{id}/complete.
- Never store passwords, door codes or alarm codes in the manual. Record where the
  password manager recovery kit or emergency access is kept instead.
- Responses are {"data": ...} on success and
  {"error": {"code","message","details"}} on failure. HTTP status codes are meaningful.
- List endpoints use limit/offset and return pagination.total and pagination.has_more.

## Endpoints

GET    /health
GET    /meta
GET    /appliances?q=&category=&status=&sort=&limit=&offset=
POST   /appliances                         ({"make":"...","model":"..."} is enough for a name)
GET    /appliances/{id}
PATCH  /appliances/{id}                    (partial update; send only what changes)
DELETE /appliances/{id}                    (also deletes notes, files and service history)
GET    /appliances/{id}/service
POST   /appliances/{id}/service
DELETE /appliances/{id}/service/{recordId}
GET    /pages?q=&section_id=&kind=&limit=&offset=
POST   /pages
GET    /pages/{id}
PATCH  /pages/{id}                         (normal pages only)
DELETE /pages/{id}                         (normal pages only)
GET    /sections
POST   /sections
GET    /sections/{id}
PATCH  /sections/{id}
DELETE /sections/{id}                      (409 unless empty)
GET    /maintenance?status=&type=&limit=&offset=
GET    /tasks?status=&limit=&offset=
POST   /tasks
GET    /tasks/{id}
PATCH  /tasks/{id}
DELETE /tasks/{id}
POST   /tasks/{id}/complete
GET    /attachments?appliance_id=|page_id=
POST   /attachments                        (multipart/form-data)
GET    /attachments/{id}
GET    /attachments/{id}/file[?download=1]
DELETE /attachments/{id}
GET    /search?q=&limit=&offset=
GET    /warranties?days=90
GET    /export                             (JSON, includes attachment data)
GET    /backup                             (SQLite database snapshot, includes attachments)

## Sections on this instance

${sectionList}

## Appliance shape

{
  "id": "pg_...",
  "name": "Vaillant ecoTEC plus 630 boiler",
  "make": "Vaillant",
  "model": "ecoTEC plus 630",
  "serial": "2101234567",
  "category": "Heating",
  "location": "Airing cupboard, first floor",
  "section": {"id":"sec_...","name":"Heating & Hot Water","slug":"heating-hot-water","icon":"flame"},
  "installed_on": "2021-09-15",
  "warranty_until": "2031-09-15",
  "warranty_status": "active",              // none | expired | expiring | active
  "days_until_warranty": 1764,
  "service_interval_months": 12,
  "service_next_due": "2027-09-15",
  "service_status": "later",                // none | overdue | soon | later
  "service_due": false,
  "days_until_service": 303,
  "last_service": "2026-09-10",
  "attachment_count": 1,
  "supplier": "Green Heating Ltd, 01234 567890",
  "manual_url": "https://...",
  "pinned": false,
  "body": "Markdown operation notes",
  "body_text": "Plain text version",
  "attachments": [ ... ],
  "service_records": [ ... ],
  "created_at": "...",
  "updated_at": "...",
  "links": {"self":"/api/v1/appliances/pg_...","html":"/appliances/pg_...","print":"/print/doc?pages=pg_...&dates=1"}
}

POST /appliances accepts a subset: name, make, model, serial, location, category,
section_id, section_slug, installed_on, warranty_until, service_interval_months,
service_next_due, supplier, manual_url, pinned, body. Only name — or make and model — is
required. Dates are YYYY-MM-DD.

PATCH /appliances/{id} accepts the same fields, all optional. Set service_next_due to null
to recalculate it from the interval and today. Set service_interval_months to null to remove
the schedule.

## Page shape

{ "id":"pg_...", "title":"...", "kind":"page", "pinned":false,
  "section": {...}, "body":"Markdown", "body_text":"...",
  "attachment_count":0, "attachments":[], "updated_at":"..." }

Create a normal page with POST /pages {"title":"...","body":"...","section_id":"..."}.

## Service record shape

{ "id":"srv_...", "performed_on":"2026-10-20", "kind":"service", "company":"...",
  "engineer":"...", "cost":96.5, "notes":"...", "next_due":"2027-10-20" }

## Task shape

{ "id":"task_...", "title":"Test smoke and CO alarms", "category":"Safety",
  "interval_months":6, "next_due":"2027-05-01", "status":"later",
  "days_until_due":166, "last_done":"2026-11-01", "notes":"..." }

## Workflows

### Populate an appliance from a make and model

1. GET /meta and remember the section ids.
2. GET /appliances?q=<make>+<model> — update the existing record instead of duplicating it.
3. Research the exact model: official manual URL, service interval, consumable/filter part
   numbers, normal operating readings, common fault codes. Prefer the manufacturer's PDF.
   Leave serial, install date and warranty blank unless the owner or a data plate provides them.
4. Create the record:
   curl -X POST ${base}/appliances \\
     -H "Content-Type: application/json" \\
${authCurl}     -d '{"make":"Vaillant","model":"ecoTEC plus 630","category":"Heating","location":"Airing cupboard","service_interval_months":12,"body":"## Operation\\n\\n...","manual_url":"https://..."}'
5. Upload the manual PDF:
   curl -X POST ${base}/attachments \\
${authCurl}     -F "file=@manual.pdf" -F "appliance_id=<id>" -F "kind=document" -F "caption=Installation manual"
6. Re-read GET /appliances/{id} and report what was verified versus what is still unknown.

### Ask what needs doing

- GET /maintenance?status=overdue,soon returns the urgent items plus summary, calendar and warranties.
- GET /warranties?days=90 lists warranties ending soon.
- GET /appliances?status=overdue is the appliance-only view.

### Log a service or repair

curl -X POST ${base}/appliances/<id>/service \\
  -H "Content-Type: application/json" \\
${authCurl}  -d '{"performed_on":"2026-10-20","kind":"service","company":"Green Heating Ltd","cost":96.50,"notes":"Flushed the system","next_due":"2027-10-20"}'

Omit next_due to use the appliance's service interval. The appliance's service_next_due is
updated automatically.

### Add a standing task

curl -X POST ${base}/tasks \\
  -H "Content-Type: application/json" \\
${authCurl}  -d '{"title":"Clean gutters","category":"Exterior","interval_months":6,"last_done":"2026-11-01"}'

Omit next_due and it is calculated from last_done and the interval. Complete it with
POST /tasks/{id}/complete.

### Search for an answer

curl "${base}/search?q=stopcock"
curl "${base}/appliances?q=boiler"

Search covers titles, notes, make, model, serial, location and category.

## Notes

- service_status/status use: overdue (date before today), soon (today to 30 days), later,
  none (no date). service_due is true for today or earlier.
- warranty_status is expiring within 90 days; warranties already expired are still shown on
  the appliance itself but are not in the 90-day alert lists.
- body is Markdown. body_text is a plain-text rendering for searching or summarising.
- Attachments are stored inside SQLite; GET /export and GET /backup include them. JSON
  export embeds each file as data_base64.
- Uploads are limited to ${Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))} MB per file. PDF, images, text,
  Word/Excel and ZIP are accepted. SVG and HTML are refused.
- DELETE endpoints are destructive and immediate. Ask the owner before deleting an appliance
  or task unless they explicitly requested it.
- This API is local: the app binds to 127.0.0.1 by default and has no user accounts. Treat the
  data as readable by anyone with access to the computer.
`;

  return new Response(text, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
});
