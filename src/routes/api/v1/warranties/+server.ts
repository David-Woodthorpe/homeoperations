import { warrantyApi } from '$lib/server/api-serialize';
import { dataResponse, queryInt, wrapApi } from '$lib/server/http';
import { warrantyItems } from '$lib/server/maintenance';

export const GET = wrapApi(({ url }) => {
  const days = queryInt(url.searchParams.get('days'), 90, 0, 3650);
  return dataResponse(warrantyItems(days).map(warrantyApi));
});
