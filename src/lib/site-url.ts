/**
 * Safe, trusted canonical site origin resolution.
 * Primary production domain: https://teleera.turbobits.in
 *
 * Configurable via trusted environment variables (NEXT_PUBLIC_SITE_URL or SITE_URL).
 * Never uses untrusted incoming HTTP request headers (x-forwarded-host, etc.) for canonical generation.
 */

export const PRIMARY_PRODUCTION_ORIGIN = 'https://teleera.turbobits.in';

/**
 * Returns the sanitized site origin (e.g. 'https://teleera.turbobits.in').
 */
export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Allow local development on localhost/127.0.0.1
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
      return window.location.origin;
    }
    // On any external browser deployment (preview, Vercel branch, etc.), always enforce official production origin
    return PRIMARY_PRODUCTION_ORIGIN;
  }

  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (envUrl && envUrl.trim() !== '') {
    const cleaned = envUrl.trim().replace(/\/+$/, '');
    // If set to localhost/127.0.0.1 in development, keep local development working
    if (cleaned.includes('localhost') || cleaned.includes('127.0.0.1')) {
      return cleaned;
    }
    return PRIMARY_PRODUCTION_ORIGIN;
  }
  return PRIMARY_PRODUCTION_ORIGIN;
}

/**
 * Converts a relative path into a fully qualified absolute canonical URL.
 * e.g. getAbsoluteUrl('/competitions/ideathon') => 'https://teleera.turbobits.in/competitions/ideathon'
 */
export function getAbsoluteUrl(path: string = '/'): string {
  const base = getSiteUrl();
  if (!path || path === '/') {
    return base;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
