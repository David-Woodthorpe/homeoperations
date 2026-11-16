import { all, get, newId, nowIso, run, transaction, uniqueSectionSlug, getDb } from './db';
import type { Section, SectionWithCount } from '$lib/types';

function toSection(row: Record<string, unknown>): Section {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ''),
    icon: String(row.icon ?? 'book'),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

export function listSections(): SectionWithCount[] {
  return all<Record<string, unknown>>(`
    SELECT s.*,
           COUNT(p.id) AS page_count,
           COALESCE(SUM(CASE WHEN p.kind = 'appliance' THEN 1 ELSE 0 END), 0) AS appliance_count,
           MAX(p.updated_at) AS last_updated
    FROM sections s
    LEFT JOIN pages p ON p.section_id = s.id
    GROUP BY s.id
    ORDER BY s.sort_order, s.name COLLATE NOCASE
  `).map((row) => ({
    ...toSection(row),
    page_count: Number(row.page_count ?? 0),
    appliance_count: Number(row.appliance_count ?? 0),
    last_updated: row.last_updated ? String(row.last_updated) : null
  }));
}

export function getSection(id: string): Section | null {
  const row = get<Record<string, unknown>>('SELECT * FROM sections WHERE id = ?', id);
  return row ? toSection(row) : null;
}

export function getSectionBySlug(slug: string): Section | null {
  const row = get<Record<string, unknown>>('SELECT * FROM sections WHERE slug = ?', slug);
  return row ? toSection(row) : null;
}

export function createSection(input: { name: string; description?: string; icon?: string }): Section {
  const name = input.name.trim();
  if (!name) throw new Error('Give the section a name.');

  const id = newId('sec');
  const timestamp = nowIso();
  const max = get<{ value: number }>('SELECT COALESCE(MAX(sort_order), -1) + 1 AS value FROM sections');
  run(
    `INSERT INTO sections (id, name, slug, description, icon, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    name,
    uniqueSectionSlug(getDb(), name),
    (input.description ?? '').trim(),
    input.icon ?? 'book',
    Number(max?.value ?? 0),
    timestamp,
    timestamp
  );
  return getSection(id)!;
}

export function updateSection(
  id: string,
  input: { name: string; description?: string; icon?: string }
): Section {
  const name = input.name.trim();
  if (!name) throw new Error('Give the section a name.');
  run(
    `UPDATE sections SET name = ?, description = ?, icon = ?, updated_at = ? WHERE id = ?`,
    name,
    (input.description ?? '').trim(),
    input.icon ?? 'book',
    nowIso(),
    id
  );
  const section = getSection(id);
  if (!section) throw new Error('That section no longer exists.');
  return section;
}

export function deleteSection(id: string): void {
  const count = get<{ count: number }>('SELECT COUNT(*) AS count FROM pages WHERE section_id = ?', id);
  if (Number(count?.count ?? 0) > 0) {
    throw new Error('This section still has pages. Move or delete them first.');
  }
  run('DELETE FROM sections WHERE id = ?', id);
}

/** Move a section one place up (-1) or down (+1) and normalise all order values. */
export function moveSection(id: string, direction: -1 | 1): void {
  transaction(() => {
    const ids = all<{ id: string }>('SELECT id FROM sections ORDER BY sort_order, name COLLATE NOCASE').map(
      (row) => row.id
    );
    const index = ids.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    const update = getDb().prepare('UPDATE sections SET sort_order = ? WHERE id = ?');
    ids.forEach((sectionId, order) => update.run(order, sectionId));
  });
}
