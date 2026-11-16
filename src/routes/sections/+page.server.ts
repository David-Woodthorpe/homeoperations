import { fail, redirect } from '@sveltejs/kit';
import { isSectionIcon } from '$lib/icons';
import { createSection, deleteSection, listSections, moveSection, updateSection } from '$lib/server/sections';

export function load({ url }: { url: URL }) {
  return {
    sections: listSections(),
    editId: url.searchParams.get('edit') ?? ''
  };
}

function readSectionForm(form: FormData) {
  const name = String(form.get('name') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const icon = String(form.get('icon') ?? 'book');
  return {
    name,
    description,
    icon: isSectionIcon(icon) ? icon : 'book'
  };
}

export const actions = {
  create: async ({ request }: { request: Request }) => {
    const form = await request.formData();
    const values = readSectionForm(form);
    if (!values.name) {
      return fail(400, { error: 'Give the section a name.', values });
    }
    const section = createSection(values);
    redirect(303, `/sections/${section.slug}`);
  },

  update: async ({ request }: { request: Request }) => {
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    const values = readSectionForm(form);
    if (!id) return fail(400, { error: 'That section could not be found.' });
    if (!values.name) return fail(400, { error: 'Give the section a name.', values });

    updateSection(id, values);
    redirect(303, '/sections');
  },

  delete: async ({ request }: { request: Request }) => {
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    try {
      deleteSection(id);
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'The section could not be deleted.'
      });
    }
    redirect(303, '/sections');
  },

  move: async ({ request }: { request: Request }) => {
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    const direction = String(form.get('direction') ?? '') === 'up' ? -1 : 1;
    if (id) moveSection(id, direction);
  }
};
