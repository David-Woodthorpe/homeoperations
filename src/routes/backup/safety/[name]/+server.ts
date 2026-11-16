import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { error } from '@sveltejs/kit';
import { safetyCopyDir } from '$lib/server/config';

/**
 * Download one of the automatic safety copies. Only plain file names made by
 * makeSafetyCopy are served; anything containing a path separator is refused.
 */
export function GET({ params }: { params: { name: string } }) {
  const name = params.name;
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*\.db$/.test(name)) error(404, 'That safety copy could not be found.');

  const file = path.join(safetyCopyDir, name);
  if (path.dirname(file) !== safetyCopyDir) error(404, 'That safety copy could not be found.');

  try {
    statSync(file);
  } catch {
    error(404, 'That safety copy could not be found.');
  }

  return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, {
    headers: {
      'content-type': 'application/vnd.sqlite3',
      'content-disposition': `attachment; filename="${name}"`,
      'cache-control': 'no-store'
    }
  });
}
