<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import {
    daysUntil,
    dueLabel,
    dueState,
    formatShortDate
  } from '$lib/format';  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const filtered = $derived(
    Boolean(data.filters.q || data.filters.category || (data.filters.status && data.filters.status !== 'all'))
  );

  function warrantyLabel(date: string): string {
    if (!date) return '—';
    const days = daysUntil(date);
    if (days < 0) return 'Expired';
    if (days <= 90) return `Ends ${formatShortDate(date)}`;
    return formatShortDate(date);
  }

  function warrantyClass(date: string): string {
    if (!date) return 'none';
    const days = daysUntil(date);
    if (days < 0) return 'overdue';
    if (days <= 90) return 'soon';
    return 'later';
  }
</script>

<svelte:head>
  <title>Appliances &amp; systems · Home Operations</title>
</svelte:head>

<div class="page-head">
  <div>
    <div class="page-kicker">The register</div>
    <h1>Appliances &amp; systems</h1>
    <p class="page-sub">
      Everything with a make, model or service schedule. Each one has a detail page for manuals,
      photos, fault codes and service history.
    </p>
  </div>
  <div class="page-actions">
    <button class="btn hide-sm" type="button" onclick={() => window.print()}>
      <Icon name="printer" size={15} />
      Print register
    </button>
    <a class="btn btn-primary" href="/appliances/new">
      <Icon name="plus" size={16} />
      Add appliance
    </a>
  </div>
</div>

<div class="print-only print-heading">
  <div class="print-heading-title">{data.bookTitle}</div>
  <div>Appliance register · printed {formatShortDate(new Date().toISOString())}</div>
</div>

<div class="stat-grid" style="margin-bottom: 22px;">
  <div class="stat">
    <div class="stat-label"><Icon name="wrench" size={14} /> Appliances</div>
    <div class="stat-value">{data.stats.total}</div>
  </div>
  <div class="stat">
    <div class="stat-label"><Icon name="alert" size={14} /> Overdue</div>
    <div class="stat-value" style:color={data.stats.overdue > 0 ? 'var(--danger)' : undefined}>
      {data.stats.overdue}
    </div>
  </div>
  <div class="stat">
    <div class="stat-label"><Icon name="calendar" size={14} /> Due in 30 days</div>
    <div class="stat-value" style:color={data.stats.dueSoon > 0 ? 'var(--warning)' : undefined}>
      {data.stats.dueSoon}
    </div>
  </div>
  <div class="stat">
    <div class="stat-label"><Icon name="shieldCheck" size={14} /> Warranties ending</div>
    <div class="stat-value">{data.stats.warrantySoon}</div>
  </div>
</div>

