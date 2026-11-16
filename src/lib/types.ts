export type Section = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SectionWithCount = Section & {
  page_count: number;
  appliance_count: number;
  last_updated: string | null;
};

export type PageKind = 'page' | 'appliance';

export type Page = {
  id: string;
  section_id: string;
  title: string;
  body: string;
  sort_order: number;
  pinned: number;
  kind: PageKind;
  category: string;
  make: string;
  model: string;
  serial: string;
  location: string;
  installed_on: string;
  warranty_until: string;
  service_interval_months: number | null;
  service_next_due: string;
  supplier: string;
  manual_url: string;
  created_at: string;
  updated_at: string;
};

export type PageWithSection = Page & {
  section_name: string;
  section_slug: string;
  section_icon: string;
  section_description: string;
};

export type PageListItem = {
  id: string;
  title: string;
  body: string;
  pinned: number;
  kind: PageKind;
  updated_at: string;
  sort_order: number;
  snippet: string;
};

export type Revision = {
  id: string;
  page_id: string;
  title: string;
  body: string;
  section_id: string;
  created_at: string;
};

export type AppSettings = {
  book_title: string;
  book_subtitle: string;
  prepared_by: string;
  cover_note: string;
  last_backup_at: string;
};

export type PageTitleIndexEntry = {
  id: string;
  title: string;
  slug: string;
};

export type PrintPage = PageWithSection;

export type AttachmentKind = 'document' | 'photo' | 'receipt';

export type Attachment = {
  id: string;
  page_id: string;
  filename: string;
  mime_type: string;
  size: number;
  kind: AttachmentKind;
  caption: string;
  created_at: string;
};

export type AttachmentWithData = Attachment & {
  data: Uint8Array;
};

export type ServiceRecord = {
  id: string;
  page_id: string;
  performed_on: string;
  kind: string;
  engineer: string;
  company: string;
  cost: number | null;
  notes: string;
  next_due: string;
  created_at: string;
};

export type MaintenanceTask = {
  id: string;
  title: string;
  category: string;
  interval_months: number | null;
  next_due: string;
  last_done: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ApplianceRow = PageWithSection & {
  attachment_count: number;
  last_service: string | null;
};

export type DueStatus = 'overdue' | 'soon' | 'later' | 'none';

export type ScheduleItem = {
  type: 'appliance' | 'task';
  id: string;
  title: string;
  subtitle: string;
  due: string;
  interval_months: number | null;
  last_done: string;
  status: DueStatus;
  href: string;
};

export type WarrantyItem = {
  id: string;
  title: string;
  warranty_until: string;
  section_name: string;
};

export type ApplianceInput = {
  title: string;
  section_id: string;
  body: string;
  pinned: boolean;
  category: string;
  make: string;
  model: string;
  serial: string;
  location: string;
  installed_on: string;
  warranty_until: string;
  service_interval_months: number | null;
  service_next_due: string;
  supplier: string;
  manual_url: string;
};
