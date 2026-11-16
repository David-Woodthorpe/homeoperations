import { all, get, newId, nowIso, run, transaction } from './db';
import { getPage, updatePage } from './pages';
import { addMonths, dueState, isoDate, daysUntil } from '$lib/format';
import type {
  ApplianceInput,
  ApplianceRow,
  DueStatus,
  PageWithSection,
  ServiceRecord,
  WarrantyItem
} from '$lib/types';

export type ApplianceFilters = {
  q?: string;
  category?: string;
  status?: 'all' | 'overdue' | 'soon' | 'warranty' | 'unscheduled';
  sort?: 'name' | 'due' | 'warranty' | 'updated' | 'category';
};

const APPLIANCE_SELECT = `
  SELECT p.*, s.name AS section_name, s.slug AS section_slug, s.icon AS section_icon,
         s.description AS section_description,
         (SELECT COUNT(*) FROM attachments a WHERE a.page_id = p.id) AS attachment_count,
         (SELECT MAX(r.performed_on) FROM service_records r WHERE r.page_id = p.id) AS last_service
  FROM pages p
  JOIN sections s ON s.id = p.section_id
  WHERE p.kind = 'appliance'
`;

function toRow(row: Record<string, unknown>): ApplianceRow {
  return {
    id: String(row.id),
    section_id: String(row.section_id),
    title: String(row.title),
    body: String(row.body ?? ''),
    sort_order: Number(row.sort_order ?? 0),
    pinned: Number(row.pinned ?? 0),
    kind: 'appliance',
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
    updated_at: String(row.updated_at),
    section_name: String(row.section_name),
    section_slug: String(row.section_slug),
    section_icon: String(row.section_icon),
    section_description: String(row.section_description ?? ''),
    attachment_count: Number(row.attachment_count ?? 0),
    last_service: row.last_service ? String(row.last_service) : null
  };
}

function normaliseNextDue(input: {
  service_interval_months: number | null;
  service_next_due: string;
  installed_on: string;
}): string {
  if (input.service_next_due) return input.service_next_due;
  if (!input.service_interval_months) return '';
  // A blank next-due means "start the clock now", not "when it was installed".
  return addMonths(isoDate(), input.service_interval_months);
}

function structuredValues(input: ApplianceInput) {
  return {
    category: input.category.trim(),
    make: input.make.trim(),
    model: input.model.trim(),
    serial: input.serial.trim(),
    location: input.location.trim(),
    installed_on: input.installed_on.trim(),
    warranty_until: input.warranty_until.trim(),
    service_interval_months: input.service_interval_months,
    service_next_due: normaliseNextDue(input),
    supplier: input.supplier.trim(),
    manual_url: input.manual_url.trim()
  };
}

