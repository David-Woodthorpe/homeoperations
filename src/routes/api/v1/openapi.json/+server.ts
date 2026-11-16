import { openapi } from '$lib/server/openapi';
import { jsonResponse, wrapApi } from '$lib/server/http';

export const GET = wrapApi(() => jsonResponse(openapi));
