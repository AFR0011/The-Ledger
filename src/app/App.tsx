import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/common/AppShell';
import { EntryDetailPage } from '../pages/EntryDetailPage';
import { EntriesPage } from '../pages/EntriesPage';
import { EntryFlowPage } from '../pages/EntryFlowPage';
import { HomePage } from '../pages/HomePage';
import { SettingsPage } from '../pages/SettingsPage';
import { LedgerProvider } from './LedgerProvider';

function RootLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export function App() {
  return (
    <LedgerProvider>
      <HashRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/entry/:type" element={<EntryFlowPage />} />
            <Route path="/entries" element={<EntriesPage />} />
            <Route path="/entries/:entryId" element={<EntryDetailPage />} />
            <Route path="/entries/:entryId/edit" element={<EntryFlowPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Route>
        </Routes>
      </HashRouter>
    </LedgerProvider>
  );
}
