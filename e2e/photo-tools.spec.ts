import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { makePng, readImageDimensions } from "./helpers/fixture";

const photoTools: ReadonlyArray<{ route: string; width: number; height: number; filename: string; maxBytes?: number }> = [
  { route: "/passport-photo", width: 413, height: 531, filename: "passport-photo-413x531.jpg", maxBytes: 500 * 1024 },
  { route: "/id-photo", width: 354, height: 472, filename: "id-photo-354x472.jpg" },
  { route: "/resident-id-photo", width: 413, height: 531, filename: "resident-id-photo-413x531.jpg" },
  { route: "/youtube-banner", width: 2560, height: 1440, filename: "youtube-banner-2560x1440.jpg", maxBytes: 6 * 1024 * 1024 },
];

for (const tool of photoTools) {
  test(`${tool.route} 업로드부터 정확한 출력 다운로드까지 동작한다`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    await page.goto(tool.route);
    await page.getByLabel("사진 또는 파일 선택").setInputFiles({ name: "synthetic-fixture.png", mimeType: "image/png", buffer: makePng() });
    await expect(page.getByText("크기와 위치")).toBeVisible();
    await page.getByLabel("확대").press("ArrowRight");
    await page.getByLabel(/사진 위치 조정 영역/).press("ArrowRight");
    if (tool.route === "/id-photo") {
      await page.getByRole("button", { name: /^흰색/ }).click();
    }
    await page.getByRole("button", { name: "확인하고 만들기" }).click();
    await expect(page.getByRole("heading", { name: "파일이 준비됐습니다." })).toBeVisible({ timeout: 30_000 });
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /결과 다운로드/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(tool.filename);
    const path = await download.path();
    if (!path) throw new Error("download path missing");
    const bytes = await readFile(path);
    expect(readImageDimensions(bytes)).toEqual({ width: tool.width, height: tool.height });
    if (tool.maxBytes) expect(bytes.length).toBeLessThanOrEqual(tool.maxBytes);
    expect(consoleErrors).toEqual([]);
  });
}

test("여권사진에서는 배경 제거·합성 경로가 노출되지 않는다", async ({ page }) => {
  await page.goto("/passport-photo");
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({ name: "passport.png", mimeType: "image/png", buffer: makePng() });
  await expect(page.getByText(/배경 제거·합성·얼굴 보정은 실행할 수 없습니다/)).toBeVisible();
  await expect(page.getByRole("button", { name: /흰색 배경/ })).toHaveCount(0);
});

test("처리 중 새 파일을 골라도 최신 파일 상태로 계속된다", async ({ page }) => {
  await page.goto("/id-photo");
  const input = page.getByLabel("사진 또는 파일 선택");
  await input.setInputFiles({ name: "first.png", mimeType: "image/png", buffer: makePng(600, 800) });
  await expect(page.getByText("크기와 위치")).toBeVisible();
  await page.getByRole("button", { name: "원본으로 초기화" }).click();
  await expect(page.getByText("크기와 위치")).toBeVisible();
});