export function createAppliance(input: ApplianceInput): PageWithSection {
  const title = input.title.trim() || 'Untitled appliance';
  const values = structuredValues(input);
  const id = newId('pg');
  const timestamp = nowIso();
  const next = get<{ value: number }>(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS value FROM pages WHERE section_id = ?',
    input.section_id
  );

  run(
    `INSERT INTO pages (
       id, section_id, title, body, sort_order, pinned, kind, category, make, model, serial,
       location, installed_on, warranty_until, service_interval_months, service_next_due,
       supplier, manual_url, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, 'appliance', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.section_id,
    title,
    input.body,
    Number(next?.value ?? 0),
    input.pinned ? 1 : 0,
    values.category,
    values.make,
    values.model,
    values.serial,
    values.location,
    values.installed_on,
    values.warranty_until,
    values.service_interval_months,
    values.service_next_due,
    values.supplier,
    values.manual_url,
    timestamp,
    timestamp
  );

  const page = getAppliance(id);
  if (!page) throw new Error('The appliance could not be created.');
  return page;
}

export function updateAppliance(id: string, input: ApplianceInput): PageWithSection {
  const existing = getPage(id);
  if (!existing) throw new Error('That appliance no longer exists.');

  updatePage(id, {
    section_id: input.section_id,
    title: input.title.trim() || 'Untitled appliance',
    body: input.body,
    pinned: input.pinned
  });

  const values = structuredValues(input);
  run(
    `UPDATE pages SET category = ?, make = ?, model = ?, serial = ?, location = ?,
       installed_on = ?, warranty_until = ?, service_interval_months = ?, service_next_due = ?,
       supplier = ?, manual_url = ?, updated_at = ?
     WHERE id = ?`,
    values.category,
    values.make,
    values.model,
    values.serial,
    values.location,
    values.installed_on,
    values.warranty_until,
    values.service_interval_months,
    values.service_next_due,
    values.supplier,
    values.manual_url,
    nowIso(),
    id
  );

  const page = getAppliance(id);
  if (!page) throw new Error('That appliance no longer exists.');
  return page;
}

export function getAppliance(id: string): ApplianceRow | null {
  const row = get<Record<string, unknown>>(`${APPLIANCE_SELECT} AND p.id = ?`, id);
  return row ? toRow(row) : null;
}

export function listAppliances(filters: ApplianceFilters = {}): ApplianceRow[] {
  const q = (filters.q ?? '').trim().toLowerCase();
  const category = (filters.category ?? '').trim();
  const status = filters.status ?? 'all';
  let rows = all<Record<string, unknown>>(`${APPLIANCE_SELECT} ORDER BY p.title COLLATE NOCASE`).map(
    toRow
  );

  if (q) {
    rows = rows.filter((row) =>
      [row.title, row.make, row.model, row.serial, row.location, row.category, row.supplier]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }
  if (category) {
    rows = rows.filter((row) => row.category.toLowerCase() === category.toLowerCase());
  }
  if (status !== 'all') {
    rows = rows.filter((row) => {
      if (status === 'overdue') return dueState(row.service_next_due) === 'overdue';
      if (status === 'soon') return dueState(row.service_next_due) === 'soon';
      if (status === 'warranty') {
        return Boolean(row.warranty_until) && daysUntil(row.warranty_until) <= 90;
      }
      if (status === 'unscheduled') return !row.service_next_due;
      return true;
    });
  }

  const sort = filters.sort ?? 'name';
  rows.sort((a, b) => {
    if (sort === 'due') {
      return (
        (a.service_next_due || '9999-12-31').localeCompare(b.service_next_due || '9999-12-31') ||
        a.title.localeCompare(b.title)
      );
    }
    if (sort === 'warranty') {
      return (
        (a.warranty_until || '9999-12-31').localeCompare(b.warranty_until || '9999-12-31') ||
        a.title.localeCompare(b.title)
      );
    }
    if (sort === 'updated') return b.updated_at.localeCompare(a.updated_at);
    if (sort === 'category') {
      return (
        (a.category || 'zzz').localeCompare(b.category || 'zzz') || a.title.localeCompare(b.title)
      );
    }
    return a.title.localeCompare(b.title);
  });

  return rows;
}

export function usedCategories(): string[] {
  return all<{ category: string }>(
    "SELECT DISTINCT category FROM pages WHERE kind = 'appliance' AND category <> '' ORDER BY category COLLATE NOCASE"
  ).map((row) => row.category);
}

export type ApplianceStats = {
  total: number;
  overdue: number;
  dueSoon: number;
  warrantySoon: number;
  unscheduled: number;
};

export function applianceStats(): ApplianceStats {
  const rows = listAppliances();
  return {
    total: rows.length,
    overdue: rows.filter((row) => dueState(row.service_next_due) === 'overdue').length,
    dueSoon: rows.filter((row) => dueState(row.service_next_due) === 'soon').length,
    warrantySoon: rows.filter((row) => {
      if (!row.warranty_until) return false;
      const remaining = daysUntil(row.warranty_until);
      return remaining >= 0 && remaining <= 90;
    }).length,
    unscheduled: rows.filter((row) => !row.service_next_due).length
  };
}

export function warrantiesExpiring(days = 90): WarrantyItem[] {
  return listAppliances()
    .filter((row) => {
      if (!row.warranty_until) return false;
      const remaining = daysUntil(row.warranty_until);
      return remaining >= 0 && remaining <= days;
    })
    .sort((a, b) => a.warranty_until.localeCompare(b.warranty_until))
    .map((row) => ({
      id: row.id,
      title: row.title,
      warranty_until: row.warranty_until,
      section_name: row.section_name
    }));
}

// ── Service history ────────────────────────────────────────────────────────

export type ServiceInput = {
  performed_on: string;
  kind: string;
  engineer: string;
  company: string;
  cost: number | null;
  notes: string;
  next_due: string;
};

export function listServiceRecords(pageId: string): ServiceRecord[] {
  return all<Record<string, unknown>>(
    'SELECT * FROM service_records WHERE page_id = ? ORDER BY performed_on DESC, created_at DESC',
    pageId
  ).map((row) => ({
    id: String(row.id),
    page_id: String(row.page_id),
    performed_on: String(row.performed_on),
    kind: String(row.kind ?? 'service'),
    engineer: String(row.engineer ?? ''),
    company: String(row.company ?? ''),
    cost: row.cost === null || row.cost === undefined ? null : Number(row.cost),
    notes: String(row.notes ?? ''),
    next_due: String(row.next_due ?? ''),
    created_at: String(row.created_at)
  }));
}

export function addServiceRecord(pageId: string, input: ServiceInput): ServiceRecord {
  const appliance = getAppliance(pageId);
  if (!appliance) throw new Error('That appliance no longer exists.');

  const id = newId('srv');
  const performedOn = input.performed_on || isoDate();
  const nextDue =
    input.next_due ||
    (appliance.service_interval_months
      ? addMonths(performedOn, appliance.service_interval_months)
      : '');

  transaction(() => {
    run(
      `INSERT INTO service_records
        (id, page_id, performed_on, kind, engineer, company, cost, notes, next_due, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      pageId,
      performedOn,
      input.kind || 'service',
      input.engineer.trim(),
      input.company.trim(),
      input.cost,
      input.notes.trim(),
      nextDue,
      nowIso()
    );
    if (nextDue) {
      run('UPDATE pages SET service_next_due = ?, updated_at = ? WHERE id = ?', nextDue, nowIso(), pageId);
    } else {
      run('UPDATE pages SET updated_at = ? WHERE id = ?', nowIso(), pageId);
    }
  });

  const record = get<Record<string, unknown>>('SELECT * FROM service_records WHERE id = ?', id);
  if (!record) throw new Error('The service record could not be saved.');
  return {
    id,
    page_id: pageId,
    performed_on: String(record.performed_on),
    kind: String(record.kind),
    engineer: String(record.engineer),
    company: String(record.company),
    cost: record.cost === null ? null : Number(record.cost),
    notes: String(record.notes),
    next_due: String(record.next_due),
    created_at: String(record.created_at)
  };
}

export function deleteServiceRecord(id: string): void {
  const record = get<{ page_id: string }>('SELECT page_id FROM service_records WHERE id = ?', id);
  if (!record) return;

  transaction(() => {
    run('DELETE FROM service_records WHERE id = ?', id);
    const latest = get<{ next_due: string }>(
      `SELECT next_due FROM service_records
       WHERE page_id = ? AND next_due <> ''
       ORDER BY performed_on DESC, created_at DESC LIMIT 1`,
      record.page_id
    );
    if (latest?.next_due) {
      run(
        'UPDATE pages SET service_next_due = ?, updated_at = ? WHERE id = ?',
        latest.next_due,
        nowIso(),
        record.page_id
      );
    }
  });
}

export function serviceStatus(due: string): DueStatus {
  return dueState(due);
}

export function applianceCount(): number {
  const row = get<{ count: number }>(
    "SELECT COUNT(*) AS count FROM pages WHERE kind = 'appliance'"
  );
  return Number(row?.count ?? 0);
}
