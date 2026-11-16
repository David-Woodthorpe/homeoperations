<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { formatDate } from '$lib/format';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const error = $derived(form && 'error' in form ? form.error : '');
  const saved = $derived(form && 'saved' in form ? form.saved : false);
  const values = $derived(form && 'values' in form ? form.values : data.settings);
</script>

<svelte:head>
  <title>Settings · Home Operations</title>
</svelte:head>

<div class="page-head">
  <div>
    <div class="page-kicker">This book</div>
    <h1>Settings</h1>
    <p class="page-sub">
      These details appear on the cover page and at the top of the menu. Keep them plain: the point
      is that someone else can pick the book up and understand it.
    </p>
  </div>
  <div class="page-actions">
    <a class="btn" href="/print/doc?cover=1" target="_blank" rel="noopener">
      <Icon name="eye" size={15} />
      Preview cover
    </a>
  </div>
</div>

{#if error}
  <div class="alert alert-error" role="alert" style="margin-bottom: 18px;">
    <Icon name="alert" size={17} />
    <span>{error}</span>
  </div>
{/if}

{#if saved}
  <div class="alert alert-success" role="status" style="margin-bottom: 18px;">
    <Icon name="check" size={17} />
    <span>Saved. The cover page will use these details next time you print.</span>
  </div>
{/if}

<form method="POST">
  <section class="card">
    <div class="card-head">
      <h2>The book</h2>
      <span class="hint">Shown on the cover and in the menu</span>
    </div>
    <div class="card-body">
      <div class="form-grid">
        <div class="field full">
          <label class="label" for="book-title">Book title</label>
          <input
            class="input"
            id="book-title"
            name="book_title"
            value={values.book_title}
            placeholder="Our House O&M Manual"
            required
          />
        </div>

        <div class="field full">
          <label class="label" for="book-subtitle">
            Subtitle <span class="optional">optional</span>
          </label>
          <input
            class="input"
            id="book-subtitle"
            name="book_subtitle"
            value={values.book_subtitle}
            placeholder="How everything works, and how to look after it"
          />
        </div>

        <div class="field">
          <label class="label" for="prepared-by">
            Prepared by <span class="optional">optional</span>
          </label>
          <input
            class="input"
            id="prepared-by"
            name="prepared_by"
            value={values.prepared_by}
            placeholder="Your name"
            autocomplete="name"
          />
        </div>

        <div class="field full">
          <label class="label" for="cover-note">Note on the cover</label>
          <textarea class="textarea" id="cover-note" name="cover_note" rows="3">{values.cover_note}</textarea>
          <p class="hint">
            A short line for whoever opens the printed copy. For example, where the property
            documents and spare keys are kept.
          </p>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary btn-lg" type="submit">
          <Icon name="check" size={16} />
          Save settings
        </button>
        <span class="spacer"></span>
        <a class="hint link" href="/print/doc?cover=1" target="_blank" rel="noopener">See how the cover looks</a>
      </div>
    </div>
  </section>
</form>

<div class="stack" style="margin-top: 22px;">
  <section class="card">
    <div class="card-head"><h2>Where to go next</h2></div>
    <div class="card-body">
      <div class="row">
        <a class="btn" href="/backup">
          <Icon name="archive" size={15} />
          Backup &amp; restore
        </a>
        <a class="btn" href="/sections">
          <Icon name="folder" size={15} />
          Manage sections
        </a>
        <a class="btn btn-ghost" href="/help">
          <Icon name="info" size={15} />
          How to use the book
        </a>
      </div>
      <p class="hint" style="margin-top: 14px;">
        Last backup: {data.settings.last_backup_at
          ? formatDate(data.settings.last_backup_at)
          : 'never'}. A backup is a single file you can keep anywhere.
      </p>
    </div>
  </section>
</div>
