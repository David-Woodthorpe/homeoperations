<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { formatDate, formatRelative } from '$lib/format';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const error = $derived(form && 'error' in form ? form.error : '');
  const message = $derived(form && 'message' in form ? form.message : '');
</script>

<svelte:head>
  <title>Backup &amp; restore · Home Operations</title>
</svelte:head>

<div class="page-head">
  <div>
    <div class="page-kicker">Keep it safe</div>
    <h1>Backup &amp; restore</h1>
    <p class="page-sub">
      The whole book lives in one folder on this computer. Download a copy regularly and keep it
      somewhere else, in case this computer stops working.
    </p>
  </div>
</div>

{#if error}
  <div class="alert alert-error" role="alert" style="margin-bottom: 18px;">
    <Icon name="alert" size={17} />
    <span>{error}</span>
  </div>
{/if}

{#if message}
  <div class="alert alert-success" role="status" style="margin-bottom: 18px;">
    <Icon name="check" size={17} />
    <span>{message}</span>
  </div>
{/if}

<div class="stack">
  <section class="card">
    <div class="card-head">
      <h2>Download a copy</h2>
      <span class="hint">
        {data.lastBackupAt ? `Last backup ${formatRelative(data.lastBackupAt)}` : 'No backup taken yet'}
      </span>
    </div>
    <div class="card-body">
      <div class="backup-options">
        <div class="backup-option">
          <span class="backup-option-icon"><Icon name="archive" size={20} /></span>
          <div>
            <h3>Full backup <span class="badge badge-accent">Best</span></h3>
            <p>
              A single JSON file containing every section, page, earlier version, service record,
              maintenance task, setting — and every manual, photo and receipt you have attached.
              Use this to restore the manual exactly as it is now.
            </p>
            <a class="btn btn-primary" href="/backup/download" download>
              <Icon name="download" size={16} />
              Download backup
            </a>
          </div>
        </div>

        <div class="backup-option">
          <span class="backup-option-icon"><Icon name="file" size={20} /></span>
          <div>
            <h3>Plain Markdown</h3>
            <p>
              The whole book as one readable text file. Good for keeping in another notes app,
              searching with other tools, or emailing to someone.
            </p>
            <a class="btn" href="/backup/markdown" download>
              <Icon name="download" size={16} />
              Download Markdown
            </a>
          </div>
        </div>

        <div class="backup-option">
          <span class="backup-option-icon"><Icon name="history" size={20} /></span>
          <div>
            <h3>Safety copy of the database</h3>
            <p>
              Home Operations makes its own copy before a restore. You can also take one by hand, for
              example before a big edit.
            </p>
            <form method="POST" action="?/safetyCopy">
              <button class="btn" type="submit">
                <Icon name="copy" size={16} />
                Make a safety copy
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="card-head">
      <h2>Restore from a backup</h2>
      <span class="hint">Replaces everything currently in the book</span>
    </div>
    <div class="card-body">
      <form method="POST" action="?/import" enctype="multipart/form-data">
        <div class="field">
          <label class="label" for="backup-file">Backup file (.json)</label>
          <input class="input" style="height: auto; padding: 8px 11px;" id="backup-file" name="file" type="file" accept=".json,application/json" required />
          <p class="hint">
            Only restore a file made by Home Operations. A safety copy of the current book is made first,
            so an accidental restore can be undone by hand if needed.
          </p>
        </div>

        <div style="margin-top: 16px;">
          <label class="check">
            <input type="checkbox" name="confirm" value="1" required />
            <span>
              I understand this replaces the current book with the contents of the backup.
            </span>
          </label>
        </div>

        <div class="form-actions">
          <button class="btn btn-danger" type="submit">
            <Icon name="upload" size={16} />
            Restore this backup
          </button>
        </div>
      </form>
    </div>
  </section>

  <section class="card">
    <div class="card-head"><h2>Where the book is stored</h2></div>
    <div class="card-body">
      <dl class="kv">
        <dt>Database</dt>
        <dd class="mono" style="font-size: 12.5px;">{data.summary.location}</dd>
        <dt>Size</dt>
        <dd>{data.summary.size}</dd>
        <dt>Contents</dt>
        <dd>
          {data.summary.page_count} page{data.summary.page_count === 1 ? '' : 's'} ·
          {data.summary.words.toLocaleString('en-GB')} words
        </dd>
        <dt>Attachments</dt>
        <dd>
          {data.summary.attachment_count} file{data.summary.attachment_count === 1 ? '' : 's'}
          {#if data.summary.attachment_bytes > 0}· {data.summary.attachment_size}{/if}
        </dd>
      </dl>
      <p class="hint" style="margin-top: 12px;">
        If you copy files by hand, copy the whole folder containing this database, not just the
        database file. The download buttons above are the safer option.
      </p>

      {#if data.copies.length > 0}
        <div class="divider"></div>
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--faint); margin-bottom: 10px;">
          Recent safety copies
        </h3>
        <div class="copy-list">
          {#each data.copies as copy (copy.name)}
            <a class="copy-row" href="/backup/safety/{copy.name}" download>
              <Icon name="download" size={14} />
              <span class="mono" style="font-size: 11.5px;">{copy.name}</span>
              <span class="spacer"></span>
              <span class="faint small">{copy.size} · {formatDate(copy.modified)}</span>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </section>
</div>
