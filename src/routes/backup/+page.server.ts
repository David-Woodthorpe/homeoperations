import { fail, redirect } from '@sveltejs/kit';
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { databaseSummary, importPayload, makeSafetyCopy, parseBackup } from '$lib/server/backup';
import { safetyCopyDir } from '$lib/server/config';
import { getSettings } from '$lib/server/settings';
import { formatBytes } from '$lib/format';

function safetyCopies() {
  try {
    return readdirSync(safetyCopyDir)
      .filter((name) => name.endsWith('.db'))
      .map((name) => {
        const stat = statSync(path.join(safetyCopyDir, name));
        return { name, size: formatBytes(stat.size), modified: stat.mtime.toISOString() };
      })
      .sort((a, b) => b.modified.localeCompare(a.modified))
      .slice(0, 4);
  } catch {
    return [];
  }
}

export function load() {
  const settings = getSettings();
  const summary = databaseSummary();
  return {
    lastBackupAt: settings.last_backup_at,
    summary: {
      ...summary,
      size: formatBytes(summary.size_bytes),
      attachment_size: formatBytes(summary.attachment_bytes)
    },
    copies: safetyCopies()
  };
}

export const actions = {
  import: async ({ request }: { request: Request }) => {
    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return fail(400, { error: 'Choose a backup file to restore.' });
    }
    if (form.get('confirm') !== '1') {
      return fail(400, { error: 'Tick the box to confirm this replaces the current book.' });
    }
    if (file.size > 512 * 1024 * 1024) {
      return fail(400, { error: 'That file is too large to be a Home Operations backup.' });
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      return fail(400, { error: 'The file could not be read.' });
    }

    try {
      const payload = parseBackup(text);
      importPayload(payload);
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'The backup could not be restored.'
      });
    }

    redirect(303, '/?imported=1');
  },

  safetyCopy: async () => {
    try {
      mkdirSync(safetyCopyDir, { recursive: true });
      makeSafetyCopy('manual');
      return { message: 'Safety copy made.' };
    } catch (error) {
      return fail(500, {
        error: error instanceof Error ? error.message : 'The safety copy could not be made.'
      });
    }
  }
};
