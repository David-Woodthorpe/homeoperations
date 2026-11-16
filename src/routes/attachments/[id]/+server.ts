import { error } from '@sveltejs/kit';
import { getAttachment } from '$lib/server/attachments';

function disposition(filename: string, inline: boolean): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const encoded = encodeURIComponent(filename);
  return `${inline ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export function GET({ params, url }: { params: { id: string }; url: URL }) {
  const attachment = getAttachment(params.id);
  if (!attachment) error(404, 'That file could not be found.');

  const download = url.searchParams.get('download') === '1';
  const canShowInline =
    !download &&
    (attachment.mime_type === 'application/pdf' || attachment.mime_type.startsWith('image/'));

  const bytes = new Uint8Array(attachment.data);
  return new Response(bytes.buffer, {
    headers: {
      'content-type': attachment.mime_type,
      'content-length': String(attachment.size),
      'content-disposition': disposition(attachment.filename, canShowInline),
      'x-content-type-options': 'nosniff',
      'cache-control': 'private, max-age=0, must-revalidate'
    }
  });
}
