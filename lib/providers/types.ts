import type { MediaItem } from "@/types";

/**
 * Every provider returns this shape. `configured: false` means the
 * credentials are absent — that is a state, not an error, and sync
 * reports it as a skip rather than a failure.
 */
export interface ProviderResult {
  items: MediaItem[];
  configured: boolean;
  error: string | null;
}

export const skipped = (reason: string): ProviderResult => ({
  items: [],
  configured: false,
  error: reason,
});

export const failed = (reason: string): ProviderResult => ({
  items: [],
  configured: true,
  error: reason,
});
