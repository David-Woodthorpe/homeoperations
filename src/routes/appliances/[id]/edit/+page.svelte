<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import ApplianceForm from '$lib/components/ApplianceForm.svelte';
  import type { ApplianceInput } from '$lib/types';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const error = $derived(form && 'error' in form ? form.error : '');
  const values = $derived(form && 'values' in form ? (form.values as ApplianceInput) : null);
  const initial = $derived(values ?? data.values);
</script>

<svelte:head>
  <title>Edit {data.appliance.title} · Home Operations</title>
</svelte:head>

<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <a href="/appliances">Appliances</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <a href="/appliances/{data.appliance.id}">{data.appliance.title}</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <span>Edit</span>
</nav>

<div class="page-head">
  <div>
    <div class="page-kicker">Editing the register</div>
    <h1>{data.appliance.title}</h1>
    <p class="page-sub">
      Changes to the notes keep a previous version, just like a normal page.
    </p>
  </div>
  <div class="page-actions">
    <a class="btn" href="/appliances/{data.appliance.id}">
      <Icon name="eye" size={15} />
      View appliance
    </a>
  </div>
</div>

{#if error}
  <div class="alert alert-error" role="alert" style="margin-bottom: 18px;">
    <Icon name="alert" size={17} />
    <span>{error}</span>
  </div>
{/if}

<ApplianceForm
  initial={initial}
  sections={data.sections}
  categories={data.categories}
  pageIndex={data.pageIndex}
  formAction="?/save"
  submitLabel="Save changes"
  cancelHref="/appliances/{data.appliance.id}"
/>

<div class="divider" style="margin-top: 34px;"></div>

<section class="danger-zone">
  <div>
    <h2>Delete this appliance</h2>
    <p>
      Its notes page, manuals, photos and service history will be removed. This cannot be undone,
      though a backup may still contain a copy.
    </p>
  </div>
  <form
    method="POST"
    action="?/delete"
    onsubmit={(event) => {
      if (!confirm(`Delete “${data.appliance.title}” and all of its files?`)) event.preventDefault();
    }}
  >
    <button class="btn btn-danger" type="submit">
      <Icon name="trash" size={15} />
      Delete appliance
    </button>
  </form>
</section>
