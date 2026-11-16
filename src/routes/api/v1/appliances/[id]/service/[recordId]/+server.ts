import { getApplianceDetail } from '$lib/server/api-appliances';
import { deleteServiceRecord, listServiceRecords } from '$lib/server/appliances';
import { ApiError } from '$lib/server/errors';
import { dataResponse, pathId, wrapApi } from '$lib/server/http';

export const DELETE = wrapApi(({ params }) => {
  const applianceId = pathId({ id: params.id });
  const recordId = pathId({ id: params.recordId });
  getApplianceDetail(applianceId);

  const record = listServiceRecords(applianceId).find((item) => item.id === recordId);
  if (!record) {
    throw new ApiError(404, 'not_found', 'No service record with that id exists on this appliance.');
  }

  deleteServiceRecord(recordId);
  return dataResponse({ id: recordId, deleted: true });
});
