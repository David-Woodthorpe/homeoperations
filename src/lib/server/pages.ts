import { all, get, getDb, newId, nowIso, run, transaction } from './db';
import { snippet, searchSnippet, plainText } from '$lib/text';
import type { Page, PageListItem, PageTitleIndexEntry, PageWithSection, Revision } from '$lib/types';

const PAGE_WITH_SECTION = `
  SELECT p.*, s.name AS section_name, s.slug AS section_slug, s.icon AS section_icon,
         s.description AS section_description
  FROM pages p
  JOIN sections s ON s.id = p.section_id
`;

const REVISION_LIMIT = 30;

function toPage(row: Record<string, unknown>): Page {
  return {
    id: String(row.id),
    section_id: String(row.section_id),
    title: String(row.title),
    body: String(row.body ?? ''),
    sort_order: Number(row.sort_order ?? 0),
    pinned: Number(row.pinned ?? 0),
    kind: row.kind === 'appliance' ? 'appliance' : 'page',
    category: String(row.category ?? ''),
    make: String(row.make ?? ''),
    model: String(row.model ?? ''),
    serial: String(row.serial ?? ''),
    location: String(row.location ?? ''),
    installed_on: String(row.installed_on ?? ''),
    warranty_until: String(row.warranty_until ?? ''),
    service_interval_months:
      row.service_interval_months === null || row.service_interval_months === undefined
        ? null
        : Number(row.service_interval_months),
    service_next_due: String(row.service_next_due ?? ''),
    supplier: String(row.supplier ?? ''),
    manual_url: String(row.manual_url ?? ''),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

function toPageWithSection(row: Record<string, unknown>): PageWithSection {
  return {
    ...toPage(row),
    section_name: String(row.section_name),
    section_slug: String(row.section_slug),
    section_icon: String(row.section_icon),
    section_description: String(row.section_description ?? '')
  };
}

export function listPages(sectionId: string): PageListItem[] {
  return all<Record<string, unknown>>(
    `SELECT id, title, body, pinned, kind, updated_at, sort_order
     FROM pages WHERE section_id = ?
     ORDER BY pinned DESC, sort_order, title COLLATE NOCASE`,
    sectionId
  ).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    body: String(row.body ?? ''),
    pinned: Number(row.pinned ?? 0),
    kind: row.kind === 'appliance' ? 'appliance' : 'page',
    updated_at: String(row.updated_at),
    sort_order: Number(row.sort_order ?? 0),
    snippet: snippet(String(row.body ?? ''))
  }));
}

export function getPage(id: string): PageWithSection | null {
  const row = get<Record<string, unknown>>(`${PAGE_WITH_SECTION} WHERE p.id = ?`, id);
  return row ? toPageWithSection(row) : null;
}

export function createPage(input: { section_id: string; title: string; body?: string; pinned?: boolean }): PageWithSection {
  const title = input.title.trim() || 'Untitled page';
  const id = newId('pg');
  const timestamp = nowIso();
  const next = get<{ value: number }>(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS value FROM pages WHERE section_id = ?',
    input.section_id
  );
  run(
    `INSERT INTO pages (id, section_id, title, body, sort_order, pinned, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.section_id,
    title,
    input.body ?? '',
    Number(next?.value ?? 0),
    input.pinned ? 1 : 0,
    timestamp,
    timestamp
  );
  const page = getPage(id);
  if (!page) throw new Error('The page could not be created.');
  return page;
}

export function updatePage(
  id: string,
  input: { section_id: string; title: string; body: string; pinned?: boolean }
): PageWithSection {
  const existing = getPage(id);
  if (!existing) throw new Error('That page no longer exists.');

  const title = input.title.trim() || 'Untitled page';
  const sectionChanged = existing.section_id !== input.section_id;
  const contentChanged =
    existing.title !== title || existing.body !== input.body || sectionChanged;

  transaction(() => {
    if (contentChanged) {
      run(
        `INSERT INTO page_revisions (id, page_id, title, body, section_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        newId('rev'),
        id,
        existing.title,
        existing.body,
        existing.section_id,
        nowIso()
      );
      pruneRevisions(id);
    }

    let sortOrder = existing.sort_order;
    if (sectionChanged) {
      const next = get<{ value: number }>(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 AS value FROM pages WHERE section_id = ?',
        input.section_id
      );
      sortOrder = Number(next?.value ?? 0);
    }

    run(
      `UPDATE pages SET section_id = ?, title = ?, body = ?, sort_order = ?, pinned = ?, updated_at = ?
       WHERE id = ?`,
      input.section_id,
      title,
      input.body,
      sortOrder,
      input.pinned ? 1 : 0,
      nowIso(),
      id
    );
  });

  const page = getPage(id);
  if (!page) throw new Error('That page no longer exists.');
  return page;
}

