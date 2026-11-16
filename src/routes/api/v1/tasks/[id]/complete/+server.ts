import { taskApi } from '$lib/server/api-serialize';
import { ApiError } from '$lib/server/errors';
import { dataResponse, pathId, wrapApi } from '$lib/server/http';
import { completeTask, getTask } from '$lib/server/maintenance';

export const POST = wrapApi(({ params }) => {
  const id = pathId(params);
  if (!getTask(id)) {
    throw new ApiError(404, 'not_found', 'No maintenance task exists with that id.');
  }
  return dataResponse(taskApi(completeTask(id)));
});
