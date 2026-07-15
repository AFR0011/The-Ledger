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
import type {
  CommitmentStatus,
  DraftEntry,
  HandoffCandidate,
  HandoffKind,
  HandoffStatus,
  HandoffTarget,
  LedgerCommitment,
  LedgerData,
  LedgerEntry,
  PublicationRecord,
  StorageStatus,
  ThemeMode
} from '../types/ledger';
import { exportLedgerData } from '../services/backup';
import {
  commitDraft,
  createCommitment,
  createHandoffCandidate,
  createDraft,
  deleteEntry,
  getEntryById,
  getCanonicalEntryForPeriod,
  saveDraft as persistDraftState,
  replaceLedgerData,
  updateCommitmentStatus,
  updateEntryPublication,
  updateHandoffStatus,
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
  createCommitment: (entryId: string, text: string, duePeriod?: string) => LedgerCommitment;
  updateCommitmentStatus: (commitmentId: string, status: CommitmentStatus) => void;
  updateTheme: (theme: ThemeMode) => void;
  updateAutosave: (autosave: boolean) => void;
  updateIntegrationUrls: (contextOsUrl: string, socialOsUrl: string) => void;
  createHandoff: (entryId: string, input: { target: HandoffTarget; kind: HandoffKind; title: string; body: string; area?: string }) => HandoffCandidate;
  updateHandoffStatus: (id: string, status: HandoffStatus) => void;
  updatePublication: (entryId: string, publication: PublicationRecord) => void;
  exportData: () => string;
  replaceData: (nextData: LedgerData) => void;
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
    const nextState = producer(dataRef.current);
    dataRef.current = nextState;
    setStatus(saveLedgerData(nextState));
    setData(nextState);
    return nextState;
  }, []);

  const getEntry = useCallback((entryId: string) => getEntryById(data, entryId), [data]);
  const createDraftForType = useCallback((type: DraftEntry['type'], entry?: LedgerEntry) => {
    const canonical = entry ?? getCanonicalEntryForPeriod(dataRef.current, type);
    return createDraft(type, canonical);
  }, []);
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
  const createCommitmentFromEntry = useCallback((entryId: string, text: string, duePeriod?: string) => {
    let nextCommitment: LedgerCommitment | undefined;
    persist((current) => {
      const committed = createCommitment(current, entryId, text, duePeriod);
      nextCommitment = committed.commitment;
      return committed.data;
    });
    if (!nextCommitment) {
      throw new Error('Commitment could not be saved.');
    }
    return nextCommitment;
  }, [persist]);
  const updateCommitmentById = useCallback((commitmentId: string, commitmentStatus: CommitmentStatus) => {
    persist((current) => updateCommitmentStatus(current, commitmentId, commitmentStatus));
  }, [persist]);
  const updateTheme = useCallback((theme: ThemeMode) => {
    persist((current) => updateSettings(current, { theme }));
  }, [persist]);
  const updateAutosave = useCallback((autosave: boolean) => {
    persist((current) => updateSettings(current, { autosave }));
  }, [persist]);
  const updateIntegrationUrls = useCallback((contextOsUrl: string, socialOsUrl: string) => {
    persist((current) => updateSettings(current, { contextOsUrl: contextOsUrl.trim(), socialOsUrl: socialOsUrl.trim() }));
  }, [persist]);
  const createHandoff = useCallback((entryId: string, input: { target: HandoffTarget; kind: HandoffKind; title: string; body: string; area?: string }) => {
    let candidate: HandoffCandidate | undefined;
    persist((current) => {
      const result = createHandoffCandidate(current, { ...input, sourceEntryId: entryId });
      candidate = result.candidate;
      return result.data;
    });
    if (!candidate) throw new Error('Handoff could not be created.');
    return candidate;
  }, [persist]);
  const updateHandoff = useCallback((id: string, handoffStatus: HandoffStatus) => {
    persist((current) => updateHandoffStatus(current, id, handoffStatus));
  }, [persist]);
  const updatePublication = useCallback((entryId: string, publication: PublicationRecord) => {
    persist((current) => updateEntryPublication(current, entryId, publication));
  }, [persist]);
  const replaceData = useCallback((nextData: LedgerData) => {
    persist(() => replaceLedgerData(nextData));
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
      createCommitment: createCommitmentFromEntry,
      updateCommitmentStatus: updateCommitmentById,
      updateTheme,
      updateAutosave,
      updateIntegrationUrls,
      createHandoff,
      updateHandoffStatus: updateHandoff,
      updatePublication,
      exportData: () => exportLedgerData(data),
      replaceData
    }),
    [
      commitDraftForType,
      createHandoff,
      createCommitmentFromEntry,
      createDraftForType,
      data,
      deleteEntryById,
      discardDraftForType,
      getEntry,
      replaceData,
      resolvedTheme,
      saveDraft,
      status,
      updateCommitmentById,
      updateAutosave,
      updateHandoff,
      updateIntegrationUrls,
      updatePublication,
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
