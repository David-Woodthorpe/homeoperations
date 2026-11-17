import agentBriefTemplate from './agent-brief.md?raw';
import agentSkillTemplate from './agent-skill.md?raw';
import { apiKey, appVersion, publicBaseUrl } from './config';
import { isoDate } from '$lib/format';

export type AgentContext = {
  origin: string;
  base: string;
  authRequired: boolean;
  ingressOnly: boolean;
  version: string;
  today: string;
};

export function agentContext(url: URL, request: Request): AgentContext {
  const origin = publicBaseUrl || url.origin;
  const ingressPath = request.headers.get('x-ingress-path') ?? '';
  return {
    origin,
    base: `${origin}/api/v1`,
    authRequired: Boolean(apiKey),
    ingressOnly: Boolean(ingressPath) && !publicBaseUrl,
    version: appVersion,
    today: isoDate()
  };
}

function authSetup(): string {
  return `AUTH_HEADER=()
if [[ -n "\${HOME_OPERATIONS_API_KEY:-}" ]]; then
  AUTH_HEADER=(-H "Authorization: Bearer \${HOME_OPERATIONS_API_KEY}")
fi`;
}

function authNote(required: boolean): string {
  if (required) {
    return `Authentication is **required** on this instance. Send
\`Authorization: Bearer $HOME_OPERATIONS_API_KEY\` (or \`X-Api-Key: <key>\`) on
every request except \`/health\`. Ask the owner for the key. Never put the key in
the skill file or a note.`;
  }
  return `Authentication is currently **disabled**. If the owner sets
\`HOME_OPERATIONS_API_KEY\`, send \`Authorization: Bearer <key>\` or
\`X-Api-Key: <key>\` on every request except \`/health\`.`;
}

function ingressNote(ingressOnly: boolean): string {
  return ingressOnly
    ? `This request came through a Home Assistant ingress URL. That URL contains a
per-session token and is not stable for an agent. For agent use, enable the
add-on's optional \`3000/tcp\` port and use
\`http://<home-assistant-host>:3000\` as the base URL.`
    : '';
}

function fill(template: string, ctx: AgentContext): string {
  const values: Record<string, string> = {
    '{{BASE_URL}}': ctx.base,
    '{{ORIGIN}}': ctx.origin,
    '{{VERSION}}': ctx.version,
    '{{TODAY}}': ctx.today,
    '{{AUTH_SETUP}}': authSetup(),
    '{{AUTH_NOTE}}': authNote(ctx.authRequired),
    '{{INGRESS_NOTE}}': ingressNote(ctx.ingressOnly),
    '{{LLMS_URL}}': `${ctx.origin}/llms.txt`,
    '{{OPENAPI_URL}}': `${ctx.base}/openapi.json`,
    '{{HUMAN_URL}}': `${ctx.origin}/api`,
    '{{HEALTH_URL}}': `${ctx.base}/health`,
    '{{META_URL}}': `${ctx.base}/meta`,
    '{{AGENT_URL}}': `${ctx.origin}/agent.md`,
    '{{SKILL_URL}}': `${ctx.origin}/skill.md`,
    '{{MANIFEST_URL}}': `${ctx.origin}/.well-known/home-operations.json`
  };

  let output = template;
  for (const [key, value] of Object.entries(values)) output = output.replaceAll(key, value);
  return output.replace(/\n{3,}/g, '\n\n');
}

export function agentBrief(ctx: AgentContext): string {
  return fill(agentBriefTemplate, ctx);
}

export function agentSkill(ctx: AgentContext): string {
  return fill(agentSkillTemplate, ctx);
}

export function agentManifest(ctx: AgentContext) {
  return {
    name: 'Home Operations',
    version: ctx.version,
    description:
      'Self-hosted house operations and maintenance manual: appliances, service history, maintenance tasks, manuals and photos.',
    generated_at: `${ctx.today}T00:00:00Z`,
    api: {
      base_url: ctx.base,
      health: `${ctx.base}/health`,
      meta: `${ctx.base}/meta`,
      openapi: `${ctx.base}/openapi.json`,
      auth: {
        required: ctx.authRequired,
        schemes: ['bearer', 'x-api-key'],
        headers: ['Authorization', 'X-Api-Key']
      }
    },
    agent: {
      entrypoint: `${ctx.origin}/agent.md`,
      skill: `${ctx.origin}/skill.md`,
      canonical_guide: `${ctx.origin}/llms.txt`,
      human_docs: `${ctx.origin}/api`,
      manifest: `${ctx.origin}/.well-known/home-operations.json`
    },
    access: {
      ingress_only: ctx.ingressOnly,
      note: ctx.ingressOnly
        ? 'Use the add-on direct port 3000/tcp for stable agent access.'
        : 'Use the base URL above.'
    },
    capabilities: [
      'read appliance and system specifications',
      'read operation notes and attached manuals',
      'create or update appliances from a make and model',
      'upload manuals, photos and receipts',
      'log service, repair and inspection history',
      'create and complete standing maintenance tasks',
      'query overdue work, warranties and the year-ahead schedule',
      'search all notes and appliances',
      'export a JSON backup or download the SQLite database'
    ]
  };
}
