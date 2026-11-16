const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

const shortDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});

const monthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric'
});

const monthShortFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: '2-digit'
});

function parseDate(value: string): Date {
  // Date-only strings are treated as local dates. `new Date('2026-11-16')`
  // would otherwise be parsed as UTC midnight and could display as the day
  // before in some timezones.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = parseDate(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = parseDate(iso);
  return Number.isNaN(date.getTime()) ? '—' : shortDateFormatter.format(date);
}

export function formatMonth(iso: string | null | undefined): string {
  if (!iso) return 'Later';
  const date = parseDate(iso);
  return Number.isNaN(date.getTime()) ? 'Later' : monthFormatter.format(date);
}

export function formatMonthShort(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = parseDate(iso);
  return Number.isNaN(date.getTime()) ? '' : monthShortFormatter.format(date);
}

/** Today's date as YYYY-MM-DD in local time. */
export function isoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Add whole months to a date-only value, clamping to the end of the month. */
export function addMonths(iso: string, months: number): string {
  if (!iso) return '';
  const date = parseDate(iso);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return isoDate(target);
}

/** Whole days from today (or `from`) until a date. Negative means past. */
export function daysUntil(iso: string, from = isoDate()): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const start = parseDate(from);
  const end = parseDate(iso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export type DueState = 'overdue' | 'soon' | 'later' | 'none';

export function dueState(iso: string, soonDays = 30, from = isoDate()): DueState {
  if (!iso) return 'none';
  const days = daysUntil(iso, from);
  if (!Number.isFinite(days)) return 'none';
  if (days < 0) return 'overdue';
  if (days <= soonDays) return 'soon';
  return 'later';
}

export function dueLabel(iso: string, soonDays = 30): string {
  const state = dueState(iso, soonDays);
  if (state === 'none') return 'No date set';
  if (state === 'overdue') {
    const days = Math.abs(daysUntil(iso));
    return days === 0 ? 'Due today' : `Overdue by ${days} day${days === 1 ? '' : 's'}`;
  }
  const days = daysUntil(iso);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= soonDays) return `Due in ${days} days`;
  return `Due ${formatShortDate(iso)}`;
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const date = parseDate(iso);
  if (Number.isNaN(date.getTime())) return 'never';

  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor((Date.now() - date.getTime()) / day);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }
  return formatShortDate(iso);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function todayLong(): string {
  return dateFormatter.format(new Date());
}
