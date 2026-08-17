import { describe, expect, it, vi } from "vitest";

// The auth module reads env through getters at call time, so the values
// must be in place before each import.
process.env.ADMIN_PASSWORD = "correct-horse-battery-staple";
process.env.ADMIN_SESSION_SECRET = "a-long-random-signing-secret-value";
process.env.CRON_SECRET = "cron-token-value";

const { ADMIN_COOKIE, authorizeSync, createSessionToken, verifyPassword, verifySessionToken } =
  await import("@/lib/auth");

describe("verifyPassword", () => {
  it("accepts the configured password", async () => {
    await expect(verifyPassword("correct-horse-battery-staple")).resolves.toBe(true);
  });

  it("rejects a wrong password, a prefix, and an empty string", async () => {
    await expect(verifyPassword("wrong")).resolves.toBe(false);
    await expect(verifyPassword("correct-horse-battery-stapl")).resolves.toBe(false);
    await expect(verifyPassword("")).resolves.toBe(false);
  });
});

describe("session tokens", () => {
  it("mints a token that verifies", async () => {
    const { token } = await createSessionToken();
    await expect(verifySessionToken(token)).resolves.toBe(true);
  });

  it("rejects a token whose signature has been altered", async () => {
    const { token } = await createSessionToken();
    const [expiry, nonce, sig] = token.split(".");
    const tampered = `${expiry}.${nonce}.${sig.slice(0, -2)}XY`;
    await expect(verifySessionToken(tampered)).resolves.toBe(false);
  });

  it("rejects a token whose expiry has been pushed forward", async () => {
    const { token } = await createSessionToken();
    const [, nonce, sig] = token.split(".");
    const forged = `${Date.now() + 10_000_000}.${nonce}.${sig}`;
    await expect(verifySessionToken(forged)).resolves.toBe(false);
  });

  it("rejects an expired token even though the signature is genuine", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const { token } = await createSessionToken();
    // 12h TTL — jump a day.
    vi.setSystemTime(new Date("2026-01-02T00:00:00Z"));
    await expect(verifySessionToken(token)).resolves.toBe(false);
    vi.useRealTimers();
  });

  it("rejects malformed input rather than throwing", async () => {
    await expect(verifySessionToken(undefined)).resolves.toBe(false);
    await expect(verifySessionToken("")).resolves.toBe(false);
    await expect(verifySessionToken("a.b")).resolves.toBe(false);
    await expect(verifySessionToken("a.b.c.d")).resolves.toBe(false);
    await expect(verifySessionToken("not-a-token")).resolves.toBe(false);
  });
});

describe("authorizeSync", () => {
  const req = (headers: Record<string, string>) => new Request("https://x.test/api/sync/youtube", { headers });

  it("accepts the cron bearer token", async () => {
    await expect(authorizeSync(req({ authorization: "Bearer cron-token-value" }))).resolves.toBe(
      true
    );
  });

  it("rejects a wrong bearer token", async () => {
    await expect(authorizeSync(req({ authorization: "Bearer nope" }))).resolves.toBe(false);
  });

  it("rejects a request with no credentials at all — a browser hitting the URL", async () => {
    await expect(authorizeSync(req({}))).resolves.toBe(false);
  });

  it("accepts a valid admin session cookie so the control room can sync by hand", async () => {
    const { token } = await createSessionToken();
    await expect(authorizeSync(req({ cookie: `${ADMIN_COOKIE}=${token}` }))).resolves.toBe(true);
  });

  it("rejects a forged session cookie", async () => {
    await expect(
      authorizeSync(req({ cookie: `${ADMIN_COOKIE}=9999999999999.aaaa.bbbb` }))
    ).resolves.toBe(false);
  });

  it("is not fooled by a similarly named cookie", async () => {
    const { token } = await createSessionToken();
    await expect(
      authorizeSync(req({ cookie: `not_${ADMIN_COOKIE}=${token}` }))
    ).resolves.toBe(false);
  });
});
