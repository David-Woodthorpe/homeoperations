import { error, fail, redirect } from '@sveltejs/kit';
import { deletePage, getPage, pageTitleIndex, updatePage } from '$lib/server/pages';
import { getSection, listSections } from '$lib/server/sections';

export function load({ params }: { params: { id: string } }) {
  const page = getPage(params.id);
  if (!page) error(404, 'That page could not be found.');
  if (page.kind === 'appliance') redirect(303, `/appliances/${page.id}/edit`);

  return {
    page,
    sections: listSections().map((section) => ({ id: section.id, name: section.name })),
    pageIndex: pageTitleIndex()
  };
}

function readPageForm(form: FormData) {
  return {
    title: String(form.get('title') ?? '').trim(),
    body: String(form.get('body') ?? ''),
    section_id: String(form.get('section_id') ?? ''),
    pinned: form.get('pinned') === '1'
  };
}

export const actions = {
  save: async ({ request, params }: { request: Request; params: { id: string } }) => {
    const existing = getPage(params.id);
    if (!existing) error(404, 'That page could not be found.');

    const form = await request.formData();
    const values = readPageForm(form);

    if (!values.title) {
      return fail(400, { error: 'Give the page a title.', values });
    }
    if (!values.section_id || !getSection(values.section_id)) {
      return fail(400, { error: 'Choose a valid section.', values });
    }

    try {
      updatePage(params.id, values);
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'The page could not be saved.',
        values
      });
    }
    redirect(303, `/pages/${params.id}`);
  },

  delete: async ({ params }: { params: { id: string } }) => {
    const page = getPage(params.id);
    if (!page) error(404, 'That page could not be found.');
    deletePage(params.id);
    redirect(303, `/sections/${page.section_slug}`);
  }
};
