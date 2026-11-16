# Changelog

## 1.2.0 — 2026-11-16

- Renamed the app to **Home Operations** throughout, including the package,
  database file, API names and the agent skill.
- Added a Home Assistant add-on package: ingress sidebar panel, optional direct
  port, watchdog and cold snapshots.
- Added Docker packaging with a `/data` volume and health check.
- Added ingress-aware links, forms, images and redirects, including the
  sandboxed-iframe form handling used by Home Assistant.
- Existing `hearthbook.db` databases are renamed automatically.

## 1.1.0 — 2026-11-16

- Added the `/api/v1` REST API for scripts and AI agents: appliances, service
  history, pages, sections, maintenance, tasks, warranties, search, attachments,
  export and database backup.
- Added `/llms.txt`, an OpenAPI schema and an **API & AI** page.
- Added optional API-key authentication.
- Added the **Home Operations** OpenCode skill and `ho.sh` API wrapper.
- Added “populate from a make and model”: a name and section are generated from
  `make`/`model` and the category.

## 1.0.0 — 2026-11-15

- First release: house O&M sections, appliance register, service history,
  maintenance tasks, manuals and photos, print-ready output, backups and the
  original family-manual structure.
