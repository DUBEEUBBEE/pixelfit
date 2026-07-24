import type { Locator, Page } from "@playwright/test";
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

test("사진 압축은 실제 목표 바이트 이하 JPEG를 내려받는다", async ({ page }) => {
  await page.goto("/image-compressor");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({ name: "compress.png", mimeType: "image/png", buffer: makePng(640, 800) });
  await expect(page.getByRole("heading", { name: "목표 용량", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "JPG", exact: true }).click();
  await page.getByLabel("직접 입력").fill("100");
  await page.getByRole("button", { name: "목표 용량으로 만들기" }).click();
  await expect(page.getByRole("heading", { name: "압축 결과를 실제 파일로 확인했습니다." })).toBeVisible({ timeout: 30_000 });
  const bytes = await downloadedBytes(page, page.getByRole("button", { name: "결과 다운로드" }), "pixelfit-compressed.jpg");
  expect(bytes.length).toBeLessThanOrEqual(100 * 1024);
  expect(readImageFormat(bytes)).toBe("jpeg");
  expect(readImageDimensions(bytes)).toEqual({ width: 640, height: 800 });
});

test("크기 조절은 비율 잠금 계산과 실제 PNG 픽셀을 일치시킨다", async ({ page }) => {
  await page.goto("/image-resizer");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({ name: "resize.png", mimeType: "image/png", buffer: makePng(640, 800) });
  await expect(page.getByRole("heading", { name: "크기 지정 방식" })).toBeVisible();
  await page.getByLabel("가로(px)").fill("320");
  await expect(page.getByLabel("세로(px)")).toHaveValue("400");
  await page.getByRole("button", { name: "새 크기로 만들기" }).click();
  await expect(page.getByRole("heading", { name: "요청한 픽셀 크기로 만들었습니다." })).toBeVisible({ timeout: 30_000 });
  const bytes = await downloadedBytes(page, page.getByRole("button", { name: "결과 다운로드" }), "pixelfit-resized.png");
  expect(readImageFormat(bytes)).toBe("png");
  expect(readImageDimensions(bytes)).toEqual({ width: 320, height: 400 });
});

test("형식 변환은 메타데이터를 빼고 지원되는 실제 출력 형식으로 저장한다", async ({ page }) => {
  await page.goto("/image-converter");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({ name: "convert.png", mimeType: "image/png", buffer: makePng(320, 400, true) });
  await expect(page.getByText(/실제 파일 서명으로 확인한 입력 형식/)).toBeVisible();
  await page.getByRole("button", { name: "WEBP", exact: true }).click();
  await page.getByRole("button", { name: "WEBP 파일 만들기" }).click();
  const resultHeading = page.getByRole("heading", { name: "변환 결과의 형식과 크기를 확인했습니다." });
  const unsupportedWebp = page.getByRole("alert").filter({ hasText: "브라우저가 WEBP 대신 PNG 파일을 만들었습니다." });
  await expect(resultHeading.or(unsupportedWebp)).toBeVisible({ timeout: 30_000 });

  let expectedFormat: "jpeg" | "webp" = "webp";
  let expectedFilename = "pixelfit-converted.webp";
  if (await unsupportedWebp.isVisible()) {
    await page.getByRole("button", { name: "JPG", exact: true }).click();
    await page.getByRole("button", { name: "JPG 파일 만들기" }).click();
    await expect(resultHeading).toBeVisible({ timeout: 30_000 });
    expectedFormat = "jpeg";
    expectedFilename = "pixelfit-converted.jpg";
  }

  const bytes = await downloadedBytes(page, page.getByRole("button", { name: "결과 다운로드" }), expectedFilename);
  expect(readImageFormat(bytes)).toBe(expectedFormat);
  expect(readImageDimensions(bytes)).toEqual({ width: 320, height: 400 });
  expect(bytes.includes(Buffer.from("QA Fixture Maker"))).toBe(false);
  expect(bytes.includes(Buffer.from("PixelFit E2E"))).toBe(false);
});
