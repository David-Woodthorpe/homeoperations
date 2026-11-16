import { applianceCategories } from '$lib/seed-sections';
import type { ApplianceInput, PageWithSection } from '$lib/types';

function text(form: FormData, name: string): string {
  return String(form.get(name) ?? '').trim();
}

function date(form: FormData, name: string): string {
  const value = text(form, name);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
}

function months(form: FormData, name: string): number | null {
  const raw = text(form, name);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

function url(form: FormData, name: string): string {
  const value = text(form, name);
  if (!value) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  return `https://${value}`;
}

export function readApplianceForm(form: FormData): ApplianceInput {
  return {
    title: text(form, 'title'),
    section_id: text(form, 'section_id'),
    body: String(form.get('body') ?? ''),
    pinned: form.get('pinned') === '1',
    category: text(form, 'category'),
    make: text(form, 'make'),
    model: text(form, 'model'),
    serial: text(form, 'serial'),
    location: text(form, 'location'),
    installed_on: date(form, 'installed_on'),
    warranty_until: date(form, 'warranty_until'),
    service_interval_months: months(form, 'service_interval_months'),
    service_next_due: date(form, 'service_next_due'),
    supplier: text(form, 'supplier'),
    manual_url: url(form, 'manual_url')
  };
}

export function applianceToValues(page: PageWithSection): ApplianceInput {
  return {
    title: page.title,
    section_id: page.section_id,
    body: page.body,
    pinned: page.pinned === 1,
    category: page.category,
    make: page.make,
    model: page.model,
    serial: page.serial,
    location: page.location,
    installed_on: page.installed_on,
    warranty_until: page.warranty_until,
    service_interval_months: page.service_interval_months,
    service_next_due: page.service_next_due,
    supplier: page.supplier,
    manual_url: page.manual_url
  };
}

export function categoryOptions(used: string[] = []): string[] {
  return [...new Set([...used, ...applianceCategories])];
}

export function safeReturn(value: string | null, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}
