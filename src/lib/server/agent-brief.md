# Build a skill for Home Operations

You are an AI agent. Build a reusable skill that lets another agent read and
update this self-hosted house operations & maintenance manual.

This file is the entrypoint. Read it, fetch the linked documents, then produce a
`SKILL.md` for the target agent framework (OpenCode, Claude, ChatGPT, a local
agent, or anything else that understands Markdown instructions).

Generated from Home Operations {{VERSION}} on {{TODAY}}.

## What the system is

Home Operations is a local O&M manual for a house:

- appliance and system register (make, model, serial, location, warranty,
  service interval, next due date)
- service history with costs and notes
- standing maintenance tasks and a year-ahead schedule
- written procedures and notes
- uploaded manuals, photos and receipts, stored in SQLite

It has a browser UI, a JSON API, print-ready output and backups. It is not a
general-purpose document store, and it is not a source of manufacturer data: an
agent that wants a manual, service interval or fault code must research it.

## Access

- API base: `{{BASE_URL}}`
- Health: `{{HEALTH_URL}}` (never requires a key)
- Meta: `{{META_URL}}` (call this first)
- Canonical agent guide: `{{LLMS_URL}}`
- OpenAPI: `{{OPENAPI_URL}}`
- Human docs: `{{HUMAN_URL}}`
- Discovery manifest: `{{MANIFEST_URL}}`

{{AUTH_NOTE}}
{{INGRESS_NOTE}}

## Read these before writing the skill

1. `GET {{LLMS_URL}}` — rules, endpoint list, shapes and workflows.
2. `GET {{OPENAPI_URL}}` — machine-readable schema.
3. `GET {{META_URL}}` — live sections, categories and stats.
4. `GET {{SKILL_URL}}` — a complete generic skill you can adapt. It is the
   fastest starting point and is kept in step with the API.

Do not invent an endpoint or an id. If the OpenAPI schema and `/llms.txt`
disagree, prefer `/llms.txt` and report the inconsistency to the owner.

## What the skill must contain

- YAML frontmatter with `name` and a specific `description` that says when to use
  it (appliances, service history, maintenance, manuals, warranties, house
  questions).
- A **Connect** section with the base URL and optional
  `Authorization: Bearer $HOME_OPERATIONS_API_KEY` / `X-Api-Key` header.
- A **Workflow** section: `/meta` first, search before creating, read before
  patching, re-read after writing.
- **Conventions**: `Make Model Type` names, separate `make`/`model`, reuse
  section ids, do not guess serial/install/warranty data, no passwords or codes.
- **Recipes** for:
  - “what is overdue / due soon?”
  - “when was the boiler last serviced?”
  - “add this make and model”
  - uploading a manual PDF or a data-plate photo
  - logging a service
  - adding and completing a standing task
  - searching notes and appliances
- **Pitfalls**: appliance pages vs normal pages, partial PATCH, destructive
  deletes, pagination, attachment size, local/unencrypted access.
- A **Reporting** section: what changed, what was verified, what is still unknown.

## The make/model workflow to encode

When the owner gives only a make and model:

1. `GET /appliances?q=<make>+<model>` — update the existing record if it matches.
2. Research the exact model, official manual, service interval, consumables and
   common fault codes.
3. Never invent a serial number, install date or warranty date. Leave them blank
   and say so.
4. `POST /appliances` with at least `make` and `model`; a name is generated and a
   section is chosen from the category.
5. Attach the manual or a photo with `POST /attachments` (multipart).
6. Re-read `GET /appliances/{id}` and report verified facts separately from
   assumptions.

## Verification before you finish

- The skill names the base URL and the auth method honestly for this instance.
- It tells the reader to call `/meta` first and to use `/llms.txt` as canonical.
- It does not contain a real API key, password, alarm code or door code.
- It does not promise manufacturer lookup that the API does not perform.
- Test a read-only call such as `GET /meta` or `GET /maintenance?status=overdue`
  and include the result in your report to the owner.

## Output

Write a single Markdown file named `SKILL.md`, ready to drop into the target
agent's skills directory. If the target uses a specific skill format, keep the
content and adapt the frontmatter and file name to that format. Tell the owner
where to install it and which base URL you used.
