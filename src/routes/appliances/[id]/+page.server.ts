import { error, fail, redirect } from '@sveltejs/kit';
import { renderMarkdown } from '$lib/markdown';
import {
  addServiceRecord,
  deleteServiceRecord,
  getAppliance,
  listServiceRecords
} from '$lib/server/appliances';
import { addAttachment, deleteAttachment, listAttachments } from '$lib/server/attachments';
import { safeReturn } from '$lib/server/appliance-form';
import { pageTitleIndex } from '$lib/server/pages';

export function load({ params }: { params: { id: string } }) {
  const appliance = getAppliance(params.id);
  if (!appliance) error(404, 'That appliance could not be found.');

  const links = pageTitleIndex();
  return {
    appliance,
    html: renderMarkdown(appliance.body, { pages: links }),
    attachments: listAttachments(appliance.id),
    serviceRecords: listServiceRecords(appliance.id)
  };
}

function parseCost(form: FormData): number | null {
  const raw = String(form.get('cost') ?? '').trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function parseDate(form: FormData, name: string): string {
  const value = String(form.get(name) ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
}

export const actions = {
  upload: async ({ request, params }: { request: Request; params: { id: string } }) => {
    const form = await request.formData();
    const file = form.get('file');
    const fallback = `/appliances/${params.id}`;

    if (!(file instanceof File) || file.size === 0) {
      return fail(400, { error: 'Choose a file to attach.' });
    }
    try {
      await addAttachment(
        params.id,
        file,
        String(form.get('kind') ?? 'document'),
        String(form.get('caption') ?? '')
      );
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'The file could not be attached.'
      });
    }
    redirect(303, safeReturn(String(form.get('return_to') || ''), fallback));
  },

  deleteAttachment: async ({ request, params }: { request: Request; params: { id: string } }) => {
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    if (id) deleteAttachment(id);
    redirect(
      303,
      safeReturn(String(form.get('return_to') || ''), `/appliances/${params.id}`)
    );
  },

  addService: async ({ request, params }: { request: Request; params: { id: string } }) => {
    const form = await request.formData();
    const performedOn = parseDate(form, 'performed_on');
    if (!performedOn) {
      return fail(400, { error: 'Choose the date the work was done.' });
    }

    try {
      addServiceRecord(params.id, {
        performed_on: performedOn,
        kind: String(form.get('kind') ?? 'service'),
        engineer: String(form.get('engineer') ?? ''),
        company: String(form.get('company') ?? ''),
        cost: parseCost(form),
        notes: String(form.get('notes') ?? ''),
        next_due: parseDate(form, 'next_due')
      });
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'The service record could not be saved.'
      });
    }
    redirect(303, `/appliances/${params.id}#service-history`);
  },

  deleteService: async ({ request, params }: { request: Request; params: { id: string } }) => {
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    if (id) deleteServiceRecord(id);
    redirect(303, `/appliances/${params.id}#service-history`);
  }
};
