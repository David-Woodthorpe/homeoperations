<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import ApplianceForm from '$lib/components/ApplianceForm.svelte';
  import type { ApplianceInput } from '$lib/types';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const error = $derived(form && 'error' in form ? form.error : '');
  const values = $derived(form && 'values' in form ? (form.values as ApplianceInput) : null);

  const initial = $derived<ApplianceInput>({
    title: values?.title ?? '',
    section_id: values?.section_id ?? data.defaultSectionId,
    body: values?.body ?? '',
    pinned: values?.pinned ?? false,
    category: values?.category ?? data.defaultCategory,
    make: values?.make ?? '',
    model: values?.model ?? '',
    serial: values?.serial ?? '',
    location: values?.location ?? '',
    installed_on: values?.installed_on ?? '',
    warranty_until: values?.warranty_until ?? '',
    service_interval_months: values?.service_interval_months ?? null,
    service_next_due: values?.service_next_due ?? '',
    supplier: values?.supplier ?? '',
    manual_url: values?.manual_url ?? ''
  });
</script>

<svelte:head>
  <title>Add an appliance · Home Operations</title>
</svelte:head>

<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <a href="/appliances">Appliances</a>
  <span class="sep"><Icon name="chevronRight" size={12} /></span>
  <span>Add</span>
</nav>

<div class="page-head">
  <div>
    <div class="page-kicker">The register</div>
    <h1>Add an appliance or system</h1>
    <p class="page-sub">
      Record what it is, where it is and how often it needs attention. Manuals, photos and service
      history can be added once it is saved.
    </p>
  </div>
  <div class="page-actions">
    <a class="btn btn-ghost" href="/appliances">Cancel</a>
  </div>
</div>

{#if error}
  <div class="alert alert-error" role="alert" style="margin-bottom: 18px;">
    <Icon name="alert" size={17} />
    <span>{error}</span>
  </div>
{/if}

{#if !data.hasSections}
  <div class="alert alert-warning" role="alert">
    <Icon name="alert" size={17} />
    <span>
      There are no sections yet, so there is nowhere to file the notes.
      <a class="link" href="/sections">Add a section first</a>.
    </span>
  </div>
{:else}
  <ApplianceForm
    initial={initial}
    sections={data.sections}
    categories={data.categories}
    pageIndex={data.pageIndex}
    cancelHref="/appliances"
    submitLabel="Save appliance"
  />
{/if}
