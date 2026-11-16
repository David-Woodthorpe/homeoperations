import { error, fail, redirect } from '@sveltejs/kit';
import { renderMarkdown } from '$lib/markdown';
import {
  addAttachment,
  deleteAttachment,
  listAttachments
} from '$lib/server/attachments';
import { safeReturn } from '$lib/server/appliance-form';
import { backlinks, getPage, listPages, neighbours, pageTitleIndex } from '$lib/server/pages';

export function load({ params }: { params: { id: string } }) {
  const page = getPage(params.id);
  if (!page) error(404, 'That page could not be found.');
  if (page.kind === 'appliance') redirect(303, `/appliances/${page.id}`);

  const links = pageTitleIndex();
  const { previous, next } = neighbours(page);

  return {
    page,
    html: renderMarkdown(page.body, { pages: links }),
    attachments: listAttachments(page.id),
    sectionPages: listPages(page.section_id).map((item) => ({
      id: item.id,
      title: item.title,
      pinned: item.pinned,
      kind: item.kind
    })),
    previous: previous ? { id: previous.id, title: previous.title } : null,
    next: next ? { id: next.id, title: next.title } : null,
    linkedFrom: backlinks(page.title, page.id).map((item) => ({
      id: item.id,
      title: item.title,
      section_name: item.section_name
    }))
  };
}

export const actions = {
  upload: async ({ request, params }: { request: Request; params: { id: string } }) => {
    const form = await request.formData();
    const file = form.get('file');
    const fallback = `/pages/${params.id}`;
    if (!(file instanceof File) || file.size === 0) {
      return fail(400, { error: 'Choose a file to attach.' });
    }
    try {
      await addAttachment(
        params.id,
        file,
        String(form.get('kind') ?? 'document'),
        String(form.get('caption') ?? '')
      );
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'The file could not be attached.'
      });
    }
    redirect(303, safeReturn(String(form.get('return_to') || ''), fallback));
  },

  deleteAttachment: async ({ request, params }: { request: Request; params: { id: string } }) => {
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    if (id) deleteAttachment(id);
    redirect(303, safeReturn(String(form.get('return_to') || ''), `/pages/${params.id}`));
  }
};
