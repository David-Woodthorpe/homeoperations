import { all, getDb, run, transaction } from './db';
import type { AppSettings } from '$lib/types';

export const defaultSettings: AppSettings = {
  book_title: 'Our House O&M Manual',
  book_subtitle: 'How everything works, and how to look after it',
  prepared_by: '',
  cover_note:
    'Keep this with the property documents. It is the place to start when something stops working, and the record of what has been serviced.',
  last_backup_at: ''
};

export function getSettings(): AppSettings {
  const rows = all<{ key: string; value: string }>('SELECT key, value FROM settings');
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    book_title: stored.book_title?.trim() || defaultSettings.book_title,
    book_subtitle: stored.book_subtitle ?? defaultSettings.book_subtitle,
    prepared_by: stored.prepared_by ?? defaultSettings.prepared_by,
    cover_note: stored.cover_note ?? defaultSettings.cover_note,
    last_backup_at: stored.last_backup_at ?? ''
  };
}

export function saveSettings(input: AppSettings): AppSettings {
  const values: AppSettings = {
    book_title: input.book_title.trim() || defaultSettings.book_title,
    book_subtitle: input.book_subtitle.trim(),
    prepared_by: input.prepared_by.trim(),
    cover_note: input.cover_note.trim(),
    last_backup_at: input.last_backup_at
  };

  transaction(() => {
    const statement = getDb().prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT (key) DO UPDATE SET value = excluded.value`
    );
    for (const [key, value] of Object.entries(values)) statement.run(key, value);
  });

  return values;
}

export function markBackupTaken(timestamp = new Date().toISOString()): void {
  transaction(() => {
    getDb()
      .prepare(
        `INSERT INTO settings (key, value) VALUES ('last_backup_at', ?)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value`
      )
      .run(timestamp);
  });
}

export function setSetting(key: string, value: string): void {
  run(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    key,
    value
  );
}
