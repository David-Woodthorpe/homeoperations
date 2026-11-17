# Home Operations — Home Assistant add-on

This repository is also a Home Assistant add-on repository. The add-on runs the
same SvelteKit server as the Docker image, stores its SQLite database and
attachments in the add-on's private `/data` directory, and is available from the
Home Assistant sidebar through ingress.

## Installation

1. In Home Assistant, go to **Settings → Add-ons → Add-on store**.
2. Open the three-dot menu, choose **Repositories**, and add
   `https://github.com/David-Woodthorpe/homeoperations`.
3. Install **Home Operations** and start it.
4. Turn on **Show in sidebar** on the add-on page, or use **Open Web UI**.

The first start creates the house sections (House Essentials, Heating & Hot Water,
Smart Home & Network, and so on). There is no sample content: add appliances and
pages from the app.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `api_key` | *(empty)* | Protect `/api/v1/*` with `Authorization: Bearer <key>` or `X-Api-Key: <key>`. `/api/v1/health` and the web UI stay reachable. |
| `public_url` | *(empty)* | Stable public URL of the app, used in `/llms.txt` and the API examples. Leave empty when using ingress. |

Changing an option restarts the add-on.

If you use API clients or AI agents, set `api_key` before enabling the optional
direct port.

## Ingress and direct access

Ingress is enabled by default, so no port is exposed and Home Assistant handles
authentication. The app detects the changing ingress prefix from
`X-Ingress-Path` and keeps links, images, forms, uploads and redirects inside the
ingress session.

If Home Assistant is behind a TLS-terminating reverse proxy, the app reconciles
a missing or incorrect forwarded scheme with the browser's `Origin` header when
the host matches. It checks the forwarded host, the browser's `Host` header and,
for requests arriving through ingress, the browser's `Sec-Fetch-Site:
same-origin` signal. The ingress panel runs in a sandboxed iframe, so form posts
arrive with an opaque `Origin: null`; those are resolved to the forwarded origin
as well. This keeps ordinary form submissions working even when a proxy rewrites
the host headers. Every form submission is logged with its response status and
the forwarded headers, so a remaining 403 can be diagnosed from the add-on log.

For API clients that cannot use ingress, enable the optional `3000/tcp` port on
the add-on page. The API is then reachable at
`http://<home-assistant-host>:3000/api/v1`. Set `api_key` before enabling direct
access if the host is reachable by anyone else.

When the app is behind ingress, set `public_url` only if you also publish it at
a stable address. Ingress URLs contain a per-installation token and are not
suitable for `/llms.txt`.

## AI agents

The add-on exposes the same local API described in the in-app **API & AI** page
and in `/llms.txt`:

- `GET /agent.md` — an entrypoint that tells an AI agent how to build a skill for
  this manual.
- `GET /skill.md` — a ready-made generic skill with the instance URL filled in.
- `GET /.well-known/home-operations.json` — a discovery manifest.

API endpoints:
- `GET /api/v1/appliances` and `GET /api/v1/appliances/{id}` — read the register,
  notes, manuals and service history.
- `POST /api/v1/appliances` — create an appliance from a make and model.
- `POST /api/v1/attachments` — upload a manual PDF or a photo.
- `POST /api/v1/appliances/{id}/service` — log a service.
- `GET /api/v1/maintenance` — overdue work and the year ahead.

The OpenCode skill lives in the desktop app at
`~/.config/opencode/skills/home-operations/SKILL.md`, with `scripts/ho.sh`. It is
not installed inside the add-on; it is the agent-side workflow.

The API is local and unencrypted. Treat the add-on's direct port as you would
the web UI: enable it only on a trusted network and set an API key.

## Data, snapshots and backups

Everything is stored under `/data`:

```
/data/
  home-operations.db     the manual, including attached manuals and photos
  safety-copies/         automatic database copies taken before restores
  options.json           written by Home Assistant
```

Home Assistant snapshots stop the add-on first (`backup: cold`), so the SQLite
database is copied consistently. The app's own **Backup** page also offers:

- a full JSON backup including attached files;
- a Markdown export (without attachments);
- database safety copies, downloadable from the page.

An older database named `hearthbook.db` from the pre-rename app is moved to
`home-operations.db` automatically on first start.

## Upload limits

- Each manual, photo or receipt: 25 MB.
- Backup restore and request body: 512 MB.

PDF, images, text, Word/Excel and ZIP are accepted. SVG and HTML are refused.

## Troubleshooting

- **The sidebar panel is blank or links leave the app.** Check the add-on log for
  the ingress path and forwarded headers logged with form submissions. The app
  prefixes links and redirects itself; a reverse proxy that rewrites
  `X-Ingress-Path` will break that.
- **A form returns 403 “Cross-site POST form submissions are forbidden”.** Look at
  the `Form POST …` log line. It shows the browser's `Origin`, `Host`, forwarded
  host and `Sec-Fetch-Site`. The add-on handles the sandboxed-iframe case; a
  proxy that strips `Sec-Fetch-Site` may still fail.
- **Direct API access fails.** Enable `3000/tcp` on the add-on page, check the
  host firewall, and send the API key if one is set.
- **The watchdog reports unhealthy.** `GET /api/v1/health` must return 200 and is
  exempt from the API key.

## Updates

Add-on versions are published from this repository. Home Assistant shows the
changelog in `CHANGELOG.md` on the add-on page. The package version and
`config.yaml` version are kept in step.
