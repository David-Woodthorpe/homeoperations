<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { formatRelative } from '$lib/format';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function chunks(text: string, query: string) {
    if (!query) return [{ text, match: false }];
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'ig'));
    return parts
      .filter((part) => part !== '')
      .map((part) => ({ text: part, match: part.toLowerCase() === query.toLowerCase() }));
  }
</script>

<svelte:head>
  <title>{data.query ? `Search: ${data.query}` : 'Search'} · Home Operations</title>
</svelte:head>

<div class="page-head">
  <div>
    <div class="page-kicker">Search</div>
    <h1>Find something</h1>
    <p class="page-sub">Searches page titles and everything written inside them.</p>
  </div>
</div>

<form class="search-form" action="/search" method="GET" role="search" style="margin-bottom: 26px;">
  <div class="search-input">
    <Icon name="search" size={18} />
    <!-- svelte-ignore a11y_autofocus -->
    <input
      class="input"
      type="search"
      name="q"
      value={data.query}
      placeholder="Try “boiler”, “bank”, “passport”, a name…"
      aria-label="Search the book"
      autofocus
    />
  </div>
  <button class="btn btn-primary" type="submit">Search</button>
</form>

{#if !data.query}
  <section class="card">
    <div class="empty">
      <div class="empty-icon"><Icon name="search" size={24} /></div>
      <h3>Search the whole book</h3>
      <p>
        Look for a word or phrase. Searching “gas” will find pages that mention the gas meter even
        if the page title is “Utilities”.
      </p>
      <div class="empty-actions">
        <a class="btn" href="/">Browse sections instead</a>
      </div>
    </div>
  </section>
{:else if data.results.length === 0}
  <section class="card">
    <div class="empty">
      <div class="empty-icon"><Icon name="search" size={24} /></div>
      <h3>Nothing found for “{data.query}”</h3>
      <p>Try a shorter or more general word, or browse the sections from the menu.</p>
      <div class="empty-actions">
        <a class="btn" href="/">Browse sections</a>
        <a class="btn" href="/pages/new">Write a new page</a>
      </div>
    </div>
  </section>
{:else}
  <p class="result-count">
    {data.results.length} result{data.results.length === 1 ? '' : 's'} for
    <strong style="color: var(--text);">“{data.query}”</strong>
  </p>

  <div class="list" style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden;">
    {#each data.results as result (result.id)}
      <div class="list-row" style="align-items: flex-start; padding: 16px 20px;">
        <span class="list-icon"><Icon name={result.section_icon} size={17} /></span>
        <div class="list-main">
          <a class="list-title" href={result.kind === 'appliance' ? `/appliances/${result.id}` : `/pages/${result.id}`} style="font-size: 15.5px;">
            {#each chunks(result.title, data.query) as part}
              {#if part.match}<mark>{part.text}</mark>{:else}{part.text}{/if}
            {/each}
          </a>
          {#if result.meta}
            <div class="list-sub" style="margin-top: 2px; color: var(--muted);">
              {result.meta}
            </div>
          {/if}
          <div class="list-sub" style="margin-top: 4px; -webkit-line-clamp: 3;">
            {#each chunks(result.snippet, data.query) as part}
              {#if part.match}<mark>{part.text}</mark>{:else}{part.text}{/if}
            {/each}
          </div>
          <div style="margin-top: 7px;" class="row">
            <a class="badge badge-outline" href="/sections/{result.section_slug}">{result.section_name}</a>
            {#if result.kind === 'appliance'}
              <span class="badge badge-accent">Appliance</span>
            {/if}
          </div>
        </div>
        <div class="list-meta">{formatRelative(result.updated_at)}</div>
      </div>
    {/each}
  </div>
{/if}
