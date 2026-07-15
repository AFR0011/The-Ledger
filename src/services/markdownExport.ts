import { getEntryBlueprint } from '../config/prompts';
import type { LedgerEntry } from '../types/ledger';

export const FRONTMATTER_START = '# ledger-managed:start';
export const FRONTMATTER_END = '# ledger-managed:end';
export const BODY_START = '<!-- ledger-managed-body:start -->';
export const BODY_END = '<!-- ledger-managed-body:end -->';

export interface MergeResult {
  status: 'created' | 'updated' | 'conflict';
  content?: string;
  reason?: string;
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function titleFor(entry: LedgerEntry): string {
  return entry.headline.trim() ? `${entry.date} — ${entry.headline.trim()}` : entry.type === 'monthly' ? entry.periodLabel : entry.date;
}

export function entryMarkdownPath(entry: LedgerEntry): string {
  if (entry.type === 'daily') {
    const [year, month] = entry.date.split('-');
    return `04 Journal/Daily/${year}/${month}/${entry.date}.md`;
  }
  if (entry.type === 'monthly') {
    const [year] = entry.periodKey.split('-');
    return `01 Direction/Reviews/Monthly/${year}/${entry.periodKey} Monthly Review.md`;
  }
  throw new Error('Weekly entries belong to ContextOS and cannot be published to LifeOS.');
}

function managedFrontmatter(entry: LedgerEntry): string {
  const areas = entry.domainTags.length ? `areas:\n${entry.domainTags.map((tag) => `  - ${yamlString(tag)}`).join('\n')}` : 'areas: []';
  const tags = entry.stateTags.length ? `tags:\n${entry.stateTags.map((tag) => `  - ${yamlString(tag)}`).join('\n')}` : 'tags: []';
  const type = entry.type === 'monthly' ? 'review' : 'journal';
  const cadence = entry.type === 'monthly' ? '\ncadence: monthly\nperiod: ' + yamlString(entry.periodKey) : '\ndate: ' + yamlString(entry.date);
  return [
    FRONTMATTER_START,
    `type: ${type}`,
    'status: complete',
    cadence.trimStart(),
    areas,
    'project: ""',
    `created: ${yamlString(entry.createdAt.slice(0, 10))}`,
    `updated: ${yamlString(entry.updatedAt.slice(0, 10))}`,
    'sensitivity: private',
    tags,
    'source: ledger',
    `source_id: ${yamlString(entry.id)}`,
    `source_updated_at: ${yamlString(entry.updatedAt)}`,
    FRONTMATTER_END
  ].join('\n');
}

function managedBody(entry: LedgerEntry): string {
  const blueprint = getEntryBlueprint(entry.type, entry.promptVersion);
  const known = new Set(blueprint.prompts.map((prompt) => prompt.key));
  const sections = blueprint.prompts
    .filter((prompt) => entry.answers[prompt.key]?.trim())
    .map((prompt) => `## ${prompt.label.replace(/\?$/u, '')}\n\n${entry.answers[prompt.key].trim()}`);
  const legacy = Object.entries(entry.answers)
    .filter(([key, answer]) => !known.has(key) && answer.trim())
    .map(([key, answer]) => `### ${key.replace(/_/gu, ' ')}\n\n${answer.trim()}`);
  if (legacy.length) sections.push(`## Legacy responses\n\n${legacy.join('\n\n')}`);
  return `${BODY_START}\n${sections.join('\n\n')}\n${BODY_END}`;
}

export function renderEntryMarkdown(entry: LedgerEntry): string {
  if (entry.type === 'weekly') throw new Error('Weekly entries cannot be rendered as LifeOS notes.');
  return `---\n${managedFrontmatter(entry)}\n---\n\n# ${titleFor(entry)}\n\n${managedBody(entry)}\n\n## Notes and Agent Suggestions\n\n`;
}

function between(content: string, start: string, end: string): string | null {
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) return null;
  return content.slice(startIndex, endIndex + end.length);
}

function replaceRegion(content: string, start: string, end: string, replacement: string): string {
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end, startIndex + start.length);
  return content.slice(0, startIndex) + replacement + content.slice(endIndex + end.length);
}

export function mergeLedgerMarkdown(existing: string | null, generated: string, sourceId: string, allowUnmanaged = false): MergeResult {
  if (existing === null) return { status: 'created', content: generated };
  const generatedFront = between(generated, FRONTMATTER_START, FRONTMATTER_END)!;
  const generatedBody = between(generated, BODY_START, BODY_END)!;
  const existingFront = between(existing, FRONTMATTER_START, FRONTMATTER_END);
  const existingBody = between(existing, BODY_START, BODY_END);

  if (existingFront || existingBody) {
    if (!existingFront || !existingBody) return { status: 'conflict', reason: 'The file contains incomplete Ledger markers.' };
    const sourceMatch = /source_id:\s*["']?([^\s"']+)/u.exec(existingFront);
    if (!sourceMatch || sourceMatch[1] !== sourceId) return { status: 'conflict', reason: 'The file belongs to a different Ledger entry.' };
    return {
      status: 'updated',
      content: replaceRegion(replaceRegion(existing, FRONTMATTER_START, FRONTMATTER_END, generatedFront), BODY_START, BODY_END, generatedBody)
    };
  }

  if (!allowUnmanaged) return { status: 'conflict', reason: 'An unmanaged LifeOS note already exists at this path.' };
  const frontmatterMatch = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(existing);
  const withFrontmatter = frontmatterMatch
    ? existing.replace(frontmatterMatch[0], `---\n${frontmatterMatch[1]}\n${generatedFront}\n---`)
    : `---\n${generatedFront}\n---\n\n${existing}`;
  return { status: 'updated', content: `${withFrontmatter.trimEnd()}\n\n${generatedBody}\n` };
}

export function eligibleEntries(entries: LedgerEntry[]): LedgerEntry[] {
  return entries.filter((entry) => entry.type !== 'weekly' && !entry.legacyDuplicateOf);
}
