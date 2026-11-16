import { error, fail, redirect } from '@sveltejs/kit';
import { listPages, movePage } from '$lib/server/pages';
import { getSectionBySlug } from '$lib/server/sections';

export function load({ params }: { params: { slug: string } }) {
  const section = getSectionBySlug(params.slug);
  if (!section) error(404, 'That section could not be found.');
  return {
    section,
    pages: listPages(section.id)
  };
}

export const actions = {
  move: async ({ request, params }: { request: Request; params: { slug: string } }) => {
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    const direction = String(form.get('direction') ?? '') === 'up' ? -1 : 1;
    if (!id) return fail(400, { error: 'That page could not be found.' });
    movePage(id, direction);
    redirect(303, `/sections/${params.slug}`);
  }
};
