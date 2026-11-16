<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import PageEditor from '$lib/components/PageEditor.svelte';
  import { formatRelative } from '$lib/format';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const error = $derived(form && 'error' in form ? form.error : '');
  const values = $derived(form && 'values' in form ? form.values : null);
</script>

<svelte:head>
  <title>Edit {data.page.title} · Home Operations</title>
</svelte:head>

<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <a href="/sections/{data.page.section_slug}">{data.page.section_name}</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <a href="/pages/{data.page.id}">{data.page.title}</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <span>Edit</span>
</nav>

<div class="page-head">
  <div>
    <div class="page-kicker">Editing</div>
    <h1 class="hide-sm" style="font-size: 26px;">{data.page.title}</h1>
    <p class="page-sub">
      Last saved {formatRelative(data.page.updated_at)}. Every save keeps the previous version, so
      you can undo a mistake.
    </p>
  </div>
  <div class="page-actions">
    <a class="btn" href="/pages/{data.page.id}/history">
      <Icon name="history" size={15} />
      <span class="hide-sm">History</span>
    </a>
    <a class="btn" href="/pages/{data.page.id}">
      <Icon name="eye" size={15} />
      View page
    </a>
  </div>
</div>

{#if error}
  <div class="alert alert-error" role="alert" style="margin-bottom: 18px;">
    <Icon name="alert" size={17} />
    <span>{error}</span>
  </div>
{/if}

<form method="POST" action="?/save" id="page-form">
  <PageEditor
    initialTitle={values?.title ?? data.page.title}
    initialBody={values?.body ?? data.page.body}
    initialSectionId={values?.section_id ?? data.page.section_id}
    initialPinned={values?.pinned ?? data.page.pinned === 1}
    sections={data.sections}
    pageIndex={data.pageIndex}
  />

  <div class="form-actions">
    <button class="btn btn-primary btn-lg" type="submit">
      <Icon name="check" size={16} />
      Save changes
    </button>
    <a class="btn btn-ghost" href="/pages/{data.page.id}">Cancel</a>
    <span class="spacer"></span>
    <span class="hint hide-sm">A version is kept each time you save.</span>
  </div>
</form>

<div class="divider" style="margin-top: 34px;"></div>

<section class="danger-zone">
  <div>
    <h2>Delete this page</h2>
    <p>
      The page and its saved versions will be removed. If you only want to start again, save a
      blank page instead and the old text stays in History.
    </p>
  </div>
  <form
    method="POST"
    action="?/delete"
    onsubmit={(event) => {
      if (!confirm(`Delete “${data.page.title}” permanently?`)) event.preventDefault();
    }}
  >
    <button class="btn btn-danger" type="submit">
      <Icon name="trash" size={15} />
      Delete page
    </button>
  </form>
</section>
