import { searchResultApi } from '$lib/server/api-serialize';
import { ApiError } from '$lib/server/errors';
import { dataResponse, queryInt, wrapApi } from '$lib/server/http';
import { searchPages } from '$lib/server/pages';

export const GET = wrapApi(({ url }) => {
  const q = (url.searchParams.get('q') ?? '').trim();
  if (!q) throw new ApiError(400, 'q_required', 'Pass a search term in ?q=');

  const limit = queryInt(url.searchParams.get('limit'), 20, 1, 60);
  const offset = queryInt(url.searchParams.get('offset'), 0, 0, 60);
  const all = searchPages(q);
  const page = all.slice(offset, offset + limit);

  return dataResponse(page.map(searchResultApi), 200);
});