{#if data.total === 0}
  <section class="card">
    <div class="card-body">
      <p class="lead" style="margin-bottom: 20px;">
        Start with the things that would stop the house working: the boiler, the consumer unit,
        the stopcock, the router and the alarm. The rest can be added over time.
      </p>
      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <h3>Find the data plate</h3>
          <p>Make, model and serial number are usually on a sticker on the appliance or inside the door.</p>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <h3>Photograph it</h3>
          <p>Add the photo to the appliance once saved. It saves crawling behind it again.</p>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <h3>Set a service interval</h3>
          <p>Twelve months for a boiler, six for filters. The dashboard will then tell you when it is due.</p>
        </div>
      </div>
      <div class="row" style="margin-top: 20px;">
        <a class="btn btn-primary" href="/appliances/new">
          <Icon name="plus" size={16} />
          Add the first appliance
        </a>
        <a class="btn btn-ghost" href="/help">
          <Icon name="info" size={16} />
          How the register works
        </a>
      </div>
    </div>
  </section>
{:else}
  <form class="filter-bar" method="GET" action="/appliances">
    <div class="search">
      <Icon name="search" size={16} />
      <input
        class="input"
        type="search"
        name="q"
        value={data.filters.q ?? ''}
        placeholder="Name, make, model, serial, location…"
        aria-label="Search appliances"
      />
    </div>
    <select class="select" name="category" aria-label="Filter by category">
      <option value="">All categories</option>
      {#each data.categories as category}
        <option value={category} selected={data.filters.category === category}>{category}</option>
      {/each}
    </select>
    <select class="select" name="status" aria-label="Filter by status">
      <option value="all" selected={data.filters.status === 'all'}>Any status</option>
      <option value="overdue" selected={data.filters.status === 'overdue'}>Overdue</option>
      <option value="soon" selected={data.filters.status === 'soon'}>Due in 30 days</option>
      <option value="warranty" selected={data.filters.status === 'warranty'}>Warranty ending</option>
      <option value="unscheduled" selected={data.filters.status === 'unscheduled'}>No service date</option>
    </select>
    <select class="select" name="sort" aria-label="Sort order">
      <option value="name" selected={data.filters.sort === 'name'}>Name</option>
      <option value="due" selected={data.filters.sort === 'due'}>Next service</option>
      <option value="warranty" selected={data.filters.sort === 'warranty'}>Warranty end</option>
      <option value="category" selected={data.filters.sort === 'category'}>Category</option>
      <option value="updated" selected={data.filters.sort === 'updated'}>Recently updated</option>
    </select>
    <button class="btn" type="submit">Apply</button>
    {#if filtered}
      <a class="btn btn-ghost" href="/appliances">Clear</a>
    {/if}
  </form>

  {#if data.appliances.length === 0}
    <section class="card">
      <div class="empty">
        <div class="empty-icon"><Icon name="search" size={24} /></div>
        <h3>No appliances match those filters</h3>
        <p>Try a different category or clear the filters to see the whole register.</p>
        <div class="empty-actions">
          <a class="btn" href="/appliances">Clear filters</a>
        </div>
      </div>
    </section>
  {:else}
    <section class="card">
      <div class="card-head">
        <h2>{data.appliances.length} appliance{data.appliances.length === 1 ? '' : 's'}</h2>
        <span class="hint">Click a name for manuals, notes and service history</span>
      </div>
      <div class="table-wrap">
        <table class="data appliance-table">
          <thead>
            <tr>
              <th>Appliance</th>
              <th class="hide-sm">Category</th>
              <th class="hide-sm">Location</th>
              <th>Service</th>
              <th class="hide-xs">Warranty</th>
              <th class="num hide-sm" title="Attached files">Files</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each data.appliances as appliance (appliance.id)}
              <tr>
                <td>
                  <a class="table-link" href="/appliances/{appliance.id}">{appliance.title}</a>
                  <div class="cell-sub">
                    {[appliance.make, appliance.model].filter(Boolean).join(' ')}
                    {#if appliance.last_service}
                      · last service {formatShortDate(appliance.last_service)}
                    {/if}
                  </div>
                </td>
                <td class="hide-sm">
                  {#if appliance.category}
                    <span class="badge">{appliance.category}</span>
                  {:else}
                    <span class="faint">—</span>
                  {/if}
                </td>
                <td class="hide-sm">{appliance.location || '—'}</td>
                <td>
                  <span class="status-pill {dueState(appliance.service_next_due)}">
                    {dueLabel(appliance.service_next_due)}
                  </span>
                  {#if appliance.service_next_due}
                    <div class="cell-sub">{formatShortDate(appliance.service_next_due)}</div>
                  {/if}
                </td>
                <td class="hide-xs">
                  <span class="status-pill {warrantyClass(appliance.warranty_until)}">
                    {warrantyLabel(appliance.warranty_until)}
                  </span>
                </td>
                <td class="num hide-sm">
                  {#if appliance.attachment_count > 0}
                    <span class="row" style="justify-content: flex-end; gap: 4px;">
                      <Icon name="paperclip" size={13} />
                      {appliance.attachment_count}
                    </span>
                  {:else}
                    <span class="faint">—</span>
                  {/if}
                </td>
                <td class="num">
                  <a class="icon-btn" href="/appliances/{appliance.id}" aria-label="Open {appliance.title}">
                    <Icon name="chevronRight" size={16} />
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="card-foot">
        <span>Showing {data.appliances.length} of {data.total}</span>
        <span class="hint">Manuals and photos count towards the backup size.</span>
      </div>
    </section>
  {/if}
{/if}
