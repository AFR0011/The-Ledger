import type { HandoffCandidate, HandoffKind, HandoffTarget, LedgerEntry } from '../types/ledger';

export interface LifeOsHandoffV1 {
  schema: 'lifeos-handoff';
  version: 1;
  id: string;
  source: 'the-ledger' | 'lifeos' | 'contextos' | 'socialos';
  target: HandoffTarget;
  kind: HandoffKind;
  title: string;
  body: string;
  area?: string;
  sourceRef: {
    entryId?: string;
    entryType?: string;
    date?: string;
    lifeosPath?: string;
  };
  createdAt: string;
  sensitivity: 'private';
}

const HANDOFF_KINDS: HandoffKind[] = ['next-action', 'project-update', 'note', 'social-reflection', 'follow-up'];
const MAX_TITLE_LENGTH = 160;
const MAX_BODY_BYTES = 6_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function validateHandoff(value: unknown, expectedTarget?: HandoffTarget): LifeOsHandoffV1 {
  if (!isRecord(value) || value.schema !== 'lifeos-handoff' || value.version !== 1) {
    throw new Error('This handoff uses an unsupported schema or version.');
  }
  if (value.target !== 'contextos' && value.target !== 'socialos') throw new Error('The handoff target is invalid.');
  if (expectedTarget && value.target !== expectedTarget) throw new Error(`This handoff is not intended for ${expectedTarget}.`);
  if (!HANDOFF_KINDS.includes(value.kind as HandoffKind)) throw new Error('The handoff kind is invalid.');
  if (typeof value.id !== 'string' || !value.id.trim()) throw new Error('The handoff ID is missing.');
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.length > MAX_TITLE_LENGTH) {
    throw new Error(`The handoff title must be 1–${MAX_TITLE_LENGTH} characters.`);
  }
  if (typeof value.body !== 'string' || !value.body.trim() || new TextEncoder().encode(value.body).length > MAX_BODY_BYTES) {
    throw new Error(`The handoff body must be 1–6,000 UTF-8 bytes.`);
  }
  if (!isRecord(value.sourceRef) || typeof value.createdAt !== 'string' || value.sensitivity !== 'private') {
    throw new Error('The handoff metadata is incomplete.');
  }
  if (!['the-ledger', 'lifeos', 'contextos', 'socialos'].includes(String(value.source))) {
    throw new Error('The handoff source is invalid.');
  }
  return value as unknown as LifeOsHandoffV1;
}

export function encodeHandoff(payload: LifeOsHandoffV1): string {
  const valid = validateHandoff(payload);
  return bytesToBase64(new TextEncoder().encode(JSON.stringify(valid))).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '');
}

export function decodeHandoff(encoded: string, expectedTarget?: HandoffTarget): LifeOsHandoffV1 {
  const normalized = encoded.replace(/-/gu, '+').replace(/_/gu, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  try {
    return validateHandoff(JSON.parse(new TextDecoder().decode(base64ToBytes(padded))), expectedTarget);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('This handoff')) throw error;
    throw new Error('The handoff payload is malformed.');
  }
}

export function candidateToHandoff(candidate: HandoffCandidate, entry: LedgerEntry): LifeOsHandoffV1 {
  return validateHandoff({
    schema: 'lifeos-handoff',
    version: 1,
    id: candidate.id,
    source: 'the-ledger',
    target: candidate.target,
    kind: candidate.kind,
    title: candidate.title,
    body: candidate.body,
    area: candidate.area,
    sourceRef: { entryId: entry.id, entryType: entry.type, date: entry.date },
    createdAt: candidate.createdAt,
    sensitivity: 'private'
  });
}

export function buildHandoffUrl(baseUrl: string, route: string, payload: LifeOsHandoffV1): string {
  const base = baseUrl.trim().replace(/\/+$/u, '');
  return `${base}${route}#handoff=${encodeHandoff(payload)}`;
}

export function handoffFromFragment(fragment: string, expectedTarget?: HandoffTarget): LifeOsHandoffV1 {
  const params = new URLSearchParams(fragment.replace(/^#/u, ''));
  const encoded = params.get('handoff');
  if (!encoded) throw new Error('No handoff payload was provided.');
  return decodeHandoff(encoded, expectedTarget);
}
