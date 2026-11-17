import { readFileSync } from 'node:fs';
import path from 'node:path';
import { env } from '$env/dynamic/private';

const root = process.cwd();

export const appName = 'Home Operations';
export const appVersion = '1.3.0';

export const dataDir = env.DATA_DIR ? path.resolve(env.DATA_DIR) : path.join(root, 'data');
export const databaseFile = path.join(dataDir, 'home-operations.db');
export const safetyCopyDir = path.join(dataDir, 'safety-copies');

/**
 * Home Assistant writes add-on options to /data/options.json. Read them only
 * when running under the Supervisor, so a plain Docker install can never pick
 * up an unrelated file.
 */
function readHomeAssistantOptions(): Record<string, unknown> {
  if (!process.env.SUPERVISOR_TOKEN) return {};
  try {
    const parsed: unknown = JSON.parse(
      readFileSync(path.join(dataDir, 'options.json'), 'utf8')
    );
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

const haOptions = readHomeAssistantOptions();

function optionText(key: string): string {
  const value = haOptions[key];
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

/** Optional API key. Empty means the API is open to the local machine. */
export const apiKey = (
  env.HOME_OPERATIONS_API_KEY ||
  env.HEARTHBOOK_API_KEY ||
  optionText('api_key')
).trim();

/** Optional public origin used in llms.txt and the API page, behind a proxy. */
export const publicBaseUrl = (env.PUBLIC_BASE_URL || optionText('public_url'))
  .trim()
  .replace(/\/+$/, '');

/** Set SEED_SECTIONS=0 to start with a completely empty book. */
export const seedStarterSections = (env.SEED_SECTIONS ?? '1').trim() !== '0';
