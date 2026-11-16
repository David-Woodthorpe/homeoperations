import { applianceStats, listAppliances, usedCategories } from '$lib/server/appliances';
import { categoryOptions } from '$lib/server/appliance-form';
import type { ApplianceFilters } from '$lib/server/appliances';

const STATUSES = ['all', 'overdue', 'soon', 'warranty', 'unscheduled'] as const;
const SORTS = ['name', 'due', 'warranty', 'updated', 'category'] as const;

export function load({ url }: { url: URL }) {
  const status = url.searchParams.get('status') ?? 'all';
  const sort = url.searchParams.get('sort') ?? 'name';
  const filters: ApplianceFilters = {
    q: url.searchParams.get('q') ?? '',
    category: url.searchParams.get('category') ?? '',
    status: (STATUSES as readonly string[]).includes(status)
      ? (status as ApplianceFilters['status'])
      : 'all',
    sort: (SORTS as readonly string[]).includes(sort)
      ? (sort as ApplianceFilters['sort'])
      : 'name'
  };

  return {
    filters,
    appliances: listAppliances(filters),
    stats: applianceStats(),
    categories: categoryOptions(usedCategories()),
    total: listAppliances().length
  };
}
