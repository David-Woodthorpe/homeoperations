import { z } from 'zod';
import { isSectionIcon, sectionIcons } from '$lib/icons';

const emptyToNull = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
};

const emptyToUndefined = (value: unknown) => {
  if (value === '' || value === null) return undefined;
  return value;
};

const optionalText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable()).optional();

const optionalId = z.preprocess(emptyToNull, z.string().trim().max(100).nullable()).optional();

const optionalBoolean = z
  .preprocess((value) => {
    if (value === true || value === 'true' || value === '1' || value === 1 || value === 'on') {
      return true;
    }
    if (value === false || value === 'false' || value === '0' || value === 0) return false;
    return value;
  }, z.boolean())
  .optional();

function normalizeDateString(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  return match ? match[1] : trimmed;
}

function isDateOnly(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine(isDateOnly, 'Use a valid calendar date');

const optionalDate = z.preprocess(normalizeDateString, dateOnly.nullable()).optional();

const optionalMonths = z
  .preprocess(
    emptyToNull,
    z.coerce
      .number()
      .int('Use whole months')
      .min(1, 'Use at least 1 month')
      .max(240, 'Use 240 months or fewer')
      .nullable()
  )
  .optional();

function normalizeUrl(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const optionalHttpUrl = z
  .preprocess(
    normalizeUrl,
    z
      .string()
      .trim()
      .max(2000)
      .refine((value) => /^https?:\/\//i.test(value), 'Use an http(s) URL')
      .nullable()
  )
  .optional();

const applianceFields = {
  name: optionalText(300),
  make: optionalText(200),
  model: optionalText(200),
  serial: optionalText(200),
  location: optionalText(300),
  category: optionalText(200),
  section_id: optionalId,
  section_slug: optionalText(80),
  installed_on: optionalDate,
  warranty_until: optionalDate,
  service_interval_months: optionalMonths,
  service_next_due: optionalDate,
  supplier: optionalText(300),
  manual_url: optionalHttpUrl,
  pinned: optionalBoolean,
  body: z.string().max(2_000_000).optional()
};

export const applianceCreateSchema = z
  .object(applianceFields)
  .refine(
    (value) =>
      Boolean(value.name?.trim()) || (Boolean(value.make?.trim()) && Boolean(value.model?.trim())),
    { message: 'Provide a name, or both make and model', path: ['name'] }
  );

export const applianceUpdateSchema = z
  .object(applianceFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update'
  });

export const pageCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  body: z.string().max(2_000_000).optional(),
  section_id: optionalId,
  section_slug: optionalText(80),
  pinned: optionalBoolean
});

export const pageUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    body: z.string().max(2_000_000).optional(),
    section_id: optionalId,
    section_slug: optionalText(80),
    pinned: optionalBoolean
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update'
  });

export const sectionCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().trim().max(4000).optional(),
  icon: z
    .string()
    .optional()
    .refine((value) => !value || isSectionIcon(value), {
      message: `Use one of: ${sectionIcons.join(', ')}`
    })
});

export const sectionUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(4000).optional(),
    icon: z
      .string()
      .optional()
      .refine((value) => !value || isSectionIcon(value), {
        message: `Use one of: ${sectionIcons.join(', ')}`
      })
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update'
  });

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  category: z.string().trim().max(100).optional(),
  interval_months: optionalMonths,
  next_due: optionalDate,
  last_done: optionalDate,
  notes: z.string().trim().max(10_000).optional()
});

export const taskUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    category: z.string().trim().max(100).optional(),
    interval_months: optionalMonths,
    next_due: optionalDate,
    last_done: optionalDate,
    notes: z.string().trim().max(10_000).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update'
  });

export const serviceCreateSchema = z.object({
  performed_on: optionalDate,
  kind: z
    .enum(['service', 'repair', 'inspection', 'install', 'other'])
    .optional(),
  engineer: z.string().trim().max(200).optional(),
  company: z.string().trim().max(300).optional(),
  cost: z.preprocess(emptyToUndefined, z.coerce.number().min(0).max(1_000_000).optional()),
  notes: z.string().trim().max(10_000).optional(),
  next_due: optionalDate
});

export const attachmentKindSchema = z.enum(['document', 'photo', 'receipt']);
