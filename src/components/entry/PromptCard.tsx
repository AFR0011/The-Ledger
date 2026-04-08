import type { PromptItem } from '../../config/prompts';

export function PromptCard({
  prompt,
  step,
  total,
  value,
  onChange
}: {
  prompt: PromptItem;
  step: number;
  total: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-panel">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
        Step {step} of {total}
      </p>
      <h2 className="mt-3 max-w-3xl text-[clamp(1.75rem,3vw,2.5rem)] font-[510] leading-[1.02] tracking-[-0.04em] text-[var(--ink)]">
        {prompt.label}
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">{prompt.helperText}</p>

      <textarea
        className="mt-6 min-h-60 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-4 text-[16px] leading-7 text-[var(--ink)] outline-none placeholder:text-[var(--muted-quiet)] focus:border-[var(--accent-border)] focus:shadow-focus"
        onChange={(event) => onChange(event.target.value)}
        placeholder={prompt.placeholder}
        value={value}
      />
      <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
        <span>Write it plainly.</span>
        <span>{value.trim().length} characters</span>
      </div>
    </section>
  );
}
