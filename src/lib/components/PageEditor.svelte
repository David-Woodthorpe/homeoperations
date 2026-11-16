<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { tick } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { renderMarkdown } from '$lib/markdown';
  import { plainText } from '$lib/text';
  import type { PageTitleIndexEntry } from '$lib/types';

  let {
    initialTitle = '',
    initialBody = '',
    initialSectionId = '',
    initialPinned = false,
    sections,
    pageIndex,
    showMeta = true,
    bodyLabel = 'Page content',
    bodyHint = 'plain text, with a little optional formatting'
  }: {
    initialTitle?: string;
    initialBody?: string;
    initialSectionId?: string;
    initialPinned?: boolean;
    sections: { id: string; name: string }[];
    pageIndex: PageTitleIndexEntry[];
    showMeta?: boolean;
    bodyLabel?: string;
    bodyHint?: string;
  } = $props();

  // These deliberately capture the first value only: the editor owns its draft
  // after that, so an unsaved edit is not overwritten by a parent re-render.
  // svelte-ignore state_referenced_locally
  let title = $state(initialTitle);
  // svelte-ignore state_referenced_locally
  let body = $state(initialBody);
  // svelte-ignore state_referenced_locally
  let sectionId = $state(initialSectionId || sections[0]?.id || '');
  // svelte-ignore state_referenced_locally
  let pinned = $state(initialPinned);
  let textarea = $state<HTMLTextAreaElement | null>(null);
  let shell = $state<HTMLDivElement | null>(null);
  let submitting = $state(false);

  const preview = $derived(renderMarkdown(body, { pages: pageIndex }));
  const words = $derived(plainText(body).split(/\s+/).filter(Boolean).length);
  const dirty = $derived(
    body !== initialBody ||
      (showMeta &&
        (title !== initialTitle || sectionId !== initialSectionId || pinned !== initialPinned))
  );

  beforeNavigate(({ cancel }) => {
    if (dirty && !submitting && !confirm('You have not saved this page. Leave without saving?')) {
      cancel();
    }
  });

  // Saving is itself a navigation. Mark the page as submitting as soon as any
  // form is posted so the "unsaved changes" prompt does not appear on save.
  $effect(() => {
    const forms = shell?.closest('form')?.parentElement?.querySelectorAll('form') ?? [];
    const markSubmitting = () => {
      submitting = true;
    };
    forms.forEach((form) => form.addEventListener('submit', markSubmitting));
    return () => forms.forEach((form) => form.removeEventListener('submit', markSubmitting));
  });

  type Edit = 'start' | 'end';

  function replaceSelection(before: string, after = before, placeholder = 'text', select: Edit = 'start') {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.slice(start, end) || placeholder;
    body = `${body.slice(0, start)}${before}${selected}${after}${body.slice(end)}`;
    void tick().then(() => {
      textarea?.focus();
      if (select === 'start') {
        textarea?.setSelectionRange(start + before.length, start + before.length + selected.length);
      } else {
        textarea?.setSelectionRange(body.length, body.length);
      }
    });
  }

  function prefixLines(prefix: string) {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const from = body.lastIndexOf('\n', start - 1) + 1;
    const to = end > start ? end : body.indexOf('\n', start) === -1 ? body.length : body.indexOf('\n', start);
    const block = body.slice(from, to) || 'List item';
    const updated = block
      .split('\n')
      .map((line) => `${prefix}${line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '')}`)
      .join('\n');
    body = `${body.slice(0, from)}${updated}${body.slice(to)}`;
    void tick().then(() => {
      textarea?.focus();
      textarea?.setSelectionRange(from, from + updated.length);
    });
  }

  function insertBlock(block: string) {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const needsLeading = start > 0 && body[start - 1] !== '\n' ? '\n\n' : '';
    const needsTrailing = end < body.length && body[end] !== '\n' ? '\n\n' : '';
    const content = `${needsLeading}${block}${needsTrailing}`;
    body = `${body.slice(0, start)}${content}${body.slice(end)}`;
    void tick().then(() => {
      textarea?.focus();
      const cursor = start + content.length - (needsTrailing ? 2 : 0);
      textarea?.setSelectionRange(cursor, cursor);
    });
  }

  function onKeydown(event: KeyboardEvent) {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key.toLowerCase() === 'b') {
      event.preventDefault();
      replaceSelection('**', '**', 'bold text');
    } else if (event.key.toLowerCase() === 'i') {
      event.preventDefault();
      replaceSelection('_', '_', 'italic text');
    } else if (event.key.toLowerCase() === 'k') {
      event.preventDefault();
      replaceSelection('[', '](https://)', 'link text', 'start');
    }
  }

  const tableTemplate = '| Item | Details |\n| --- | --- |\n|  |  |\n|  |  |';
</script>

