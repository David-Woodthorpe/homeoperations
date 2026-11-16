import { renderMarkdown } from '$lib/markdown';
import { allPages, getPagesByIds, pageTitleIndex } from '$lib/server/pages';
import { getSettings } from '$lib/server/settings';
import { listServiceRecords } from '$lib/server/appliances';
import { formatShortDate, todayLong } from '$lib/format';
import type { PageWithSection } from '$lib/types';

export function load({ url }: { url: URL }) {
  const settings = getSettings();
  const flag = (name: string) => url.searchParams.getAll(name).includes('1');

  const requested = url.searchParams
    .getAll('pages')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  const uniqueIds = [...new Set(requested)];

  const selected: PageWithSection[] =
    url.searchParams.get('all') === '1'
      ? allPages()
      : uniqueIds.length > 0
        ? getPagesByIds(uniqueIds)
        : [];

  const links = pageTitleIndex();

  const groups: {
    id: string;
    name: string;
    description: string;
    icon: string;
    pages: {
      id: string;
      title: string;
      updated: string;
      html: string;
      appliance: {
        make: string;
        model: string;
        serial: string;
        location: string;
        installed: string;
        warranty: string;
        supplier: string;
        interval: string;
        nextDue: string;
        service: {
          performed_on: string;
          kind: string;
          company: string;
          engineer: string;
          cost: number | null;
          notes: string;
          next_due: string;
        }[];
      } | null;
    }[];
  }[] = [];

  for (const page of selected) {
    let group = groups.find((item) => item.id === page.section_id);
    if (!group) {
      group = {
        id: page.section_id,
        name: page.section_name,
        description: page.section_description,
        icon: page.section_icon,
        pages: []
      };
      groups.push(group);
    }
    group.pages.push({
      id: page.id,
      title: page.title,
      updated: formatShortDate(page.updated_at),
      html: renderMarkdown(page.body, { pages: links, forPrint: true }),
      appliance:
        page.kind === 'appliance'
          ? {
              make: page.make,
              model: page.model,
              serial: page.serial,
              location: page.location,
              installed: page.installed_on ? formatShortDate(page.installed_on) : '',
              warranty: page.warranty_until ? formatShortDate(page.warranty_until) : '',
              supplier: page.supplier,
              interval: page.service_interval_months
                ? `${page.service_interval_months} months`
                : '',
              nextDue: page.service_next_due ? formatShortDate(page.service_next_due) : '',
              service: listServiceRecords(page.id).map((record) => ({
                performed_on: record.performed_on,
                kind: record.kind,
                company: record.company,
                engineer: record.engineer,
                cost: record.cost,
                notes: record.notes,
                next_due: record.next_due
              }))
            }
          : null
    });
  }

  return {
    bookTitle: settings.book_title,
    bookSubtitle: settings.book_subtitle,
    preparedBy: settings.prepared_by,
    coverNote: settings.cover_note,
    printedOn: todayLong(),
    groups,
    totalPages: selected.length,
    options: {
      cover: flag('cover'),
      contents: flag('contents'),
      dividers: flag('dividers'),
      dates: flag('dates'),
      notes: flag('notes')
    }
  };
}
