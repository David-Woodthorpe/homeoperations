import { error, fail, redirect } from '@sveltejs/kit';
import {
  applianceToValues,
  categoryOptions,
  readApplianceForm
} from '$lib/server/appliance-form';
import {
  getAppliance,
  updateAppliance,
  usedCategories
} from '$lib/server/appliances';
import { deletePage, pageTitleIndex } from '$lib/server/pages';
import { listSections } from '$lib/server/sections';

export function load({ params }: { params: { id: string } }) {
  const appliance = getAppliance(params.id);
  if (!appliance) error(404, 'That appliance could not be found.');

  return {
    appliance,
    values: applianceToValues(appliance),
    sections: listSections().map((section) => ({ id: section.id, name: section.name })),
    categories: categoryOptions(usedCategories()),
    pageIndex: pageTitleIndex()
  };
}

export const actions = {
  save: async ({ request, params }: { request: Request; params: { id: string } }) => {
    const appliance = getAppliance(params.id);
    if (!appliance) error(404, 'That appliance could not be found.');

    const form = await request.formData();
    const values = readApplianceForm(form);

    if (!values.title) {
      return fail(400, { error: 'Give the appliance a name.', values });
    }
    if (!values.section_id) {
      return fail(400, { error: 'Choose a section for its notes page.', values });
    }

    try {
      updateAppliance(params.id, values);
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'The appliance could not be saved.',
        values
      });
    }
    redirect(303, `/appliances/${params.id}`);
  },

  delete: async ({ params }: { params: { id: string } }) => {
    const appliance = getAppliance(params.id);
    if (!appliance) error(404, 'That appliance could not be found.');
    deletePage(params.id);
    redirect(303, '/appliances');
  }
};
