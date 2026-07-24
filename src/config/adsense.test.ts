import { describe, expect, it, vi } from "vitest";
import { canRenderAds, isSafeAdPlacement } from "./adsense";

describe("AdSense policy guard", () => {
  it("allows only explicit content placements", () => {
    expect(isSafeAdPlacement("home-content-break")).toBe(true);
    expect(isSafeAdPlacement("guide-content-break")).toBe(true);
    expect(isSafeAdPlacement("upload")).toBe(false);
    expect(isSafeAdPlacement("download")).toBe(false);
    expect(isSafeAdPlacement("privacy")).toBe(false);
  });

  it("requires enabled, ready, valid client and valid slot together", () => {
    expect(canRenderAds({ requested: false, enabled: false, ready: false })).toBe(false);
    expect(canRenderAds({
      requested: true,
      enabled: true,
      client: "ca-pub-1234567890123456",
      contentSlot: "1234567890",
      ready: true,
    })).toBe(true);
    expect(canRenderAds({
      requested: true,
      enabled: true,
      client: "ca-pub-invalid",
      contentSlot: "1234567890",
      ready: true,
    })).toBe(false);
  });

  it("emits a development warning only for requested but incomplete settings", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ADSENSE_ENABLED", "true");
    vi.stubEnv("ADSENSE_CLIENT", "ca-pub-invalid");
    vi.stubEnv("ADSENSE_CONTENT_SLOT", "1234567890");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { warnAboutIncompleteAdSense } = await import("./adsense");

    warnAboutIncompleteAdSense();
    warnAboutIncompleteAdSense();

    expect(warning).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
    warning.mockRestore();
  });
});
