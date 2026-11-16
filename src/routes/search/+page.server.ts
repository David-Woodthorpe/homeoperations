import { searchPages } from '$lib/server/pages';

export function load({ url }: { url: URL }) {
  const query = (url.searchParams.get('q') ?? '').trim();
  return {
    query,
    results: query ? searchPages(query) : []
  };
}
