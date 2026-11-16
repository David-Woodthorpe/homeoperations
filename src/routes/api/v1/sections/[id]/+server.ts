import { sectionUpdateSchema } from '$lib/server/api-schemas';
import { sectionApi } from '$lib/server/api-serialize';
import { ApiError } from '$lib/server/errors';
import { dataResponse, pathId, readJson, wrapApi } from '$lib/server/http';
import {
  deleteSection,
  getSection,
  listSections,
  updateSection
} from '$lib/server/sections';

function requireSection(id: string) {
  const section = listSections().find((item) => item.id === id);
  if (!section) throw new ApiError(404, 'not_found', 'No section exists with that id.');
  return section;
}

export const GET = wrapApi(({ params }) => {
  return dataResponse(sectionApi(requireSection(pathId(params))));
});

export const PATCH = wrapApi(async ({ request, params }) => {
  const id = pathId(params);
  const current = requireSection(id);
  const input = sectionUpdateSchema.parse(await readJson(request));

  const section = updateSection(id, {
    name: input.name ?? current.name,
    description: input.description ?? current.description,
    icon: input.icon || current.icon
  });

  const refreshed = listSections().find((item) => item.id === section.id)!;
  return dataResponse(sectionApi(refreshed));
});

export const DELETE = wrapApi(({ params }) => {
  const id = pathId(params);
  const current = requireSection(id);
  try {
    deleteSection(id);
  } catch (error) {
    throw new ApiError(
      409,
      'section_not_empty',
      error instanceof Error ? error.message : 'The section could not be deleted.'
    );
  }
  return dataResponse({ id: current.id, deleted: true });
});
