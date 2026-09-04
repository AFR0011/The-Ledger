import { describe, expect, it } from 'vitest';
import { buildIntegrationUrl, normalizeIntegrationOrigin } from './integrationOrigins';

describe('integration origins', () => {
  it('normalizes HTTPS origins and loopback development origins', () => {
    expect(normalizeIntegrationOrigin(' https://context.example/ ')).toBe('https://context.example');
    expect(normalizeIntegrationOrigin('http://localhost:4173')).toBe('http://localhost:4173');
    expect(buildIntegrationUrl('https://context.example', '/reviews')).toBe('https://context.example/reviews');
  });

  it.each([
    'http://example.com',
    'javascript:alert(1)',
    'https://user:secret@example.com',
    'https://example.com/path',
    'https://example.com?next=elsewhere',
    'https://example.com/#fragment'
  ])('rejects unsafe or non-origin destination %s', (value) => {
    expect(() => normalizeIntegrationOrigin(value)).toThrow();
  });
});
