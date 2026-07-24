import type { Page } from "@playwright/test";
import { makePng } from "./helpers/fixture";
import { expect, test } from "./helpers/qa-test";

type StorageSnapshot = {
  local: Array<[string, string]>;
  session: Array<[string, string]>;
  indexed: Array<string | undefined>;
  cache: string[];
};

async function storageSnapshot(page: Page): Promise<StorageSnapshot> {
  return page.evaluate(async () => ({
    local: Object.entries(localStorage),
    session: Object.entries(sessionStorage),
    indexed: "databases" in indexedDB ? (await indexedDB.databases()).map((database) => database.name) : [],
    cache: "caches" in globalThis ? await caches.keys() : [],
  }));
}

test("같은 사진 전달은 메모리에만 머물고 새로고침하면 사라진다", async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    const stats = { created: 0, revoked: 0 };
    const createObjectURL = URL.createObjectURL.bind(URL);
    const revokeObjectURL = URL.revokeObjectURL.bind(URL);
    Object.assign(window, { __pixelFitObjectUrlStats: stats });
    URL.createObjectURL = (object) => {
      stats.created += 1;
      return createObjectURL(object);
    };
    URL.revokeObjectURL = (url) => {
      stats.revoked += 1;
      return revokeObjectURL(url);
    };
  });
  const writes: string[] = [];
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH"].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
  });

  await page.goto("/passport-photo");
  await page.waitForLoadState("networkidle");
  const before = await storageSnapshot(page);
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({ name: "same-photo-private.png", mimeType: "image/png", buffer: makePng(640, 800, true) });
  await expect(page.getByText("크기와 위치")).toBeVisible();
  await page.getByRole("button", { name: "확인하고 만들기" }).click();
  await expect(page.getByRole("heading", { name: "파일이 준비됐습니다." })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "사진 용량 줄이기" }).click();
  await expect(page).toHaveURL(/\/image-compressor\/?$/);
  await expect(page.getByRole("heading", { name: "목표 용량", exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel("사진 또는 파일 선택")).toHaveCount(0);

  const afterTransfer = await storageSnapshot(page);
  expect(afterTransfer).toEqual(before);
  expect(JSON.stringify(afterTransfer)).not.toContain("same-photo-private.png");
  expect(writes).toEqual([]);
  const objectUrls = await page.evaluate(() => (window as unknown as { __pixelFitObjectUrlStats: { created: number; revoked: number } }).__pixelFitObjectUrlStats);
  expect(objectUrls.created).toBeGreaterThanOrEqual(2);
  expect(objectUrls.revoked).toBeGreaterThanOrEqual(1);

  await page.reload();
  await expect(page.getByLabel("사진 또는 파일 선택")).toBeAttached();
  await expect(page.getByRole("heading", { name: "목표 용량", exact: true })).toHaveCount(0);
  expect(await storageSnapshot(page)).toEqual(before);
  expect(writes).toEqual([]);
});
