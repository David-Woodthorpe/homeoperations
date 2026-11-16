import { appVersion } from '$lib/server/config';
import { jsonResponse, wrapApi } from '$lib/server/http';

export const GET = wrapApi(() =>
  jsonResponse({
    status: 'ok',
    app: 'home-operations',
    version: appVersion,
    time: new Date().toISOString()
  })
);
