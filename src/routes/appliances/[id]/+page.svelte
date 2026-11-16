<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import Attachments from '$lib/components/Attachments.svelte';
  import ServiceHistory from '$lib/components/ServiceHistory.svelte';
  import {
    daysUntil,
    dueLabel,
    dueState,
    formatDate,
    formatRelative
  } from '$lib/format';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const error = $derived(form && 'error' in form ? form.error : '');
  const appliance = $derived(data.appliance);
  const printHref = $derived(`/print/doc?pages=${appliance.id}&dates=1`);
  const manualHref = $derived(
    /^https?:\/\//i.test(appliance.manual_url) ? appliance.manual_url : ''
  );

  const specs = $derived(
    [
      ['Make', appliance.make],
      ['Model', appliance.model],
      ['Serial number', appliance.serial],
      ['Location', appliance.location],
      ['Installed', appliance.installed_on ? formatDate(appliance.installed_on) : ''],
      [
        'Service interval',
        appliance.service_interval_months ? `Every ${appliance.service_interval_months} months` : ''
      ],
      ['Next service', appliance.service_next_due ? formatDate(appliance.service_next_due) : ''],
      ['Warranty until', appliance.warranty_until ? formatDate(appliance.warranty_until) : ''],
      ['Supplier / installer', appliance.supplier]
    ].filter(([, value]) => Boolean(value))
  );

  const warrantyState = $derived.by(() => {
    if (!appliance.warranty_until) return { label: 'Not recorded', class: 'none', detail: '' };
    const days = daysUntil(appliance.warranty_until);
    if (days < 0) {
      return {
        label: 'Expired',
        class: 'overdue',
        detail: `Ended ${formatDate(appliance.warranty_until)}`
      };
    }
    if (days <= 90) {
      return {
        label: 'Ending soon',
        class: 'soon',
        detail: `${days} day${days === 1 ? '' : 's'} left · ${formatDate(appliance.warranty_until)}`
      };
    }
    return {
      label: 'Covered',
      class: 'later',
      detail: `Until ${formatDate(appliance.warranty_until)}`
    };
  });

  const lastService = $derived(
    data.serviceRecords.length > 0
      ? data.serviceRecords[0].performed_on
      : appliance.last_service
  );
</script>

<svelte:head>
  <title>{appliance.title} · Home Operations</title>
  <meta name="description" content={`${appliance.make} ${appliance.model} — ${appliance.location}`} />
</svelte:head>

<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <a href="/appliances">Appliances</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <span>{appliance.title}</span>
</nav>

