export function TagGroupField({
  label,
  description,
  options,
  selected,
  onToggle
}: {
  label: string;
  description: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] p-4">
      <div>
        <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">{label}</h3>
        <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              className={[
                'rounded-full border px-3 py-2 text-[12px] font-medium transition',
                active
                  ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-bright)]'
                  : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--panel)] hover:text-[var(--ink)]'
              ].join(' ')}
              onClick={() => onToggle(option)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>
    </section>
  );
}
