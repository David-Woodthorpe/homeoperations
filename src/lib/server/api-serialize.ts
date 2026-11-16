import type {
  ApplianceRow,
  Attachment,
  MaintenanceTask,
  PageWithSection,
  ScheduleItem,
  SectionWithCount,
  ServiceRecord
} from '$lib/types';
import { daysUntil, dueState, isoDate } from '$lib/format';
import { plainText, snippet } from '$lib/text';
import type { SearchResult } from './pages';
import type { ApplianceInput } from '$lib/types';

function nullIfEmpty(value: string): string | null {
  return value ? value : null;
}

function daysOrNull(date: string): number | null {
  if (!date) return null;
  const days = daysUntil(date);
  return Number.isFinite(days) ? days : null;
}

export function sectionRef(section: {
  id: string;
  name: string;
  slug: string;
  icon: string;
}) {
  return {
    id: section.id,
    name: section.name,
    slug: section.slug,
    icon: section.icon
  };
}

export function attachmentApi(attachment: Attachment) {
  return {
    id: attachment.id,
    page_id: attachment.page_id,
    filename: attachment.filename,
    mime_type: attachment.mime_type,
    size: attachment.size,
    kind: attachment.kind,
    caption: attachment.caption,
    created_at: attachment.created_at,
    url: `/api/v1/attachments/${attachment.id}`,
    file_url: `/api/v1/attachments/${attachment.id}/file`,
    download_url: `/api/v1/attachments/${attachment.id}/file?download=1`
  };
}

export function serviceApi(record: ServiceRecord) {
  return {
    id: record.id,
    performed_on: record.performed_on,
    kind: record.kind,
    engineer: record.engineer,
    company: record.company,
    cost: record.cost,
    notes: record.notes,
    next_due: nullIfEmpty(record.next_due),
    created_at: record.created_at
  };
}

export function applianceSummary(row: ApplianceRow) {
  const serviceDays = daysOrNull(row.service_next_due);
  const warrantyDays = daysOrNull(row.warranty_until);

  return {
    id: row.id,
    name: row.title,
    make: nullIfEmpty(row.make),
    model: nullIfEmpty(row.model),
    serial: nullIfEmpty(row.serial),
    category: nullIfEmpty(row.category),
    location: nullIfEmpty(row.location),
    section: sectionRef({
      id: row.section_id,
      name: row.section_name,
      slug: row.section_slug,
      icon: row.section_icon
    }),
    installed_on: nullIfEmpty(row.installed_on),
    warranty_until: nullIfEmpty(row.warranty_until),
    warranty_status: !row.warranty_until
      ? 'none'
      : warrantyDays !== null && warrantyDays < 0
        ? 'expired'
        : warrantyDays !== null && warrantyDays <= 90
          ? 'expiring'
          : 'active',
    days_until_warranty: warrantyDays,
    service_interval_months: row.service_interval_months,
    service_next_due: nullIfEmpty(row.service_next_due),
    service_status: dueState(row.service_next_due),
    service_due: Boolean(row.service_next_due) && (serviceDays ?? 0) <= 0,
    days_until_service: serviceDays,
    last_service: nullIfEmpty(row.last_service ?? ''),
    attachment_count: row.attachment_count,
    updated_at: row.updated_at,
    url: `/api/v1/appliances/${row.id}`
  };
}

export function applianceApi(
  row: ApplianceRow,
  attachments: Attachment[],
  serviceRecords: ServiceRecord[]
) {
  return {
    ...applianceSummary(row),
    supplier: nullIfEmpty(row.supplier),
    manual_url: nullIfEmpty(row.manual_url),
    pinned: row.pinned === 1,
    body: row.body,
    body_text: plainText(row.body),
    created_at: row.created_at,
    attachments: attachments.map(attachmentApi),
    service_records: serviceRecords.map(serviceApi),
    links: {
      self: `/api/v1/appliances/${row.id}`,
      html: `/appliances/${row.id}`,
      print: `/print/doc?pages=${row.id}&dates=1`
    }
  };
}

export function pageSummaryApi(row: PageWithSection) {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    pinned: row.pinned === 1,
    section: sectionRef({
      id: row.section_id,
      name: row.section_name,
      slug: row.section_slug,
      icon: row.section_icon
    }),
    updated_at: row.updated_at,
    snippet: snippet(row.body),
    url:
      row.kind === 'appliance' ? `/api/v1/appliances/${row.id}` : `/api/v1/pages/${row.id}`
  };
}

