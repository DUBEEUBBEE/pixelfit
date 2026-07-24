import { describe, expect, it } from "vitest";
import { calculateThumbnailTextLayout, YOUTUBE_SAFE_MARGIN, YOUTUBE_THUMBNAIL_HEIGHT, YOUTUBE_THUMBNAIL_WIDTH, youtubeThumbnailTemplates } from ".";

describe("YouTube thumbnail specification", () => {
  it("uses the requested official 4K 16:9 canvas", () => {
    expect([YOUTUBE_THUMBNAIL_WIDTH, YOUTUBE_THUMBNAIL_HEIGHT]).toEqual([3840, 2160]);
    expect(YOUTUBE_THUMBNAIL_WIDTH / YOUTUBE_THUMBNAIL_HEIGHT).toBeCloseTo(16 / 9);
    expect(YOUTUBE_SAFE_MARGIN).toBeGreaterThan(0);
  });

  it("offers exactly four constrained templates", () => {
    expect(Object.keys(youtubeThumbnailTemplates)).toHaveLength(4);
    expect(new Set(Object.values(youtubeThumbnailTemplates).map((template) => template.label)).size).toBe(4);
  });

  it("keeps the largest two-line lower-third title and subtitle inside the canvas", () => {
    const layout = calculateThumbnailTextLayout("lower-third", 300, 2, true);
    expect(layout.titleSize).toBe(300);
    expect(layout.startY).toBeLessThan(1540);
    expect(layout.blockBottom).toBeLessThanOrEqual(YOUTUBE_THUMBNAIL_HEIGHT - YOUTUBE_SAFE_MARGIN);
    expect(layout.subtitleY).toBeLessThan(YOUTUBE_THUMBNAIL_HEIGHT);
  });
});
