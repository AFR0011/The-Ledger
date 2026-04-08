import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import type { DraftEntry, LedgerData, LedgerEntry, StorageStatus, ThemeMode } from '../types/ledger';
import { exportLedgerData, parseLedgerImport } from '../services/backup';
import {
  commitDraft,
  createDraft,
  deleteEntry,
  getEntryById,
  saveDraft as persistDraftState,
  updateSettings
} from '../services/ledgerRepository';
import { loadLedgerData, saveLedgerData } from '../services/ledgerStorage';

interface LedgerContextValue {
  data: LedgerData;
  status: StorageStatus;
  resolvedTheme: 'light' | 'dark';
  getEntry: (entryId: string) => LedgerEntry | undefined;
  createDraftForType: (type: DraftEntry['type'], entry?: LedgerEntry) => DraftEntry;
  saveDraft: (type: DraftEntry['type'], draft: DraftEntry) => void;
  discardDraft: (type: DraftEntry['type']) => void;
  commitDraft: (type: DraftEntry['type'], draft: DraftEntry) => LedgerEntry;
  deleteEntry: (entryId: string) => void;
  updateTheme: (theme: ThemeMode) => void;
  updateAutosave: (autosave: boolean) => void;
  exportData: () => string;
  importData: (rawText: string) => void;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function LedgerProvider({ children }: { children: ReactNode }) {
  const initialState = useMemo(() => loadLedgerData(), []);
  const [data, setData] = useState(initialState.data);
  const [status, setStatus] = useState(initialState.status);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemTheme());
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme = data.settings.theme === 'system' ? systemTheme : data.settings.theme;

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const persist = useCallback((producer: (current: LedgerData) => LedgerData) => {
    let nextState: LedgerData | undefined;
    setData((current) => {
      nextState = producer(current);
      if (nextState) {
        setStatus(saveLedgerData(nextState));
      }
      return nextState ?? current;
    });
    return nextState ?? dataRef.current;
  }, []);

  const getEntry = useCallback((entryId: string) => getEntryById(data, entryId), [data]);
  const createDraftForType = useCallback((type: DraftEntry['type'], entry?: LedgerEntry) => createDraft(type, entry), []);
  const saveDraft = useCallback((type: DraftEntry['type'], draft: DraftEntry) => {
    persist((current) => persistDraftState(current, type, draft));
  }, [persist]);
  const discardDraftForType = useCallback((type: DraftEntry['type']) => {
    persist((current) => {
      const drafts = { ...current.drafts };
      delete drafts[type];
      return {
        ...current,
        drafts
      };
    });
  }, [persist]);
  const commitDraftForType = useCallback((type: DraftEntry['type'], draft: DraftEntry) => {
    let committedEntry: LedgerEntry | undefined;
    persist((current) => {
      const committed = commitDraft(current, type, draft);
      committedEntry = committed.entry;
      return committed.data;
    });
    if (!committedEntry) {
      throw new Error('Commit failed because the draft could not be saved.');
    }
    return committedEntry;
  }, [persist]);
  const deleteEntryById = useCallback((entryId: string) => {
    persist((current) => deleteEntry(current, entryId));
  }, [persist]);
  const updateTheme = useCallback((theme: ThemeMode) => {
    persist((current) => updateSettings(current, { theme }));
  }, [persist]);
  const updateAutosave = useCallback((autosave: boolean) => {
    persist((current) => updateSettings(current, { autosave }));
  }, [persist]);
  const importData = useCallback((rawText: string) => {
    const imported = parseLedgerImport(rawText);
    persist(() => imported.data);
  }, [persist]);

  const value = useMemo<LedgerContextValue>(
    () => ({
      data,
      status,
      resolvedTheme,
      getEntry,
      createDraftForType,
      saveDraft,
      discardDraft: discardDraftForType,
      commitDraft: commitDraftForType,
      deleteEntry: deleteEntryById,
      updateTheme,
      updateAutosave,
      exportData: () => exportLedgerData(data),
      importData
    }),
    [
      commitDraftForType,
      createDraftForType,
      data,
      deleteEntryById,
      discardDraftForType,
      getEntry,
      importData,
      resolvedTheme,
      saveDraft,
      status,
      updateAutosave,
      updateTheme
    ]
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger() {
  const context = useContext(LedgerContext);

  if (!context) {
    throw new Error('useLedger must be used inside LedgerProvider.');
  }

  return context;
}
