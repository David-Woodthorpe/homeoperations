import { appVersion } from '$lib/server/config';
import { listSections } from '$lib/server/sections';
import { getSettings } from '$lib/server/settings';
import { maintenanceSummary } from '$lib/server/maintenance';

export function load({ request }: { request: Request }) {
  const ingressPath = (request.headers.get('x-ingress-path') ?? '').replace(/\/+$/, '');
  const settings = getSettings();
  const sections = listSections();

  return {
    appVersion,
    ingressPath,
    bookTitle: settings.book_title,
    sections: sections.map((section) => ({
      id: section.id,
      name: section.name,
      slug: section.slug,
      icon: section.icon,
      page_count: section.page_count,
      appliance_count: section.appliance_count
    })),
    maintenance: maintenanceSummary(),
    lastBackupAt: settings.last_backup_at
  };
}
