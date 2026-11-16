<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import Attachments from '$lib/components/Attachments.svelte';
  import { formatDate, formatRelative } from '$lib/format';
  import { readingTime } from '$lib/text';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const error = $derived(form && 'error' in form ? form.error : '');
  const printHref = $derived(`/print/doc?pages=${data.page.id}&dates=1`);
</script>

<svelte:head>
  <title>{data.page.title} · Home Operations</title>
  <meta name="description" content={data.page.title} />
</svelte:head>

{#if error}
  <div class="alert alert-error" role="alert" style="margin-bottom: 18px;">
    <Icon name="alert" size={17} />
    <span>{error}</span>
  </div>
{/if}

<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <a href="/sections/{data.page.section_slug}">{data.page.section_name}</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <span>{data.page.title}</span>
</nav>

<div class="article-layout">
  <article>
    <header class="article-head">
      <div class="row" style="justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
        <a class="badge badge-accent" href="/sections/{data.page.section_slug}">
          <Icon name={data.page.section_icon} size={12} />
          {data.page.section_name}
        </a>
        <div class="row" style="gap: 6px;">
          <a class="btn btn-sm" href="/pages/{data.page.id}/edit">
            <Icon name="edit" size={14} />
            Edit
          </a>
          <a class="btn btn-sm" href={printHref} target="_blank" rel="noopener">
            <Icon name="printer" size={14} />
            <span class="hide-xs">Print</span>
          </a>
          <a class="icon-btn" href="/pages/{data.page.id}/history" title="Page history" aria-label="Page history">
            <Icon name="history" size={16} />
          </a>
          <a
            class="icon-btn"
            href="/pages/{data.page.id}/download"
            title="Download as Markdown"
            aria-label="Download this page as Markdown"
          >
            <Icon name="download" size={16} />
          </a>
        </div>
      </div>

      <h1 class="article-title">
        {#if data.page.pinned === 1}
          <span class="pin-flag" style="vertical-align: middle; margin-right: 10px;">
            <Icon name="pin" size={11} /> Pinned
          </span>
        {/if}
        {data.page.title}
      </h1>

      <div class="article-meta">
        <span>Updated {formatDate(data.page.updated_at)}</span>
        <span>·</span>
        <span>{readingTime(data.page.body)}</span>
        {#if data.page.created_at !== data.page.updated_at}
          <span>·</span>
          <span>First written {formatRelative(data.page.created_at)}</span>
        {/if}
      </div>
    </header>

    {#if data.page.body.trim()}
      <div class="prose article-body">
        {@html data.html}
      </div>
    {:else}
      <div class="empty" style="border: 1px dashed var(--border-strong); border-radius: var(--radius);">
        <div class="empty-icon"><Icon name="edit" size={22} /></div>
        <h3>This page is still blank</h3>
        <p>Add the first few lines. Even a rough note is better than nothing.</p>
        <div class="empty-actions">
          <a class="btn btn-primary" href="/pages/{data.page.id}/edit">
            <Icon name="edit" size={15} />
            Start writing
          </a>
        </div>
      </div>
    {/if}

    {#if data.linkedFrom.length > 0}
      <section class="backlinks">
        <h2><Icon name="link" size={14} /> Linked from</h2>
        <ul>
          {#each data.linkedFrom as item (item.id)}
            <li>
              <a href="/pages/{item.id}">{item.title}</a>
              <span class="faint">· {item.section_name}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <div style="margin-top: 28px;">
      <Attachments
        attachments={data.attachments}
        actionPath="/pages/{data.page.id}"
        returnTo="/pages/{data.page.id}"
        title="Files on this page"
        hint="Scans, photos or documents that belong with this page."
      />
    </div>

    {#if data.previous || data.next}
      <nav class="pager" aria-label="Pages in this section">
        {#if data.previous}
          <a class="pager-link" href="/pages/{data.previous.id}">
            <span class="pager-label"><Icon name="arrowLeft" size={12} /> Previous</span>
            <span class="pager-title">{data.previous.title}</span>
          </a>
        {:else}
          <span></span>
        {/if}
        {#if data.next}
          <a class="pager-link next" href="/pages/{data.next.id}">
            <span class="pager-label">Next <Icon name="arrowRight" size={12} /></span>
            <span class="pager-title">{data.next.title}</span>
          </a>
        {/if}
      </nav>
    {/if}
  </article>

  <aside class="article-side">
    <div class="side-card">
      <h3>More in this section</h3>
      <div class="side-links">
        {#each data.sectionPages as item (item.id)}
          <a
            class="side-link"
            class:active={item.id === data.page.id}
            href={item.kind === 'appliance' ? `/appliances/${item.id}` : `/pages/${item.id}`}
            aria-current={item.id === data.page.id ? 'page' : undefined}
          >
            {#if item.kind === 'appliance'}
              <Icon name="wrench" size={12} />
            {:else if item.pinned === 1}
              <Icon name="pin" size={12} />
            {:else}
              <Icon name="file" size={13} />
            {/if}
            <span class="nav-label">{item.title}</span>
          </a>
        {/each}
      </div>
      <a class="side-link" href="/sections/{data.page.section_slug}" style="margin-top: 6px;">
        <Icon name="arrowRight" size={13} />
        <span class="nav-label">All of {data.page.section_name}</span>
      </a>
    </div>

    <div class="side-card">
      <h3>Copies</h3>
      <div class="side-links">
        <a class="side-link" href={printHref} target="_blank" rel="noopener">
          <Icon name="printer" size={14} />
          <span class="nav-label">Print this page</span>
        </a>
        <a class="side-link" href="/pages/{data.page.id}/download">
          <Icon name="download" size={14} />
          <span class="nav-label">Download as Markdown</span>
        </a>
        <a class="side-link" href="/pages/{data.page.id}/history">
          <Icon name="history" size={14} />
          <span class="nav-label">Earlier versions</span>
        </a>
        <a class="side-link" href="/print">
          <Icon name="bookOpen" size={14} />
          <span class="nav-label">Print a larger collection</span>
        </a>
      </div>
    </div>

    <p class="hint" style="padding: 0 4px;">
      Page address: <span class="mono">/pages/{data.page.id}</span>
    </p>
  </aside>
</div>
