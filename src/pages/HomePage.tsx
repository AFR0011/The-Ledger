import { APP_PLAN } from '../config/roadmap';

export function HomePage() {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-slate-400">Private Ledger</p>
        <h1 className="text-2xl font-semibold">MVP Foundation Ready</h1>
        <p className="text-sm text-slate-300">
          Initial architecture, docs, and folder structure are in place for the React + Tailwind + localStorage build.
        </p>
      </header>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Build Phases</h2>
        <ul className="space-y-2 text-sm text-slate-200">
          {APP_PLAN.map((phase) => (
            <li key={phase.id}>
              <span className="font-medium">{phase.id}:</span> {phase.title}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
