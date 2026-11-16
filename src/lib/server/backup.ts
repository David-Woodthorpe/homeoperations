import { mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { databaseFile, safetyCopyDir } from './config';
import { getDb, nowIso, reopenDatabase, transaction } from './db';
import { defaultSettings, getSettings } from './settings';
import type { AppSettings } from '$lib/types';
import { structureVersion } from '$lib/seed-sections';
import { allPages } from './pages';
import { attachmentsSummary } from './attachments';
import { listServiceRecords } from './appliances';
import { plainText } from '$lib/text';
import { formatShortDate } from '$lib/format';

const MAX_PAGES = 10_000;

const sectionSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(80),
  description: z.string().max(4000).default(''),
  icon: z.string().max(40).default('book'),
  sort_order: z.number().int().min(-100000).max(100000).default(0),
  created_at: z.string().min(1).max(40),
  updated_at: z.string().min(1).max(40)
});

const pageSchema = z.object({
  id: z.string().min(1).max(64),
  section_id: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(300),
  body: z.string().max(2_000_000).default(''),
  sort_order: z.number().int().min(-100000).max(100000).default(0),
  pinned: z.number().int().min(0).max(1).default(0),
  kind: z.enum(['page', 'appliance']).default('page'),
  category: z.string().max(200).default(''),
  make: z.string().max(200).default(''),
  model: z.string().max(200).default(''),
  serial: z.string().max(200).default(''),
  location: z.string().max(300).default(''),
  installed_on: z.string().max(40).default(''),
  warranty_until: z.string().max(40).default(''),
  service_interval_months: z.number().int().min(0).max(240).nullable().default(null),
  service_next_due: z.string().max(40).default(''),
  supplier: z.string().max(300).default(''),
  manual_url: z.string().max(1000).default(''),
  created_at: z.string().min(1).max(40),
  updated_at: z.string().min(1).max(40)
});

const attachmentSchema = z.object({
  id: z.string().min(1).max(64),
  page_id: z.string().min(1).max(64),
  filename: z.string().min(1).max(300),
  mime_type: z.string().min(1).max(200),
  size: z.number().int().min(0).max(25 * 1024 * 1024),
  kind: z.enum(['document', 'photo', 'receipt']).default('document'),
  caption: z.string().max(500).default(''),
  created_at: z.string().min(1).max(40),
  data_base64: z.string().max(40_000_000)
});

const serviceRecordSchema = z.object({
  id: z.string().min(1).max(64),
  page_id: z.string().min(1).max(64),
  performed_on: z.string().min(1).max(40),
  kind: z.string().max(40).default('service'),
  engineer: z.string().max(200).default(''),
  company: z.string().max(300).default(''),
  cost: z.number().min(0).max(1_000_000).nullable().default(null),
  notes: z.string().max(10_000).default(''),
  next_due: z.string().max(40).default(''),
  created_at: z.string().min(1).max(40)
});

const taskSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(300),
  category: z.string().max(100).default(''),
  interval_months: z.number().int().min(0).max(240).nullable().default(null),
  next_due: z.string().max(40).default(''),
  last_done: z.string().max(40).default(''),
  notes: z.string().max(10_000).default(''),
  created_at: z.string().min(1).max(40),
  updated_at: z.string().min(1).max(40)
});

const revisionSchema = z.object({
  id: z.string().min(1).max(64),
  page_id: z.string().min(1).max(64),
  title: z.string().max(300),
  body: z.string().max(2_000_000),
  section_id: z.string().min(1).max(64),
  created_at: z.string().min(1).max(40)
});

const settingsSchema = z
  .object({
    book_title: z.string().max(200).default(defaultSettings.book_title),
    book_subtitle: z.string().max(300).default(defaultSettings.book_subtitle),
    prepared_by: z.string().max(200).default(''),
    cover_note: z.string().max(2000).default(defaultSettings.cover_note),
    last_backup_at: z.string().max(40).default('')
  })
  .partial()
  .default({});

const backupSchema = z.object({
  app: z.string().optional(),
  version: z.number().int().optional(),
  exported_at: z.string().optional(),
  settings: settingsSchema,
  sections: z.array(sectionSchema).max(500),
  pages: z.array(pageSchema).max(MAX_PAGES),
  revisions: z.array(revisionSchema).max(50_000).default([]),
  attachments: z.array(attachmentSchema).max(5_000).default([]),
  service_records: z.array(serviceRecordSchema).max(20_000).default([]),
  maintenance_tasks: z.array(taskSchema).max(5_000).default([])
});

