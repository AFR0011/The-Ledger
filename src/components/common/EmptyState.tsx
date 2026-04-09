import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section
      aria-labelledby="empty-state-title"
      className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-5 py-6 shadow-panel"
      data-focus-target
      role="region"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">State</p>
      <h2 className="mt-3 text-2xl font-[510] tracking-[-0.03em] text-[var(--ink)]" id="empty-state-title">
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--text-secondary)]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
