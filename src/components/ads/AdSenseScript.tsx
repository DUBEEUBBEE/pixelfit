import { adsenseConfig, canRenderAds, type AdSenseConfig, warnAboutIncompleteAdSense } from "@/config/adsense";

type AdSenseScriptProps = {
  config?: AdSenseConfig;
};

export function AdSenseScript({ config = adsenseConfig }: AdSenseScriptProps = {}) {
  if (!canRenderAds(config)) {
    warnAboutIncompleteAdSense(config);
    return null;
  }

  return (
    <script
      async
      crossOrigin="anonymous"
      data-pixelfit-adsense="script"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.client}`}
    />
  );
}