{#if error}
  <div class="alert alert-error" role="alert" style="margin-bottom: 18px;">
    <Icon name="alert" size={17} />
    <span>{error}</span>
  </div>
{/if}

<header class="appliance-head">
  <div class="appliance-head-main">
    <div class="row" style="gap: 8px; margin-bottom: 10px;">
      {#if appliance.category}
        <a class="badge badge-accent" href="/appliances?category={encodeURIComponent(appliance.category)}">
          {appliance.category}
        </a>
      {/if}
      <a class="badge badge-outline" href="/sections/{appliance.section_slug}">
        <Icon name={appliance.section_icon} size={11} />
        {appliance.section_name}
      </a>
      {#if appliance.pinned === 1}
        <span class="pin-flag"><Icon name="pin" size={11} /> Pinned</span>
      {/if}
    </div>

    <h1 class="article-title">{appliance.title}</h1>
    <div class="article-meta">
      {#if appliance.make || appliance.model}
        <span>{[appliance.make, appliance.model].filter(Boolean).join(' ')}</span>
      {/if}
      {#if appliance.location}
        <span>· {appliance.location}</span>
      {/if}
      <span>· Updated {formatRelative(appliance.updated_at)}</span>
    </div>
  </div>

  <div class="page-actions">
    <a class="btn" href="/appliances/{appliance.id}/edit">
      <Icon name="edit" size={15} />
      Edit
    </a>
    <a class="btn" href={printHref} target="_blank" rel="noopener">
      <Icon name="printer" size={15} />
      <span class="hide-xs">Print</span>
    </a>
    <a class="icon-btn" href="/pages/{appliance.id}/history" title="Notes history" aria-label="Notes history">
      <Icon name="history" size={16} />
    </a>
    <a class="icon-btn" href="/pages/{appliance.id}/download" title="Download notes" aria-label="Download notes as Markdown">
      <Icon name="download" size={16} />
    </a>
  </div>
</header>

<div class="status-strip">
  <div class="status-block">
    <div class="status-label">Service</div>
    <span class="status-pill {dueState(appliance.service_next_due)}">
      {dueLabel(appliance.service_next_due)}
    </span>
    <div class="status-detail">
      {#if appliance.service_next_due}
        {formatDate(appliance.service_next_due)}
        {#if appliance.service_interval_months}· every {appliance.service_interval_months} months{/if}
      {:else}
        No schedule set
      {/if}
    </div>
  </div>

  <div class="status-block">
    <div class="status-label">Warranty</div>
    <span class="status-pill {warrantyState.class}">{warrantyState.label}</span>
    <div class="status-detail">{warrantyState.detail || 'Add the end date when you know it'}</div>
  </div>

  <div class="status-block">
    <div class="status-label">Last service</div>
    <div class="status-value">
      {lastService ? formatDate(lastService) : 'None logged'}
    </div>
    <div class="status-detail">
      {#if lastService}
        {formatRelative(lastService)}
      {:else}
        Add a service record below
      {/if}
    </div>
  </div>

  <div class="status-block">
    <div class="status-label">Files</div>
    <div class="status-value">{data.attachments.length}</div>
    <div class="status-detail">
      {#if data.attachments.length === 0}
        No manuals or photos
      {:else}
        Manuals, photos, receipts
      {/if}
    </div>
  </div>
</div>

<div class="appliance-layout">
  <div class="stack">
    <section class="card">
      <div class="card-head">
        <h2>Specification</h2>
        <span class="hint">What an engineer would ask for</span>
      </div>
      <div class="card-body">
        {#if specs.length > 0}
          <dl class="kv">
            {#each specs as [label, value]}
              <dt>{label}</dt>
              <dd>{value}</dd>
            {/each}
          </dl>
        {:else}
          <p class="hint">
            No specification recorded yet. Add the make, model and serial number so an engineer can
            identify it without moving it.
          </p>
        {/if}

        {#if manualHref || appliance.manual_url}
          <div class="row" style="margin-top: 16px;">
            {#if manualHref}
              <a class="btn btn-sm" href={manualHref} target="_blank" rel="noopener noreferrer">
                <Icon name="external" size={14} />
                Open manual or product page
              </a>
            {:else}
              <span class="hint">Manual link: {appliance.manual_url}</span>
            {/if}
            <a class="btn btn-sm btn-ghost" href="/appliances/{appliance.id}/edit">
              <Icon name="edit" size={14} />
              Edit specification
            </a>
          </div>
        {/if}
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Operation notes</h2>
        <span class="hint">How to use it, reset it and what to check first</span>
      </div>
      <div class="card-body">
        {#if appliance.body.trim()}
          <div class="prose article-body">{@html data.html}</div>
        {:else}
          <div class="empty" style="padding: 28px 16px;">
            <div class="empty-icon"><Icon name="edit" size={22} /></div>
            <h3>No notes yet</h3>
            <p>
              Write down the controls, the reset procedure, any fault codes you have seen, and
              which filter or cartridge it uses.
            </p>
            <div class="empty-actions">
              <a class="btn btn-primary" href="/appliances/{appliance.id}/edit">
                <Icon name="edit" size={15} />
                Add operation notes
              </a>
            </div>
          </div>
        {/if}
      </div>
    </section>

    <Attachments
      attachments={data.attachments}
      actionPath="/appliances/{appliance.id}"
      returnTo="/appliances/{appliance.id}"
      title="Manuals, photos & receipts"
      hint="Attach the installation manual, a photo of the data plate, or the receipt."
    />

    <ServiceHistory
      records={data.serviceRecords}
      actionPath="/appliances/{appliance.id}"
      returnTo="/appliances/{appliance.id}"
      intervalMonths={appliance.service_interval_months}
    />
  </div>

  <aside class="appliance-side">
    <div class="side-card">
      <h3>Quick actions</h3>
      <div class="side-links">
        <a class="side-link" href="/appliances/{appliance.id}/edit">
          <Icon name="edit" size={14} />
          <span class="nav-label">Edit details and notes</span>
        </a>
        <a class="side-link" href={printHref} target="_blank" rel="noopener">
          <Icon name="printer" size={14} />
          <span class="nav-label">Print this appliance</span>
        </a>
        <a class="side-link" href="/pages/{appliance.id}/history">
          <Icon name="history" size={14} />
          <span class="nav-label">Earlier versions of the notes</span>
        </a>
        <a class="side-link" href="/maintenance">
          <Icon name="calendar" size={14} />
          <span class="nav-label">Full maintenance schedule</span>
        </a>
      </div>
    </div>

    <div class="side-card">
      <h3>Service contacts</h3>
      <p class="small muted" style="line-height: 1.55;">
        {#if appliance.supplier}
          {appliance.supplier}
        {:else}
          No supplier recorded. Add the installer or manufacturer’s service number so it is to hand
          when something fails.
        {/if}
      </p>
      <a class="side-link" href="/sections/service-contacts" style="margin-top: 8px;">
        <Icon name="phone" size={14} />
        <span class="nav-label">Open service contacts</span>
      </a>
    </div>

    <p class="hint" style="padding: 0 4px;">
      Page address: <span class="mono">/appliances/{appliance.id}</span>
    </p>
  </aside>
</div>
