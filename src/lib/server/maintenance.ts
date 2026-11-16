import { all, get, newId, nowIso, run } from './db';
import { applianceCount, listAppliances, warrantiesExpiring } from './appliances';
import { addMonths, daysUntil, dueState, formatMonth, isoDate } from '$lib/format';
import type { DueStatus, MaintenanceTask, ScheduleItem, WarrantyItem } from '$lib/types';

export type TaskInput = {
  title: string;
  category: string;
  interval_months: number | null;
  next_due: string;
  last_done: string;
  notes: string;
};

function toTask(row: Record<string, unknown>): MaintenanceTask {
  return {
    id: String(row.id),
    title: String(row.title),
    category: String(row.category ?? ''),
    interval_months:
      row.interval_months === null || row.interval_months === undefined
        ? null
        : Number(row.interval_months),
    next_due: String(row.next_due ?? ''),
    last_done: String(row.last_done ?? ''),
    notes: String(row.notes ?? ''),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

export function listTasks(): MaintenanceTask[] {
  return all<Record<string, unknown>>(
    `SELECT * FROM maintenance_tasks
     ORDER BY CASE WHEN next_due = '' THEN 1 ELSE 0 END, next_due, title COLLATE NOCASE`
  ).map(toTask);
}

export function getTask(id: string): MaintenanceTask | null {
  const row = get<Record<string, unknown>>('SELECT * FROM maintenance_tasks WHERE id = ?', id);
  return row ? toTask(row) : null;
}

export function createTask(input: TaskInput): MaintenanceTask {
  const title = input.title.trim();
  if (!title) throw new Error('Give the task a name.');
  const id = newId('task');
  const timestamp = nowIso();
  const nextDue = resolveTaskNextDue(input.next_due, input.last_done, input.interval_months);
  run(
    `INSERT INTO maintenance_tasks
      (id, title, category, interval_months, next_due, last_done, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    title,
    input.category.trim(),
    input.interval_months,
    nextDue,
    input.last_done,
    input.notes.trim(),
    timestamp,
    timestamp
  );
  const task = getTask(id);
  if (!task) throw new Error('The task could not be created.');
  return task;
}

export function updateTask(id: string, input: TaskInput): MaintenanceTask {
  if (!input.title.trim()) throw new Error('Give the task a name.');
  run(
    `UPDATE maintenance_tasks SET title = ?, category = ?, interval_months = ?, next_due = ?,
       last_done = ?, notes = ?, updated_at = ? WHERE id = ?`,
    input.title.trim(),
    input.category.trim(),
    input.interval_months,
    input.next_due,
    input.last_done,
    input.notes.trim(),
    nowIso(),
    id
  );
  const task = getTask(id);
  if (!task) throw new Error('That task no longer exists.');
  return task;
}

export function deleteTask(id: string): void {
  run('DELETE FROM maintenance_tasks WHERE id = ?', id);
}

export function completeTask(id: string): MaintenanceTask {
  const task = getTask(id);
  if (!task) throw new Error('That task no longer exists.');
  const today = isoDate();
  const next = task.interval_months ? addMonths(today, task.interval_months) : '';
  run(
    'UPDATE maintenance_tasks SET last_done = ?, next_due = ?, updated_at = ? WHERE id = ?',
    today,
    next,
    nowIso(),
    id
  );
  return getTask(id)!;
}

/** A blank next-due is calculated from the last-done date and interval. */
export function resolveTaskNextDue(
  nextDue: string,
  lastDone: string,
  intervalMonths: number | null
): string {
  if (nextDue) return nextDue;
  if (!intervalMonths) return '';
  return addMonths(lastDone || isoDate(), intervalMonths);
}

export function scheduleItems(): ScheduleItem[] {
  const applianceItems: ScheduleItem[] = listAppliances().map((row) => ({
    type: 'appliance',
    id: row.id,
    title: row.title,
    subtitle: [row.category, row.location].filter(Boolean).join(' · ') || row.section_name,
    due: row.service_next_due,
    interval_months: row.service_interval_months,
    last_done: row.last_service ?? '',
    status: dueState(row.service_next_due) as DueStatus,
    href: `/appliances/${row.id}`
  }));

  const taskItems: ScheduleItem[] = listTasks().map((task) => ({
    type: 'task',
    id: task.id,
    title: task.title,
    subtitle: task.category || 'House task',
    due: task.next_due,
    interval_months: task.interval_months,
    last_done: task.last_done,
    status: dueState(task.next_due) as DueStatus,
    href: `/maintenance#task-${task.id}`
  }));

  return [...applianceItems, ...taskItems].sort(
    (a, b) =>
      (a.due || '9999-12-31').localeCompare(b.due || '9999-12-31') ||
      a.title.localeCompare(b.title)
  );
}

export type MonthGroup = {
  key: string;
  label: string;
  items: ScheduleItem[];
};

/** Group due items into months for the next year, for the printable calendar. */
export function monthGroups(items: ScheduleItem[], months = 12): MonthGroup[] {
  const groups = new Map<string, ScheduleItem[]>();
  for (const item of items) {
    if (!item.due) continue;
    const days = daysUntil(item.due);
    if (days > months * 31) continue;
    const key = item.due.slice(0, 7);
    const bucket = groups.get(key) ?? [];
    bucket.push(item);
    groups.set(key, bucket);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupItems]) => ({
      key,
      label: formatMonth(`${key}-01`),
      items: groupItems
    }));
}

export function maintenanceSummary(): {
  overdue: number;
  dueSoon: number;
  warrantySoon: number;
  tasks: number;
  appliances: number;
} {
  const items = scheduleItems();
  return {
    overdue: items.filter((item) => item.status === 'overdue').length,
    dueSoon: items.filter((item) => item.status === 'soon').length,
    warrantySoon: warrantiesExpiring(90).length,
    tasks: listTasks().length,
    appliances: applianceCount()
  };
}

export function warrantyItems(days = 90): WarrantyItem[] {
  return warrantiesExpiring(days);
}
