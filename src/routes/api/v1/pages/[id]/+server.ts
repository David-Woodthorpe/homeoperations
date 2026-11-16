import { pageUpdateSchema } from '$lib/server/api-schemas';
import { pageApi } from '$lib/server/api-serialize';
import { resolvePageSection } from '$lib/server/api-pages';
import { listAttachments } from '$lib/server/attachments';
import { ApiError } from '$lib/server/errors';
import { dataResponse, pathId, readJson, wrapApi } from '$lib/server/http';
import { deletePage, getPage, updatePage } from '$lib/server/pages';

function requirePage(id: string) {
  const page = getPage(id);
  if (!page) throw new ApiError(404, 'not_found', 'No page exists with that id.');
  return page;
}

export const GET = wrapApi(({ params }) => {
  const page = requirePage(pathId(params));
  return dataResponse(pageApi(page, listAttachments(page.id)));
});

export const PATCH = wrapApi(async ({ request, params }) => {
  const id = pathId(params);
  const page = requirePage(id);
  if (page.kind === 'appliance') {
    throw new ApiError(
      409,
      'use_appliance_endpoint',
      'This page belongs to an appliance. Update it with PATCH /api/v1/appliances/{id}.'
    );
  }

  const input = pageUpdateSchema.parse(await readJson(request));
  const section =
    input.section_id || input.section_slug
      ? resolvePageSection({
          section_id: input.section_id,
          section_slug: input.section_slug
        })
      : null;

  updatePage(id, {
    section_id: section?.id ?? page.section_id,
    title: input.title ?? page.title,
    body: input.body ?? page.body,
    pinned: input.pinned ?? page.pinned === 1
  });

  const updated = requirePage(id);
  return dataResponse(pageApi(updated, listAttachments(updated.id)));
});

export const DELETE = wrapApi(({ params }) => {
  const id = pathId(params);
  const page = requirePage(id);
  if (page.kind === 'appliance') {
    throw new ApiError(
      409,
      'use_appliance_endpoint',
      'This page belongs to an appliance. Delete it with DELETE /api/v1/appliances/{id}.'
    );
  }
  deletePage(id);
  return dataResponse({ id, deleted: true });
});
