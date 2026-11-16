import { ApiError } from './errors';
import { getSection, getSectionBySlug, listSections } from './sections';
import type { Section } from '$lib/types';

export function resolvePageSection(input: {
  section_id?: string | null;
  section_slug?: string | null;
}): Section {
  if (input.section_id) {
    const section = getSection(input.section_id);
    if (!section) {
      throw new ApiError(400, 'unknown_section', 'No section exists with that section_id.');
    }
    return section;
  }
  if (input.section_slug) {
    const section = getSectionBySlug(input.section_slug);
    if (!section) {
      throw new ApiError(400, 'unknown_section', 'No section exists with that section_slug.');
    }
    return section;
  }

  const sections = listSections();
  if (sections.length === 0) {
    throw new ApiError(
      409,
      'no_sections',
      'The manual has no sections. Create one with POST /api/v1/sections first.'
    );
  }
  return getSectionBySlug('unsorted') ?? getSectionBySlug('other') ?? sections[0];
}
