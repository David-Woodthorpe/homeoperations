<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { formatRelative } from '$lib/format';
  import { readingTime } from '$lib/text';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const printHref = $derived.by(() => {
    const params = new URLSearchParams();
    for (const page of data.pages) params.append('pages', page.id);
    params.set('dividers', '1');
    params.set('dates', '1');
    return `/print/doc?${params.toString()}`;
  });
</script>

<svelte:head>
  <title>{data.section.name} · Home Operations</title>
  <meta name="description" content={data.section.description} />
</svelte:head>

<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <span>Sections</span>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <span>{data.section.name}</span>
</nav>

<div class="page-head">
  <div>
    <div class="page-kicker">Section</div>
    <h1>{data.section.name}</h1>
    {#if data.section.description}
      <p class="page-sub">{data.section.description}</p>
    {/if}
  </div>
  <div class="page-actions">
    <a class="btn" href="/sections?edit={data.section.id}#section-{data.section.id}">
      <Icon name="edit" size={15} />
      <span class="hide-sm">Edit section</span>
    </a>
    {#if data.pages.length > 0}
      <a class="btn" href={printHref} target="_blank" rel="noopener">
        <Icon name="printer" size={15} />
        <span class="hide-sm">Print section</span>
      </a>
    {/if}
    <a class="btn btn-primary" href="/pages/new?section={data.section.slug}">
      <Icon name="plus" size={16} />
      New page
    </a>
  </div>
</div>

{#if data.pages.length === 0}
  <section class="card">
    <div class="empty">
      <div class="empty-icon"><Icon name={data.section.icon} size={24} /></div>
      <h3>This section is empty</h3>
      <p>
        Write the first page for {data.section.name}. A page can be a few lines, a checklist, or a
        long explanation. You can always add to it later.
      </p>
      <div class="empty-actions">
        <a class="btn btn-primary" href="/pages/new?section={data.section.slug}">
          <Icon name="plus" size={16} />
          Write the first page
        </a>
      </div>
    </div>
  </section>
{:else}
  <div class="page-list">
    {#each data.pages as page, index (page.id)}
      <article class="page-row">
        <div class="page-row-main">
          <a class="page-row-title" href={page.kind === 'appliance' ? `/appliances/${page.id}` : `/pages/${page.id}`}>
            {#if page.kind === 'appliance'}
              <Icon name="wrench" size={15} />
            {:else if page.pinned === 1}
              <Icon name="pin" size={15} />
            {/if}
            {page.title}
            {#if page.kind === 'appliance'}
              <span class="badge">Appliance</span>
            {/if}
          </a>
          {#if page.snippet}
            <p class="page-row-snippet">{page.snippet}</p>
          {/if}
          <div class="page-row-foot">
            <span>Updated {formatRelative(page.updated_at)}</span>
            <span>·</span>
            <span>{readingTime(page.body)}</span>
          </div>
        </div>

        <div class="page-row-actions">
          <form method="POST" action="?/move">
            <input type="hidden" name="id" value={page.id} />
            <input type="hidden" name="direction" value="up" />
            <button class="icon-btn" type="submit" disabled={index === 0} title="Move up" aria-label="Move {page.title} up">
              <Icon name="arrowUp" size={15} />
            </button>
          </form>
          <form method="POST" action="?/move">
            <input type="hidden" name="id" value={page.id} />
            <input type="hidden" name="direction" value="down" />
            <button
              class="icon-btn"
              type="submit"
              disabled={index === data.pages.length - 1}
              title="Move down"
              aria-label="Move {page.title} down"
            >
              <Icon name="arrowDown" size={15} />
            </button>
          </form>
          <a class="icon-btn" href={page.kind === 'appliance' ? `/appliances/${page.id}/edit` : `/pages/${page.id}/edit`} title="Edit page" aria-label="Edit {page.title}">
            <Icon name="edit" size={15} />
          </a>
        </div>
      </article>
    {/each}
  </div>
{/if}
