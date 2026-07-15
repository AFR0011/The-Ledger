import { useEffect, useId, useRef } from 'react';
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
  const promptId = useId();
  const helperId = `${promptId}-helper`;
  const counterId = `${promptId}-counter`;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [step]);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-panel" data-focus-target>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
        Step {step} of {total}
      </p>
      <h2
        className="mt-3 max-w-3xl text-[clamp(1.75rem,3vw,2.5rem)] font-[510] leading-[1.02] tracking-[-0.04em] text-[var(--ink)]"
        id={promptId}
      >
        {prompt.label} {prompt.required === false ? <span className="text-[0.55em] font-normal text-[var(--muted)]">Optional</span> : null}
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]" id={helperId}>
        {prompt.helperText}
      </p>

      <label className="sr-only" htmlFor={`${promptId}-field`}>
        {prompt.label}
      </label>
      <textarea
        aria-describedby={`${helperId} ${counterId}`}
        aria-labelledby={promptId}
        className="mt-6 min-h-64 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-4 text-[16px] leading-7 text-[var(--ink)] outline-none placeholder:text-[var(--muted-quiet)] focus:border-[var(--accent-border)] focus:shadow-focus"
        id={`${promptId}-field`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={prompt.placeholder}
        ref={textareaRef}
        value={value}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
        <span>Write it plainly.</span>
        <span aria-live="polite" id={counterId}>
          {value.trim().length} characters
        </span>
      </div>
    </section>
  );
}
