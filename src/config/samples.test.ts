import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { allSampleAssets, sampleGalleries, sampleToolIds } from "./samples";

function listSampleImages(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return listSampleImages(absolute);
    return /\.(?:png|svg)$/u.test(entry.name)
      ? [path.relative(path.join(process.cwd(), "public"), absolute).split(path.sep).join("/")]
      : [];
  });
}

describe("self-produced sample assets", () => {
  it("covers the required tool result sets without duplicate paths", () => {
    expect(sampleToolIds).toEqual([
      "image-compressor",
      "youtube-thumbnail",
      "four-cut-photo",
      "film-photo",
      "passport-photo",
    ]);
    expect(sampleGalleries["image-compressor"].items.map((item) => item.id)).toEqual([
      "original",
      "target-500kb",
      "target-200kb",
      "target-100kb-downscaled",
    ]);
    expect(sampleGalleries["youtube-thumbnail"].items).toHaveLength(4);
    expect(sampleGalleries["four-cut-photo"].items).toHaveLength(4);
    expect(sampleGalleries["film-photo"].items.map((item) => item.id)).toEqual([
      "original",
      "light-leak",
      "mono",
      "low-saturation",
      "flash",
    ]);
    expect(sampleGalleries["passport-photo"].items.map((item) => item.id)).toEqual([
      "top-margin-tight",
      "face-too-small",
      "off-center",
      "background-shadow",
      "near-recommended",
    ]);
    expect(allSampleAssets).toHaveLength(22);
    expect(new Set(allSampleAssets.map((item) => item.src)).size).toBe(allSampleAssets.length);

    const physicalImages = listSampleImages(path.join(process.cwd(), "public", "samples")).sort();
    const declaredImages = allSampleAssets.flatMap((item) => [
      item.src.slice(1),
      ...(item.thumbnailSrc ? [item.thumbnailSrc.slice(1)] : []),
    ]).sort();
    expect(declaredImages).toHaveLength(26);
    expect(physicalImages).toEqual(declaredImages);
  });

  it.each(allSampleAssets)("ships an internal deterministic image at $src", (asset) => {
    expect(asset.src).toMatch(/^\/samples\/[a-z0-9/-]+\.(?:png|svg)$/u);
    expect(asset.src).not.toMatch(/^https?:|^\/\//u);
    expect(asset.alt.trim().length).toBeGreaterThan(20);
    expect(asset.width).toBeGreaterThan(0);
    expect(asset.height).toBeGreaterThan(0);

    const filePath = path.join(process.cwd(), "public", asset.src.slice(1));
    expect(fs.existsSync(filePath)).toBe(true);
    const contents = fs.readFileSync(filePath);
    if (asset.src.endsWith(".svg")) {
      const svg = contents.toString("utf8");
      expect(svg).toContain(`width="${asset.width}" height="${asset.height}"`);
      expect(svg).toContain('data-pixelfit-sample="true"');
      expect(svg).not.toMatch(/(?:href|src)\s*=\s*["'](?:https?:|\/\/|data:)/iu);
    } else {
      expect(contents.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(contents.readUInt32BE(16)).toBe(asset.width);
      expect(contents.readUInt32BE(20)).toBe(asset.height);
      expect(contents.includes(Buffer.from("PixelFit self-produced synthetic compression sample"))).toBe(true);
    }
  });

  it("keeps every compressor display equal to the generated PNG and its target contract", () => {
    const items = sampleGalleries["image-compressor"].items;
    for (const asset of items) {
      const filePath = path.join(process.cwd(), "public", asset.src.slice(1));
      const actualBytes = fs.statSync(filePath).size;
      expect(asset.displayedBytes).toBe(actualBytes);
      expect(asset.actualBytes).toBe(actualBytes);
      expect(asset.caption).toContain(String(actualBytes).replace(/\B(?=(\d{3})+(?!\d))/gu, ","));
      expect(asset.caption).toContain("PNG");
      expect(asset.caption).toContain("확인:");
      expect(asset.thumbnailSrc).toMatch(/^\/samples\/image-compressor\/thumbnails\/[a-z0-9-]+\.png$/u);
      expect(asset.thumbnailWidth).toBe(480);
      expect(asset.thumbnailHeight).toBe(320);

      const thumbnailPath = path.join(process.cwd(), "public", asset.thumbnailSrc!.slice(1));
      const thumbnail = fs.readFileSync(thumbnailPath);
      expect(thumbnail.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(thumbnail.readUInt32BE(16)).toBe(480);
      expect(thumbnail.readUInt32BE(20)).toBe(320);
      expect(thumbnail.byteLength).toBeLessThan(actualBytes);
    }
    expect(items[1].actualBytes).toBeLessThanOrEqual(500 * 1024);
    expect(items[2].actualBytes).toBeLessThanOrEqual(200 * 1024);
    expect(items[3].actualBytes).toBeLessThanOrEqual(100 * 1024);
    expect(items.slice(0, 3).every((item) => item.width === 1200 && item.height === 800)).toBe(true);
    expect(items[3]).toMatchObject({ width: 900, height: 600 });
    expect(items[3].caption).toContain("해상도 축소 적용");
  });

  it("uses explicit user-facing sample meanings without approval claims", () => {
    const youtubeTitles = sampleGalleries["youtube-thumbnail"].items.map((item) => item.title);
    expect(youtubeTitles).toContain("인물 왼쪽 · 제목 오른쪽");
    expect(youtubeTitles).toContain("인물 오른쪽 · 제목 왼쪽");

    const passport = sampleGalleries["passport-photo"];
    expect(passport.description).toContain("자동 검사는 참고용");
    expect(passport.description).toContain("실제 심사 결과와 다를 수 있습니다");
    expect(passport.items.map((item) => item.title)).toEqual([
      "머리 위 여백이 부족한 예",
      "얼굴이 너무 작은 예",
      "좌우로 치우친 예",
      "배경 그림자가 의심되는 예",
      "권장 범위에 가까운 배치 예",
    ]);
    expect(JSON.stringify(passport)).not.toMatch(/통과|합격|보장/u);
  });

  it("keeps visual semantics explicit in generated SVG fixtures", () => {
    const readSample = (relativePath: string) => fs.readFileSync(
      path.join(process.cwd(), "public", "samples", relativePath),
      "utf8",
    );

    const youtubeLeft = readSample("youtube-thumbnail/editorial-left.svg");
    const youtubeRight = readSample("youtube-thumbnail/editorial-right.svg");
    expect(youtubeLeft).toContain("translate(250 458)");
    expect(youtubeLeft).toContain('x="1190"');
    expect(youtubeRight).toContain("translate(1030 458)");
    expect(youtubeRight).toContain('x="82"');

    const passportSvgs = sampleGalleries["passport-photo"].items.map((item) => readSample(item.src.split("/").slice(-2).join("/")));
    expect(new Set(passportSvgs).size).toBe(5);
    expect(passportSvgs[3]).toContain('opacity=".28"');
    expect(passportSvgs.join("\n")).not.toMatch(/통과|합격|보장/u);

    const mono = readSample("film-photo/mono.svg");
    expect(mono).toContain('<feColorMatrix type="saturate" values="0"/>');
    for (const item of sampleGalleries["film-photo"].items.slice(1)) {
      const svg = readSample(item.src.split("/").slice(-2).join("/"));
      expect(svg).toContain("약하게");
      expect(svg).toContain("강하게");
    }
  });

  it("matches every checked-in asset to the deterministic generator", () => {
    expect(() => execFileSync(
      process.execPath,
      ["scripts/generate-samples.mjs", "--check"],
      { cwd: process.cwd(), encoding: "utf8", stdio: "pipe" },
    )).not.toThrow();
  }, 15_000);
});
