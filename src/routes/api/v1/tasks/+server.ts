import { taskCreateSchema } from '$lib/server/api-schemas';
import { taskApi } from '$lib/server/api-serialize';
import {
  dataResponse,
  listResponse,
  queryInt,
  readJson,
  wrapApi
} from '$lib/server/http';
import { createTask, listTasks, resolveTaskNextDue } from '$lib/server/maintenance';
import { dueState } from '$lib/format';

const STATUSES = new Set(['overdue', 'soon', 'later', 'none']);

export const GET = wrapApi(({ url }) => {
  const params = url.searchParams;
  const status = params.get('status') ?? '';
  const limit = queryInt(params.get('limit'), 50, 1, 200);
  const offset = queryInt(params.get('offset'), 0, 0, 10_000_000);

  let rows = listTasks();
  if (STATUSES.has(status)) rows = rows.filter((task) => dueState(task.next_due) === status);

  return listResponse(rows.slice(offset, offset + limit).map(taskApi), {
    total: rows.length,
    limit,
    offset
  });
});

export const POST = wrapApi(async ({ request }) => {
  const input = taskCreateSchema.parse(await readJson(request));
  const task = createTask({
    title: input.title,
    category: input.category ?? '',
    interval_months: input.interval_months ?? null,
    next_due: resolveTaskNextDue(
      input.next_due ?? '',
      input.last_done ?? '',
      input.interval_months ?? null
    ),
    last_done: input.last_done ?? '',
    notes: input.notes ?? ''
  });
  return dataResponse(taskApi(task), 201);
});
