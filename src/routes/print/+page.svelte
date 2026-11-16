<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // The chooser starts with everything ticked; the server data does not change
  // while this page is open.
  // svelte-ignore state_referenced_locally
  const everyPage = data.sections.flatMap((section) => section.pages.map((page) => page.id));
  let selected = $state<string[]>([...everyPage]);

  const count = $derived(selected.length);
  const allSelected = $derived(count === everyPage.length && count > 0);

  function sectionSelected(sectionId: string): boolean {
    const section = data.sections.find((item) => item.id === sectionId);
    return Boolean(section && section.pages.length > 0 && section.pages.every((page) => selected.includes(page.id)));
  }

  function toggleSection(sectionId: string, checked: boolean) {
    const section = data.sections.find((item) => item.id === sectionId);
    if (!section) return;
    const ids = section.pages.map((page) => page.id);
    selected = checked
      ? [...new Set([...selected, ...ids])]
      : selected.filter((id) => !ids.includes(id));
  }

  function selectAll() {
    selected = [...everyPage];
  }

  function selectNone() {
    selected = [];
  }
</script>

<svelte:head>
  <title>Print &amp; export · Home Operations</title>
</svelte:head>

<div class="page-head">
  <div>
    <div class="page-kicker">Physical backup</div>
    <h1>Print &amp; export</h1>
    <p class="page-sub">
      Choose what to put on paper, then print it or save it as a PDF. A printed copy is the backup
      that works without a computer, a password, or an internet connection.
    </p>
  </div>
</div>

<form method="GET" action="/print/doc" class="print-layout">
  <section class="card">
    <div class="card-head">
      <h2>What to include</h2>
      <div class="row" style="gap: 6px;">
        <button class="btn btn-sm btn-ghost" type="button" onclick={selectAll} disabled={allSelected || everyPage.length === 0}>
          Select all
        </button>
        <button class="btn btn-sm btn-ghost" type="button" onclick={selectNone} disabled={count === 0}>
          Clear
        </button>
      </div>
    </div>

    <div class="tree">
      {#each data.sections as section (section.id)}
        <div class="tree-section">
          <div class="tree-section-head">
            <input
              type="checkbox"
              checked={sectionSelected(section.id)}
              disabled={section.pages.length === 0}
              onchange={(event) => toggleSection(section.id, event.currentTarget.checked)}
              aria-label={`Select all pages in ${section.name}`}
            />
            <label class="check" style="cursor: pointer;">
              <span style="display: inline-flex; align-items: center; gap: 7px;">
                <Icon name={section.icon} size={15} />
                {section.name}
              </span>
            </label>
            <span class="tree-section-count">
              {section.pages.length} page{section.pages.length === 1 ? '' : 's'}
            </span>
          </div>

          <div class="tree-pages">
            {#if section.pages.length > 0}
              {#each section.pages as page (page.id)}
                <label class="tree-page">
                  <input type="checkbox" name="pages" value={page.id} bind:group={selected} />
                  <span>{page.title}</span>
                </label>
              {/each}
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </section>

  <aside class="print-side">
    <div class="card">
      <div class="card-body">
        <div class="selection-count">
          <strong>{count}</strong>
          <span>of {data.totalPages} page{data.totalPages === 1 ? '' : 's'} selected</span>
        </div>

        <div class="option-list" style="margin-top: 18px;">
          <label class="check">
            <input type="checkbox" name="cover" value="1" checked />
            <span>Cover page<small>Book title, date and who it was prepared by.</small></span>
          </label>
          <label class="check">
            <input type="checkbox" name="contents" value="1" checked />
            <span>Contents<small>A list of the sections and pages in this copy.</small></span>
          </label>
          <label class="check">
            <input type="checkbox" name="dividers" value="1" checked />
            <span>Section divider pages<small>Starts each section on a fresh page, like chapters.</small></span>
          </label>
          <label class="check">
            <input type="checkbox" name="dates" value="1" checked />
            <span>Last updated dates<small>Shows how current each page is.</small></span>
          </label>
          <label class="check">
            <input type="checkbox" name="notes" value="1" />
            <span>Space for handwritten notes<small>A few ruled lines at the end of every page.</small></span>
          </label>
        </div>

        <p class="hint" style="margin-top: 14px;">
          Appliance pages also print their specification and service history automatically.
        </p>

        <button class="btn btn-primary btn-lg btn-block" type="submit" style="margin-top: 20px;" disabled={count === 0}>
          <Icon name="printer" size={17} />
          Open print view
        </button>
        <p class="hint" style="margin-top: 10px;">
          The next screen shows the finished document. Use its <strong>Print / Save as PDF</strong>
          button, or press <span style="white-space: nowrap;"><kbd>Ctrl</kbd> + <kbd>P</kbd>.</span>
        </p>
      </div>
    </div>

    <div class="side-card">
      <h3>For a ring binder</h3>
      <p class="small muted" style="line-height: 1.55;">
        Print double-sided if you can, use A4 paper, and keep the copy with your passports, will and
        insurance documents. Add a note in your calendar to print a fresh copy after big changes.
      </p>
    </div>

    <div class="side-card">
      <h3>Page numbers</h3>
      <p class="small muted" style="line-height: 1.55;">
        In the print dialog, tick <strong>Headers and footers</strong> to add page numbers and the
        date. Browsers cannot number pages inside the page itself.
      </p>
    </div>
  </aside>
</form>
