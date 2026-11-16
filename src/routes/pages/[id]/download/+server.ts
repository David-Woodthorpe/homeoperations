import { error } from '@sveltejs/kit';
import { markdownForPage } from '$lib/server/backup';
import { getPage } from '$lib/server/pages';

function filename(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return `${slug || 'page'}.md`;
}

export function GET({ params }: { params: { id: string } }) {
  const page = getPage(params.id);
  if (!page) error(404, 'That page could not be found.');

  return new Response(markdownForPage(page), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'content-disposition': `attachment; filename="${filename(page.title)}"`,
      'cache-control': 'no-store'
    }
  });
}
