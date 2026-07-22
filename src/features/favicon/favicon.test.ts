import { deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

import {
  FAVICON_PACKAGE_FILENAME,
  FAVICON_SIZES,
  ICO_SIZES,
  REQUIRED_PACKAGE_FILES,
  buildFaviconZip,
  calculateFaviconDrawPlan,
  createFaviconIco,
  createFaviconPackageAssets,
  createWebManifest,
  parseFaviconIco,
  readPngDimensions,
  serializeWebManifest,
  type FaviconPngBytes,
} from "./index";

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function concatenate(parts: readonly Uint8Array[]) {
  const output = new Uint8Array(
    parts.reduce((length, part) => length + part.byteLength, 0),
  );
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

function crc32(input: Uint8Array) {
  let crc = 0xffffffff;
  for (const value of input) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array) {
  const typeBytes = new TextEncoder().encode(type);
  const checksumInput = concatenate([typeBytes, data]);
  const output = new Uint8Array(12 + data.byteLength);
  const view = new DataView(output.buffer);
  view.setUint32(0, data.byteLength, false);
  output.set(typeBytes, 4);
  output.set(data, 8);
  view.setUint32(8 + data.byteLength, crc32(checksumInput), false);
  return output;
}

function createSolidPng(size: number) {
  const header = new Uint8Array(13);
  const headerView = new DataView(header.buffer);
  headerView.setUint32(0, size, false);
  headerView.setUint32(4, size, false);
  header[8] = 8;
  header[9] = 6;

  const scanlineBytes = size * 4 + 1;
  const pixels = new Uint8Array(scanlineBytes * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * scanlineBytes;
    pixels[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const pixel = row + 1 + x * 4;
      pixels[pixel] = 45;
      pixels[pixel + 1] = 107;
      pixels[pixel + 2] = 230;
      pixels[pixel + 3] = 255;
    }
  }

  return concatenate([
    PNG_SIGNATURE,
    pngChunk("IHDR", header),
    pngChunk("IDAT", new Uint8Array(deflateSync(pixels))),
    pngChunk("IEND", new Uint8Array()),
  ]);
}

function createPngSet(): FaviconPngBytes {
  return Object.fromEntries(
    FAVICON_SIZES.map((size) => [size, createSolidPng(size)]),
  ) as FaviconPngBytes;
}

describe("favicon PNG and theme helpers", () => {
  it("reads PNG dimensions from the IHDR bytes", () => {
    for (const size of FAVICON_SIZES) {
      expect(readPngDimensions(createSolidPng(size))).toEqual({
        width: size,
        height: size,
      });
    }
  });

  it("calculates cover, padding, circle, rounded, transparent and solid plans", () => {
    const source = { width: 120, height: 80 };
    const fill = calculateFaviconDrawPlan(source, 32, { theme: "fill" });
    expect(fill.source).toEqual({ x: 20, y: 0, width: 80, height: 80 });
    expect(fill.destination).toEqual({ x: 0, y: 0, width: 32, height: 32 });

    const safe = calculateFaviconDrawPlan(source, 32, { theme: "safe-padding" });
    expect(safe.background).toBe("transparent");
    expect(safe.destination.width).toBeCloseTo(21.76);

    expect(calculateFaviconDrawPlan(source, 32, { theme: "circle" })).toMatchObject({
      background: "circle",
      clip: "circle",
    });
    expect(calculateFaviconDrawPlan(source, 32, { theme: "rounded" })).toMatchObject({
      background: "rounded",
      clip: "rounded",
    });
    expect(
      calculateFaviconDrawPlan(source, 32, { theme: "transparent" }).background,
    ).toBe("transparent");
    expect(calculateFaviconDrawPlan(source, 32, { theme: "solid" }).background).toBe(
      "square",
    );
  });
});

describe("favicon ICO", () => {
  it("writes three PNG payloads with valid little-endian ICO directory entries", () => {
    const pngs = createPngSet();
    const ico = createFaviconIco(pngs);
    const parsed = parseFaviconIco(ico);

    expect(parsed.type).toBe(1);
    expect(parsed.entries.map((entry) => entry.size)).toEqual(ICO_SIZES);

    for (const entry of parsed.entries) {
      expect(entry.width).toBe(entry.height);
      expect(entry.offset).toBeGreaterThanOrEqual(6 + 16 * ICO_SIZES.length);
      const payload = ico.subarray(entry.offset, entry.offset + entry.byteLength);
      expect(readPngDimensions(payload)).toEqual({
        width: entry.width,
        height: entry.height,
      });
    }
  });
});

describe("favicon manifest", () => {
  it("uses non-empty safe fallbacks and always serializes valid JSON", () => {
    const manifest = createWebManifest({
      name: " \u0000 ",
      shortName: "\n",
      backgroundColor: "not-a-color",
      themeColor: "#1D4ED8",
    });
    const parsed = JSON.parse(serializeWebManifest(manifest));

    expect(parsed.name).toBe("내 웹사이트");
    expect(parsed.short_name).toBe("웹사이트");
    expect(parsed.background_color).toBe("#ffffff");
    expect(parsed.theme_color).toBe("#1d4ed8");
    expect(parsed.icons).toEqual([
      expect.objectContaining({ src: "./icon-192.png", sizes: "192x192" }),
      expect.objectContaining({ src: "./icon-512.png", sizes: "512x512" }),
    ]);
  });

  it("escapes user-provided names through JSON serialization", () => {
    const serialized = serializeWebManifest(
      createWebManifest({ name: '사이트 "이름"', shortName: "앱" }),
    );
    expect(() => JSON.parse(serialized)).not.toThrow();
    expect(JSON.parse(serialized).name).toBe('사이트 "이름"');
  });
});

describe("favicon ZIP package", () => {
  it("has a stable filename constant and all required, dimensionally valid files", async () => {
    expect(FAVICON_PACKAGE_FILENAME).toBe("favicon-package.zip");
    const contents = createFaviconPackageAssets(createPngSet(), {
      name: "픽셀핏 테스트",
      shortName: "픽셀핏",
    });
    const bytes = await buildFaviconZip(contents.assets);
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(bytes);

    expect(Object.keys(zip.files).sort()).toEqual([...REQUIRED_PACKAGE_FILES].sort());

    const expectedPngSizes = {
      "favicon-16x16.png": 16,
      "favicon-32x32.png": 32,
      "favicon-48x48.png": 48,
      "apple-touch-icon.png": 180,
      "icon-192.png": 192,
      "icon-512.png": 512,
    } as const;

    for (const [filename, size] of Object.entries(expectedPngSizes)) {
      const payload = await zip.file(filename)?.async("uint8array");
      expect(payload).toBeDefined();
      expect(readPngDimensions(payload!)).toEqual({ width: size, height: size });
    }

    const icoBytes = await zip.file("favicon.ico")?.async("uint8array");
    expect(parseFaviconIco(icoBytes!).entries.map((entry) => entry.size)).toEqual(
      ICO_SIZES,
    );

    const manifestText = await zip.file("site.webmanifest")?.async("string");
    expect(JSON.parse(manifestText!).name).toBe("픽셀핏 테스트");
    expect(await zip.file("favicon-install.html")?.async("string")).toContain(
      '<link rel="manifest" href="/site.webmanifest">',
    );
  });
});
