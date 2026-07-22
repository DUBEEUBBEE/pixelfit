import { describe, expect, it } from "vitest";
import { getPreset } from "@/lib/presets";
import { resolveBackgroundColor } from "./policy";

describe("operation policy", () => {
  it("cannot reach background processing from passport", () => {
    const passport = getPreset("passport-photo");
    if (!passport) throw new Error("missing preset");
    expect(resolveBackgroundColor(passport, "white")).toBeNull();
  });

  it("allows explicit general ID background variants", () => {
    const idPhoto = getPreset("id-photo");
    if (!idPhoto) throw new Error("missing preset");
    expect(resolveBackgroundColor(idPhoto, "white")).toBe("#ffffff");
  });
});
