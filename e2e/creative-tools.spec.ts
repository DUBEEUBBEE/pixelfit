import type { Locator, Page } from "@playwright/test";
import JSZip from "jszip";
import { readFile } from "node:fs/promises";
import { makePng, readImageDimensions, readImageFormat } from "./helpers/fixture";
import { expect, test } from "./helpers/qa-test";

async function downloadedBytes(page: Page, trigger: Locator, filename: string): Promise<Buffer> {
  const event = page.waitForEvent("download");
  await trigger.click();
  const download = await event;
  expect(download.suggestedFilename()).toBe(filename);
  const path = await download.path();
  if (!path) throw new Error("download path missing");
  return readFile(path);
}

test("SNS 세트 ZIP은 선택한 세 비율의 실제 JPEG를 포함한다", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/social-image-pack");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({ name: "social.png", mimeType: "image/png", buffer: makePng(800, 600) });
  await expect(page.getByRole("heading", { name: "결과별 독립 크롭" })).toBeVisible();
  await page.getByRole("button", { name: "선택 이미지 만들기" }).click();
  await expect(page.getByRole("heading", { name: "SNS 이미지 세트가 준비됐습니다." })).toBeVisible({ timeout: 60_000 });
  const bytes = await downloadedBytes(page, page.getByRole("button", { name: "전체 ZIP 다운로드" }), "pixelfit-social-image-pack.zip");
  const zip = await JSZip.loadAsync(bytes);
  const expected = new Map([
    ["pixelfit-social-1x1-1080x1080.jpg", { width: 1080, height: 1080 }],
    ["pixelfit-social-4x5-1080x1350.jpg", { width: 1080, height: 1350 }],
    ["pixelfit-social-9x16-1080x1920.jpg", { width: 1080, height: 1920 }],
  ]);
  expect(Object.keys(zip.files).sort()).toEqual([...expected.keys()].sort());
  for (const [name, dimensions] of expected) {
    const image = Buffer.from(await zip.file(name)!.async("uint8array"));
    expect(readImageFormat(image)).toBe("jpeg");
    expect(readImageDimensions(image)).toEqual(dimensions);
  }
});

test("유튜브 썸네일은 텍스트 설정을 반영해 3840×2160 JPEG를 만든다", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/youtube-thumbnail");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({ name: "thumbnail.png", mimeType: "image/png", buffer: makePng(960, 540) });
  await expect(page.getByRole("heading", { name: "완성형 템플릿 4종" })).toBeVisible();
  await page.getByLabel("제목", { exact: true }).fill("픽셀핏 브라우저 QA");
  await page.getByLabel("짧은 보조 문구").fill("실제 픽셀과 파일을 확인합니다");
  await page.getByRole("button", { name: "3840×2160 썸네일 만들기" }).click();
  await expect(page.getByRole("heading", { name: "4K 16:9 썸네일을 만들었습니다." })).toBeVisible({ timeout: 60_000 });
  const bytes = await downloadedBytes(page, page.getByRole("button", { name: "결과 다운로드" }), "youtube-thumbnail-3840x2160.jpg");
  expect(readImageFormat(bytes)).toBe("jpeg");
  expect(readImageDimensions(bytes)).toEqual({ width: 3840, height: 2160 });
});

test("네컷사진은 여러 입력을 가로 1800×1200 결과로 조합한다", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/four-cut-photo");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("사진 1~4장 선택").setInputFiles([
    { name: "first.png", mimeType: "image/png", buffer: makePng(480, 640) },
    { name: "second.png", mimeType: "image/png", buffer: makePng(640, 480) },
  ]);
  await expect(page.getByRole("group", { name: "네컷 순서와 크롭 예상" })).toBeVisible();
  await page.getByRole("button", { name: /가로 네컷/ }).click();
  await page.getByLabel("짧은 문구 (선택)").fill("PIXELFIT QA");
  await page.getByRole("button", { name: "네컷사진 만들기" }).click();
  await expect(page.getByRole("heading", { name: "네 칸을 실제 이미지로 만들었습니다." })).toBeVisible({ timeout: 60_000 });
  const bytes = await downloadedBytes(page, page.getByRole("button", { name: "결과 다운로드" }), "four-cut-horizontal-1800x1200.jpg");
  expect(readImageFormat(bytes)).toBe("jpeg");
  expect(readImageDimensions(bytes)).toEqual({ width: 1800, height: 1200 });
});

test("필름 효과는 생성형 경로 없이 원본 픽셀 크기의 실제 JPEG를 만든다", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/film-photo");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({ name: "film.png", mimeType: "image/png", buffer: makePng(640, 800) });
  await expect(page.getByText(/생성형 AI를 사용하지 않는 결정적 픽셀 필터/)).toBeVisible();
  await page.getByRole("button", { name: /흑백 필름/ }).click();
  await page.getByRole("button", { name: "필름사진 만들기" }).click();
  await expect(page.getByRole("heading", { name: "결정적 필름 효과를 적용했습니다." })).toBeVisible({ timeout: 60_000 });
  const bytes = await downloadedBytes(page, page.getByRole("button", { name: "결과 다운로드" }), "film-photo-mono.jpg");
  expect(readImageFormat(bytes)).toBe("jpeg");
  expect(readImageDimensions(bytes)).toEqual({ width: 640, height: 800 });
});
