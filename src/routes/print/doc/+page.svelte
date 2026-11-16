<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { formatDate } from '$lib/format';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function kindLabel(kind: string): string {
    if (kind === 'repair') return 'Repair';
    if (kind === 'inspection') return 'Inspection';
    if (kind === 'install') return 'Installation';
    if (kind === 'other') return 'Other';
    return 'Service';
  }
</script>

<svelte:head>
  <title>{data.bookTitle} · Print copy</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="print-bar no-print">
  <a class="btn btn-sm" href="/print">
    <Icon name="arrowLeft" size={15} />
    Choose pages
  </a>
  <div>
    <div class="print-bar-title">{data.bookTitle}</div>
    <div class="print-bar-meta">
      {data.totalPages} page{data.totalPages === 1 ? '' : 's'}
      {#if data.groups.length > 0}· {data.groups.length} section{data.groups.length === 1 ? '' : 's'}{/if}
    </div>
  </div>
  <span class="spacer"></span>
  <span class="print-bar-meta hide-sm">
    In the print dialog, tick “Headers and footers” for page numbers.
  </span>
  <button class="btn btn-primary" type="button" onclick={() => window.print()}>
    <Icon name="printer" size={16} />
    Print / Save as PDF
  </button>
</div>

<div class="print-doc-wrap">
  <div class="print-doc">
    {#if data.options.cover}
      <section class="print-sheet print-cover">
        <div class="print-cover-top">
          <span class="print-cover-mark"><Icon name="bookOpen" size={14} /> Home Operations</span>
          <span>{data.printedOn}</span>
        </div>

        <div class="print-cover-body">
          <h1>{data.bookTitle}</h1>
          {#if data.bookSubtitle}
            <p class="print-cover-sub">{data.bookSubtitle}</p>
          {/if}
          <hr class="print-cover-rule" />
          <div class="print-cover-meta">
            {#if data.preparedBy}
              Prepared by <strong>{data.preparedBy}</strong><br />
            {/if}
            <strong>
              {data.groups.length} section{data.groups.length === 1 ? '' : 's'} ·
              {data.totalPages} page{data.totalPages === 1 ? '' : 's'}
            </strong>
            <br />
            Printed {data.printedOn}
          </div>
        </div>

        {#if data.coverNote}
          <div class="print-cover-foot">{data.coverNote}</div>
        {/if}
      </section>
    {/if}

    {#if data.options.contents && data.groups.length > 0}
      <section class="print-sheet print-contents">
        <h2>Contents</h2>
        <p class="print-contents-intro">Sections and pages included in this copy.</p>

        {#each data.groups as group, index (group.id)}
          <div class="toc-section">
            <div class="toc-section-name">
              <span class="toc-num">{String(index + 1).padStart(2, '0')}</span>
              {group.name}
            </div>
            <ul class="toc-pages">
              {#each group.pages as page (page.id)}
                <li>
                  <a href="#page-{page.id}">
                    <span class="toc-page-title">{page.title}</span>
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </section>
    {/if}

    {#if data.totalPages === 0 && !data.options.cover}
      <section class="print-sheet print-empty">
        <p>No pages were selected. Go back and choose at least one page to print.</p>
        <div style="margin-top: 14px;" class="no-print">
          <a class="btn" href="/print">Choose pages</a>
        </div>
      </section>
    {/if}

    {#each data.groups as group, index (group.id)}
      {#if data.options.dividers}
        <section class="print-sheet print-section-divider">
          <div class="print-section-num">{String(index + 1).padStart(2, '0')}</div>
          <h2>{group.name}</h2>
          {#if group.description}
            <p>{group.description}</p>
          {/if}
          <ul class="print-section-pages">
            {#each group.pages as page (page.id)}
              <li>{page.title}</li>
            {/each}
          </ul>
        </section>
      {/if}

      {#each group.pages as page (page.id)}
        <article class="print-sheet print-page" id="page-{page.id}">
          <header class="print-page-head">
            <span>{group.name}</span>
            {#if data.options.dates}
              <span class="updated">Updated {page.updated}</span>
            {/if}
          </header>

          <h1>{page.title}</h1>

          {#if page.appliance}
            <dl class="print-specs">
              {#if page.appliance.make}
                <dt>Make</dt>
                <dd>{page.appliance.make}</dd>
              {/if}
              {#if page.appliance.model}
                <dt>Model</dt>
                <dd>{page.appliance.model}</dd>
              {/if}
              {#if page.appliance.serial}
                <dt>Serial number</dt>
                <dd>{page.appliance.serial}</dd>
              {/if}
              {#if page.appliance.location}
                <dt>Location</dt>
                <dd>{page.appliance.location}</dd>
              {/if}
              {#if page.appliance.installed}
                <dt>Installed</dt>
                <dd>{page.appliance.installed}</dd>
              {/if}
              {#if page.appliance.warranty}
                <dt>Warranty until</dt>
                <dd>{page.appliance.warranty}</dd>
              {/if}
              {#if page.appliance.supplier}
                <dt>Supplier / installer</dt>
                <dd>{page.appliance.supplier}</dd>
              {/if}
              {#if page.appliance.interval}
                <dt>Service interval</dt>
                <dd>{page.appliance.interval}</dd>
              {/if}
              {#if page.appliance.nextDue}
                <dt>Next service due</dt>
                <dd>{page.appliance.nextDue}</dd>
              {/if}
            </dl>
          {/if}

          {#if page.html.trim()}
            {#if page.appliance}
              <h2 class="print-subhead">Operation notes</h2>
            {/if}
            <div class="prose">
              {@html page.html}
            </div>
          {:else}
            <p class="print-empty" style="padding: 20px 0; text-align: left;">
              This page was blank when it was printed.
            </p>
          {/if}

          {#if page.appliance && page.appliance.service.length > 0}
            <h2 class="print-subhead">Service history</h2>
            <table class="print-service">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Work</th>
                  <th>Company</th>
                  <th class="num">Cost</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {#each page.appliance.service as record}
                  <tr>
                    <td class="nowrap">{formatDate(record.performed_on)}</td>
                    <td>{kindLabel(record.kind)}</td>
                    <td>
                      {record.company || '—'}
                      {#if record.engineer}<br /><span class="print-small">{record.engineer}</span>{/if}
                    </td>
                    <td class="num">{record.cost !== null ? `£${record.cost.toFixed(2)}` : '—'}</td>
                    <td>
                      {record.notes || '—'}
                      {#if record.next_due}
                        <br /><span class="print-small">Next due {formatDate(record.next_due)}</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}

          {#if data.options.notes}
            <div class="print-notes">
              <div class="print-notes-label">Notes</div>
              <div class="print-notes-line"></div>
              <div class="print-notes-line"></div>
              <div class="print-notes-line"></div>
              <div class="print-notes-line"></div>
              <div class="print-notes-line"></div>
              <div class="print-notes-line"></div>
            </div>
          {/if}
        </article>
      {/each}
    {/each}
  </div>
</div>
