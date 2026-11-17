---
name: Home Operations
description: Read and update the self-hosted Home Operations house O&M manual over its HTTP API. Use for appliance and system questions, make/model research and register entries, service history, maintenance tasks, warranties, manuals and photo uploads, and printable house documentation.
---

# Home Operations

Home Operations is a local operations & maintenance manual for a house: an
appliance and system register, service history, standing maintenance tasks,
written procedures, manuals and photos. It is a plain HTTP/JSON API.

Generated from Home Operations {{VERSION}} on {{TODAY}}.

## Connect

```sh
BASE="${HOME_OPERATIONS_BASE_URL:-{{BASE_URL}}}"
{{AUTH_SETUP}}
```

{{AUTH_NOTE}}
{{INGRESS_NOTE}}

- Canonical agent guide: `{{LLMS_URL}}`
- OpenAPI: `{{OPENAPI_URL}}`
- Human docs: `{{HUMAN_URL}}`
- Start with `GET $BASE/health`, then `GET $BASE/meta`. Use the section ids from
  `/meta`; never invent an id.

## Workflow

1. `GET /meta` — sections, categories, statistics and docs links.
2. Search before writing: `GET /search?q=...`, `GET /appliances?q=...`,
   `GET /pages?q=...`.
3. Read before changing: `GET /appliances/{id}` includes specs, notes, files and
   service history.
4. Write with `POST` or `PATCH`, then re-read and report the verified result.

## Conventions

- Name an appliance `Make Model Type`, with the bare values in `make` and
  `model`. Example: `Vaillant ecoTEC plus 630 boiler`.
- Reuse a category from `/meta`; choose an existing section id.
- Put the location in the form someone would use to find it, for example
  `Airing cupboard, first floor`.
- Only record a serial number, install date or warranty date from the data
  plate, receipt or owner. Never guess.
- Write operation notes in the Markdown `body`: controls, normal display, reset,
  fault codes, consumables, seasonal settings, shutdown steps.
- Do not store passwords, alarm codes or door codes. Record where the recovery
  kit is kept instead.

## Recipes

Ask what needs doing:

```sh
curl "$BASE/maintenance?status=overdue,soon"
curl "$BASE/warranties?days=90"
```

Find and read an appliance:

```sh
curl "$BASE/appliances?q=boiler"
curl "$BASE/appliances/<id>"
```

Populate an appliance from a make and model. Research the exact model, official
manual and service interval first; leave unknown facts blank:

```sh
curl -X POST "$BASE/appliances" \
  -H "Content-Type: application/json" \
  "${AUTH_HEADER[@]}" \
  -d '{"make":"Vaillant","model":"ecoTEC plus 630","category":"Heating",
       "location":"Airing cupboard","service_interval_months":12,
       "body":"## Operation\n\n..."}'
```

Attach a manual or a photo. Verify a downloaded PDF is real (`file` says PDF,
the first bytes are `%PDF-`):

```sh
curl -X POST "$BASE/attachments" \
  "${AUTH_HEADER[@]}" \
  -F "file=@manual.pdf" -F "appliance_id=<id>" \
  -F "kind=document" -F "caption=Installation manual"
```

Log a service; omit `next_due` to use the appliance interval:

```sh
curl -X POST "$BASE/appliances/<id>/service" \
  -H "Content-Type: application/json" \
  "${AUTH_HEADER[@]}" \
  -d '{"performed_on":"2026-10-20","kind":"service","company":"Green Heating Ltd",
       "cost":96.50,"notes":"Flushed the system","next_due":"2027-10-20"}'
```

Add and complete a standing task:

```sh
curl -X POST "$BASE/tasks" -H "Content-Type: application/json" \
  "${AUTH_HEADER[@]}" \
  -d '{"title":"Clean gutters","category":"Exterior","interval_months":6,
       "last_done":"2026-11-01"}'

curl -X POST "$BASE/tasks/<id>/complete" "${AUTH_HEADER[@]}"
```

Create a normal notes page:

```sh
curl -X POST "$BASE/pages" -H "Content-Type: application/json" \
  "${AUTH_HEADER[@]}" \
  -d '{"title":"Where the stopcock is","section_id":"<id>",
       "body":"Under the kitchen sink..."}'
```

## Pitfalls

- Appliance pages are not normal pages: `GET /pages/{id}` returns their notes, but
  `PATCH` and `DELETE` return 409. Use `/appliances/{id}`.
- PATCH is partial. An omitted `service_next_due` preserves the schedule; send
  `null` to recalculate from the interval.
- Deletes remove notes, attachments and service history immediately.
- Lists are paginated (`limit`, `offset`, `pagination.total`, `has_more`).
- `service_status` is `overdue`, `soon` (30 days), `later` or `none`.
- Attachments are inside SQLite and included in `GET /export` and `GET /backup`.
- The API is local and unencrypted. Never put secrets in notes or examples.

## Reporting

After a change, report a short table of the appliance, section, service interval,
manual and anything still unknown. State which facts were verified and which were
assumed. Do not present a guessed serial number or date as fact.
