import { fail } from '@sveltejs/kit';
import { getSettings, saveSettings } from '$lib/server/settings';

export function load() {
  return { settings: getSettings() };
}

export const actions = {
  default: async ({ request }: { request: Request }) => {
    const form = await request.formData();
    const current = getSettings();
    const values = {
      book_title: String(form.get('book_title') ?? '').trim(),
      book_subtitle: String(form.get('book_subtitle') ?? '').trim(),
      prepared_by: String(form.get('prepared_by') ?? '').trim(),
      cover_note: String(form.get('cover_note') ?? '').trim(),
      last_backup_at: current.last_backup_at
    };

    if (!values.book_title) {
      return fail(400, { error: 'The book needs a title.', values });
    }

    saveSettings(values);
    return { saved: true, values };
  }
};