export type BackupPayload = z.infer<typeof backupSchema>;

export function exportPayload() {
  const attachments = getDb()
    .prepare('SELECT * FROM attachments ORDER BY page_id, created_at')
    .all()
    .map((row) => {
      const record = row as Record<string, unknown>;
      return {
        id: String(record.id),
        page_id: String(record.page_id),
        filename: String(record.filename),
        mime_type: String(record.mime_type),
        size: Number(record.size),
        kind: String(record.kind),
        caption: String(record.caption ?? ''),
        created_at: String(record.created_at),
        data_base64: Buffer.from(record.data as Uint8Array).toString('base64')
      };
    });

  return {
    app: 'home-operations',
    version: 2,
    exported_at: nowIso(),
    settings: getSettings(),
    sections: getDb()
      .prepare('SELECT * FROM sections ORDER BY sort_order, name COLLATE NOCASE')
      .all() as unknown[],
    pages: getDb()
      .prepare('SELECT * FROM pages ORDER BY section_id, sort_order, title COLLATE NOCASE')
      .all() as unknown[],
    revisions: getDb()
      .prepare('SELECT * FROM page_revisions ORDER BY page_id, created_at')
      .all() as unknown[],
    attachments,
    service_records: getDb()
      .prepare('SELECT * FROM service_records ORDER BY page_id, performed_on')
      .all() as unknown[],
    maintenance_tasks: getDb()
      .prepare('SELECT * FROM maintenance_tasks ORDER BY title COLLATE NOCASE')
      .all() as unknown[]
  };
}

/**
 * Write a consistent copy of the database before destructive work such as
 * importing a backup. `VACUUM INTO` copies a live database safely, unlike
 * copying the file while WAL mode is writing to it.
 */
export function makeSafetyCopy(label = 'manual'): string {
  mkdirSync(safetyCopyDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(safetyCopyDir, `${label}-${stamp}.db`);
  getDb().exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
  pruneSafetyCopies();
  return target;
}

function pruneSafetyCopies(keep = 8): void {
  try {
    const files = readdirSync(safetyCopyDir)
      .filter((name) => name.endsWith('.db'))
      .map((name) => ({
        name,
        path: path.join(safetyCopyDir, name),
        time: statSync(path.join(safetyCopyDir, name)).mtimeMs
      }))
      .sort((a, b) => b.time - a.time);
    for (const file of files.slice(keep)) unlinkSync(file.path);
  } catch {
    // A missing safety-copy directory is not worth failing over.
  }
}

export function parseBackup(text: string): BackupPayload {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      issue ? `The backup is not valid: ${issue.path.join('.') || 'file'} — ${issue.message}` : 'The backup is not valid.'
    );
  }

  const payload = parsed.data;
  const sectionIds = new Set<string>();
  const slugs = new Set<string>();
  for (const section of payload.sections) {
    if (sectionIds.has(section.id)) throw new Error('The backup contains duplicate section ids.');
    if (slugs.has(section.slug)) throw new Error('The backup contains duplicate section web addresses.');
    sectionIds.add(section.id);
    slugs.add(section.slug);
  }

  const pageIds = new Set<string>();
  for (const page of payload.pages) {
    if (pageIds.has(page.id)) throw new Error('The backup contains duplicate page ids.');
    if (!sectionIds.has(page.section_id)) {
      throw new Error(`Page “${page.title}” belongs to a section that is not in the backup.`);
    }
    pageIds.add(page.id);
  }

  for (const revision of payload.revisions) {
    if (!pageIds.has(revision.page_id)) {
      throw new Error('The backup contains a saved version of a page that is not in the backup.');
    }
  }

  const attachmentIds = new Set<string>();
  for (const attachment of payload.attachments) {
    if (attachmentIds.has(attachment.id)) {
      throw new Error('The backup contains duplicate attachment ids.');
    }
    if (!pageIds.has(attachment.page_id)) {
      throw new Error(`File “${attachment.filename}” belongs to a page that is not in the backup.`);
    }
    attachmentIds.add(attachment.id);
  }

  const serviceIds = new Set<string>();
  for (const record of payload.service_records) {
    if (serviceIds.has(record.id)) throw new Error('The backup contains duplicate service record ids.');
    if (!pageIds.has(record.page_id)) {
      throw new Error('The backup contains a service record for a page that is not in the backup.');
    }
    serviceIds.add(record.id);
  }

  const taskIds = new Set<string>();
  for (const task of payload.maintenance_tasks) {
    if (taskIds.has(task.id)) throw new Error('The backup contains duplicate maintenance task ids.');
    taskIds.add(task.id);
  }

  return payload;
}

