const TONES = {
  neutral: 'bg-[var(--panel-quiet)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  accent: 'bg-[var(--accent-soft)] text-[var(--accent-bright)] border-[var(--accent-border)]',
  warm: 'bg-[var(--success-soft)] text-[var(--success-ink)] border-[var(--border-subtle)]'
} as const;

export function TagPill({
  children,
  tone = 'neutral'
}: {
  children: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.06em]',
        TONES[tone]
      ].join(' ')}
    >
      {children}
    </span>
  );
}
