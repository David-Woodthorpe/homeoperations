import { attachmentApi } from '$lib/server/api-serialize';
import {
  addAttachment,
  attachmentKindFor,
  listAttachments
} from '$lib/server/attachments';
import { getAppliance } from '$lib/server/appliances';
import { ApiError } from '$lib/server/errors';
import {
  dataResponse,
  wrapApi
} from '$lib/server/http';
import { getPage } from '$lib/server/pages';

function targetPageId(url: URL): string {
  const applianceId = url.searchParams.get('appliance_id');
  const pageId = url.searchParams.get('page_id');
  if (Boolean(applianceId) === Boolean(pageId)) {
    throw new ApiError(
      400,
      'target_required',
      'Pass exactly one of appliance_id or page_id.'
    );
  }
  if (applianceId) {
    const appliance = getAppliance(applianceId);
    if (!appliance) throw new ApiError(404, 'not_found', 'No appliance exists with that id.');
    return appliance.id;
  }
  const page = getPage(pageId!);
  if (!page) throw new ApiError(404, 'not_found', 'No page exists with that id.');
  return page.id;
}

export const GET = wrapApi(({ url }) => {
  const pageId = targetPageId(url);
  return dataResponse(listAttachments(pageId).map(attachmentApi));
});

export const POST = wrapApi(async ({ request, url }) => {
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new ApiError(400, 'file_required', 'Upload a file in the "file" field.');
  }

  const applianceId = String(form.get('appliance_id') ?? '').trim();
  const pageIdInput = String(form.get('page_id') ?? '').trim();
  if (Boolean(applianceId) === Boolean(pageIdInput)) {
    throw new ApiError(
      400,
      'target_required',
      'Pass exactly one of appliance_id or page_id as a form field.'
    );
  }

  let pageId: string;
  if (applianceId) {
    const appliance = getAppliance(applianceId);
    if (!appliance) throw new ApiError(404, 'not_found', 'No appliance exists with that id.');
    pageId = appliance.id;
  } else {
    const page = getPage(pageIdInput);
    if (!page) throw new ApiError(404, 'not_found', 'No page exists with that id.');
    pageId = page.id;
  }

  const kind = String(form.get('kind') ?? '').trim();
  try {
    const attachment = await addAttachment(
      pageId,
      file,
      kind || attachmentKindFor(file.type),
      String(form.get('caption') ?? '')
    );
    return dataResponse(attachmentApi(attachment), 201);
  } catch (error) {
    throw new ApiError(
      400,
      'attachment_rejected',
      error instanceof Error ? error.message : 'The file could not be attached.'
    );
  }
});
