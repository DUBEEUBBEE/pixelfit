export const FAVICON_SIZES = [16, 32, 48, 180, 192, 512] as const;

export const ICO_SIZES = [16, 32, 48] as const;

export const FAVICON_PACKAGE_FILENAME = "favicon-package.zip" as const;

export const REQUIRED_PACKAGE_FILES = [
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "favicon-48x48.png",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "site.webmanifest",
  "favicon-install.html",
  "README.txt",
] as const;

export type FaviconSize = (typeof FAVICON_SIZES)[number];
export type IcoSize = (typeof ICO_SIZES)[number];
export type FaviconTheme =
  | "fill"
  | "safe-padding"
  | "circle"
  | "rounded"
  | "transparent"
  | "solid";
export type RequiredPackageFile = (typeof REQUIRED_PACKAGE_FILES)[number];

export type FaviconPngBlobs = Record<FaviconSize, Blob>;
export type FaviconPngBytes = Record<FaviconSize, Uint8Array>;
export type FaviconPackageAssets = Record<RequiredPackageFile, Uint8Array | string>;

export interface SourceDimensions {
  width: number;
  height: number;
}

export interface DrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaviconDrawPlan {
  background: "transparent" | "square" | "circle" | "rounded";
  clip: "none" | "circle" | "rounded";
  cornerRadius: number;
  destination: DrawRect;
  source: DrawRect;
}

export interface RasterizeFaviconOptions {
  theme?: FaviconTheme;
  backgroundColor?: string;
  /** A value from 0 through 0.4. Only themes that contain the source use it. */
  paddingRatio?: number;
  /** A value from 0 through 0.5, measured against the output edge. */
  cornerRadiusRatio?: number;
  signal?: AbortSignal;
}

export interface ManifestOptions {
  name?: string;
  shortName?: string;
  backgroundColor?: string;
  themeColor?: string;
}

export interface FaviconWebManifest {
  name: string;
  short_name: string;
  icons: Array<{
    src: string;
    sizes: "192x192" | "512x512";
    type: "image/png";
    purpose: "any";
  }>;
  start_url: "./";
  scope: "./";
  display: "standalone";
  background_color: string;
  theme_color: string;
}

export interface FaviconPackageOptions
  extends RasterizeFaviconOptions,
    ManifestOptions {}

export interface GeneratedFaviconPackage {
  filename: typeof FAVICON_PACKAGE_FILENAME;
  blob: Blob;
  bytes: Uint8Array;
  assets: FaviconPackageAssets;
  manifest: FaviconWebManifest;
  installationHtml: string;
  readme: string;
}
