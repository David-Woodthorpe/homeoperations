<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const authHeader = $derived(
    data.apiKeyEnabled ? '  -H "Authorization: Bearer $HOME_OPERATIONS_API_KEY" \\\n' : ''
  );

  const endpoints = [
    ['GET', '/health', 'Health check; never needs a key'],
    ['GET', '/meta', 'Sections, categories, stats and doc links'],
    ['GET', '/appliances', 'List/search by q, category, status'],
    ['POST', '/appliances', 'Create from make/model or full fields'],
    ['GET', '/appliances/{id}', 'Spec, notes, files and service history'],
    ['PATCH', '/appliances/{id}', 'Update only the fields sent'],
    ['DELETE', '/appliances/{id}', 'Delete the appliance and its files'],
    ['GET', '/appliances/{id}/service', 'Service history'],
    ['POST', '/appliances/{id}/service', 'Log a service or repair'],
    ['GET', '/pages', 'List notes pages'],
    ['POST', '/pages', 'Create a notes page'],
    ['GET', '/pages/{id}', 'Page body as Markdown and text'],
    ['PATCH', '/pages/{id}', 'Update a normal page'],
    ['GET', '/sections', 'Sections with counts'],
    ['GET', '/maintenance', 'Due work, calendar and warranties'],
    ['GET', '/tasks', 'Standing maintenance tasks'],
    ['POST', '/tasks', 'Create a standing task'],
    ['POST', '/tasks/{id}/complete', 'Mark done and roll the date forward'],
    ['POST', '/attachments', 'Upload a manual, photo or receipt'],
    ['GET', '/attachments/{id}/file', 'Download the file'],
    ['GET', '/search', 'Search appliances and pages together'],
    ['GET', '/export', 'Full JSON backup, including files'],
    ['GET', '/backup', 'SQLite database snapshot']
  ];
</script>

<svelte:head>
  <title>API &amp; AI · Home Operations</title>
</svelte:head>

