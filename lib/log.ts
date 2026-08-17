// ============================================================
// STRUCTURED LOGGING + ERROR REPORTING
//
// Two jobs:
//   1. Emit one-line JSON to stdout so Vercel log drains and
//      `vercel logs` can be filtered and aggregated.
//   2. Forward errors to an external monitor when one is wired
//      (SENTRY_DSN via the Sentry ingest HTTP API — no SDK, no
//      bundle cost, no vendor lock).
//
// Never log secrets. Never return an internal message to a
// caller: use `publicError` for the response body and `logError`
// for the detail.
// ============================================================

type Level = "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

const REDACT = /(key|secret|token|password|authorization|cookie|signature)/i;

function redact(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = REDACT.test(k) ? "[redacted]" : v;
  }
  return out;
}

function emit(level: Level, event: string, fields: LogFields = {}): void {
  const line = JSON.stringify({
    level,
    event,
    ts: new Date().toISOString(),
    ...redact(fields),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  // `debug` rather than `log`: it is the level a JSON info line belongs at,
  // and it keeps the no-console lint rule meaningful everywhere else.
  else console.debug(line);
}

export function logInfo(event: string, fields?: LogFields): void {
  emit("info", event, fields);
}

export function logWarn(event: string, fields?: LogFields): void {
  emit("warn", event, fields);
}

/**
 * Record a failure. Returns a short correlation id that is safe to
 * hand back to the caller so a support request can be traced to a
 * log line without leaking the underlying error.
 */
export function logError(event: string, err: unknown, fields?: LogFields): string {
  const ref = crypto.randomUUID().slice(0, 8);
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  emit("error", event, { ...fields, ref, message, stack });
  void forwardToSentry(event, message, stack, { ...fields, ref });
  return ref;
}

/**
 * Body for a failed API response. Carries the correlation id and
 * nothing else — no database internals, no provider text, no stack.
 */
export function publicError(message: string, ref?: string) {
  return ref ? { error: message, ref } : { error: message };
}

// ------------------------------------------------------------
// SENTRY — direct ingest, fire-and-forget, never blocks a response
// ------------------------------------------------------------

interface ParsedDsn {
  endpoint: string;
  publicKey: string;
}

function parseDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, "");
    if (!projectId || !url.username) return null;
    return {
      endpoint: `${url.protocol}//${url.host}/api/${projectId}/store/`,
      publicKey: url.username,
    };
  } catch {
    return null;
  }
}

async function forwardToSentry(
  event: string,
  message: string,
  stack: string | undefined,
  fields: LogFields
): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  const parsed = parseDsn(dsn);
  if (!parsed) return;

  try {
    await fetch(parsed.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": [
          "Sentry sentry_version=7",
          `sentry_key=${parsed.publicKey}`,
          "sentry_client=wockkingdagger/1.0",
        ].join(", "),
      },
      body: JSON.stringify({
        event_id: crypto.randomUUID().replace(/-/g, ""),
        timestamp: new Date().toISOString(),
        platform: "node",
        level: "error",
        logger: event,
        environment: process.env.VERCEL_ENV ?? "development",
        release: process.env.VERCEL_GIT_COMMIT_SHA ?? undefined,
        message: { formatted: `${event}: ${message}` },
        extra: redact(fields),
        exception: stack
          ? { values: [{ type: event, value: message, stacktrace: { frames: [] } }] }
          : undefined,
        contexts: { trace: { op: event } },
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Monitoring must never take down the request it is reporting on.
  }
}
