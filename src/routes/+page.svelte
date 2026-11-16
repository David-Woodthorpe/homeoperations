<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { dueLabel, formatDate, formatRelative } from '$lib/format';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const dueCount = $derived(data.summary.overdue + data.summary.dueSoon);
  const empty = $derived(data.stats.appliances === 0);
</script>

<svelte:head>
  <title>{data.settings.book_title} · Home Operations</title>
  <meta name="description" content={data.settings.book_subtitle} />
</svelte:head>

<section class="hero">
  <div class="hero-text">
    <div class="hero-kicker">The house manual</div>
    <h1>{data.settings.book_title}</h1>
    <p>
      {data.settings.book_subtitle || 'How everything works, and how to look after it.'}
    </p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="/appliances/new">
        <Icon name="plus" size={16} />
        Add appliance
      </a>
      <a class="btn" href="/maintenance">
        <Icon name="calendar" size={16} />
        Maintenance
      </a>
      <a class="btn" href="/print">
        <Icon name="printer" size={16} />
        Print manual
      </a>
    </div>
  </div>
  <div class="hero-mark" aria-hidden="true">
    <Icon name="home" size={42} strokeWidth={1.4} />
  </div>
</section>

<div class="stack" style="margin-top: 22px;">
  <div class="stat-grid">
    <div class="stat">
      <div class="stat-label"><Icon name="wrench" size={14} /> Appliances</div>
      <div class="stat-value">{data.stats.appliances}</div>
    </div>
    <div class="stat">
      <div class="stat-label"><Icon name="alert" size={14} /> Overdue</div>
      <div class="stat-value" style:color={data.summary.overdue > 0 ? 'var(--danger)' : undefined}>
        {data.summary.overdue}
      </div>
    </div>
    <div class="stat">
      <div class="stat-label"><Icon name="calendar" size={14} /> Due in 30 days</div>
      <div class="stat-value" style:color={data.summary.dueSoon > 0 ? 'var(--warning)' : undefined}>
        {data.summary.dueSoon}
      </div>
    </div>
    <div class="stat">
      <div class="stat-label"><Icon name="shieldCheck" size={14} /> Warranties ending</div>
      <div class="stat-value">{data.summary.warrantySoon}</div>
    </div>
  </div>

  {#if empty}
    <section class="card">
      <div class="card-head">
        <h2>Start with the things that keep the house running</h2>
        <span class="hint">The rest can wait</span>
      </div>
      <div class="card-body">
        <p class="lead" style="margin-bottom: 20px;">
          Add the boiler, the consumer unit, the stopcock, the router and the alarm first. Even a
          name and a photo of the data plate is enough to start.
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
            <p>Add the photo once the appliance is saved. It saves crawling behind it again.</p>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <h3>Set the service interval</h3>
            <p>Twelve months for a boiler, six for filters. Then the dashboard tells you when it is due.</p>
          </div>
        </div>
        <div class="row" style="margin-top: 20px;">
          <a class="btn btn-primary" href="/appliances/new">
            <Icon name="plus" size={16} />
            Add the first appliance
          </a>
          <a class="btn btn-ghost" href="/help">
            <Icon name="info" size={16} />
            How the manual works
          </a>
        </div>
      </div>
    </section>
  {/if}

  <div class="dash-grid">
    <div class="stack">
      <section class="card">
        <div class="card-head">
          <h2>Needs attention</h2>
          <a class="hint link" href="/maintenance">Full schedule</a>
        </div>
        {#if data.attention.length === 0}
          <div class="card-body all-clear">
            <span class="all-clear-icon"><Icon name="check" size={18} /></span>
            <div>
              <strong>Nothing overdue and nothing due in the next 30 days.</strong>
              <p>Keep the service dates up to date and this list will tell you when something needs doing.</p>
            </div>
          </div>
        {:else}
          <div class="list">
            {#each data.attention as item (item.type + item.id)}
              <div class="list-row">
                <span class="list-icon" class:attention-overdue={item.status === 'overdue'}>
                  <Icon name={item.type === 'appliance' ? 'wrench' : 'clipboard'} size={16} />
                </span>
                <div class="list-main">
                  <a class="list-title" href={item.href}>{item.title}</a>
                  <div class="list-sub">{item.subtitle}</div>
                </div>
                <div class="list-meta">
                  <span class="status-pill {item.status}">{dueLabel(item.due)}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <section class="card">
        <div class="card-head">
          <h2>Recently updated</h2>
          <a class="hint link" href="/search">Search everything</a>
        </div>
        {#if data.recent.length === 0}
          <div class="empty" style="padding: 34px 20px;">
            <div class="empty-icon"><Icon name="file" size={22} /></div>
            <h3>Nothing written yet</h3>
            <p>Add an appliance or a page, and recent changes will appear here.</p>
          </div>
        {:else}
          <div class="list">
            {#each data.recent as item (item.id)}
              <div class="list-row">
                <span class="list-icon">
                  <Icon name={item.kind === 'appliance' ? 'wrench' : item.section_icon} size={16} />
                </span>
                <div class="list-main">
                  <a
                    class="list-title"
                    href={item.kind === 'appliance' ? `/appliances/${item.id}` : `/pages/${item.id}`}
                  >
                    {item.title}
                  </a>
                  <div class="list-sub">
                    {item.section_name}
                    {#if item.kind === 'appliance' && item.category && item.category !== item.section_name}
                      · {item.category}
                    {/if}
                  </div>
                </div>
                <div class="list-meta">{formatRelative(item.updated_at)}</div>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    </div>

    <div class="stack-sm">
      <section class="card">
        <div class="card-head"><h2>Due soon</h2></div>
        <div class="card-body">
          {#if dueCount === 0}
            <p class="small muted" style="line-height: 1.55;">
              No appliance services or standing tasks are due in the next month.
            </p>
          {:else}
            <p class="small muted" style="line-height: 1.55;">
              {data.summary.overdue} overdue and {data.summary.dueSoon} due in the next 30 days.
              The full list is on the maintenance page.
            </p>
          {/if}
          <div class="row" style="margin-top: 14px;">
            <a class="btn btn-sm" href="/maintenance">
              <Icon name="calendar" size={15} />
              Open schedule
            </a>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h2>Warranty watch</h2></div>
        {#if data.warranties.length === 0}
          <div class="card-body">
            <p class="small muted" style="line-height: 1.55;">
              No warranties end in the next three months. Add warranty dates to appliances to see
              them here.
            </p>
          </div>
        {:else}
          <div class="list">
            {#each data.warranties as warranty (warranty.id)}
              <div class="list-row">
                <div class="list-main">
                  <a class="list-title" href="/appliances/{warranty.id}">{warranty.title}</a>
                  <div class="list-sub">{warranty.section_name}</div>
                </div>
                <div class="list-meta">{formatDate(warranty.warranty_until)}</div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <section class="card">
        <div class="card-head"><h2>Keep it safe</h2></div>
        <div class="card-body" style="font-size: 13px; color: var(--muted); line-height: 1.55;">
          {#if data.lastBackupAt}
            <p>Last backup: <strong style="color: var(--text);">{formatDate(data.lastBackupAt)}</strong>.</p>
            <p style="margin-top: 6px;">Keep the file on a USB stick, an external drive, or with a trusted person.</p>
          {:else}
            <p>This manual and its manuals/photos live on one computer. Download a backup now.</p>
          {/if}
          <div class="row" style="margin-top: 14px;">
            <a class="btn btn-sm" href="/backup">
              <Icon name="download" size={15} />
              Back up
            </a>
          </div>
        </div>
      </section>
    </div>
  </div>

  <section>
    <div class="section-head">
      <h2>House systems</h2>
      <a class="btn btn-sm" href="/sections">
        <Icon name="folder" size={15} />
        Manage sections
      </a>
    </div>

    <div class="system-grid">
      {#each data.sections as section (section.id)}
        <a class="system-card" href="/sections/{section.slug}">
          <span class="system-icon"><Icon name={section.icon} size={18} /></span>
          <span class="system-main">
            <span class="system-name">{section.name}</span>
            <span class="system-meta">
              {#if section.appliance_count > 0}
                {section.appliance_count} appliance{section.appliance_count === 1 ? '' : 's'}
              {/if}
              {#if section.appliance_count > 0 && section.page_count - section.appliance_count > 0}
                ·
              {/if}
              {#if section.page_count - section.appliance_count > 0}
                {section.page_count - section.appliance_count} page{section.page_count - section.appliance_count === 1 ? '' : 's'}
              {/if}
              {#if section.page_count === 0}
                Empty
              {/if}
            </span>
          </span>
          <Icon name="chevronRight" size={14} />
        </a>
      {/each}
    </div>
  </section>
</div>
