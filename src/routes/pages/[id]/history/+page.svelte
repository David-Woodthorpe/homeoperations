<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { formatDate, formatRelative } from '$lib/format';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>History of {data.page.title} · Home Operations</title>
</svelte:head>

<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <a href="/sections/{data.page.section_slug}">{data.page.section_name}</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <a href="/pages/{data.page.id}">{data.page.title}</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <span>History</span>
</nav>

<div class="page-head">
  <div>
    <div class="page-kicker">Earlier versions</div>
    <h1>History</h1>
    <p class="page-sub">
      A version is saved each time the page changes. Restoring an old version keeps the current one
      here too, so nothing is lost.
    </p>
  </div>
  <div class="page-actions">
    <a class="btn" href="/pages/{data.page.id}">
      <Icon name="arrowLeft" size={15} />
      Back to page
    </a>
    <a class="btn btn-primary" href="/pages/{data.page.id}/edit">
      <Icon name="edit" size={15} />
      Edit page
    </a>
  </div>
</div>

{#if data.revisions.length === 0}
  <section class="card">
    <div class="empty">
      <div class="empty-icon"><Icon name="history" size={24} /></div>
      <h3>No earlier versions yet</h3>
      <p>The next time you save a change to this page, the version before it will appear here.</p>
    </div>
  </section>
{:else}
  <div class="revision-list">
    {#each data.revisions as revision, index (revision.id)}
      <article class="card revision">
        <div class="revision-head">
          <div>
            <div class="revision-title">
              {#if index === 0}
                <span class="badge badge-accent">Most recent</span>
              {/if}
              {revision.title}
            </div>
            <div class="revision-meta">
              Saved {formatDate(revision.created_at)} · {formatRelative(revision.created_at)}
              {#if revision.title !== data.page.title}
                · the page was called “{revision.title}” then
              {/if}
            </div>
          </div>
          <form
            method="POST"
            action="?/restore"
            onsubmit={(event) => {
              if (!confirm('Replace the current page with this version? The current text will be kept in History.')) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="revision_id" value={revision.id} />
            <button class="btn btn-sm" type="submit">
              <Icon name="history" size={14} />
              Restore this version
            </button>
          </form>
        </div>
        <details class="revision-body">
          <summary>Read this version</summary>
          {#if revision.body.trim()}
            <div class="prose">{@html revision.html}</div>
          {:else}
            <p class="muted small">This version was blank.</p>
          {/if}
        </details>
      </article>
    {/each}
  </div>
{/if}
