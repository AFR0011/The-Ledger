import { useLedger } from '../../app/LedgerProvider';

const STATUS_TONE: Record<'migrated' | 'unavailable' | 'corrupted', string> = {
  migrated: 'border-[var(--border-subtle)] bg-[var(--success-soft)] text-[var(--success-ink)]',
  unavailable: 'border-[var(--border-subtle)] bg-[var(--warning-soft)] text-[var(--warning-ink)]',
  corrupted: 'border-[var(--border-subtle)] bg-[var(--danger-soft)] text-[var(--danger-ink)]'
};

export function StatusBanner() {
  const { status } = useLedger();

  if (status.state === 'ready') {
    return null;
  }

  return (
    <div className={`rounded-xl border px-4 py-3 text-[13px] leading-6 shadow-panel ${STATUS_TONE[status.state]}`}>
      {status.message}
    </div>
  );
}
