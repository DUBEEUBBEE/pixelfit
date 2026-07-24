import JSZip from "jszip";
import { readFile } from "node:fs/promises";
import { makePng, readImageDimensions } from "./helpers/fixture";
import { expect, test } from "./helpers/qa-test";

test("파비콘 ZIP에 유효한 ICO·PNG·manifest와 설치 문서가 들어간다", async ({ page }) => {
  await page.goto("/favicon-maker");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: makePng(512, 512) });
  await expect(page.getByText("작은 크기 미리보기").or(page.getByLabel("작은 크기 미리보기"))).toBeVisible();
  await page.getByRole("button", { name: /원형 배경/ }).click();
  await page.getByLabel("사이트 이름 (선택)").fill("픽셀핏 테스트");
  await page.getByRole("button", { name: "패키지 만들기" }).click();
  await expect(page.getByRole("heading", { name: "웹사이트에 바로 설치하세요." })).toBeVisible({ timeout: 30_000 });
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "ZIP 다운로드" }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe("favicon-package.zip");
  const path = await download.path();
  if (!path) throw new Error("download path missing");
  const zip = await JSZip.loadAsync(await readFile(path));
  const expected = ["favicon.ico", "favicon-16x16.png", "favicon-32x32.png", "favicon-48x48.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "site.webmanifest", "favicon-install.html", "README.txt"];
  expect(Object.keys(zip.files).sort()).toEqual(expected.sort());
  for (const [name, size] of [["favicon-16x16.png", 16], ["favicon-32x32.png", 32], ["favicon-48x48.png", 48], ["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]] as const) {
    const content = await zip.file(name)!.async("nodebuffer");
    expect(readImageDimensions(content)).toEqual({ width: size, height: size });
  }
  const manifest = JSON.parse(await zip.file("site.webmanifest")!.async("string"));
  expect(manifest.name).toBe("픽셀핏 테스트");
  const ico = await zip.file("favicon.ico")!.async("nodebuffer");
  expect(ico.readUInt16LE(0)).toBe(0);
  expect(ico.readUInt16LE(2)).toBe(1);
  expect(ico.readUInt16LE(4)).toBe(3);
});

test("PNG 개인정보를 선택 제거하고 재파싱한 파일을 다운로드한다", async ({ page }) => {
  await page.goto("/photo-privacy-cleaner");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({ name: "private.png", mimeType: "image/png", buffer: makePng(320, 400, true) });
  await expect(page.getByText("작성자", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("편집 프로그램", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "선택 정보 정리" }).click();
  await expect(page.getByText(/필드를 정리했습니다/)).toBeVisible();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "정리된 파일 다운로드" }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe("photo-private-metadata-removed.png");
  const path = await download.path();
  if (!path) throw new Error("download path missing");
  const content = await readFile(path);
  expect(content.includes(Buffer.from("QA Fixture Maker"))).toBe(false);
  expect(content.includes(Buffer.from("PixelFit E2E"))).toBe(false);
  expect(readImageDimensions(content)).toEqual({ width: 320, height: 400 });
});

test("이미지를 고른 뒤 외부 쓰기 요청이나 브라우저 저장소 복사가 없다", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH"].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
  });
  await page.goto("/passport-photo");
  await page.waitForLoadState("networkidle");
  const before = await page.evaluate(async () => ({
    local: Object.entries(localStorage),
    session: Object.entries(sessionStorage),
    indexed: "databases" in indexedDB ? (await indexedDB.databases()).map((database) => database.name) : [],
    cache: "caches" in globalThis ? await caches.keys() : [],
  }));
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({ name: "private.png", mimeType: "image/png", buffer: makePng() });
  await expect(page.getByText("크기와 위치")).toBeVisible();
  expect(writes).toEqual([]);
  const after = await page.evaluate(async () => ({
    local: Object.entries(localStorage),
    session: Object.entries(sessionStorage),
    indexed: "databases" in indexedDB ? (await indexedDB.databases()).map((database) => database.name) : [],
    cache: "caches" in globalThis ? await caches.keys() : [],
  }));
  expect(after).toEqual(before);
  expect(JSON.stringify(after)).not.toContain("private.png");
});
