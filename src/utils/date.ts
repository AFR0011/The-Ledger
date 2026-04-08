import type { EntryType } from '../config/prompts';

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
});

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric'
});

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatDisplayDate(value: string): string {
  return dayFormatter.format(new Date(value));
}

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function differenceInCalendarDays(laterDate: Date, earlierDate: Date): number {
  const later = Date.UTC(laterDate.getFullYear(), laterDate.getMonth(), laterDate.getDate());
  const earlier = Date.UTC(earlierDate.getFullYear(), earlierDate.getMonth(), earlierDate.getDate());

  return Math.max(Math.round((later - earlier) / 86_400_000), 0);
}

function getWeekStart(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + delta);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function formatPeriodLabel(type: EntryType, date: Date): string {
  if (type === 'daily') {
    return dayFormatter.format(date);
  }

  if (type === 'weekly') {
    return `Week of ${dayFormatter.format(getWeekStart(date))}`;
  }

  return monthFormatter.format(date);
}

export function formatMissedDays(days: number): string {
  if (days <= 0) {
    return 'No missed days since the last entry.';
  }

  if (days === 1) {
    return 'Missed 1 day since the last entry.';
  }

  return `Missed ${days} days since the last entry.`;
}
