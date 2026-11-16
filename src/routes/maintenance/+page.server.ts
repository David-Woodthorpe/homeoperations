import { fail, redirect } from '@sveltejs/kit';
import { listAppliances } from '$lib/server/appliances';
import {
  completeTask,
  createTask,
  deleteTask,
  listTasks,
  maintenanceSummary,
  monthGroups,
  resolveTaskNextDue,
  scheduleItems,
  updateTask,
  warrantyItems
} from '$lib/server/maintenance';

function text(form: FormData, name: string): string {
  return String(form.get(name) ?? '').trim();
}

function date(form: FormData, name: string): string {
  const value = text(form, name);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
}

function interval(form: FormData): number | null {
  const raw = text(form, 'interval_months');
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

function readTaskForm(form: FormData) {
  const months = interval(form);
  const lastDone = date(form, 'last_done');
  const nextDue = date(form, 'next_due');

  return {
    title: text(form, 'title'),
    category: text(form, 'category'),
    interval_months: months,
    next_due: resolveTaskNextDue(nextDue, lastDone, months),
    last_done: lastDone,
    notes: text(form, 'notes')
  };
}

export function load() {
  const items = scheduleItems();
  return {
    items,
    tasks: listTasks(),
    appliances: listAppliances(),
    summary: maintenanceSummary(),
    months: monthGroups(items),
    warranties: warrantyItems(90)
  };
}

export const actions = {
  addTask: async ({ request }: { request: Request }) => {
    const form = await request.formData();
    const values = readTaskForm(form);
    if (!values.title) return fail(400, { error: 'Give the task a name.', values });
    try {
      createTask(values);
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'The task could not be saved.',
        values
      });
    }
    redirect(303, '/maintenance#tasks');
  },

  updateTask: async ({ request }: { request: Request }) => {
    const form = await request.formData();
    const id = text(form, 'id');
    const values = readTaskForm(form);
    if (!id) return fail(400, { error: 'That task could not be found.' });
    if (!values.title) return fail(400, { error: 'Give the task a name.', values });
    try {
      updateTask(id, values);
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'The task could not be saved.',
        values
      });
    }
    redirect(303, '/maintenance#tasks');
  },

  deleteTask: async ({ request }: { request: Request }) => {
    const form = await request.formData();
    const id = text(form, 'id');
    if (id) deleteTask(id);
    redirect(303, '/maintenance#tasks');
  },

  completeTask: async ({ request }: { request: Request }) => {
    const form = await request.formData();
    const id = text(form, 'id');
    if (id) completeTask(id);
    redirect(303, '/maintenance#tasks');
  }
};
