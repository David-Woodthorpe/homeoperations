<script lang="ts">
  import '../app.css';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import Icon from '$lib/components/Icon.svelte';
  import { formatRelative } from '$lib/format';
  import { withBase } from '$lib/paths';
  import type { LayoutData } from './$types';

  let { children, data }: { children: Snippet; data: LayoutData } = $props();

  let menuOpen = $state(false);
  let theme = $state<'light' | 'dark'>('light');
  let mounted = $state(false);

  const h = (path: string) => withBase(data.ingressPath, path);

  const path = $derived.by(() => {
    const pathname = page.url.pathname;
    if (data.ingressPath && pathname.startsWith(data.ingressPath)) {
      return pathname.slice(data.ingressPath.length) || '/';
    }
    return pathname;
  });

  const bare = $derived(path.startsWith('/print/doc'));

  const isActive = (prefix: string) =>
    prefix === '/' ? path === '/' : path === prefix || path.startsWith(`${prefix}/`);

  const backupOverdue = $derived.by(() => {
    if (!data.lastBackupAt) return true;
    const days = (Date.now() - new Date(data.lastBackupAt).getTime()) / 86_400_000;
    return days > 30;
  });

  // Home Assistant ingress puts the app under a changing path prefix. SvelteKit
  // cannot know that prefix at build time, so use full-page navigation while
  // ingress is active instead of the client-side router.
  beforeNavigate(({ to, cancel }) => {
    if (!data.ingressPath || !to) return;
    cancel();
    const target = to.url;
    const prefix = data.ingressPath;
    if (
      target.origin === window.location.origin &&
      target.pathname !== prefix &&
      !target.pathname.startsWith(`${prefix}/`)
    ) {
      window.location.assign(`${prefix}${target.pathname}${target.search}${target.hash}`);
    } else {
      window.location.assign(target.href);
    }
  });

  onMount(() => {
    const base = data.ingressPath;
    if (!base) return;

    const prefixed = (value: string) => {
      if (!value.startsWith('/') || value.startsWith('//')) return value;
      return withBase(base, value);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as
        | HTMLAnchorElement
        | null;
      if (!anchor) return;
      const raw = anchor.getAttribute('href');
      if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return;

      const href = prefixed(raw);
      if (href !== raw) anchor.setAttribute('href', href);

      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      event.preventDefault();
      window.location.assign(href);
    };

    const onSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form) return;
      const raw = form.getAttribute('action');
      if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return;
      const href = prefixed(raw);
      if (href !== raw) form.setAttribute('action', href);
    };

    const prefixImages = () => {
      for (const image of document.querySelectorAll<HTMLImageElement>('img[src^="/"]')) {
        const raw = image.getAttribute('src');
        if (!raw || raw.startsWith('//')) continue;
        const href = prefixed(raw);
        if (href !== raw) image.setAttribute('src', href);
      }
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);
    prefixImages();
    const observer = new MutationObserver(prefixImages);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('submit', onSubmit, true);
      observer.disconnect();
    };
  });

  $effect(() => {
    if (mounted) {
      document.documentElement.dataset.theme = theme;
      try {
        localStorage.setItem('theme', theme);
      } catch {
        // Private browsing can refuse storage; the toggle still works for this visit.
      }
    }
  });

  $effect(() => {
    path;
    menuOpen = false;
  });

  $effect(() => {
    theme = (document.documentElement.dataset.theme as 'light' | 'dark') ?? 'light';
    mounted = true;
  });
</script>

<svelte:head>
  <meta name="description" content="A house operations and maintenance manual: appliances, systems, service history and manuals." />
</svelte:head>

