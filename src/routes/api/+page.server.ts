import { apiKey, appVersion, publicBaseUrl } from '$lib/server/config';
import { MAX_ATTACHMENT_BYTES } from '$lib/server/attachments';
import { pageStats } from '$lib/server/pages';
import { maintenanceSummary } from '$lib/server/maintenance';

export function load({ url }: { url: URL }) {
  const origin = publicBaseUrl || url.origin;
  return {
    origin,
    base: `${origin}/api/v1`,
    apiKeyEnabled: Boolean(apiKey),
    version: appVersion,
    maxAttachmentMb: Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024)),
    stats: pageStats(),
    summary: maintenanceSummary()
  };
}
