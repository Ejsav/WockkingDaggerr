// ============================================================
// OUTBOUND HTTP
// Every upstream call in this codebase goes through here so that
// no provider can hang a serverless function. A missing timeout
// is the difference between "the archive is stale" and "the site
// is down".
// ============================================================

export interface FetchOptions extends RequestInit {
  /** Abort after this many milliseconds. Default 8s. */
  timeoutMs?: number;
  /** Extra attempts after the first. Default 2. Only retries transient failures. */
  retries?: number;
}

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function backoffMs(attempt: number): number {
  // 250ms, 500ms, 1000ms … with jitter so parallel syncs do not resonate.
  return Math.round(250 * 2 ** attempt * (0.75 + Math.random() * 0.5));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch with a hard timeout and bounded retries.
 * Throws on network failure or exhausted retries; returns the Response
 * otherwise, including non-retryable error statuses (callers inspect `.ok`).
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeoutMs = 8000, retries = 2, ...init } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (RETRYABLE_STATUS.has(res.status) && attempt < retries) {
        await sleep(backoffMs(attempt));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(backoffMs(attempt));
        continue;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Request to ${new URL(url).host} failed`);
}

/** fetchWithTimeout + JSON decode. Returns null instead of throwing on any failure. */
export async function fetchJson<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(url, options);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
