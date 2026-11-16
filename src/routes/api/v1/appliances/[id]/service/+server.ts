import { serviceCreateSchema } from '$lib/server/api-schemas';
import { getApplianceDetail } from '$lib/server/api-appliances';
import { serviceApi } from '$lib/server/api-serialize';
import { addServiceRecord, listServiceRecords } from '$lib/server/appliances';
import { dataResponse, pathId, readJson, wrapApi } from '$lib/server/http';
import { isoDate } from '$lib/format';

export const GET = wrapApi(({ params }) => {
  const detail = getApplianceDetail(pathId(params));
  return dataResponse(listServiceRecords(detail.appliance.id).map(serviceApi));
});

export const POST = wrapApi(async ({ request, params }) => {
  const id = pathId(params);
  getApplianceDetail(id);
  const input = serviceCreateSchema.parse(await readJson(request));

  const record = addServiceRecord(id, {
    performed_on: input.performed_on ?? isoDate(),
    kind: input.kind ?? 'service',
    engineer: input.engineer ?? '',
    company: input.company ?? '',
    cost: input.cost ?? null,
    notes: input.notes ?? '',
    next_due: input.next_due ?? ''
  });

  return dataResponse(serviceApi(record), 201);
});
