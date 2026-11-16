import {
  maintenanceItemApi,
  warrantyApi
} from '$lib/server/api-serialize';
import { listResponse, queryInt, wrapApi } from '$lib/server/http';
import {
  maintenanceSummary,
  monthGroups,
  scheduleItems,
  warrantyItems
} from '$lib/server/maintenance';
import { jsonResponse } from '$lib/server/http';
import { isoDate } from '$lib/format';

const STATUSES = new Set(['overdue', 'soon', 'later', 'none']);

export const GET = wrapApi(({ url }) => {
  const params = url.searchParams;
  const statusFilter = (params.get('status') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => STATUSES.has(value));
  const type = params.get('type') ?? '';
  const limit = queryInt(params.get('limit'), 50, 1, 200);
  const offset = queryInt(params.get('offset'), 0, 0, 10_000_000);

  const all = scheduleItems();
  let filtered = all;
  if (statusFilter.length > 0) {
    filtered = filtered.filter((item) => statusFilter.includes(item.status));
  }
  if (type === 'appliance' || type === 'task') {
    filtered = filtered.filter((item) => item.type === type);
  }

  const page = filtered.slice(offset, offset + limit);
  return jsonResponse({
    data: page.map(maintenanceItemApi),
    pagination: {
      total: filtered.length,
      limit,
      offset,
      has_more: offset + page.length < filtered.length
    },
    today: isoDate(),
    summary: (({ overdue, dueSoon, warrantySoon, tasks, appliances }) => ({
      overdue,
      due_soon: dueSoon,
      warranties_due: warrantySoon,
      tasks,
      appliances
    }))(maintenanceSummary()),
    calendar: monthGroups(all, 12).map((group) => ({
      month: group.key,
      label: group.label,
      items: group.items.map(maintenanceItemApi)
    })),
    warranties: warrantyItems(90).map(warrantyApi)
  });
});
