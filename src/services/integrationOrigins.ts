function isLoopback(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function normalizeIntegrationOrigin(value: string): string {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Enter a complete integration origin, such as https://example.com.');
  }

  if (url.username || url.password) {
    throw new Error('Integration origins cannot include credentials.');
  }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopback(url.hostname))) {
    throw new Error('Integration origins must use HTTPS. HTTP is allowed only for loopback development.');
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Integration settings must be origins only, without a path, query, or fragment.');
  }

  return url.origin;
}

export function tryNormalizeIntegrationOrigin(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return normalizeIntegrationOrigin(value);
  } catch {
    return fallback;
  }
}

export function integrationHost(value: string): string {
  return new URL(normalizeIntegrationOrigin(value)).host;
}

export function buildIntegrationUrl(origin: string, route: string): string {
  const normalizedOrigin = normalizeIntegrationOrigin(origin);
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  return new URL(normalizedRoute, normalizedOrigin).toString();
}
