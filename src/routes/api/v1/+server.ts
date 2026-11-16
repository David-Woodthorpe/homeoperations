import { appVersion, publicBaseUrl } from '$lib/server/config';
import { wrapApi, dataResponse } from '$lib/server/http';

const endpoints = [
  'GET /health',
  'GET /meta',
  'GET /appliances?q=&category=&status=&sort=&limit=&offset=',
  'POST /appliances',
  'GET /appliances/{id}',
  'PATCH /appliances/{id}',
  'DELETE /appliances/{id}',
  'GET /appliances/{id}/service',
  'POST /appliances/{id}/service',
  'DELETE /appliances/{id}/service/{recordId}',
  'GET /pages?q=&section_id=&kind=&limit=&offset=',
  'POST /pages',
  'GET /pages/{id}',
  'PATCH /pages/{id}',
  'DELETE /pages/{id}',
  'GET /sections',
  'POST /sections',
  'GET /sections/{id}',
  'PATCH /sections/{id}',
  'DELETE /sections/{id}',
  'GET /maintenance?status=&type=&limit=&offset=',
  'GET /tasks?status=&limit=&offset=',
  'POST /tasks',
  'GET /tasks/{id}',
  'PATCH /tasks/{id}',
  'DELETE /tasks/{id}',
  'POST /tasks/{id}/complete',
  'GET /attachments?appliance_id=|page_id=',
  'POST /attachments',
  'GET /attachments/{id}',
  'GET /attachments/{id}/file',
  'DELETE /attachments/{id}',
  'GET /search?q=&limit=&offset=',
  'GET /warranties?days=90',
  'GET /export',
  'GET /backup'
];

export const GET = wrapApi(({ url }) => {
  const origin = publicBaseUrl || url.origin;
  const base = `${origin}/api/v1`;
  return dataResponse({
    app: 'home-operations',
    version: appVersion,
    base_url: base,
    docs: {
      llms: `${origin}/llms.txt`,
      openapi: `${base}/openapi.json`,
      human: `${origin}/api`
    },
    endpoints
  });
});