function pruneRevisions(pageId: string): void {
  run(
    `DELETE FROM page_revisions
     WHERE page_id = ? AND id NOT IN (
       SELECT id FROM page_revisions WHERE page_id = ? ORDER BY created_at DESC LIMIT ?
     )`,
    pageId,
    pageId,
    REVISION_LIMIT
  );
}

export function deletePage(id: string): void {
  run('DELETE FROM pages WHERE id = ?', id);
}

export function movePage(id: string, direction: -1 | 1): void {
  transaction(() => {
    const page = getPage(id);
    if (!page) return;
    const ids = all<{ id: string }>(
      'SELECT id FROM pages WHERE section_id = ? ORDER BY sort_order, title COLLATE NOCASE',
      page.section_id
    ).map((row) => row.id);
    const index = ids.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    const update = getDb().prepare('UPDATE pages SET sort_order = ? WHERE id = ?');
    ids.forEach((pageId, order) => update.run(order, pageId));
  });
}

export function recentPages(limit = 8): PageWithSection[] {
  return all<Record<string, unknown>>(
    `${PAGE_WITH_SECTION} ORDER BY p.updated_at DESC LIMIT ?`,
    limit
  ).map(toPageWithSection);
}

export function allPages(): PageWithSection[] {
  return all<Record<string, unknown>>(
    `${PAGE_WITH_SECTION} ORDER BY s.sort_order, s.name COLLATE NOCASE, p.pinned DESC, p.sort_order, p.title COLLATE NOCASE`
  ).map(toPageWithSection);
}

export function getPagesByIds(ids: string[]): PageWithSection[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const rows = all<Record<string, unknown>>(
    `${PAGE_WITH_SECTION} WHERE p.id IN (${placeholders})
     ORDER BY s.sort_order, s.name COLLATE NOCASE, p.pinned DESC, p.sort_order, p.title COLLATE NOCASE`,
    ...ids
  ).map(toPageWithSection);
  return rows;
}

export function pageTitleIndex(): PageTitleIndexEntry[] {
  return all<{ id: string; title: string; slug: string }>(
    `SELECT p.id, p.title, s.slug FROM pages p JOIN sections s ON s.id = p.section_id
     ORDER BY p.title COLLATE NOCASE`
  ).map((row) => ({ id: row.id, title: row.title, slug: row.slug }));
}

export function neighbours(page: PageWithSection): { previous: Page | null; next: Page | null } {
  const siblings = all<Record<string, unknown>>(
    `SELECT * FROM pages WHERE section_id = ?
     ORDER BY pinned DESC, sort_order, title COLLATE NOCASE`,
    page.section_id
  ).map(toPage);
  const index = siblings.findIndex((row) => row.id === page.id);
  return {
    previous: index > 0 ? siblings[index - 1] : null,
    next: index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null
  };
}

/** Pages whose text mentions this page as a `[[wiki link]]`. */
export function backlinks(title: string, excludeId: string): PageWithSection[] {
  const escaped = title.replace(/[\\%_]/g, (character) => `\\${character}`);
  return all<Record<string, unknown>>(
    `${PAGE_WITH_SECTION}
     WHERE p.id <> ? AND p.body LIKE ? ESCAPE '\\'
     ORDER BY s.sort_order, p.title COLLATE NOCASE`,
    excludeId,
    `%[[${escaped}]]%`
  ).map(toPageWithSection);
}

