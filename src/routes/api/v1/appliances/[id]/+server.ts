import { applianceUpdateSchema } from '$lib/server/api-schemas';
import {
  getApplianceDetail,
  updateApplianceFromApi
} from '$lib/server/api-appliances';
import { applianceApi } from '$lib/server/api-serialize';
import { deletePage } from '$lib/server/pages';
import { dataResponse, pathId, readJson, wrapApi } from '$lib/server/http';

export const GET = wrapApi(({ params }) => {
  const detail = getApplianceDetail(pathId(params));
  return dataResponse(
    applianceApi(detail.appliance, detail.attachments, detail.serviceRecords)
  );
});

export const PATCH = wrapApi(async ({ request, params }) => {
  const id = pathId(params);
  const input = applianceUpdateSchema.parse(await readJson(request));
  const row = updateApplianceFromApi(id, input as Record<string, unknown>);
  const detail = getApplianceDetail(row.id);
  return dataResponse(
    applianceApi(detail.appliance, detail.attachments, detail.serviceRecords)
  );
});

export const DELETE = wrapApi(({ params }) => {
  const id = pathId(params);
  const detail = getApplianceDetail(id);
  deletePage(detail.appliance.id);
  return dataResponse({ id, deleted: true });
});
