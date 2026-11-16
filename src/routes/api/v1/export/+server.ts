import { exportPayload } from '$lib/server/backup';
import { dataResponse, wrapApi } from '$lib/server/http';

export const GET = wrapApi(() => dataResponse(exportPayload()));
