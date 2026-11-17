import { agentContext, agentManifest } from '$lib/server/agent-docs';
import { jsonResponse, wrapApi } from '$lib/server/http';

export const GET = wrapApi(({ url, request }) => {
  return jsonResponse(agentManifest(agentContext(url, request)));
});
