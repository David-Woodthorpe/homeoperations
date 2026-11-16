import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { ApiError } from './errors';

export function jsonResponse(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers
    }
  });
}

export function dataResponse(data: unknown, status = 200): Response {
  return jsonResponse({ data }, status);
}

export function listResponse(
  data: unknown[],
  pagination: { total: number; limit: number; offset: number }
): Response {
  return jsonResponse({
    data,
    pagination: {
      ...pagination,
      has_more: pagination.offset + data.length < pagination.total
    }
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return jsonResponse(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {})
        }
      },
      error.status
    );
  }

  if (error instanceof z.ZodError) {
    return jsonResponse(
      {
        error: {
          code: 'validation_error',
          message: 'Some fields are invalid',
          details: error.issues.map((issue) => ({
            field: issue.path.join('.') || '(body)',
            message: issue.message
          }))
        }
      },
      400
    );
  }

  console.error('[api] unhandled error', error);
  return jsonResponse(
    { error: { code: 'internal_error', message: 'An unexpected error occurred' } },
    500
  );
}

type ApiHandler = (event: RequestEvent) => Response | Promise<Response>;

export function wrapApi(handler: ApiHandler): (event: RequestEvent) => Promise<Response> {
  return async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export async function readJson(request: Request): Promise<unknown> {
  const type = request.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) {
    throw new ApiError(
      415,
      'unsupported_media_type',
      'Send a JSON body with "Content-Type: application/json".'
    );
  }
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, 'invalid_json', 'The request body is not valid JSON.');
  }
}

export function queryInt(
  value: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  if (value === null || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export function queryBool(value: string | null, fallback = false): boolean {
  if (value === null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function pathId(params: { id?: string }): string {
  const id = String(params.id ?? '').trim();
  if (!id) throw new ApiError(400, 'missing_id', 'An id is required.');
  return id;
}
