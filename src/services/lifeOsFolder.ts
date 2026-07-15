import type { LedgerEntry } from '../types/ledger';
import { eligibleEntries, entryMarkdownPath, mergeLedgerMarkdown, renderEntryMarkdown } from './markdownExport';

const DB_NAME = 'the-ledger-integrations-v1';
const STORE_NAME = 'handles';
const LIFEOS_HANDLE_KEY = 'lifeos-root';

export interface DirectionContext {
  currentSeason: string;
  annualOutcomes: string;
}

export interface PublishOutcome {
  entryId: string;
  path: string;
  status: 'created' | 'updated' | 'conflict' | 'failed';
  message?: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    tx.oncomplete = () => { db.close(); resolve((request.result as T | undefined) ?? null); };
    tx.onerror = () => { db.close(); reject(tx.error ?? request.error); };
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function directoryExists(root: FileSystemDirectoryHandle, path: string[]): Promise<boolean> {
  try {
    let current = root;
    for (const part of path) current = await current.getDirectoryHandle(part);
    return true;
  } catch {
    return false;
  }
}

async function fileExists(root: FileSystemDirectoryHandle, path: string[]): Promise<boolean> {
  try {
    let current = root;
    for (const part of path.slice(0, -1)) current = await current.getDirectoryHandle(part);
    await current.getFileHandle(path[path.length - 1]);
    return true;
  } catch {
    return false;
  }
}

export function supportsDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

export async function validateLifeOsRoot(root: FileSystemDirectoryHandle): Promise<void> {
  const hasObsidian = await directoryExists(root, ['.obsidian']);
  const hasBlueprint = await fileExists(root, ['03 Projects', 'LifeOS', 'BLUEPRINT.md']);
  if (!hasObsidian && !hasBlueprint) throw new Error('Choose the LifeOS vault root containing .obsidian or the LifeOS blueprint.');
}

export async function connectLifeOsFolder(): Promise<FileSystemDirectoryHandle> {
  if (!window.showDirectoryPicker) throw new Error('Connected-folder publishing requires desktop Chrome or Edge.');
  const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
  await validateLifeOsRoot(handle);
  await idbSet(LIFEOS_HANDLE_KEY, handle);
  return handle;
}

export async function loadLifeOsFolder(): Promise<FileSystemDirectoryHandle | null> {
  return idbGet<FileSystemDirectoryHandle>(LIFEOS_HANDLE_KEY);
}

export async function disconnectLifeOsFolder(): Promise<void> {
  await idbDelete(LIFEOS_HANDLE_KEY);
}

export async function ensureFolderPermission(handle: FileSystemDirectoryHandle, write = false): Promise<void> {
  const descriptor: FileSystemHandlePermissionDescriptor = { mode: write ? 'readwrite' : 'read' };
  const existing = await handle.queryPermission(descriptor);
  if (existing === 'granted') return;
  if (await handle.requestPermission(descriptor) !== 'granted') throw new Error('LifeOS folder permission was not granted.');
}

async function resolveDirectory(root: FileSystemDirectoryHandle, parts: string[], create: boolean): Promise<FileSystemDirectoryHandle> {
  let current = root;
  for (const part of parts) current = await current.getDirectoryHandle(part, { create });
  return current;
}

async function readText(root: FileSystemDirectoryHandle, path: string): Promise<string | null> {
  const parts = path.split('/');
  try {
    const directory = await resolveDirectory(root, parts.slice(0, -1), false);
    return await (await directory.getFileHandle(parts[parts.length - 1])).getFile().then((file) => file.text());
  } catch {
    return null;
  }
}

async function writeText(root: FileSystemDirectoryHandle, path: string, content: string): Promise<void> {
  const parts = path.split('/');
  const directory = await resolveDirectory(root, parts.slice(0, -1), true);
  const writable = await (await directory.getFileHandle(parts[parts.length - 1], { create: true })).createWritable();
  await writable.write(content);
  await writable.close();
}

export async function publishEntryToLifeOs(
  root: FileSystemDirectoryHandle,
  entry: LedgerEntry,
  allowUnmanaged = false,
  dryRun = false
): Promise<PublishOutcome> {
  const path = entryMarkdownPath(entry);
  try {
    await ensureFolderPermission(root, !dryRun);
    const existing = await readText(root, path);
    const merged = mergeLedgerMarkdown(existing, renderEntryMarkdown(entry), entry.id, allowUnmanaged);
    if (merged.status === 'conflict' || !merged.content) return { entryId: entry.id, path, status: 'conflict', message: merged.reason };
    if (!dryRun) await writeText(root, path, merged.content);
    return { entryId: entry.id, path, status: merged.status };
  } catch (error) {
    return { entryId: entry.id, path, status: 'failed', message: error instanceof Error ? error.message : 'Publishing failed.' };
  }
}

export async function publishAllToLifeOs(root: FileSystemDirectoryHandle, entries: LedgerEntry[], dryRun = false): Promise<PublishOutcome[]> {
  const outcomes: PublishOutcome[] = [];
  for (const entry of eligibleEntries(entries)) outcomes.push(await publishEntryToLifeOs(root, entry, false, dryRun));
  return outcomes;
}

export async function readDirectionContext(root: FileSystemDirectoryHandle, year = new Date().getFullYear()): Promise<DirectionContext> {
  await ensureFolderPermission(root, false);
  return {
    currentSeason: (await readText(root, '01 Direction/Current Season.md')) ?? '',
    annualOutcomes: (await readText(root, `01 Direction/Annual Outcomes/${year}.md`)) ?? ''
  };
}
