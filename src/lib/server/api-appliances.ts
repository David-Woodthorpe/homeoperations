import { ApiError } from './errors';
import { applianceToValues } from './appliance-form';
import {
  createAppliance,
  getAppliance,
  listServiceRecords,
  updateAppliance
} from './appliances';
import { listAttachments } from './attachments';
import { defaultsForCreate } from './api-serialize';
import {
  getSection,
  getSectionBySlug,
  listSections
} from './sections';
import type { ApplianceInput, ApplianceRow, Section } from '$lib/types';

const CATEGORY_SECTIONS: Record<string, string> = {
  heating: 'Heating & Hot Water',
  'hot water': 'Heating & Hot Water',
  boiler: 'Heating & Hot Water',
  ventilation: 'Ventilation & Air',
  air: 'Ventilation & Air',
  electrical: 'Electrical',
  electricity: 'Electrical',
  solar: 'Electrical',
  water: 'Water & Drainage',
  drainage: 'Water & Drainage',
  plumbing: 'Water & Drainage',
  kitchen: 'Kitchen',
  laundry: 'Laundry & Utility',
  utility: 'Laundry & Utility',
  'smart home': 'Smart Home & Network',
  network: 'Smart Home & Network',
  wifi: 'Smart Home & Network',
  security: 'Security & Alarms',
  alarm: 'Security & Alarms',
  garden: 'Garden & Exterior',
  exterior: 'Garden & Exterior',
  other: 'Other',
  misc: 'Other'
};

export type SectionChoice = {
  section_id?: string | null;
  section_slug?: string | null;
  category?: string | null;
};

function findByName(sections: Section[], name: string): Section | undefined {
  const wanted = name.trim().toLowerCase();
  return sections.find((section) => section.name.toLowerCase() === wanted);
}

export function resolveSectionChoice(choice: SectionChoice, preferredName = 'House Essentials'): Section {
  if (choice.section_id) {
    const section = getSection(choice.section_id);
    if (!section) {
      throw new ApiError(400, 'unknown_section', 'No section exists with that section_id.');
    }
    return section;
  }

  if (choice.section_slug) {
    const section = getSectionBySlug(choice.section_slug);
    if (!section) {
      throw new ApiError(400, 'unknown_section', 'No section exists with that section_slug.');
    }
    return section;
  }

  const sections = listSections();
  if (sections.length === 0) {
    throw new ApiError(
      409,
      'no_sections',
      'The manual has no sections. Create one with POST /api/v1/sections first.'
    );
  }

  const category = (choice.category ?? '').trim().toLowerCase();
  if (category) {
    const mapped = CATEGORY_SECTIONS[category];
    if (mapped) {
      const section = findByName(sections, mapped);
      if (section) return section;
    }
  }

  const preferred = findByName(sections, preferredName);
  if (preferred) return preferred;

  const unsorted = getSectionBySlug('unsorted');
  return unsorted ?? sections[0];
}

export function createApplianceFromApi(input: Record<string, unknown>): ApplianceRow {
  const values = defaultsForCreate(input as Parameters<typeof defaultsForCreate>[0]);
  const section = resolveSectionChoice(
    {
      section_id: (input.section_id as string | null | undefined) ?? null,
      section_slug: (input.section_slug as string | null | undefined) ?? null,
      category: values.category
    },
    'House Essentials'
  );
  values.section_id = section.id;

  if (!values.title) {
    throw new ApiError(400, 'name_required', 'Provide a name, or both make and model.');
  }

  const page = createAppliance(values);
  return getAppliance(page.id)!;
}

export function updateApplianceFromApi(
  id: string,
  input: Record<string, unknown>
): ApplianceRow {
  const existing = getAppliance(id);
  if (!existing) throw new ApiError(404, 'not_found', 'No appliance exists with that id.');

  const values = applianceToValues(existing);
  const has = (key: string) => Object.hasOwn(input, key);
  const text = (key: keyof ApplianceInput, field: string) => {
    if (!has(field)) return;
    const value = input[field];
    if (value === null || value === undefined) {
      (values[key] as string) = '';
    } else {
      (values[key] as string) = String(value).trim();
    }
  };

  if (has('name') && typeof input.name === 'string' && input.name.trim()) {
    values.title = input.name.trim();
  }
  text('category', 'category');
  text('make', 'make');
  text('model', 'model');
  text('serial', 'serial');
  text('location', 'location');
  text('supplier', 'supplier');
  text('manual_url', 'manual_url');
  text('installed_on', 'installed_on');
  text('warranty_until', 'warranty_until');

  if (has('body') && typeof input.body === 'string') values.body = input.body;
  if (has('pinned')) values.pinned = Boolean(input.pinned);

  if (has('service_interval_months')) {
    const value = input.service_interval_months;
    values.service_interval_months =
      value === null || value === undefined || value === '' ? null : Number(value);
  }

  if (has('service_next_due')) {
    const value = input.service_next_due;
    values.service_next_due =
      value === null || value === undefined ? '' : String(value);
  }

  if (has('section_id') || has('section_slug')) {
    const section = resolveSectionChoice(
      {
        section_id: (input.section_id as string | null | undefined) ?? null,
        section_slug: (input.section_slug as string | null | undefined) ?? null,
        category: values.category
      },
      'House Essentials'
    );
    values.section_id = section.id;
  }

  if (!values.title.trim()) {
    throw new ApiError(400, 'name_required', 'An appliance needs a name.');
  }

  updateAppliance(id, values);
  return getAppliance(id)!;
}

export function getApplianceDetail(id: string) {
  const appliance = getAppliance(id);
  if (!appliance) throw new ApiError(404, 'not_found', 'No appliance exists with that id.');
  return {
    appliance,
    attachments: listAttachments(appliance.id),
    serviceRecords: listServiceRecords(appliance.id)
  };
}
