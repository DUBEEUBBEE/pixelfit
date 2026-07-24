import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONTACT_URL,
  DEFAULT_OPERATOR_NAME,
  DEFAULT_SITE_URL,
  EnvironmentConfigurationError,
  normalizeBasePath,
  parseEnvironment,
} from "./env";

describe("environment configuration", () => {
  it("uses deployable, non-placeholder fallbacks with ads off", () => {
    const result = parseEnvironment({});

    expect(result.siteUrl).toBe(DEFAULT_SITE_URL);
    expect(result.basePath).toBe("");
    expect(result.contactUrl).toBe(DEFAULT_CONTACT_URL);
    expect(result.contactEmail).toBeUndefined();
    expect(result.operatorName).toBe(DEFAULT_OPERATOR_NAME);
    expect(result.adsense.ready).toBe(false);
    expect(result.googleSiteVerification).toBeUndefined();
  });

  it("normalizes both public and legacy base-path variables", () => {
    expect(normalizeBasePath("pixelfit/")).toBe("/pixelfit");
    expect(parseEnvironment({ BASE_PATH: "/legacy/" }).basePath).toBe("/legacy");

    const result = parseEnvironment({ NEXT_PUBLIC_BASE_PATH: "/public", BASE_PATH: "/legacy" });
    expect(result.basePath).toBe("/public");
    expect(result.warnings).toContain("NEXT_PUBLIC_BASE_PATH와 BASE_PATH가 달라 NEXT_PUBLIC_BASE_PATH를 우선했습니다.");
  });

  it("forces custom-domain builds to the root URL", () => {
    const result = parseEnvironment({
      NEXT_PUBLIC_CUSTOM_DOMAIN: "Photos.PixelFit.KR",
      CUSTOM_DOMAIN: "legacy.pixel.fit",
      NEXT_PUBLIC_SITE_URL: "https://dubeeubbee.github.io/pixelfit",
      NEXT_PUBLIC_BASE_PATH: "/pixelfit",
    });

    expect(result.customDomain).toBe("photos.pixelfit.kr");
    expect(result.siteUrl).toBe("https://photos.pixelfit.kr");
    expect(result.basePath).toBe("");
    expect(result.warnings).toContain("NEXT_PUBLIC_CUSTOM_DOMAIN와 CUSTOM_DOMAIN가 달라 공개 값을 우선했습니다.");
  });

  it("falls back from invalid optional contact fields without exposing fake addresses", () => {
    const result = parseEnvironment({ CONTACT_EMAIL: "not-an-email", CONTACT_URL: "javascript:alert(1)" });

    expect(result.contactEmail).toBeUndefined();
    expect(result.contactUrl).toBe(DEFAULT_CONTACT_URL);
    expect(result.warnings).toHaveLength(2);
  });

  it("keeps ads inert unless every required value is valid", () => {
    const incomplete = parseEnvironment({ ADSENSE_ENABLED: "true", ADSENSE_CLIENT: "ca-pub-123" });
    expect(incomplete.adsense.ready).toBe(false);

    const complete = parseEnvironment({
      ADSENSE_ENABLED: "true",
      ADSENSE_CLIENT: "ca-pub-1234567890123456",
      ADSENSE_CONTENT_SLOT: "1234567890",
    });
    expect(complete.adsense).toMatchObject({
      requested: true,
      enabled: true,
      client: "ca-pub-1234567890123456",
      contentSlot: "1234567890",
      ready: true,
    });
  });

  it("supports public deployment aliases and prefers them over legacy values", () => {
    const result = parseEnvironment({
      NEXT_PUBLIC_CONTACT_EMAIL: "operator@pixel.fit",
      CONTACT_EMAIL: "legacy@pixel.fit",
      NEXT_PUBLIC_CONTACT_URL: "https://github.com/DUBEEUBBEE/pixelfit/issues",
      NEXT_PUBLIC_OPERATOR_NAME: "픽셀핏 팀",
      NEXT_PUBLIC_ADSENSE_ENABLED: "true",
      NEXT_PUBLIC_ADSENSE_CLIENT: "ca-pub-1234567890123456",
      NEXT_PUBLIC_ADSENSE_CONTENT_SLOT: "1234567890",
    });

    expect(result.contactEmail).toBe("operator@pixel.fit");
    expect(result.operatorName).toBe("픽셀핏 팀");
    expect(result.adsense.ready).toBe(true);
    expect(result.warnings).toContain("NEXT_PUBLIC_CONTACT_EMAIL와 CONTACT_EMAIL가 달라 공개 값을 우선했습니다.");
  });

  it("renders no Naver token by default and prioritizes the explicit public token", () => {
    expect(parseEnvironment({}).naverSiteVerification).toBeUndefined();
    const result = parseEnvironment({
      NEXT_PUBLIC_NAVER_SITE_VERIFICATION: "public_token_123",
      NAVER_SITE_VERIFICATION: "legacy_token_456",
    });
    expect(result.naverSiteVerification).toBe("public_token_123");
    expect(result.warnings).toContain("NEXT_PUBLIC_NAVER_SITE_VERIFICATION과 NAVER_SITE_VERIFICATION이 달라 공개 값을 우선했습니다.");
  });

  it("validates Google URL-prefix verification tokens and prefers the public value", () => {
    const result = parseEnvironment({
      NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: "public_google_token_123",
      GOOGLE_SITE_VERIFICATION: "legacy_google_token_456",
    });
    expect(result.googleSiteVerification).toBe("public_google_token_123");
    expect(result.warnings).toContain("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION와 GOOGLE_SITE_VERIFICATION가 달라 공개 값을 우선했습니다.");

    const invalid = parseEnvironment({ GOOGLE_SITE_VERIFICATION: "bad token" });
    expect(invalid.googleSiteVerification).toBeUndefined();
    expect(invalid.warnings).toContain("GOOGLE_SITE_VERIFICATION 값이 유효하지 않아 사용하지 않았습니다.");
  });

  it("fails early for routing values that could produce a broken export", () => {
    expect(() => parseEnvironment({ NEXT_PUBLIC_SITE_URL: "javascript:alert(1)" })).toThrow(EnvironmentConfigurationError);
    expect(() => parseEnvironment({ NEXT_PUBLIC_SITE_URL: "https://pixelfit.example" })).toThrow(EnvironmentConfigurationError);
    expect(() => parseEnvironment({ CUSTOM_DOMAIN: "https://pixel.fit/path" })).toThrow(EnvironmentConfigurationError);
    expect(() => parseEnvironment({ CUSTOM_DOMAIN: "pixelfit.example" })).toThrow(EnvironmentConfigurationError);
    expect(() => normalizeBasePath("/../private")).toThrow(EnvironmentConfigurationError);
  });
});
