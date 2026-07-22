import { describe, expect, it } from "vitest";
import { imagePresetSchema, validatePresetRegistry } from "./schema";
import { getPreset, isOperationAllowed, presets } from "./registry";

describe("preset registry", () => {
  it("validates all six presets", () => {
    expect(presets).toHaveLength(6);
    expect(presets.every((preset) => imagePresetSchema.safeParse(preset).success)).toBe(true);
  });

  it("rejects duplicate slugs", () => {
    expect(() => validatePresetRegistry([presets[0], { ...presets[1], slug: presets[0].slug }])).toThrow(/중복 preset slug/);
  });

  it("requires official sources", () => {
    const passport = structuredClone(getPreset("passport-photo"));
    if (!passport) throw new Error("fixture missing");
    delete passport.source;
    expect(imagePresetSchema.safeParse(passport).success).toBe(false);
  });

  it("makes passport background and generative operations unreachable", () => {
    const passport = getPreset("passport-photo");
    if (!passport) throw new Error("fixture missing");
    expect(isOperationAllowed(passport, "background-remove")).toBe(false);
    expect(isOperationAllowed(passport, "background-replace")).toBe(false);
    expect(isOperationAllowed(passport, "retouch")).toBe(false);
    expect(isOperationAllowed(passport, "generative-fill")).toBe(false);
  });
});
