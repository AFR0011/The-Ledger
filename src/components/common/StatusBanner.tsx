import { useLedger } from '../../app/LedgerProvider';

const STATUS_TONE: Record<'migrated' | 'unavailable' | 'corrupted' | 'conflicted', string> = {
  migrated: 'border-[var(--border-subtle)] bg-[var(--success-soft)] text-[var(--success-ink)]',
  unavailable: 'border-[var(--border-subtle)] bg-[var(--warning-soft)] text-[var(--warning-ink)]',
  corrupted: 'border-[var(--border-subtle)] bg-[var(--danger-soft)] text-[var(--danger-ink)]',
  conflicted: 'border-[var(--border-subtle)] bg-[var(--danger-soft)] text-[var(--danger-ink)]'
};

export function StatusBanner() {
  const { status } = useLedger();

  if (status.state === 'ready') {
    return null;
  }

  return (
    <div
      aria-live={status.state === 'migrated' ? 'polite' : 'assertive'}
      className={`rounded-xl border px-4 py-3 text-[13px] leading-6 shadow-panel ${STATUS_TONE[status.state]}`}
      role={status.state === 'migrated' ? 'status' : 'alert'}
    >
      {status.message}
    </div>
  );
}
