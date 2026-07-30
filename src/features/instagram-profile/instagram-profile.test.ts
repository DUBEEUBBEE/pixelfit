import { describe, expect, it } from "vitest";
import { calculateInstagramProfileLayout, INSTAGRAM_PROFILE_DEFAULTS, INSTAGRAM_PROFILE_SIZE, instagramProfileFilename } from ".";

describe("Instagram profile picture layout", () => {
  it("uses a high-quality square service output without claiming an official upload size", () => {
    expect(INSTAGRAM_PROFILE_SIZE).toBe(1080);
    expect(instagramProfileFilename("png")).toBe("pixelfit-instagram-profile-1080x1080.png");
    expect(instagramProfileFilename("jpeg")).toBe("pixelfit-instagram-profile-1080x1080.jpg");
  });

  it("shrinks the whole source before clipping it inside a smaller centered circle", () => {
    const layout = calculateInstagramProfileLayout(
      { width: 1600, height: 900 },
      INSTAGRAM_PROFILE_DEFAULTS,
    );

    expect(layout.outerRadius).toBeLessThan(INSTAGRAM_PROFILE_SIZE / 2);
    expect(layout.innerRadius).toBe(layout.outerRadius - INSTAGRAM_PROFILE_DEFAULTS.borderWidth);
    expect(layout.imageWidth).toBeLessThan(layout.innerRadius * 2);
    expect(layout.imageHeight).toBeLessThan(layout.innerRadius * 2);
    expect(layout.imageX + layout.imageWidth / 2).toBeCloseTo(INSTAGRAM_PROFILE_SIZE / 2);
    expect(layout.imageY + layout.imageHeight / 2).toBeCloseTo(INSTAGRAM_PROFILE_SIZE / 2);
  });

  it("clamps unsafe circle, border, scale, and offset values", () => {
    const layout = calculateInstagramProfileLayout(
      { width: 800, height: 1200 },
      { circleScale: 4, photoScale: 9, borderWidth: 999, offsetX: -8, offsetY: 8 },
    );

    expect(layout.outerRadius).toBe(INSTAGRAM_PROFILE_SIZE * 0.94 / 2);
    expect(layout.borderWidth).toBeLessThanOrEqual(120);
    expect(layout.innerRadius).toBeGreaterThan(0);
    expect(layout.imageX).toBeGreaterThanOrEqual(layout.center - layout.innerRadius);
    expect(layout.imageY + layout.imageHeight).toBeLessThanOrEqual(layout.center + layout.innerRadius);
  });
});
