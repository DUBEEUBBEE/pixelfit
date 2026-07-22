import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  ["/passport-photo", "한국 온라인 여권사진"],
  ["/id-photo", "일반 증명사진 3×4cm"],
  ["/resident-id-photo", "주민등록증 사진"],
  ["/youtube-banner", "유튜브 채널 배너"],
  ["/favicon-maker", "파비콘 패키지 생성기"],
  ["/photo-privacy-cleaner", "사진 개인정보 메타데이터 정리"],
] as const;

test("홈 검색과 모든 도구 경로가 연결된다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "용도를 고르고 사진만 올리세요." })).toBeVisible();
  await page.getByLabel("도구 검색").fill("위치정보");
  await expect(page.getByRole("heading", { name: /사진 개인정보/ })).toBeVisible();
  for (const [route, heading] of routes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByLabel("사진 또는 파일 선택")).toBeAttached();
  }
});

test("@a11y 홈과 대표 도구에 심각한 접근성 위반이 없다", async ({ page }) => {
  for (const route of ["/", "/passport-photo", "/favicon-maker", "/photo-privacy-cleaner"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
    expect(serious, `${route}: ${serious.map((item) => `${item.id}(${item.nodes.length})`).join(", ")}`).toEqual([]);
  }
});

test("404와 공통 정보 페이지가 정적으로 렌더링된다", async ({ page }) => {
  for (const route of ["/privacy", "/terms", "/guide"]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
  }
  await page.goto("/missing-route");
  await expect(page.getByText("이 페이지는 규격 밖이에요.")).toBeVisible();
});
