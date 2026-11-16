import { all, get, newId, nowIso, run } from './db';
import type { Attachment, AttachmentKind, AttachmentWithData } from '$lib/types';

export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/avif',
  'image/tiff',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed'
]);

const KINDS: AttachmentKind[] = ['document', 'photo', 'receipt'];

function toAttachment(row: Record<string, unknown>): Attachment {
  return {
    id: String(row.id),
    page_id: String(row.page_id),
    filename: String(row.filename),
    mime_type: String(row.mime_type),
    size: Number(row.size),
    kind: (KINDS.includes(row.kind as AttachmentKind) ? row.kind : 'document') as AttachmentKind,
    caption: String(row.caption ?? ''),
    created_at: String(row.created_at)
  };
}

export function listAttachments(pageId: string): Attachment[] {
  return all<Record<string, unknown>>(
    `SELECT id, page_id, filename, mime_type, size, kind, caption, created_at
     FROM attachments WHERE page_id = ? ORDER BY created_at DESC`,
    pageId
  ).map(toAttachment);
}

export function getAttachment(id: string): AttachmentWithData | null {
  const row = get<Record<string, unknown>>('SELECT * FROM attachments WHERE id = ?', id);
  if (!row) return null;
  return {
    ...toAttachment(row),
    data: new Uint8Array(row.data as Uint8Array)
  };
}

export function getAttachmentMeta(id: string): Attachment | null {
  const row = get<Record<string, unknown>>(
    `SELECT id, page_id, filename, mime_type, size, kind, caption, created_at
     FROM attachments WHERE id = ?`,
    id
  );
  return row ? toAttachment(row) : null;
}

export function attachmentsSummary(): { count: number; bytes: number } {
  const row = get<{ count: number; bytes: number }>(
    'SELECT COUNT(*) AS count, COALESCE(SUM(size), 0) AS bytes FROM attachments'
  );
  return { count: Number(row?.count ?? 0), bytes: Number(row?.bytes ?? 0) };
}

export async function addAttachment(
  pageId: string,
  file: File,
  kind: string,
  caption: string
): Promise<Attachment> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('Choose a file to attach.');
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error('That file is larger than 25 MB. Try a smaller scan or a link instead.');
  }

  const mime = (file.type || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error(
      'That file type is not supported. Use a PDF, image, text file, Word/Excel document or ZIP.'
    );
  }

  const data = new Uint8Array(await file.arrayBuffer());
  if (data.byteLength === 0) throw new Error('That file is empty.');

  const id = newId('att');
  const chosen = (KINDS.includes(kind as AttachmentKind) ? kind : 'document') as AttachmentKind;
  const filename = (file.name || 'attachment').slice(0, 200);

  run(
    `INSERT INTO attachments (id, page_id, filename, mime_type, size, kind, caption, data, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    pageId,
    filename,
    mime,
    data.byteLength,
    chosen,
    caption.trim().slice(0, 500),
    data,
    nowIso()
  );

  const row = get<Record<string, unknown>>(
    `SELECT id, page_id, filename, mime_type, size, kind, caption, created_at
     FROM attachments WHERE id = ?`,
    id
  );
  if (!row) throw new Error('The attachment could not be saved.');
  return toAttachment(row);
}

export function deleteAttachment(id: string): void {
  run('DELETE FROM attachments WHERE id = ?', id);
}

export function attachmentKindFor(mime: string): AttachmentKind {
  return mime.startsWith('image/') ? 'photo' : 'document';
}
