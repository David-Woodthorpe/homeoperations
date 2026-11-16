<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { formatRelative } from '$lib/format';
  import { sectionIcons } from '$lib/icons';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const error = $derived(form && 'error' in form ? form.error : '');
  const values = $derived(form && 'values' in form ? form.values : null);
</script>

<svelte:head>
  <title>Sections · Home Operations</title>
</svelte:head>

<div class="page-head">
  <div>
    <div class="page-kicker">Organisation</div>
    <h1>Sections</h1>
    <p class="page-sub">
      Sections are the chapters of the book. Move them up or down to change the order they appear
      in the menu and in print.
    </p>
  </div>
</div>

{#if error}
  <div class="alert alert-error" role="alert" style="margin-bottom: 18px;">
    <Icon name="alert" size={17} />
    <span>{error}</span>
  </div>
{/if}

<div class="stack">
  <section class="card">
    <div class="card-head">
      <h2>All sections</h2>
      <span class="hint">{data.sections.length} in total</span>
    </div>

    <div class="list">
      {#each data.sections as section, index (section.id)}
        <div class="section-admin" id="section-{section.id}">
          <div class="section-admin-head">
            <span class="section-admin-icon"><Icon name={section.icon} size={18} /></span>
            <span class="section-admin-main">
              <span class="section-admin-name">{section.name}</span>
              <span class="section-admin-meta">
                {section.page_count} page{section.page_count === 1 ? '' : 's'}
                {#if section.last_updated}
                  · updated {formatRelative(section.last_updated)}
                {/if}
              </span>
            </span>
            <div class="section-admin-actions">
              <form method="POST" action="?/move">
                <input type="hidden" name="id" value={section.id} />
                <input type="hidden" name="direction" value="up" />
                <button
                  class="icon-btn"
                  type="submit"
                  disabled={index === 0}
                  title="Move up"
                  aria-label="Move {section.name} up"
                >
                  <Icon name="arrowUp" size={15} />
                </button>
              </form>
              <form method="POST" action="?/move">
                <input type="hidden" name="id" value={section.id} />
                <input type="hidden" name="direction" value="down" />
                <button
                  class="icon-btn"
                  type="submit"
                  disabled={index === data.sections.length - 1}
                  title="Move down"
                  aria-label="Move {section.name} down"
                >
                  <Icon name="arrowDown" size={15} />
                </button>
              </form>
              <a class="icon-btn" href="/sections/{section.slug}" title="Open section" aria-label="Open {section.name}">
                <Icon name="eye" size={16} />
              </a>
              <a
                class="btn btn-sm"
                href={data.editId === section.id ? '/sections' : `/sections?edit=${section.id}#section-${section.id}`}
              >
                <Icon name={data.editId === section.id ? 'x' : 'edit'} size={14} />
                {data.editId === section.id ? 'Close' : 'Edit'}
              </a>
            </div>
          </div>

          {#if data.editId === section.id}
            <div class="section-admin-body">
              <form method="POST" action="?/update" class="form-grid">
                <input type="hidden" name="id" value={section.id} />
                <div class="field">
                  <label class="label" for="name-{section.id}">Name</label>
                  <input class="input" id="name-{section.id}" name="name" value={section.name} required />
                </div>
                <div class="field">
                  <label class="label" for="icon-{section.id}">Icon</label>
                  <select class="select" id="icon-{section.id}" name="icon">
                    {#each sectionIcons as icon}
                      <option value={icon} selected={icon === section.icon}>{icon}</option>
                    {/each}
                  </select>
                </div>
                <div class="field full">
                  <label class="label" for="description-{section.id}">
                    Description <span class="optional">shown under the section name</span>
                  </label>
                  <textarea class="textarea" id="description-{section.id}" name="description" rows="2"
                    >{section.description}</textarea>
                </div>
                <div class="form-actions full" style="margin-top: 0; padding-top: 16px;">
                  <button class="btn" type="submit">
                    <Icon name="check" size={15} />
                    Save changes
                  </button>
                  <span class="spacer"></span>
                  {#if section.page_count === 0}
                    <span class="hint hide-sm">Empty sections can be deleted.</span>
                    <button
                      class="btn btn-danger btn-sm"
                      type="submit"
                      formaction="?/delete"
                      onclick={(event) => {
                        if (!confirm(`Delete the section “${section.name}”?`)) event.preventDefault();
                      }}
                    >
                      <Icon name="trash" size={14} />
                      Delete
                    </button>
                  {/if}
                </div>
              </form>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </section>

  <section class="card">
    <div class="card-head">
      <h2>Add a section</h2>
      <span class="hint">For anything the starter sections do not cover</span>
    </div>
    <div class="card-body">
      <form method="POST" action="?/create" class="form-grid">
        <div class="field">
          <label class="label" for="new-name">Name</label>
          <input
            class="input"
            id="new-name"
            name="name"
            placeholder="e.g. Pets, Church, The allotment"
            value={values?.name ?? ''}
            required
          />
        </div>
        <div class="field">
          <label class="label" for="new-icon">Icon</label>
          <select class="select" id="new-icon" name="icon">
            {#each sectionIcons as icon}
              <option value={icon} selected={values?.icon === icon}>{icon}</option>
            {/each}
          </select>
        </div>
        <div class="field full">
          <label class="label" for="new-description">
            Description <span class="optional">optional, but helps someone else find things</span>
          </label>
          <textarea
            class="textarea"
            id="new-description"
            name="description"
            rows="2"
            placeholder="What belongs in this section?">{values?.description ?? ''}</textarea>
        </div>
        <div class="form-actions full" style="margin-top: 0; padding-top: 16px;">
          <button class="btn btn-primary" type="submit">
            <Icon name="plus" size={15} />
            Add section
          </button>
        </div>
      </form>
    </div>
  </section>
</div>
