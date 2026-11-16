import { existsSync, mkdirSync, renameSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import path from 'node:path';
import {
  dataDir,
  databaseFile,
  safetyCopyDir,
  seedStarterSections
} from './config';
import { seedSections as starterSections, structureVersion } from '$lib/seed-sections';

mkdirSync(dataDir, { recursive: true });
mkdirSync(safetyCopyDir, { recursive: true });

// The app was originally called Hearthbook. Move an existing database to the
// new file name so a rename does not lose the manual.
const legacyDatabaseFile = path.join(dataDir, 'hearthbook.db');
if (!existsSync(databaseFile) && existsSync(legacyDatabaseFile)) {
  renameSync(legacyDatabaseFile, databaseFile);
  for (const suffix of ['-wal', '-shm']) {
    const legacy = `${legacyDatabaseFile}${suffix}`;
    if (existsSync(legacy)) renameSync(legacy, `${databaseFile}${suffix}`);
  }
}

const migrations: string[] = [
  // v1 — initial schema
  `
  CREATE TABLE sections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT 'book',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE pages (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX idx_pages_section ON pages(section_id, sort_order, created_at);
  CREATE INDEX idx_pages_title ON pages(title COLLATE NOCASE);
  CREATE INDEX idx_pages_updated ON pages(updated_at);

  CREATE TABLE page_revisions (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    section_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_revisions_page ON page_revisions(page_id, created_at DESC);

  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
  // v2 — house O&M manual: appliance fields, attachments, service history and
  // standalone maintenance tasks.
  `
  ALTER TABLE pages ADD COLUMN kind TEXT NOT NULL DEFAULT 'page';
  ALTER TABLE pages ADD COLUMN category TEXT NOT NULL DEFAULT '';
  ALTER TABLE pages ADD COLUMN make TEXT NOT NULL DEFAULT '';
  ALTER TABLE pages ADD COLUMN model TEXT NOT NULL DEFAULT '';
  ALTER TABLE pages ADD COLUMN serial TEXT NOT NULL DEFAULT '';
  ALTER TABLE pages ADD COLUMN location TEXT NOT NULL DEFAULT '';
  ALTER TABLE pages ADD COLUMN installed_on TEXT NOT NULL DEFAULT '';
  ALTER TABLE pages ADD COLUMN warranty_until TEXT NOT NULL DEFAULT '';
  ALTER TABLE pages ADD COLUMN service_interval_months INTEGER;
  ALTER TABLE pages ADD COLUMN service_next_due TEXT NOT NULL DEFAULT '';
  ALTER TABLE pages ADD COLUMN supplier TEXT NOT NULL DEFAULT '';
  ALTER TABLE pages ADD COLUMN manual_url TEXT NOT NULL DEFAULT '';
  CREATE INDEX idx_pages_kind ON pages(kind);
  CREATE INDEX idx_pages_service_due ON pages(service_next_due);
  CREATE INDEX idx_pages_warranty ON pages(warranty_until);

  CREATE TABLE attachments (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    kind TEXT NOT NULL DEFAULT 'document',
    caption TEXT NOT NULL DEFAULT '',
    data BLOB NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_attachments_page ON attachments(page_id, created_at);

  CREATE TABLE service_records (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    performed_on TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'service',
    engineer TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    cost REAL,
    notes TEXT NOT NULL DEFAULT '',
    next_due TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_service_page ON service_records(page_id, performed_on DESC);

  CREATE TABLE maintenance_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    interval_months INTEGER,
    next_due TEXT NOT NULL DEFAULT '',
    last_done TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX idx_tasks_due ON maintenance_tasks(next_due);
  `
];

export const latestSchemaVersion = migrations.length;

let connection: DatabaseSync | null = null;

function configure(db: DatabaseSync): void {
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = NORMAL');
}

function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
  const row = db.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations').get() as
    | { version: number }
    | undefined;
  const current = Number(row?.version ?? 0);

  for (let i = current; i < migrations.length; i++) {
    db.exec('BEGIN');
    try {
      db.exec(migrations[i]);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(
        i + 1,
        nowIso()
      );
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}

/** Short, readable ids so URLs stay easy to say out loud and type. */
export function newId(prefix: string): string {
  const value = BigInt(`0x${randomBytes(8).toString('hex')}`)
    .toString(36)
    .padStart(10, '0')
    .slice(0, 10);
  return `${prefix}_${value}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function uniqueSectionSlug(db: DatabaseSync, name: string, ignoreId?: string): string {
  const base = slugify(name) || 'section';
  let candidate = base;
  let suffix = 2;
  while (true) {
    const existing = db
      .prepare('SELECT id FROM sections WHERE slug = ? AND id <> ?')
      .get(candidate, ignoreId ?? '') as { id: string } | undefined;
    if (!existing) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

function readSetting(db: DatabaseSync, key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row ? String(row.value) : null;
}

function writeSetting(db: DatabaseSync, key: string, value: string): void {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

function insertStarterSection(db: DatabaseSync, index: number, section: { name: string; description: string; icon: string }): void {
  db.prepare(
    `INSERT INTO sections (id, name, slug, description, icon, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newId('sec'),
    section.name,
    uniqueSectionSlug(db, section.name),
    section.description,
    section.icon,
    index,
    nowIso(),
    nowIso()
  );
}

function seed(db: DatabaseSync): void {
  if (!seedStarterSections) return;
  const row = db.prepare('SELECT COUNT(*) AS count FROM sections').get() as { count: number };
  if (Number(row.count) > 0) return;

  starterSections.forEach((section, index) => insertStarterSection(db, index, section));
  writeSetting(db, 'structure_version', String(structureVersion));
}

/**
 * The first version of the app shipped with personal-handbook sections. This
 * one-off migration replaces that structure with the house O&M sections,
 * moving any pages into "Unsorted" rather than deleting them. It runs once,
 * gated by a settings flag, and keeps a database copy before moving pages.
 */
function migrateStructure(db: DatabaseSync): void {
  if (readSetting(db, 'structure_version') === String(structureVersion)) return;

  // A backup or database that already has the house sections is current, even
  // if the flag was lost (older backups did not carry it). Do not restructure
  // it and move every page into Unsorted.
  const houseSection = db
    .prepare(
      "SELECT 1 AS present FROM sections WHERE slug IN ('house-essentials', 'heating-hot-water', 'smart-home-network') LIMIT 1"
    )
    .get() as { present: number } | undefined;
  if (houseSection) {
    writeSetting(db, 'structure_version', String(structureVersion));
    return;
  }

  if (!seedStarterSections) {
    writeSetting(db, 'structure_version', String(structureVersion));
    return;
  }

  const pageRow = db.prepare('SELECT COUNT(*) AS count FROM pages').get() as { count: number };
  const pageCount = Number(pageRow.count);
  const sectionRow = db.prepare('SELECT COUNT(*) AS count FROM sections').get() as { count: number };
  const sectionCount = Number(sectionRow.count);

  if (sectionCount === 0) {
    starterSections.forEach((section, index) => insertStarterSection(db, index, section));
    writeSetting(db, 'structure_version', String(structureVersion));
    return;
  }

  if (pageCount > 0) {
    // Keep a copy outside the app's control before moving anything.
    try {
      mkdirSync(safetyCopyDir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const target = path.join(safetyCopyDir, `before-om-manual-${stamp}.db`);
      db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
    } catch (error) {
      console.error('[db] could not keep a safety copy before restructuring', error);
    }
  }

  db.exec('BEGIN');
  try {
    const unsorted = db
      .prepare("SELECT id FROM sections WHERE slug = 'unsorted'")
      .get() as { id: string } | undefined;

    let unsortedId = unsorted?.id;
    if (!unsortedId) {
      unsortedId = newId('sec');
      const timestamp = nowIso();
      db.prepare(
        `INSERT INTO sections (id, name, slug, description, icon, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        unsortedId,
        'Unsorted',
        uniqueSectionSlug(db, 'Unsorted'),
        'Anything moved from an older version of the book, or not yet filed in the right section.',
        'folder',
        999,
        timestamp,
        timestamp
      );
    }

    if (pageCount > 0) {
      db.prepare('UPDATE pages SET section_id = ?').run(unsortedId);
    }

    db.prepare('DELETE FROM sections WHERE id <> ?').run(unsortedId);

    const structure = starterSections.filter((section) => section.name !== 'Unsorted');
    structure.forEach((section, index) => insertStarterSection(db, index, section));
    db.prepare('UPDATE sections SET sort_order = ? WHERE id = ?').run(structure.length, unsortedId);

    const title = readSetting(db, 'book_title');
    if (title === 'Our Family Handbook' || title === 'Restored Handbook') {
      writeSetting(db, 'book_title', 'Our House O&M Manual');
    }
    const subtitle = readSetting(db, 'book_subtitle');
    if (subtitle === 'What you need to know, all in one place') {
      writeSetting(db, 'book_subtitle', 'How everything works, and how to look after it');
    }

    writeSetting(db, 'structure_version', String(structureVersion));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function openDatabase(): DatabaseSync {
  const db = new DatabaseSync(databaseFile);
  configure(db);
  migrate(db);
  seed(db);
  migrateStructure(db);
  return db;
}

export function getDb(): DatabaseSync {
  connection ??= openDatabase();
  return connection;
}

export function closeDatabase(): void {
  connection?.close();
  connection = null;
}

/** Close and reopen the connection, used after restoring a backup file. */
export function reopenDatabase(): void {
  closeDatabase();
  getDb();
}

export function all<T>(sql: string, ...params: SQLInputValue[]): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

export function get<T>(sql: string, ...params: SQLInputValue[]): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, ...params: SQLInputValue[]) {
  return getDb().prepare(sql).run(...params);
}

export function transaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
