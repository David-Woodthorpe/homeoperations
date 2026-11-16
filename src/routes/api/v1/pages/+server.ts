import { pageCreateSchema } from '$lib/server/api-schemas';
import { pageApi, pageSummaryApi } from '$lib/server/api-serialize';
import { resolvePageSection } from '$lib/server/api-pages';
import { listAttachments } from '$lib/server/attachments';
import {
  dataResponse,
  listResponse,
  queryInt,
  readJson,
  wrapApi
} from '$lib/server/http';
import { allPages, createPage, getPage } from '$lib/server/pages';

export const GET = wrapApi(({ url }) => {
  const params = url.searchParams;
  const q = (params.get('q') ?? '').trim().toLowerCase();
  const sectionId = params.get('section_id') ?? '';
  const sectionSlug = params.get('section_slug') ?? '';
  const kind = params.get('kind') ?? '';
  const limit = queryInt(params.get('limit'), 50, 1, 200);
  const offset = queryInt(params.get('offset'), 0, 0, 10_000_000);

  let rows = allPages();
  if (sectionId) rows = rows.filter((row) => row.section_id === sectionId);
  if (sectionSlug) rows = rows.filter((row) => row.section_slug === sectionSlug);
  if (kind === 'page' || kind === 'appliance') rows = rows.filter((row) => row.kind === kind);
  if (q) {
    rows = rows.filter((row) =>
      [row.title, row.body, row.make, row.model, row.serial, row.location]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }

  const total = rows.length;
  return listResponse(rows.slice(offset, offset + limit).map(pageSummaryApi), {
    total,
    limit,
    offset
  });
});

export const POST = wrapApi(async ({ request }) => {
  const input = pageCreateSchema.parse(await readJson(request));
  const section = resolvePageSection({
    section_id: input.section_id,
    section_slug: input.section_slug
  });
  const page = createPage({
    section_id: section.id,
    title: input.title,
    body: input.body ?? '',
    pinned: input.pinned ?? false
  });
  const row = getPage(page.id)!;
  return dataResponse(pageApi(row, listAttachments(row.id)), 201);
});