export function importPayload(payload: BackupPayload): void {
  makeSafetyCopy('before-import');
  const settings: AppSettings = {
    ...defaultSettings,
    ...payload.settings,
    book_title: payload.settings.book_title?.trim() || defaultSettings.book_title
  };

  transaction(() => {
    getDb().exec(
      `DELETE FROM attachments; DELETE FROM service_records; DELETE FROM maintenance_tasks;
       DELETE FROM page_revisions; DELETE FROM pages; DELETE FROM sections; DELETE FROM settings;`
    );

    const insertSection = getDb().prepare(
      `INSERT INTO sections (id, name, slug, description, icon, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const section of payload.sections) {
      insertSection.run(
        section.id,
        section.name,
        section.slug,
        section.description,
        section.icon,
        section.sort_order,
        section.created_at,
        section.updated_at
      );
    }

    const insertPage = getDb().prepare(
      `INSERT INTO pages (
         id, section_id, title, body, sort_order, pinned, kind, category, make, model, serial,
         location, installed_on, warranty_until, service_interval_months, service_next_due,
         supplier, manual_url, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const page of payload.pages) {
      insertPage.run(
        page.id,
        page.section_id,
        page.title,
        page.body,
        page.sort_order,
        page.pinned,
        page.kind,
        page.category,
        page.make,
        page.model,
        page.serial,
        page.location,
        page.installed_on,
        page.warranty_until,
        page.service_interval_months,
        page.service_next_due,
        page.supplier,
        page.manual_url,
        page.created_at,
        page.updated_at
      );
    }

    const insertRevision = getDb().prepare(
      `INSERT INTO page_revisions (id, page_id, title, body, section_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const revision of payload.revisions) {
      insertRevision.run(
        revision.id,
        revision.page_id,
        revision.title,
        revision.body,
        revision.section_id,
        revision.created_at
      );
    }

    const insertAttachment = getDb().prepare(
      `INSERT INTO attachments
        (id, page_id, filename, mime_type, size, kind, caption, data, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const attachment of payload.attachments) {
      const data = Buffer.from(attachment.data_base64, 'base64');
      insertAttachment.run(
        attachment.id,
        attachment.page_id,
        attachment.filename,
        attachment.mime_type,
        data.byteLength,
        attachment.kind,
        attachment.caption,
        data,
        attachment.created_at
      );
    }

    const insertService = getDb().prepare(
      `INSERT INTO service_records
        (id, page_id, performed_on, kind, engineer, company, cost, notes, next_due, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const record of payload.service_records) {
      insertService.run(
        record.id,
        record.page_id,
        record.performed_on,
        record.kind,
        record.engineer,
        record.company,
        record.cost,
        record.notes,
        record.next_due,
        record.created_at
      );
    }

    const insertTask = getDb().prepare(
      `INSERT INTO maintenance_tasks
        (id, title, category, interval_months, next_due, last_done, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const task of payload.maintenance_tasks) {
      insertTask.run(
        task.id,
        task.title,
        task.category,
        task.interval_months,
        task.next_due,
        task.last_done,
        task.notes,
        task.created_at,
        task.updated_at
      );
    }

    const insertSetting = getDb().prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(settings)) insertSetting.run(key, value);

    // A current backup already has the house sections. Mark it as current so
    // reopening does not run the one-off restructuring. An older personal
    // backup is deliberately left unmarked so its pages move into Unsorted.
    const houseSlugs = new Set(['house-essentials', 'heating-hot-water', 'smart-home-network']);
    if (payload.sections.some((section) => houseSlugs.has(section.slug))) {
      insertSetting.run('structure_version', String(structureVersion));
    }
  });

  reopenDatabase();
}

function safeFilename(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'home-operations'
  );
}

export function backupFilename(prefix = 'home-operations-backup'): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.json`;
}

function markdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function serviceKind(kind: string): string {
  if (kind === 'repair') return 'Repair';
  if (kind === 'inspection') return 'Inspection';
  if (kind === 'install') return 'Installation';
  if (kind === 'other') return 'Other';
  return 'Service';
}

function applianceSpecs(page: {
  make: string;
  model: string;
  serial: string;
  location: string;
  installed_on: string;
  warranty_until: string;
  service_interval_months: number | null;
  service_next_due: string;
  supplier: string;
  manual_url: string;
}): { label: string; value: string }[] {
  return [
    { label: 'Make', value: page.make },
    { label: 'Model', value: page.model },
    { label: 'Serial number', value: page.serial },
    { label: 'Location', value: page.location },
    { label: 'Installed', value: page.installed_on ? formatShortDate(page.installed_on) : '' },
    {
      label: 'Warranty until',
      value: page.warranty_until ? formatShortDate(page.warranty_until) : ''
    },
    {
      label: 'Service interval',
      value: page.service_interval_months ? `${page.service_interval_months} months` : ''
    },
    {
      label: 'Next service',
      value: page.service_next_due ? formatShortDate(page.service_next_due) : ''
    },
    { label: 'Supplier', value: page.supplier },
    { label: 'Manual', value: page.manual_url }
  ].filter((row) => Boolean(row.value));
}

function appendApplianceDetails(
  lines: string[],
  page: { id: string; kind: string; make: string; model: string; serial: string; location: string; installed_on: string; warranty_until: string; service_interval_months: number | null; service_next_due: string; supplier: string; manual_url: string }
): void {
  if (page.kind !== 'appliance') return;

  const specs = applianceSpecs(page);
  if (specs.length > 0) {
    lines.push('| Specification | |', '| --- | --- |');
    for (const row of specs) lines.push(`| ${row.label} | ${markdownCell(row.value)} |`);
    lines.push('');
  }

  const records = listServiceRecords(page.id);
  if (records.length > 0) {
    lines.push('### Service history', '');
    lines.push('| Date | Work | Company | Engineer | Cost | Notes |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const record of records) {
      lines.push(
        `| ${record.performed_on} | ${serviceKind(record.kind)} | ${markdownCell(record.company)} | ${markdownCell(record.engineer)} | ${record.cost !== null ? `£${record.cost.toFixed(2)}` : ''} | ${markdownCell(record.notes)} |`
      );
    }
    lines.push('');
  }
}

/** A plain Markdown copy of the whole book, for grepping or printing elsewhere. */
export function exportMarkdown(): { filename: string; content: string } {
  const settings = getSettings();
  const pages = allPages();
  const lines: string[] = [
    `# ${settings.book_title}`,
    '',
    settings.book_subtitle,
    '',
    settings.prepared_by ? `Prepared by ${settings.prepared_by}.` : '',
    '',
    `Exported ${new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}.`,
    '',
    '---',
    ''
  ];

  let currentSection = '';
  for (const page of pages) {
    if (page.section_name !== currentSection) {
      currentSection = page.section_name;
      lines.push('', `# ${page.section_name}`, '');
      if (page.section_description) lines.push(`_${page.section_description}_`, '');
    }
    lines.push(`## ${page.title}`, '');
    lines.push(`_Last updated ${page.updated_at.slice(0, 10)}_`, '');
    appendApplianceDetails(lines, page);
    lines.push(page.body.trim(), '');
  }

  if (pages.length === 0) {
    lines.push('_No pages yet._', '');
  }

  return {
    filename: `${safeFilename(settings.book_title)}.md`,
    content: lines.filter((line, index, array) => !(line === '' && array[index - 1] === '')).join('\n')
  };
}