export function listRevisions(pageId: string): Revision[] {
  return all<Record<string, unknown>>(
    `SELECT * FROM page_revisions WHERE page_id = ? ORDER BY created_at DESC`,
    pageId
  ).map((row) => ({
    id: String(row.id),
    page_id: String(row.page_id),
    title: String(row.title),
    body: String(row.body ?? ''),
    section_id: String(row.section_id),
    created_at: String(row.created_at)
  }));
}

export function restoreRevision(pageId: string, revisionId: string): PageWithSection {
  const revision = get<Record<string, unknown>>(
    'SELECT * FROM page_revisions WHERE id = ? AND page_id = ?',
    revisionId,
    pageId
  );
  if (!revision) throw new Error('That saved version no longer exists.');

  const section = get<{ id: string }>('SELECT id FROM sections WHERE id = ?', String(revision.section_id));
  const current = getPage(pageId);
  if (!current) throw new Error('That page no longer exists.');

  return updatePage(pageId, {
    section_id: section ? String(revision.section_id) : current.section_id,
    title: String(revision.title),
    body: String(revision.body ?? ''),
    pinned: current.pinned === 1
  });
}

export type SearchResult = {
  id: string;
  title: string;
  section_name: string;
  section_slug: string;
  section_icon: string;
  updated_at: string;
  kind: 'page' | 'appliance';
  meta: string;
  snippet: string;
};

export function searchPages(query: string): SearchResult[] {
  const cleaned = query.trim();
  if (!cleaned) return [];
  const escaped = cleaned.replace(/[\\%_]/g, (character) => `\\${character}`);
  const like = `%${escaped}%`;
  const rows = all<Record<string, unknown>>(
    `SELECT p.id, p.title, p.body, p.updated_at, p.kind, p.make, p.model, p.serial, p.location,
            p.category, s.name AS section_name, s.slug AS section_slug, s.icon AS section_icon
     FROM pages p JOIN sections s ON s.id = p.section_id
     WHERE p.title LIKE ? ESCAPE '\\'
        OR p.body LIKE ? ESCAPE '\\'
        OR p.make LIKE ? ESCAPE '\\'
        OR p.model LIKE ? ESCAPE '\\'
        OR p.serial LIKE ? ESCAPE '\\'
        OR p.location LIKE ? ESCAPE '\\'
        OR p.category LIKE ? ESCAPE '\\'
     ORDER BY CASE WHEN p.title LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END,
              p.updated_at DESC
     LIMIT 60`,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like
  );

  return rows.map((row) => {
    const body = String(row.body ?? '');
    const details = [row.make, row.model, row.location].map(String).filter(Boolean).join(' · ');
    return {
      id: String(row.id),
      title: String(row.title),
      section_name: String(row.section_name),
      section_slug: String(row.section_slug),
      section_icon: String(row.section_icon),
      updated_at: String(row.updated_at),
      kind: row.kind === 'appliance' ? 'appliance' : 'page',
      meta: row.kind === 'appliance' ? details || String(row.category ?? '') : '',
      snippet: body.trim() ? searchSnippet(body, cleaned) : details || String(row.category ?? '')
    };
  });
}

export function pageStats(): {
  pages: number;
  sections: number;
  appliances: number;
  words: number;
  last_updated: string | null;
} {
  const pages = get<{ count: number }>('SELECT COUNT(*) AS count FROM pages');
  const appliances = get<{ count: number }>(
    "SELECT COUNT(*) AS count FROM pages WHERE kind = 'appliance'"
  );
  const sections = get<{ count: number }>('SELECT COUNT(*) AS count FROM sections');
  const bodies = all<{ body: string }>('SELECT body FROM pages');
  const words = bodies.reduce(
    (total, row) => total + plainText(row.body).split(/\s+/).filter(Boolean).length,
    0
  );
  const last = get<{ value: string | null }>('SELECT MAX(updated_at) AS value FROM pages');
  return {
    pages: Number(pages?.count ?? 0),
    sections: Number(sections?.count ?? 0),
    appliances: Number(appliances?.count ?? 0),
    words,
    last_updated: last?.value ? String(last.value) : null
  };
}
