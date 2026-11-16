import { getAttachment } from '$lib/server/attachments';
import { ApiError } from '$lib/server/errors';
import { pathId, wrapApi } from '$lib/server/http';

function disposition(filename: string, inline: boolean): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const encoded = encodeURIComponent(filename);
  return `${inline ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export const GET = wrapApi(({ params, url }) => {
  const attachment = getAttachment(pathId(params));
  if (!attachment) throw new ApiError(404, 'not_found', 'No attachment exists with that id.');

  const download = url.searchParams.get('download') === '1';
  const inline =
    !download &&
    (attachment.mime_type === 'application/pdf' ||
      attachment.mime_type.startsWith('image/'));

  const bytes = new Uint8Array(attachment.data);
  return new Response(bytes.buffer, {
    headers: {
      'content-type': attachment.mime_type,
      'content-length': String(attachment.size),
      'content-disposition': disposition(attachment.filename, inline),
      'x-content-type-options': 'nosniff',
      'cache-control': 'private, max-age=0, must-revalidate'
    }
  });
});
