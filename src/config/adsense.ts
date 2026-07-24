import { env } from "./env";

export const safeAdPlacements = [
  "home-content-break",
  "guide-content-break",
  "tool-explainer-end",
] as const;

export type SafeAdPlacement = (typeof safeAdPlacements)[number];

export const forbiddenAdSurfaces = [
  "upload",
  "editor",
  "preview",
  "result",
  "download",
  "navigation",
  "privacy",
  "terms",
  "contact",
] as const;

export type AdSenseConfig = Readonly<{
  requested: boolean;
  enabled: boolean;
  client?: string;
  contentSlot?: string;
  ready: boolean;
}>;

export const adsenseConfig: AdSenseConfig = Object.freeze({
  requested: env.adsense.requested,
  enabled: env.adsense.enabled,
  client: env.adsense.client,
  contentSlot: env.adsense.contentSlot,
  ready: env.adsense.ready,
});

export function isSafeAdPlacement(value: string): value is SafeAdPlacement {
  return (safeAdPlacements as readonly string[]).includes(value);
}

export function canRenderAds(config: AdSenseConfig = adsenseConfig): boolean {
  return config.enabled
    && config.ready
    && /^ca-pub-\d{16}$/u.test(config.client ?? "")
    && /^\d{10}$/u.test(config.contentSlot ?? "");
}

let warnedAboutConfiguration = false;

export function warnAboutIncompleteAdSense(config: AdSenseConfig = adsenseConfig): void {
  if (
    process.env.NODE_ENV !== "production"
    && config.requested
    && !canRenderAds(config)
    && !warnedAboutConfiguration
  ) {
    warnedAboutConfiguration = true;
    console.warn("[픽셀핏] AdSense 설정이 불완전해 광고 스크립트와 슬롯을 렌더링하지 않습니다.");
  }
}

export function warnAboutUnsafeAdPlacement(placement: string): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[픽셀핏] 허용되지 않은 광고 위치를 차단했습니다: ${placement}`);
  }
}

warnAboutIncompleteAdSense();
