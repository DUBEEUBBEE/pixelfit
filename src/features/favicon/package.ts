import { createFaviconIco } from "./ico";
import {
  createInstallationHtml,
  createReadmeText,
  createWebManifest,
  serializeWebManifest,
} from "./manifest";
import { readPngDimensions } from "./png";
import { generateFaviconPngs } from "./rasterize";
import {
  FAVICON_PACKAGE_FILENAME,
  FAVICON_SIZES,
  REQUIRED_PACKAGE_FILES,
  type FaviconPackageAssets,
  type FaviconPackageOptions,
  type FaviconPngBlobs,
  type FaviconPngBytes,
  type FaviconSize,
  type GeneratedFaviconPackage,
} from "./types";

const PNG_FILENAMES: Record<FaviconSize, keyof FaviconPackageAssets> = {
  16: "favicon-16x16.png",
  32: "favicon-32x32.png",
  48: "favicon-48x48.png",
  180: "apple-touch-icon.png",
  192: "icon-192.png",
  512: "icon-512.png",
};

function validatePngSet(pngs: FaviconPngBytes) {
  for (const size of FAVICON_SIZES) {
    const dimensions = readPngDimensions(pngs[size]);
    if (dimensions.width !== size || dimensions.height !== size) {
      throw new Error(`${size}px 파일의 실제 PNG 크기가 일치하지 않습니다.`);
    }
  }
}

export function createFaviconPackageAssets(
  pngs: FaviconPngBytes,
  options: FaviconPackageOptions = {},
): {
  assets: FaviconPackageAssets;
  manifest: ReturnType<typeof createWebManifest>;
  installationHtml: string;
  readme: string;
} {
  validatePngSet(pngs);
  const manifest = createWebManifest(options);
  const installationHtml = createInstallationHtml();
  const readme = createReadmeText(manifest);
  const assets = {} as FaviconPackageAssets;

  for (const size of FAVICON_SIZES) {
    assets[PNG_FILENAMES[size]] = pngs[size];
  }

  assets["favicon.ico"] = createFaviconIco(pngs);
  assets["site.webmanifest"] = serializeWebManifest(manifest);
  assets["favicon-install.html"] = installationHtml;
  assets["README.txt"] = readme;

  return { assets, manifest, installationHtml, readme };
}

function assertCompletePackage(assets: FaviconPackageAssets) {
  for (const filename of REQUIRED_PACKAGE_FILES) {
    const content = assets[filename];
    if (typeof content !== "string" && !(content instanceof Uint8Array)) {
      throw new Error(`${filename} 파일이 없습니다.`);
    }
    if (content.length === 0) {
      throw new Error(`${filename} 파일이 비어 있습니다.`);
    }
  }
}

export async function buildFaviconZip(
  assets: FaviconPackageAssets,
): Promise<Uint8Array> {
  assertCompletePackage(assets);
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  for (const filename of REQUIRED_PACKAGE_FILES) {
    zip.file(filename, assets[filename]);
  }

  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
    platform: "DOS",
  });
}

async function blobsToBytes(pngs: FaviconPngBlobs): Promise<FaviconPngBytes> {
  const entries = await Promise.all(
    FAVICON_SIZES.map(async (size) => {
      const bytes = new Uint8Array(await pngs[size].arrayBuffer());
      return [size, bytes] as const;
    }),
  );
  return Object.fromEntries(entries) as FaviconPngBytes;
}

export async function generateFaviconPackage(
  source: CanvasImageSource,
  options: FaviconPackageOptions = {},
): Promise<GeneratedFaviconPackage> {
  const pngBlobs = await generateFaviconPngs(source, options);
  const pngBytes = await blobsToBytes(pngBlobs);
  const packageContents = createFaviconPackageAssets(pngBytes, options);
  const bytes = await buildFaviconZip(packageContents.assets);
  const blob = new Blob([bytes.slice().buffer], { type: "application/zip" });

  return {
    filename: FAVICON_PACKAGE_FILENAME,
    blob,
    bytes,
    ...packageContents,
  };
}