export function markdownForPage(page: {
  id: string;
  title: string;
  body: string;
  kind: string;
  section_name: string;
  make: string;
  model: string;
  serial: string;
  location: string;
  installed_on: string;
  warranty_until: string;
  service_interval_months: number | null;
  service_next_due: string;
  supplier: string;
  manual_url: string;
}): string {
  const lines = [`# ${page.title}`, '', `_Section: ${page.section_name}_`, ''];
  appendApplianceDetails(lines, page);
  lines.push(page.body.trim(), '');
  return lines.join('\n');
}

export function databaseSummary(): {
  location: string;
  size_bytes: number;
  page_count: number;
  words: number;
  attachment_count: number;
  attachment_bytes: number;
} {
  let size = 0;
  try {
    size = statSync(databaseFile).size;
    // Data lives in the WAL until a checkpoint, so include it for an honest size.
    size += statSync(`${databaseFile}-wal`).size;
  } catch {
    // A missing WAL file simply means there is nothing to add.
  }
  const pages = allPages();
  const attachments = attachmentsSummary();
  return {
    location: databaseFile,
    size_bytes: size,
    page_count: pages.length,
    words: pages.reduce(
      (total, page) => total + plainText(page.body).split(/\s+/).filter(Boolean).length,
      0
    ),
    attachment_count: attachments.count,
    attachment_bytes: attachments.bytes
  };
}
