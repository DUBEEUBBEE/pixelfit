import { describe, expect, it } from "vitest";
import { applyFilmEffects } from "@/features/creative-tools/core";
import { FILM_ORIGINAL_SETTINGS, filmPhotoFilename, planFilmOutputDimensions } from ".";

describe("film photo output planning", () => {
  it("keeps ordinary images at their source dimensions", () => {
    expect(planFilmOutputDimensions({ width: 2400, height: 1600 })).toEqual({ width: 2400, height: 1600 });
  });

  it("bounds large photos without changing their aspect ratio", () => {
    const output = planFilmOutputDimensions({ width: 8000, height: 6000 });
    expect(output.width).toBeLessThanOrEqual(4096);
    expect(output.width * output.height).toBeLessThanOrEqual(16_000_000);
    expect(output.width / output.height).toBeCloseTo(4 / 3, 3);
  });

  it("defines original reset as a truly effect-free state", () => {
    expect(FILM_ORIGINAL_SETTINGS).toEqual({
      mode: "color",
      strength: 0,
      grain: 0,
      vignette: 0,
      lightLeak: 0,
      dateText: "",
    });
    const source = new ImageData(new Uint8ClampedArray([80, 120, 160, 255]), 1, 1);
    expect(Array.from(applyFilmEffects(source, {
      mode: FILM_ORIGINAL_SETTINGS.mode,
      strength: FILM_ORIGINAL_SETTINGS.strength,
      grain: FILM_ORIGINAL_SETTINGS.grain,
      vignette: FILM_ORIGINAL_SETTINGS.vignette,
      lightLeak: FILM_ORIGINAL_SETTINGS.lightLeak,
    }, 73421).data)).toEqual(Array.from(source.data));
  });

  it("keeps the public download filename contract", () => {
    expect(filmPhotoFilename("low-saturation", "jpeg")).toBe("film-photo-low-saturation.jpg");
    expect(filmPhotoFilename("mono", "png")).toBe("film-photo-mono.png");
  });
});
