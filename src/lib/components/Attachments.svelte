<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { formatBytes, formatRelative } from '$lib/format';
  import type { Attachment } from '$lib/types';

  let {
    attachments,
    actionPath,
    returnTo,
    title = 'Manuals, photos & receipts',
    hint = 'PDF manuals, photos of data plates or stopcocks, and receipts.'
  }: {
    attachments: Attachment[];
    actionPath: string;
    returnTo: string;
    title?: string;
    hint?: string;
  } = $props();

  const total = $derived(attachments.reduce((sum, item) => sum + item.size, 0));

  function isImage(attachment: Attachment): boolean {
    return attachment.mime_type.startsWith('image/');
  }
</script>

<section class="card">
  <div class="card-head">
    <h2>{title}</h2>
    <span class="hint">
      {attachments.length} file{attachments.length === 1 ? '' : 's'}
      {#if total > 0}· {formatBytes(total)}{/if}
    </span>
  </div>

  {#if attachments.length > 0}
    <div class="attachment-list">
      {#each attachments as attachment (attachment.id)}
        <div class="attachment-row">
          <a
            class="attachment-thumb"
            href="/attachments/{attachment.id}"
            target="_blank"
            rel="noopener"
            aria-label="Open {attachment.filename}"
          >
            {#if isImage(attachment)}
              <img src="/attachments/{attachment.id}" alt="" loading="lazy" />
            {:else}
              <Icon
                name={attachment.kind === 'receipt'
                  ? 'receipt'
                  : attachment.kind === 'photo'
                    ? 'camera'
                    : 'file'}
                size={18}
              />
            {/if}
          </a>

          <div class="attachment-main">
            <a class="attachment-name" href="/attachments/{attachment.id}" target="_blank" rel="noopener">
              {attachment.filename}
            </a>
            <div class="attachment-meta">
              {formatBytes(attachment.size)} · {formatRelative(attachment.created_at)}
              {#if attachment.caption}· {attachment.caption}{/if}
            </div>
          </div>

          <div class="attachment-actions">
            <a
              class="icon-btn"
              href="/attachments/{attachment.id}?download=1"
              title="Download"
              aria-label="Download {attachment.filename}"
            >
              <Icon name="download" size={15} />
            </a>
            <form
              method="POST"
              action="{actionPath}?/deleteAttachment"
              onsubmit={(event) => {
                if (!confirm(`Remove “${attachment.filename}”?`)) event.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={attachment.id} />
              <input type="hidden" name="return_to" value={returnTo} />
              <button class="icon-btn danger" type="submit" title="Remove" aria-label="Remove {attachment.filename}">
                <Icon name="trash" size={15} />
              </button>
            </form>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="card-body" class:attachment-empty={attachments.length === 0}>
    {#if attachments.length === 0}
      <p class="hint" style="margin-bottom: 12px;">No files yet. {hint}</p>
    {/if}

    <details class="attachment-add" open={attachments.length === 0}>
      <summary>
        <Icon name="paperclip" size={15} />
        Add a file
      </summary>
      <form
        method="POST"
        action="{actionPath}?/upload"
        enctype="multipart/form-data"
        class="attachment-form"
      >
        <input type="hidden" name="return_to" value={returnTo} />
        <div class="field">
          <label class="label" for="attachment-file-{actionPath}">File</label>
          <input
            class="input"
            id="attachment-file-{actionPath}"
            name="file"
            type="file"
            accept=".pdf,image/*,.txt,.csv,.doc,.docx,.xls,.xlsx,.zip"
            required
          />
          <p class="hint">PDF, image, text, Word/Excel or ZIP. Maximum 25 MB.</p>
        </div>
        <div class="form-grid">
          <div class="field">
            <label class="label" for="attachment-kind-{actionPath}">What is it?</label>
            <select class="select" id="attachment-kind-{actionPath}" name="kind">
              <option value="document">Manual or document</option>
              <option value="photo">Photo</option>
              <option value="receipt">Receipt or warranty</option>
            </select>
          </div>
          <div class="field">
            <label class="label" for="attachment-caption-{actionPath}">
              Caption <span class="optional">optional</span>
            </label>
            <input
              class="input"
              id="attachment-caption-{actionPath}"
              name="caption"
              placeholder="e.g. Installation manual, page 12"
            />
          </div>
        </div>
        <div class="row" style="margin-top: 12px;">
          <button class="btn" type="submit">
            <Icon name="upload" size={15} />
            Upload file
          </button>
        </div>
      </form>
    </details>
  </div>
</section>
