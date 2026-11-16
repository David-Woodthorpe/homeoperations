import { applianceCreateSchema } from '$lib/server/api-schemas';
import {
  createApplianceFromApi,
  getApplianceDetail
} from '$lib/server/api-appliances';
import { applianceApi, applianceSummary } from '$lib/server/api-serialize';
import { listAppliances } from '$lib/server/appliances';
import type { ApplianceFilters } from '$lib/server/appliances';
import {
  dataResponse,
  listResponse,
  queryInt,
  readJson,
  wrapApi
} from '$lib/server/http';

const STATUSES = ['all', 'overdue', 'soon', 'warranty', 'unscheduled'] as const;
const SORTS = ['name', 'due', 'warranty', 'updated', 'category'] as const;

export const GET = wrapApi(({ url }) => {
  const params = url.searchParams;
  const status = params.get('status') ?? 'all';
  const sort = params.get('sort') ?? 'name';
  const filters: ApplianceFilters = {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    status: (STATUSES as readonly string[]).includes(status)
      ? (status as ApplianceFilters['status'])
      : 'all',
    sort: (SORTS as readonly string[]).includes(sort)
      ? (sort as ApplianceFilters['sort'])
      : 'name'
  };
  const limit = queryInt(params.get('limit'), 50, 1, 200);
  const offset = queryInt(params.get('offset'), 0, 0, 10_000_000);
  const all = listAppliances(filters);
  const page = all.slice(offset, offset + limit);

  return listResponse(page.map(applianceSummary), {
    total: all.length,
    limit,
    offset
  });
});

export const POST = wrapApi(async ({ request }) => {
  const input = applianceCreateSchema.parse(await readJson(request));
  const row = createApplianceFromApi(input as Record<string, unknown>);
  const detail = getApplianceDetail(row.id);
  return dataResponse(
    applianceApi(detail.appliance, detail.attachments, detail.serviceRecords),
    201
  );
});