{#if bare}
  {@render children()}
{:else}
  <a class="skip-link" href="#main-content">Skip to content</a>

  <aside class="sidebar" class:open={menuOpen} class:ready={mounted} aria-label="Main navigation">
    <a class="brand" href={h('/')}>
      <span class="brand-mark">
        <Icon name="bookOpen" size={21} strokeWidth={1.7} />
      </span>
      <span>
        <span class="brand-name">Home Operations</span>
        <span class="brand-sub">{data.bookTitle}</span>
      </span>
    </a>

    <nav class="nav" aria-label="Overview">
      <a class="nav-link" class:active={isActive('/')} href={h('/')}>
        <Icon name="grid" size={17} />
        <span class="nav-label">Overview</span>
      </a>
      <a class="nav-link" class:active={isActive('/appliances')} href={h('/appliances')}>
        <Icon name="wrench" size={17} />
        <span class="nav-label">Appliances</span>
        {#if data.maintenance.appliances > 0}
          <span class="nav-count">{data.maintenance.appliances}</span>
        {/if}
      </a>
      <a class="nav-link" class:active={isActive('/maintenance')} href={h('/maintenance')}>
        <Icon name="calendar" size={17} />
        <span class="nav-label">Maintenance</span>
        {#if data.maintenance.overdue + data.maintenance.dueSoon > 0}
          <span class="nav-count nav-count-due">{data.maintenance.overdue + data.maintenance.dueSoon}</span>
        {/if}
      </a>
      <a class="nav-link" class:active={isActive('/search')} href={h('/search')}>
        <Icon name="search" size={17} />
        <span class="nav-label">Search</span>
      </a>
    </nav>

    <div class="nav-group">Sections</div>
    <nav class="nav" aria-label="Sections">
      {#each data.sections as section (section.id)}
        <a class="nav-link" class:active={isActive(`/sections/${section.slug}`)} href={h(`/sections/${section.slug}`)}>
          <Icon name={section.icon} size={17} />
          <span class="nav-label">{section.name}</span>
          {#if section.page_count > 0}
            <span class="nav-count">{section.page_count}</span>
          {/if}
        </a>
      {/each}
    </nav>

    <div class="nav-group">Book</div>
    <nav class="nav" aria-label="Book tools">
      <a class="nav-link" class:active={isActive('/print') && !path.startsWith('/print/doc')} href={h('/print')}>
        <Icon name="printer" size={17} />
        <span class="nav-label">Print &amp; export</span>
      </a>
      <a class="nav-link" class:active={isActive('/backup')} href={h('/backup')}>
        <Icon name="archive" size={17} />
        <span class="nav-label">Backup</span>
      </a>
      <a class="nav-link" class:active={isActive('/settings')} href={h('/settings')}>
        <Icon name="gear" size={17} />
        <span class="nav-label">Settings</span>
      </a>
      <a class="nav-link" class:active={isActive('/help')} href={h('/help')}>
        <Icon name="info" size={17} />
        <span class="nav-label">How to use</span>
      </a>
    </nav>

    <div class="nav-group">Developers</div>
    <nav class="nav" aria-label="Developer navigation">
      <a class="nav-link" class:active={isActive('/api')} href={h('/api')}>
        <Icon name="code" size={17} />
        <span class="nav-label">API &amp; AI</span>
      </a>
    </nav>

    <div class="sidebar-foot">
      {#if backupOverdue}
        <a class="backup-nudge" href={h('/backup')}>
          <strong>{data.lastBackupAt ? 'Time for a fresh copy' : 'Keep a copy somewhere safe'}</strong>
          {data.lastBackupAt
            ? `Last backup ${formatRelative(data.lastBackupAt)}.`
            : 'Download a backup so this book is never only on one computer.'}
        </a>
      {/if}
      <div class="sidebar-tools">
        <button class="theme-toggle" type="button" onclick={() => (theme = theme === 'dark' ? 'light' : 'dark')}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <span class="sidebar-version">v{data.appVersion}</span>
      </div>
    </div>
  </aside>

  {#if menuOpen}
    <button class="sidebar-scrim" aria-label="Close navigation" onclick={() => (menuOpen = false)}></button>
  {/if}

  <div class="main">
    <header class="topbar">
      <button class="icon-btn menu-btn" type="button" aria-label="Open navigation" onclick={() => (menuOpen = true)}>
        <Icon name="menu" size={20} />
      </button>

      <form class="topbar-search" action={h('/search')} method="GET" role="search">
        <Icon name="search" size={17} />
        <input
          class="input"
          type="search"
          name="q"
          placeholder="Search appliances, manuals, notes…"
          aria-label="Search the whole book"
          value={path === '/search' ? (page.url.searchParams.get('q') ?? '') : ''}
        />
      </form>

      <div class="topbar-spacer"></div>

      <a class="btn btn-add" href={h('/pages/new')} aria-label="New page">
        <Icon name="file" size={16} />
        <span class="hide-sm">New page</span>
      </a>

      <a class="btn btn-primary btn-add" href={h('/appliances/new')}>
        <Icon name="plus" size={16} />
        <span>Add appliance</span>
      </a>
    </header>

    <main class="page" id="main-content">
      {@render children()}
    </main>
  </div>
{/if}