<div class="page-head">
  <div>
    <div class="page-kicker">Developers &amp; AI</div>
    <h1>API &amp; AI</h1>
    <p class="page-sub">
      The manual is readable and writable over a small JSON API. An AI agent can answer questions,
      find due work, add an appliance from a make and model, attach the manual and log a service.
    </p>
  </div>
  <div class="page-actions">
    <a class="btn" href="/llms.txt" target="_blank" rel="noopener">
      <Icon name="file" size={15} />
      llms.txt
    </a>
    {#if data.apiKeyEnabled}
      <span class="badge badge-accent" style="height: 38px; padding: 0 12px;">
        <Icon name="lock" size={13} />
        Key required for live calls
      </span>
    {:else}
      <a class="btn btn-primary" href="/api/v1/meta" target="_blank" rel="noopener">
        <Icon name="code" size={15} />
        Try /meta
      </a>
    {/if}
  </div>
</div>

<div class="api-hero">
  <span class="brand-mark"><Icon name="code" size={22} /></span>
  <div>
    <h2>Start with the machine-readable docs</h2>
    <p>
      <a href="/llms.txt">/llms.txt</a> is the canonical guide for an agent. The OpenAPI schema is
      at <a href="/api/v1/openapi.json">/api/v1/openapi.json</a>. Always call
      <code class="inline">GET /meta</code> first for section ids.
    </p>
  </div>
</div>

<div class="api-grid" style="margin-bottom: 22px;">
  <section class="card">
    <div class="card-head"><h2>This instance</h2></div>
    <div class="card-body">
      <dl class="kv">
        <dt>Base URL</dt>
        <dd class="mono">{data.base}</dd>
        <dt>Access</dt>
        <dd>
          {#if data.apiKeyEnabled}
            <span class="badge badge-accent">API key required</span>
            Send <code class="inline">Authorization: Bearer …</code> or <code class="inline">X-Api-Key: …</code>.
          {:else}
            <span class="badge badge-ok">Open on this machine</span>
            No key is configured. Set <code class="inline">HOME_OPERATIONS_API_KEY</code> to require one.
          {/if}
        </dd>
        <dt>Version</dt>
        <dd>Home Operations {data.version}</dd>
        <dt>Current contents</dt>
        <dd>
          {data.stats.appliances} appliances · {data.stats.pages} pages ·
          {data.summary.overdue} overdue · {data.summary.dueSoon} due soon
        </dd>
        <dt>File limit</dt>
        <dd>{data.maxAttachmentMb} MB per attachment</dd>
      </dl>
    </div>
  </section>

  <section class="card">
    <div class="card-head"><h2>Ask an AI agent</h2></div>
    <div class="card-body prose" style="font-size: 13px;">
      <p>
        An OpenCode skill is installed at
        <code class="inline">~/.config/opencode/skills/home-operations/SKILL.md</code>. It teaches an
        agent the conventions: search before creating, verify a model and manual, do not guess a
        serial number, and report what it changed.
      </p>
      <p style="margin-top: 8px;">
        Useful questions: “What is overdue?”, “When was the boiler last serviced?”, “Add a Vaillant
        ecoTEC plus 630 boiler and its manual”, “Which warranties end this year?”, “Where is the
        stopcock?”.
      </p>
      <p style="margin-top: 8px;">
        The skill and API can populate a register entry from a make and model, but the agent will
        leave serial, install date and warranty blank unless you provide them.
      </p>
    </div>
  </section>
</div>

<section class="card" style="margin-bottom: 22px;">
  <div class="card-head">
    <h2>Endpoints</h2>
    <span class="hint">Everything is under <span class="mono">{data.base}</span></span>
  </div>
  <div class="table-wrap">
    <table class="data">
      <thead><tr><th>Method</th><th>Path</th><th>Purpose</th></tr></thead>
      <tbody>
        {#each endpoints as [method, path, description]}
          <tr>
            <td><span class="method method-{method.toLowerCase()}">{method}</span></td>
            <td class="mono" style="font-size: 12px;">{path}</td>
            <td class="muted">{description}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<div class="stack">
  <section class="card">
    <div class="card-head">
      <h2>Populate an appliance from a make and model</h2>
      <span class="hint">The agent researches, then writes</span>
    </div>
    <div class="card-body">
      <div class="prose" style="font-size: 13.5px; margin-bottom: 14px;">
        <ol>
          <li><code class="inline">GET /meta</code> for section ids.</li>
          <li><code class="inline">GET /appliances?q=vaillant+ecotec</code> to avoid a duplicate.</li>
          <li>Verify the model, official manual and service interval. Do not invent a serial number.</li>
          <li>Create the record — a name is generated from make and model if omitted.</li>
          <li>Upload the manual, then re-read <code class="inline">GET /appliances/&#123;id&#125;</code>.</li>
        </ol>
      </div>
      <pre class="code">{`curl -X POST ${data.base}/appliances \\
${authHeader}  -H 'Content-Type: application/json' \\
  -d '{
    "make": "Vaillant",
    "model": "ecoTEC plus 630",
    "category": "Heating",
    "location": "Airing cupboard, first floor",
    "service_interval_months": 12,
    "body": "## Operation\\n\\nService annually in autumn.",
    "manual_url": "https://www.vaillant.co.uk/manuals"
  }'`}</pre>
    </div>
  </section>

  <section class="card">
    <div class="card-head"><h2>Common requests</h2></div>
    <div class="card-body">
      <p class="label" style="margin-bottom: 6px;">Ask what is due</p>
      <pre class="code">{`curl '${data.base}/maintenance?status=overdue,soon'`}</pre>

      <p class="label" style="margin: 16px 0 6px;">Search the manual</p>
      <pre class="code">{`curl '${data.base}/search?q=stopcock'`}</pre>

      <p class="label" style="margin: 16px 0 6px;">Attach a manual or a photo of the data plate</p>
      <pre class="code">{`curl -X POST ${data.base}/attachments \\
${authHeader}  -F 'file=@manual.pdf' \\
  -F 'appliance_id=<id>' \\
  -F 'kind=document' \\
  -F 'caption=Installation manual'`}</pre>

      <p class="label" style="margin: 16px 0 6px;">Log a service</p>
      <pre class="code">{`curl -X POST ${data.base}/appliances/<id>/service \\
${authHeader}  -H 'Content-Type: application/json' \\
  -d '{"performed_on":"2026-10-20","company":"Green Heating Ltd","cost":96.50,"notes":"Flushed the system"}'`}</pre>

      <p class="label" style="margin: 16px 0 6px;">Add a standing task</p>
      <pre class="code">{`curl -X POST ${data.base}/tasks \\
${authHeader}  -H 'Content-Type: application/json' \\
  -d '{"title":"Clean gutters","category":"Exterior","interval_months":6,"last_done":"2026-11-01"}'`}</pre>
    </div>
  </section>

  <section class="card">
    <div class="card-head"><h2>Conventions and safety</h2></div>
    <div class="card-body prose" style="font-size: 13.5px;">
      <ul>
        <li>Search first; do not create a duplicate appliance for the same make, model and location.</li>
        <li>Use existing section ids from <code class="inline">/meta</code>. Never invent an id.</li>
        <li>Leave unknown facts blank. A missing serial number is better than a guessed one.</li>
        <li>Store manuals as PDFs where possible; a web link is second best.</li>
        <li>Do not store passwords, alarm codes or door codes. Record where the recovery kit is kept instead.</li>
        <li>Deletes are immediate and include attachments and service history.</li>
        <li>The API is local and has no user accounts. It is not encrypted; treat it like the rest of the manual.</li>
      </ul>
    </div>
  </section>
</div>
