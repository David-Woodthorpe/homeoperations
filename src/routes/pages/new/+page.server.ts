import { fail, redirect } from '@sveltejs/kit';
import { pageTitleIndex } from '$lib/server/pages';
import { createPage } from '$lib/server/pages';
import { getSection, getSectionBySlug, listSections } from '$lib/server/sections';

export function load({ url }: { url: URL }) {
  const sections = listSections();
  const wanted = url.searchParams.get('section');
  const selected = wanted ? getSectionBySlug(wanted) : null;
  return {
    sections: sections.map((section) => ({ id: section.id, name: section.name })),
    defaultSectionId: selected?.id ?? sections[0]?.id ?? '',
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
  default: async ({ request }: { request: Request }) => {
    const form = await request.formData();
    const values = readPageForm(form);

    if (!values.section_id) {
      return fail(400, { error: 'Choose a section for this page.', values });
    }
    if (!getSection(values.section_id)) {
      return fail(400, { error: 'That section no longer exists. Choose another one.', values });
    }

    let pageId: string;
    try {
      pageId = createPage(values).id;
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'The page could not be saved.',
        values
      });
    }
    redirect(303, `/pages/${pageId}`);
  }
};