export function pageApi(row: PageWithSection, attachments: Attachment[]) {
  return {
    ...pageSummaryApi(row),
    body: row.body,
    body_text: plainText(row.body),
    created_at: row.created_at,
    attachment_count: attachments.length,
    attachments: attachments.map(attachmentApi),
    links: {
      self: `/api/v1/pages/${row.id}`,
      html: row.kind === 'appliance' ? `/appliances/${row.id}` : `/pages/${row.id}`,
      ...(row.kind === 'appliance'
        ? { appliance: `/api/v1/appliances/${row.id}` }
        : {})
    }
  };
}

export function sectionApi(section: SectionWithCount) {
  return {
    id: section.id,
    name: section.name,
    slug: section.slug,
    description: section.description,
    icon: section.icon,
    sort_order: section.sort_order,
    page_count: section.page_count,
    appliance_count: section.appliance_count,
    last_updated: section.last_updated,
    url: `/api/v1/sections/${section.id}`
  };
}

export function taskApi(task: MaintenanceTask) {
  const days = daysOrNull(task.next_due);
  return {
    id: task.id,
    title: task.title,
    category: nullIfEmpty(task.category),
    interval_months: task.interval_months,
    next_due: nullIfEmpty(task.next_due),
    status: dueState(task.next_due),
    days_until_due: days,
    last_done: nullIfEmpty(task.last_done),
    notes: nullIfEmpty(task.notes),
    created_at: task.created_at,
    updated_at: task.updated_at,
    url: `/api/v1/tasks/${task.id}`
  };
}

export function maintenanceItemApi(item: ScheduleItem) {
  return {
    type: item.type,
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    due: nullIfEmpty(item.due),
    status: item.status,
    days_until_due: daysOrNull(item.due),
    interval_months: item.interval_months,
    last_done: nullIfEmpty(item.last_done),
    url: item.type === 'appliance' ? `/api/v1/appliances/${item.id}` : `/api/v1/tasks/${item.id}`
  };
}

export function warrantyApi(item: {
  id: string;
  title: string;
  warranty_until: string;
  section_name: string;
}) {
  const days = daysOrNull(item.warranty_until);
  return {
    appliance_id: item.id,
    title: item.title,
    section_name: item.section_name,
    warranty_until: item.warranty_until,
    days_until_expiry: days,
    status:
      days === null ? 'none' : days < 0 ? 'expired' : days <= 90 ? 'expiring' : 'active',
    url: `/api/v1/appliances/${item.id}`
  };
}

export function searchResultApi(result: SearchResult) {
  return {
    id: result.id,
    title: result.title,
    kind: result.kind,
    section: {
      name: result.section_name,
      slug: result.section_slug,
      icon: result.section_icon
    },
    meta: result.meta || null,
    snippet: result.snippet,
    updated_at: result.updated_at,
    url:
      result.kind === 'appliance'
        ? `/api/v1/appliances/${result.id}`
        : `/api/v1/pages/${result.id}`
  };
}

export function defaultsForCreate(input: {
  name?: string | null;
  make?: string | null;
  model?: string | null;
  category?: string | null;
  body?: string;
  pinned?: boolean;
  installed_on?: string | null;
  warranty_until?: string | null;
  serial?: string | null;
  location?: string | null;
  supplier?: string | null;
  manual_url?: string | null;
  service_interval_months?: number | null;
  service_next_due?: string | null;
}): ApplianceInput {
  const make = input.make?.trim() ?? '';
  const model = input.model?.trim() ?? '';
  const name = input.name?.trim() || [make, model].filter(Boolean).join(' ');
  return {
    title: name,
    section_id: '',
    body: input.body ?? '',
    pinned: Boolean(input.pinned),
    category: input.category?.trim() ?? '',
    make,
    model,
    serial: input.serial?.trim() ?? '',
    location: input.location?.trim() ?? '',
    installed_on: input.installed_on ?? '',
    warranty_until: input.warranty_until ?? '',
    service_interval_months: input.service_interval_months ?? null,
    service_next_due: input.service_next_due ?? '',
    supplier: input.supplier?.trim() ?? '',
    manual_url: input.manual_url ?? ''
  };
}

export function today(): string {
  return isoDate();
}
