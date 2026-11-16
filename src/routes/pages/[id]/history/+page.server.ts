import { error, redirect } from '@sveltejs/kit';
import { renderMarkdown } from '$lib/markdown';
import { getPage, listRevisions, pageTitleIndex, restoreRevision } from '$lib/server/pages';

export function load({ params }: { params: { id: string } }) {
  const page = getPage(params.id);
  if (!page) error(404, 'That page could not be found.');

  const links = pageTitleIndex();
  const revisions = listRevisions(page.id).map((revision) => ({
    id: revision.id,
    title: revision.title,
    created_at: revision.created_at,
    body: revision.body,
    html: renderMarkdown(revision.body, { pages: links })
  }));

  return { page, revisions };
}

export const actions = {
  restore: async ({ request, params }: { request: Request; params: { id: string } }) => {
    const form = await request.formData();
    const revisionId = String(form.get('revision_id') ?? '');
    if (!revisionId) error(400, 'Choose a version to restore.');
    restoreRevision(params.id, revisionId);
    redirect(303, `/pages/${params.id}`);
  }
};