{#if showMeta}
  <div class="field full" style="margin-bottom: 18px;">
    <label class="label" for="page-title">Page title</label>
    <input
      class="input title-input"
      id="page-title"
      name="title"
      bind:value={title}
      placeholder="e.g. Where the paperwork is kept"
      autocomplete="off"
      required
    />
  </div>

  <div class="form-grid" style="margin-bottom: 20px;">
    <div class="field">
      <label class="label" for="page-section">Section</label>
      <select class="select" id="page-section" name="section_id" bind:value={sectionId} required>
        {#each sections as section (section.id)}
          <option value={section.id}>{section.name}</option>
        {/each}
      </select>
    </div>
    <div class="field" style="justify-content: flex-end;">
      <label class="check" style="height: 41px;">
        <input type="checkbox" name="pinned" value="1" bind:checked={pinned} />
        <span>
          Pin to the top of the section
          <small>Useful for the first thing someone should read.</small>
        </span>
      </label>
    </div>
  </div>
{/if}

<div class="field full">
  <label class="label" for="page-body">
    {bodyLabel} <span class="optional">{bodyHint}</span>
  </label>

  <div class="editor-shell" bind:this={shell}>
    <div class="editor-pane">
      <div class="editor-toolbar" role="toolbar" aria-label="Formatting">
        <button class="icon-btn" type="button" title="Bold (Ctrl+B)" aria-label="Bold"
          onmousedown={(event) => event.preventDefault()} onclick={() => replaceSelection('**', '**', 'bold text')}>
          <Icon name="bold" size={15} />
        </button>
        <button class="icon-btn" type="button" title="Italic (Ctrl+I)" aria-label="Italic"
          onmousedown={(event) => event.preventDefault()} onclick={() => replaceSelection('_', '_', 'italic text')}>
          <Icon name="italic" size={15} />
        </button>
        <span class="sep"></span>
        <button class="icon-btn" type="button" title="Heading" aria-label="Heading"
          onmousedown={(event) => event.preventDefault()} onclick={() => prefixLines('## ')}>
          <Icon name="heading" size={15} />
        </button>
        <button class="icon-btn" type="button" title="Bulleted list" aria-label="Bulleted list"
          onmousedown={(event) => event.preventDefault()} onclick={() => prefixLines('- ')}>
          <Icon name="list" size={15} />
        </button>
        <button class="icon-btn" type="button" title="Numbered list" aria-label="Numbered list"
          onmousedown={(event) => event.preventDefault()} onclick={() => prefixLines('1. ')}>
          <Icon name="listChecks" size={15} />
        </button>
        <span class="sep"></span>
        <button class="icon-btn" type="button" title="Link" aria-label="Link"
          onmousedown={(event) => event.preventDefault()} onclick={() => replaceSelection('[', '](https://)', 'link text')}>
          <Icon name="link" size={15} />
        </button>
        <button class="icon-btn" type="button" title="Link to another page" aria-label="Link to another page"
          onmousedown={(event) => event.preventDefault()} onclick={() => replaceSelection('[[', ']]', 'Page title')}>
          <Icon name="book" size={15} />
        </button>
        <button class="icon-btn" type="button" title="Quote" aria-label="Quote"
          onmousedown={(event) => event.preventDefault()} onclick={() => prefixLines('> ')}>
          <Icon name="quote" size={15} />
        </button>
        <span class="sep"></span>
        <button class="icon-btn" type="button" title="Table" aria-label="Insert table"
          onmousedown={(event) => event.preventDefault()} onclick={() => insertBlock(tableTemplate)}>
          <Icon name="table" size={15} />
        </button>
        <button class="icon-btn" type="button" title="Tick-box list" aria-label="Tick-box list"
          onmousedown={(event) => event.preventDefault()} onclick={() => prefixLines('- [ ] ')}>
          <Icon name="checkSquare" size={15} />
        </button>
      </div>

      <textarea
        class="textarea editor-textarea"
        id="page-body"
        name="body"
        bind:this={textarea}
        bind:value={body}
        onkeydown={onKeydown}
        placeholder="Write as you would explain it to someone standing in the kitchen.

Start with the most important thing. Names, phone numbers and where to find documents are worth more than perfect sentences.

Use [[Page title]] to link to another page in the book."
        spellcheck="true"
      ></textarea>

      <div class="editor-foot">
        <span>{words} word{words === 1 ? '' : 's'}</span>
        <span>·</span>
        <span>{body.trim() ? 'Preview updates as you type' : 'Nothing written yet'}</span>
        {#if dirty}
          <span class="badge badge-accent">Unsaved changes</span>
        {/if}
      </div>
    </div>

    <div class="editor-pane">
      <div class="editor-preview-head">
        <span>Preview</span>
        <span class="faint" style="font-weight: 500; text-transform: none; letter-spacing: 0;">
          as it will read on screen and on paper
        </span>
      </div>
      <div class="editor-preview">
        {#if body.trim()}
          <div class="prose">
            {@html preview}
          </div>
        {:else}
          <p class="editor-preview-empty">Your page will appear here as you type.</p>
        {/if}
      </div>
    </div>
  </div>
  <p class="hint">
    Tip: press <kbd>Ctrl</kbd> + <kbd>B</kbd> for bold, <kbd>Ctrl</kbd> + <kbd>I</kbd> for italic,
    and <kbd>Ctrl</kbd> + <kbd>K</kbd> for a link. You can write in plain sentences and ignore
    all of this if you prefer. <a class="link" href="/help" target="_blank" rel="noopener">Formatting help</a>
  </p>
</div>
