import { apiKey, appVersion, publicBaseUrl } from '$lib/server/config';
import { MAX_ATTACHMENT_BYTES } from '$lib/server/attachments';
import { usedCategories } from '$lib/server/appliances';
import { dataResponse, wrapApi } from '$lib/server/http';
import { maintenanceSummary } from '$lib/server/maintenance';
import { pageStats } from '$lib/server/pages';
import { listSections } from '$lib/server/sections';
import { getSettings } from '$lib/server/settings';
import { sectionApi } from '$lib/server/api-serialize';
import { applianceCategories, maintenanceCategories } from '$lib/seed-sections';
import { isoDate } from '$lib/format';

export const GET = wrapApi(({ url }) => {
  const settings = getSettings();
  const stats = pageStats();
  const summary = maintenanceSummary();
  const origin = publicBaseUrl || url.origin;
  const base = `${origin}/api/v1`;

  return dataResponse({
    app: 'home-operations',
    version: appVersion,
    today: isoDate(),
    book: {
      title: settings.book_title,
      subtitle: settings.book_subtitle,
      prepared_by: settings.prepared_by,
      last_backup_at: settings.last_backup_at || null
    },
    stats: {
      appliances: stats.appliances,
      pages: stats.pages,
      sections: stats.sections,
      words: stats.words,
      last_updated: stats.last_updated
    },
    maintenance: {
      overdue: summary.overdue,
      due_soon: summary.dueSoon,
      warranties_due: summary.warrantySoon,
      tasks: summary.tasks
    },
    sections: listSections().map(sectionApi),
    categories: {
      appliance: [...new Set([...usedCategories(), ...applianceCategories])],
      maintenance: [...maintenanceCategories]
    },
    limits: {
      attachment_bytes: MAX_ATTACHMENT_BYTES,
      list_max: 200
    },
    auth: {
      required: Boolean(apiKey)
    },
    docs: {
      llms: `${origin}/llms.txt`,
      openapi: `${base}/openapi.json`,
      human: `${origin}/api`,
      base_url: base
    }
  });
});
