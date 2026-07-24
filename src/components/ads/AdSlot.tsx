import {
  adsenseConfig,
  canRenderAds,
  type AdSenseConfig,
  isSafeAdPlacement,
  type SafeAdPlacement,
  warnAboutIncompleteAdSense,
  warnAboutUnsafeAdPlacement,
} from "@/config/adsense";

type AdSlotProps = {
  placement: SafeAdPlacement;
  config?: AdSenseConfig;
};

export function AdSlot({ placement, config = adsenseConfig }: AdSlotProps) {
  if (!isSafeAdPlacement(placement)) {
    warnAboutUnsafeAdPlacement(placement);
    return null;
  }

  if (!canRenderAds(config)) {
    warnAboutIncompleteAdSense(config);
    return null;
  }

  return (
    <aside className="ad-slot" aria-label="광고" data-ad-placement={placement}>
      <span className="ad-label">광고</span>
      <ins
        className="adsbygoogle"
        data-ad-client={config.client}
        data-ad-format="auto"
        data-ad-slot={config.contentSlot}
        data-full-width-responsive="true"
        style={{ display: "block", minHeight: 120 }}
      />
      <script
        data-pixelfit-adsense="slot-init"
        dangerouslySetInnerHTML={{
          __html: "(window.adsbygoogle=window.adsbygoogle||[]).push({});",
        }}
      />
    </aside>
  );
}
