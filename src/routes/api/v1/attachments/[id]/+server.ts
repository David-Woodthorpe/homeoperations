import { attachmentApi } from '$lib/server/api-serialize';
import { deleteAttachment, getAttachmentMeta } from '$lib/server/attachments';
import { ApiError } from '$lib/server/errors';
import { dataResponse, pathId, wrapApi } from '$lib/server/http';

export const GET = wrapApi(({ params }) => {
  const id = pathId(params);
  const attachment = getAttachmentMeta(id);
  if (!attachment) throw new ApiError(404, 'not_found', 'No attachment exists with that id.');
  return dataResponse(attachmentApi(attachment));
});

export const DELETE = wrapApi(({ params }) => {
  const id = pathId(params);
  if (!getAttachmentMeta(id)) {
    throw new ApiError(404, 'not_found', 'No attachment exists with that id.');
  }
  deleteAttachment(id);
  return dataResponse({ id, deleted: true });
});
