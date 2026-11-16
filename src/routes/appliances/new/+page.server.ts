import { fail, redirect } from '@sveltejs/kit';
import { categoryOptions, readApplianceForm } from '$lib/server/appliance-form';
import { createAppliance, usedCategories } from '$lib/server/appliances';
import { pageTitleIndex } from '$lib/server/pages';
import { getSectionBySlug, listSections } from '$lib/server/sections';
import type { ApplianceInput } from '$lib/types';

export function load({ url }: { url: URL }) {
  const sections = listSections();
  const wanted = url.searchParams.get('section');
  const selected = wanted ? getSectionBySlug(wanted) : null;
  const category = url.searchParams.get('category') ?? '';

  const defaultSection =
    selected ??
    sections.find((section) => section.name === 'House Essentials') ??
    sections[0] ??
    null;

  return {
    sections: sections.map((section) => ({ id: section.id, name: section.name })),
    categories: categoryOptions(usedCategories()),
    pageIndex: pageTitleIndex(),
    defaultSectionId: defaultSection?.id ?? '',
    defaultCategory: category,
    hasSections: sections.length > 0
  };
}

export const actions = {
  default: async ({ request }: { request: Request }) => {
    const form = await request.formData();
    const values = readApplianceForm(form);

    if (!values.title) {
      return fail(400, { error: 'Give the appliance a name.', values });
    }
    if (!values.section_id) {
      return fail(400, { error: 'Choose a section for its notes page.', values });
    }

    let id: string;
    try {
      id = createAppliance(values).id;
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'The appliance could not be saved.',
        values
      });
    }
    redirect(303, `/appliances/${id}`);
  }
};
