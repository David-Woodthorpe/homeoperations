import { sectionCreateSchema } from '$lib/server/api-schemas';
import { sectionApi } from '$lib/server/api-serialize';
import { dataResponse, readJson, wrapApi } from '$lib/server/http';
import { createSection, listSections } from '$lib/server/sections';

export const GET = wrapApi(() => dataResponse(listSections().map(sectionApi)));

export const POST = wrapApi(async ({ request }) => {
  const input = sectionCreateSchema.parse(await readJson(request));
  const section = createSection({
    name: input.name,
    description: input.description,
    icon: input.icon || 'book'
  });
  return dataResponse(
    sectionApi({
      ...section,
      page_count: 0,
      appliance_count: 0,
      last_updated: null
    }),
    201
  );
});
