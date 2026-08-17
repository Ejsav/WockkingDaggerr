import { describe, expect, it } from "vitest";
import {
  formatCompactNumber,
  formatDate,
  formatDuration,
  formatPrice,
  formatRelativeDate,
  formatSize,
  getCountdown,
  parseIsoDuration,
  parseTwitchDuration,
  absoluteUrl,
  cn,
} from "@/lib/utils";

// Each block names the production failure it exists to prevent.

describe("formatDuration", () => {
  it("shows hours for anything over an hour — a 3h VOD must not read 184:11", () => {
    expect(formatDuration(11051)).toBe("3:04:11");
    expect(formatDuration(3600)).toBe("1:00:00");
    expect(formatDuration(3599)).toBe("59:59");
  });

  it("pads seconds so 4:05 never renders as 4:5", () => {
    expect(formatDuration(245)).toBe("4:05");
    expect(formatDuration(5)).toBe("0:05");
  });

  it("renders a real zero rather than an empty badge", () => {
    expect(formatDuration(0)).toBe("0:00");
  });

  it("returns nothing for absent or nonsense values instead of NaN:NaN", () => {
    expect(formatDuration(null)).toBe("");
    expect(formatDuration(undefined)).toBe("");
    expect(formatDuration(Number.NaN)).toBe("");
    expect(formatDuration(-30)).toBe("");
  });
});

describe("parseIsoDuration", () => {
  it("reads the YouTube contentDetails format", () => {
    expect(parseIsoDuration("PT1H2M3S")).toBe(3723);
    expect(parseIsoDuration("PT45S")).toBe(45);
    expect(parseIsoDuration("PT12M")).toBe(720);
    expect(parseIsoDuration("P1DT2H")).toBe(93600);
  });

  it("rejects junk rather than silently returning 0 — a 0 would mark a video a Short", () => {
    expect(parseIsoDuration("")).toBeNull();
    expect(parseIsoDuration(null)).toBeNull();
    expect(parseIsoDuration("PT")).toBeNull();
    expect(parseIsoDuration("banana")).toBeNull();
  });
});

describe("parseTwitchDuration", () => {
  it("reads the Helix format", () => {
    expect(parseTwitchDuration("1h2m3s")).toBe(3723);
    expect(parseTwitchDuration("42m10s")).toBe(2530);
    expect(parseTwitchDuration("31s")).toBe(31);
  });

  it("rejects junk rather than matching the empty string at position zero", () => {
    expect(parseTwitchDuration("")).toBeNull();
    expect(parseTwitchDuration("not-a-duration")).toBeNull();
    expect(parseTwitchDuration(null)).toBeNull();
  });
});

describe("formatPrice", () => {
  it("always shows cents, so 185 and 185.50 line up in a cart column", () => {
    expect(formatPrice(18500)).toBe("$185.00");
    expect(formatPrice(18550)).toBe("$185.50");
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("honours the product currency", () => {
    expect(formatPrice(6500, "GBP")).toContain("65.00");
  });
});

describe("formatCompactNumber", () => {
  it("compacts view counts without inventing precision", () => {
    expect(formatCompactNumber(999)).toBe("999");
    expect(formatCompactNumber(1500)).toBe("1.5K");
    expect(formatCompactNumber(184320)).toBe("184K");
    expect(formatCompactNumber(1_500_000)).toBe("1.5M");
    expect(formatCompactNumber(24_000_000)).toBe("24M");
  });

  it("renders nothing when there is no count — never a stray 0 or a dash", () => {
    expect(formatCompactNumber(null)).toBe("");
    expect(formatCompactNumber(undefined)).toBe("");
  });
});

describe("formatRelativeDate", () => {
  const now = Date.parse("2026-06-15T12:00:00Z");

  it("describes recent items the way a viewer expects", () => {
    expect(formatRelativeDate("2026-06-15T09:00:00Z", now)).toBe("today");
    expect(formatRelativeDate("2026-06-14T09:00:00Z", now)).toBe("yesterday");
    expect(formatRelativeDate("2026-06-11T12:00:00Z", now)).toBe("4d ago");
    expect(formatRelativeDate("2026-05-20T12:00:00Z", now)).toBe("3w ago");
    expect(formatRelativeDate("2025-06-15T12:00:00Z", now)).toBe("1y ago");
  });

  it("never says a future upload was posted '-3d ago'", () => {
    expect(formatRelativeDate("2026-07-01T12:00:00Z", now)).toBe("Jul 1, 2026");
  });

  it("returns empty for an unparseable timestamp", () => {
    expect(formatRelativeDate("not-a-date", now)).toBe("");
  });
});

describe("formatDate", () => {
  it("is timezone-stable, so the server and the browser agree", () => {
    expect(formatDate("2026-06-15T23:30:00Z")).toBe("Jun 15, 2026");
  });

  it("returns empty rather than 'Invalid Date'", () => {
    expect(formatDate("nope")).toBe("");
  });
});

describe("getCountdown", () => {
  const now = Date.parse("2026-06-15T12:00:00Z");

  it("breaks the remaining time down correctly", () => {
    const c = getCountdown("2026-06-18T14:30:45Z", now);
    expect(c).toMatchObject({ days: 3, hours: 2, minutes: 30, seconds: 45, done: false });
  });

  it("reports done at and after zero, so a passed drop never shows a negative clock", () => {
    expect(getCountdown("2026-06-15T12:00:00Z", now).done).toBe(true);
    expect(getCountdown("2026-06-14T12:00:00Z", now)).toMatchObject({ days: 0, done: true });
  });

  it("treats an unparseable target as elapsed rather than rendering NaN", () => {
    expect(getCountdown("garbage", now).done).toBe(true);
  });
});

describe("formatSize", () => {
  it("hides the ONE_SIZE sentinel from shoppers", () => {
    expect(formatSize("ONE_SIZE")).toBe("One size");
    expect(formatSize("XL")).toBe("XL");
  });
});

describe("absoluteUrl", () => {
  it("builds canonical URLs without doubling or dropping slashes", () => {
    expect(absoluteUrl("https://x.com", "/shop")).toBe("https://x.com/shop");
    expect(absoluteUrl("https://x.com/", "/shop")).toBe("https://x.com/shop");
    expect(absoluteUrl("https://x.com", "shop")).toBe("https://x.com/shop");
  });

  it("renders the site root without a trailing slash", () => {
    expect(absoluteUrl("https://x.com", "/")).toBe("https://x.com");
  });
});

describe("cn", () => {
  it("drops falsy branches so no class list contains 'false'", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
