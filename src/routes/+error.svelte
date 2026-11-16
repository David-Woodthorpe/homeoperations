<script lang="ts">
  import { page } from '$app/state';
  import Icon from '$lib/components/Icon.svelte';

  const status = $derived(page.status);
  const message = $derived(page.error?.message ?? 'Something went wrong.');

  const title = $derived(
    status === 404
      ? 'That page is not in the book'
      : status === 403
        ? 'That is not allowed'
        : 'Something went wrong'
  );
</script>

<svelte:head>
  <title>{title} · Home Operations</title>
</svelte:head>

<div class="page-head">
  <div>
    <div class="page-kicker">Error {status}</div>
    <h1>{title}</h1>
    <p class="page-sub">{message}</p>
  </div>
</div>

<section class="card">
  <div class="empty">
    <div class="empty-icon"><Icon name={status === 404 ? 'search' : 'alert'} size={24} /></div>
    <h3>{status === 404 ? 'It may have been renamed or deleted' : 'Your book is still safe'}</h3>
    <p>
      {#if status === 404}
        Try searching for the page, or browse the sections from the menu.
      {:else}
        Nothing has been lost. Try again, or go back to the overview.
      {/if}
    </p>
    <div class="empty-actions">
      <a class="btn btn-primary" href="/">Back to the overview</a>
      <a class="btn" href="/search">Search the book</a>
    </div>
  </div>
</section>
