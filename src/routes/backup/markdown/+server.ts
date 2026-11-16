import { exportMarkdown } from '$lib/server/backup';

export function GET() {
  const { filename, content } = exportMarkdown();
  return new Response(content, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'content-disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
      'cache-control': 'no-store'
    }
  });
}
