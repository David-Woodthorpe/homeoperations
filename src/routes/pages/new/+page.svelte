<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import PageEditor from '$lib/components/PageEditor.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const error = $derived(form && 'error' in form ? form.error : '');
  const values = $derived(form && 'values' in form ? form.values : null);
  const sectionExists = $derived(data.sections.length > 0);
</script>

<svelte:head>
  <title>New page · Home Operations</title>
</svelte:head>

<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <span>New page</span>
</nav>

<div class="page-head">
  <div>
    <div class="page-kicker">A new page</div>
    <h1>Write a page</h1>
    <p class="page-sub">
      Write it the way you would say it out loud. You can move it to a different section later.
    </p>
    <div class="alert alert-info" style="margin-top: 14px;">
      <Icon name="info" size={16} />
      <span>
        Adding an appliance with a make, model or service schedule?
        <a class="link" href="/appliances/new">Use the appliance register</a> instead, so it appears
        in the maintenance schedule.
      </span>
    </div>
  </div>
  <div class="page-actions">
    <a class="btn btn-ghost" href="/">Cancel</a>
  </div>
</div>

{#if error}
  <div class="alert alert-error" role="alert" style="margin-bottom: 18px;">
    <Icon name="alert" size={17} />
    <span>{error}</span>
  </div>
{/if}

{#if !sectionExists}
  <div class="alert alert-warning" role="alert">
    <Icon name="alert" size={17} />
    <span>
      There are no sections yet, so there is nowhere to put a page.
      <a class="link" href="/sections">Add a section first</a>.
    </span>
  </div>
{:else}
  <form method="POST">
    <PageEditor
      initialTitle={values?.title ?? ''}
      initialBody={values?.body ?? ''}
      initialSectionId={values?.section_id ?? data.defaultSectionId}
      initialPinned={values?.pinned ?? false}
      sections={data.sections}
      pageIndex={data.pageIndex}
    />

    <div class="form-actions">
      <button class="btn btn-primary btn-lg" type="submit">
        <Icon name="check" size={16} />
        Save page
      </button>
      <a class="btn btn-ghost" href="/">Cancel</a>
      <span class="spacer"></span>
      <span class="hint">You can edit this page at any time.</span>
    </div>
  </form>
{/if}
