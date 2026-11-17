import { agentBrief, agentContext } from '$lib/server/agent-docs';
import { wrapApi } from '$lib/server/http';

export const GET = wrapApi(({ url, request }) => {
  return new Response(agentBrief(agentContext(url, request)), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex'
    }
  });
});
