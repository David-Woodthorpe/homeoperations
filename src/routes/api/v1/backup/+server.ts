import { readFileSync } from 'node:fs';
import { databaseFile } from '$lib/server/config';
import { getDb } from '$lib/server/db';
import { wrapApi } from '$lib/server/http';

export const GET = wrapApi(() => {
  // Flush the write-ahead log so the single file contains everything, including
  // attachments. No await follows, so no write can interleave with the read.
  getDb().exec('PRAGMA wal_checkpoint(TRUNCATE)');
  const bytes = readFileSync(databaseFile);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(bytes, {
    headers: {
      'content-type': 'application/vnd.sqlite3',
      'content-disposition': `attachment; filename="home-operations-backup-${date}.db"`,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
});
