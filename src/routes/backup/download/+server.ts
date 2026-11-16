import { backupFilename, exportPayload } from '$lib/server/backup';
import { markBackupTaken } from '$lib/server/settings';

export function GET() {
  const payload = exportPayload();
  markBackupTaken();
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${backupFilename()}"`,
      'cache-control': 'no-store'
    }
  });
}
