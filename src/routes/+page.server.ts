import { pageStats, recentPages } from '$lib/server/pages';
import { listSections } from '$lib/server/sections';
import { getSettings } from '$lib/server/settings';
import { maintenanceSummary, scheduleItems, warrantyItems } from '$lib/server/maintenance';

export function load() {
  const settings = getSettings();
  const sections = listSections();
  const items = scheduleItems();

  return {
    settings,
    sections,
    recent: recentPages(6),
    stats: pageStats(),
    summary: maintenanceSummary(),
    attention: items
      .filter((item) => item.status === 'overdue' || item.status === 'soon')
      .slice(0, 7),
    warranties: warrantyItems(90).slice(0, 5),
    startSection: sections[0] ?? null
  };
}
