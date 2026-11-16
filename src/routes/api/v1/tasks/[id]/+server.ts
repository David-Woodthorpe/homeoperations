import { taskUpdateSchema } from '$lib/server/api-schemas';
import { taskApi } from '$lib/server/api-serialize';
import { ApiError } from '$lib/server/errors';
import { dataResponse, pathId, readJson, wrapApi } from '$lib/server/http';
import { deleteTask, getTask, resolveTaskNextDue, updateTask } from '$lib/server/maintenance';

function requireTask(id: string) {
  const task = getTask(id);
  if (!task) throw new ApiError(404, 'not_found', 'No maintenance task exists with that id.');
  return task;
}

export const GET = wrapApi(({ params }) => dataResponse(taskApi(requireTask(pathId(params)))));

export const PATCH = wrapApi(async ({ request, params }) => {
  const id = pathId(params);
  const current = requireTask(id);
  const input = taskUpdateSchema.parse(await readJson(request));
  const has = (key: string) => Object.hasOwn(input, key);

  const intervalMonths = has('interval_months')
    ? (input.interval_months ?? null)
    : current.interval_months;
  const lastDone = has('last_done') ? (input.last_done ?? '') : current.last_done;
  let nextDue = has('next_due') ? (input.next_due ?? '') : current.next_due;
  if (!has('next_due') && (has('interval_months') || has('last_done'))) {
    nextDue = resolveTaskNextDue('', lastDone, intervalMonths) || current.next_due;
  }

  const task = updateTask(id, {
    title: input.title ?? current.title,
    category: input.category ?? current.category,
    interval_months: intervalMonths,
    next_due: nextDue,
    last_done: lastDone,
    notes: input.notes ?? current.notes
  });

  return dataResponse(taskApi(task));
});

export const DELETE = wrapApi(({ params }) => {
  const id = pathId(params);
  requireTask(id);
  deleteTask(id);
  return dataResponse({ id, deleted: true });
});
