import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Page } from "@playwright/test";
import { makePng, readImageDimensions, readImageFormat } from "./helpers/fixture";
import { expect, test } from "./helpers/qa-test";

const digest = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

async function download(page: Page, button: string) {
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: button, exact: true }).click();
  const file = await event;
  const filename = await file.path();
  if (!filename) throw new Error("download missing");
  return readFile(filename);
}

function pngImageData(bytes: Buffer): Buffer {
  const chunks: Buffer[] = [];
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    if (bytes.subarray(offset + 4, offset + 8).toString() === "IDAT") chunks.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  return Buffer.concat(chunks);
}

test("공개 설명의 측정 예시를 실제 편집기·다운로드로 재현한다", async ({ page, browser, qaGuard }, testInfo) => {
  test.setTimeout(120_000);
  const input = await readFile("public/samples/image-compressor/original.png");
  const privateInput = makePng(320, 400, true);
  const passportInput = makePng(640, 800);
  const published = JSON.parse(await readFile("src/config/processing-evidence.json", "utf8"));
  qaGuard.protectOutgoingValues("evidence.png", "private-evidence.png", "passport-evidence.png");
  const records: Array<Record<string, unknown>> = [];
  const outputDirectory = testInfo.outputPath("processing-evidence");
  await mkdir(outputDirectory, { recursive: true });

  async function upload(route: string, bytes: Buffer = input, name = "evidence.png") {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await page.getByLabel("사진 또는 파일 선택").setInputFiles({ name, mimeType: "image/png", buffer: bytes });
  }
  async function record(id: string, bytes: Buffer, source: Buffer, settings: string, expected: { width: number; height: number }, extra = {}) {
    expect(readImageDimensions(bytes)).toEqual(expected);
    const format = readImageFormat(bytes);
    const reference = published.records.find((record: { id: string }) => record.id === id);
    expect(reference, `${id} 공개 측정 근거`).toBeDefined();
    expect(digest(source)).toBe(reference.inputSha256);
    expect({ ...expected, format }).toEqual({ width: reference.width, height: reference.height, format: reference.format });
    if (browser.version() === published.browser && testInfo.project.name === published.project && process.platform === published.platform && process.arch === published.arch && process.env.PIXELFIT_RECORD_EVIDENCE !== "1") {
      expect(digest(bytes), `${id} 동일 브라우저에서 공개 측정 결과 drift`).toBe(reference.outputSha256);
    }
    await writeFile(path.join(outputDirectory, `${id}.${format === "jpeg" ? "jpg" : format}`), bytes);
    records.push({ id, inputBytes: source.length, inputSha256: digest(source), inputDimensions: readImageDimensions(source), settings, format, ...expected, bytes: bytes.length, outputSha256: digest(bytes), ...extra });
  }

  for (const format of ["jpeg", "png"] as const) {
    await upload("/image-compressor/");
    await page.getByRole("button", { name: format === "jpeg" ? "JPG" : "PNG", exact: true }).click();
    await page.getByLabel("직접 입력").fill("100");
    await page.getByRole("button", { name: "목표 용량으로 만들기" }).click();
    await expect(page.getByRole("heading", { name: "압축 결과를 실제 파일로 확인했습니다." })).toBeVisible();
    const bytes = await download(page, "결과 다운로드");
    expect(readImageFormat(bytes)).toBe(format);
    if (format === "jpeg" && testInfo.project.name === "chromium") expect(bytes.length).toBeLessThanOrEqual(102400);
    if (format === "png") expect(bytes.length).toBeGreaterThan(102400);
    if (bytes.length > 102400) {
      await expect(page.getByRole("definition").filter({ hasText: /^목표 초과$/ })).toBeVisible();
    }
    await record(`compress-${format}`, bytes, input, `${format.toUpperCase()} · 100KB(102,400B) · 축소 안 함`, { width: 1200, height: 800 }, { reachedTarget: bytes.length <= 102400 });
  }

  await upload("/image-resizer/");
  // Numeric inputs must not force the WebKit mobile controls beyond the viewport.
  const percentButton = page.getByRole("button", { name: "퍼센트", exact: true });
  await percentButton.scrollIntoViewIfNeeded();
  const bounds = await percentButton.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.getByRole("button", { name: "퍼센트", exact: true }).click();
  await page.getByLabel("원본 대비(%)").fill("50");
  await page.getByRole("button", { name: "새 크기로 만들기" }).click();
  await expect(page.getByRole("heading", { name: "요청한 픽셀 크기로 만들었습니다." })).toBeVisible();
  await record("resize-half", await download(page, "결과 다운로드"), input, "50% · PNG · 전체 포함", { width: 600, height: 400 });

  for (const format of ["jpeg", "png", "webp"] as const) {
    await upload("/image-converter/");
    await page.getByRole("button", { name: format === "jpeg" ? "JPG" : format.toUpperCase(), exact: true }).click();
    if (format !== "png") await expect(page.getByLabel("출력 품질")).toHaveValue("0.9");
    await page.getByRole("button", { name: `${format === "jpeg" ? "JPG" : format.toUpperCase()} 파일 만들기`, exact: true }).click();
    const result = page.getByRole("heading", { name: "변환 결과의 형식과 크기를 확인했습니다." });
    const unsupported = page.getByRole("alert").filter({ hasText: "브라우저가 WEBP 대신 PNG 파일을 만들었습니다." });
    await expect(result.or(unsupported)).toBeVisible();
    if (await unsupported.isVisible()) {
      expect(format).toBe("webp");
      records.push({ id: "convert-webp", unsupported: true });
      continue;
    }
    const bytes = await download(page, "결과 다운로드");
    expect(readImageFormat(bytes)).toBe(format);
    await record(`convert-${format}`, bytes, input, `${format.toUpperCase()}${format === "png" ? " · 품질값 없음" : " · 품질 90%"} · 촬영 정보 제외`, { width: 1200, height: 800 });
  }

  await upload("/photo-privacy-cleaner/", privateInput, "private-evidence.png");
  await expect(page.getByText("작성자", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "선택 정보 정리", exact: true }).click();
  await expect(page.getByText(/필드를 정리했습니다/)).toBeVisible();
  const cleaned = await download(page, "정리된 파일 다운로드");
  expect(cleaned.includes(Buffer.from("QA Fixture Maker"))).toBe(false);
  expect(cleaned.includes(Buffer.from("PixelFit E2E"))).toBe(false);
  expect(cleaned.includes(Buffer.from("Synthetic test image"))).toBe(false);
  expect(pngImageData(cleaned)).toEqual(pngImageData(privateInput));
  await record("privacy-png", cleaned, privateInput, "PNG · 작성자·설명·편집 프로그램 기본 선택 제거", { width: 320, height: 400 }, { imageDataPreserved: true, removedSyntheticFields: 3 });

  await upload("/passport-photo/", passportInput, "passport-evidence.png");
  await expect(page.getByText("크기와 위치")).toBeVisible();
  await page.getByRole("button", { name: "확인하고 만들기", exact: true }).click();
  await expect(page.getByRole("heading", { name: "파일이 준비됐습니다." })).toBeVisible();
  const passport = await download(page, "결과 다운로드");
  expect(passport.length).toBeLessThanOrEqual(512000);
  expect(readImageFormat(passport)).toBe("jpeg");
  await record("passport-jpeg", passport, passportInput, "자체 도형 PNG · 초기 크롭 · JPG 출력", { width: 413, height: 531 });

  const measuredOn = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const receipt = { measuredOn, browser: browser.version(), project: testInfo.project.name, platform: process.platform, arch: process.arch, records };
  const receiptPath = path.join(outputDirectory, "receipt.json");
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  await testInfo.attach("actual-processing-evidence", { path: receiptPath, contentType: "application/json" });
  // Explicit opt-in records a candidate; normal tests never rewrite published evidence.
  if (process.env.PIXELFIT_RECORD_EVIDENCE === "1" && testInfo.project.name === "chromium") {
    await mkdir("output/seo-2026-10-12", { recursive: true });
    await writeFile("output/seo-2026-10-12/processing-evidence.json", `${JSON.stringify(receipt, null, 2)}\n`);
  }
});
