import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { usePwa } from '../../app/usePwa';
import { StatusBanner } from './StatusBanner';

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/entries', label: 'Entries' },
  { to: '/review', label: 'Handoffs' },
  { to: '/threads', label: 'Threads' },
  { to: '/settings', label: 'Settings' }
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const onEntryRoute = location.pathname.startsWith('/entry/');
  const { applyUpdate, canInstall, dismissOfflineReady, dismissUpdate, installApp, offlineReady, updateAvailable } = usePwa();

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <a className="skip-link" href="#page-content">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[color:rgba(8,9,10,0.86)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <Link className="flex items-center gap-3" to="/">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-panel"
              >
                <span className="h-3 w-3 rounded-[4px] bg-[var(--accent-bright)] shadow-[0_0_18px_rgba(113,112,255,0.35)]" />
              </span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">The Ledger</p>
                <p className="text-[13px] text-[var(--text-secondary)]">Private reflective history</p>
              </div>
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-2 md:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  className={({ isActive }) =>
                    [
                      'rounded-md border px-3 py-2.5 text-[13px] font-medium',
                      isActive
                        ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--ink)]'
                        : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-[var(--panel-quiet)] hover:text-[var(--ink)]'
                    ].join(' ')
                  }
                  end={item.to === '/'}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canInstall ? (
              <button
                className="inline-flex min-h-11 items-center rounded-md border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-2.5 text-[13px] font-medium text-[var(--accent-bright)] hover:bg-[var(--panel)] hover:text-[var(--ink)]"
                onClick={() => {
                  void installApp();
                }}
                type="button"
              >
                Install app
              </button>
            ) : null}
            <Link
              aria-label="Open history and search entries"
              className="inline-flex min-h-11 items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-3 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--panel)] hover:text-[var(--ink)]"
              to="/entries"
            >
              <span>Search history</span>
              <span className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--muted-quiet)]">/</span>
            </Link>

            {!onEntryRoute ? (
              <Link
                className="inline-flex min-h-11 items-center rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[var(--accent-hover)]"
                to="/entry/daily"
              >
                New daily entry
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Workspace</p>
            <h1 className="mt-3 text-[clamp(2rem,4vw,4rem)] font-[510] leading-none tracking-[-0.04em]">
              Continuity without the clutter.
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--text-secondary)]">
              Offline-first daily reflection, durable LifeOS publishing, and proposal-first handoffs to the systems that own execution and people.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-quiet)] px-4 py-3 text-[13px] leading-6 text-[var(--muted)] max-sm:hidden">
            Entries are stored locally. Search, edit, and recover context without leaving the device.
          </div>
        </div>

        <div className="mb-5">
          <StatusBanner />
        </div>

        {updateAvailable ? (
          <section className="mb-5 rounded-xl border border-[var(--accent-border)] bg-[var(--panel)] px-4 py-4 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Update ready</p>
                <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
                  A newer app shell is cached and ready. Refresh into the latest build when you are done with the current step.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="min-h-11 rounded-md border border-[var(--accent-border)] bg-[var(--accent)] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[var(--accent-hover)]"
                  onClick={() => {
                    void applyUpdate();
                  }}
                  type="button"
                >
                  Refresh app
                </button>
                <button
                  className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]"
                  onClick={dismissUpdate}
                  type="button"
                >
                  Later
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {!updateAvailable && offlineReady ? (
          <section className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-4 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Offline shell ready</p>
                <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
                  The Ledger can now reopen without a network connection after this first successful load on the device.
                </p>
              </div>
              <button
                className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--panel-quiet)] px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]"
                onClick={dismissOfflineReady}
                type="button"
              >
                Dismiss
              </button>
            </div>
          </section>
        ) : null}

        <div className="space-y-5" id="page-content" tabIndex={-1}>
          {children}
        </div>

        <nav
          aria-label="Mobile"
          className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[color:rgba(15,16,17,0.94)] p-2 shadow-panel backdrop-blur-xl md:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                [
                  'flex min-h-11 flex-1 items-center justify-center rounded-xl border px-3 py-2.5 text-[13px] font-medium',
                  isActive
                    ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--ink)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-[var(--panel-quiet)] hover:text-[var(--ink)]'
                ].join(' ')
              }
              end={item.to === '/'}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
