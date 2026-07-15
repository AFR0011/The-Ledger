import type { EntryType } from '../config/prompts';

const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function parseLocalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDisplayDate(value: string): string {
  return dayFormatter.format(parseLocalDate(value));
}

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function differenceInCalendarDays(laterDate: Date, earlierDate: Date): number {
  const later = Date.UTC(laterDate.getFullYear(), laterDate.getMonth(), laterDate.getDate());
  const earlier = Date.UTC(earlierDate.getFullYear(), earlierDate.getMonth(), earlierDate.getDate());
  return Math.max(Math.round((later - earlier) / 86_400_000), 0);
}

export function getWeekStart(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() + (day === 0 ? -6 : 1 - day));
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getPeriodKey(type: EntryType, date: Date): string {
  if (type === 'daily') return toIsoDate(date);
  if (type === 'weekly') return toIsoDate(getWeekStart(date));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function formatPeriodLabel(type: EntryType, date: Date): string {
  if (type === 'daily') return dayFormatter.format(date);
  if (type === 'weekly') return `Week of ${dayFormatter.format(getWeekStart(date))}`;
  return monthFormatter.format(date);
}

export function formatMissedDays(days: number): string {
  if (days <= 0) return 'No missed days since the last entry.';
  if (days === 1) return 'Missed 1 day since the last entry.';
  return `Missed ${days} days since the last entry.`;
}
