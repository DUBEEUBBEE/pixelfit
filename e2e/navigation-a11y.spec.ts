import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { makePng } from "./helpers/fixture";
import { expect, test } from "./helpers/qa-test";

const toolRoutes = [
  ["/passport-photo", "한국 온라인 여권사진", "사진 또는 파일 선택"],
  ["/id-photo", "일반 증명사진 3×4cm", "사진 또는 파일 선택"],
  ["/resident-id-photo", "주민등록증 사진", "사진 또는 파일 선택"],
  ["/youtube-banner", "유튜브 채널 배너", "사진 또는 파일 선택"],
  ["/favicon-maker", "파비콘 패키지 생성기", "사진 또는 파일 선택"],
  ["/photo-privacy-cleaner", "사진 개인정보 메타데이터 정리", "사진 또는 파일 선택"],
  ["/image-compressor", "사진 용량 줄이기", "사진 또는 파일 선택"],
  ["/image-resizer", "이미지 크기 조절", "사진 또는 파일 선택"],
  ["/image-converter", "이미지 형식 변환", "사진 또는 파일 선택"],
  ["/social-image-pack", "SNS 이미지 세트", "사진 또는 파일 선택"],
  ["/instagram-profile-picture", "인스타그램 프로필 사진", "사진 또는 파일 선택"],
  ["/youtube-thumbnail", "유튜브 썸네일", "사진 또는 파일 선택"],
  ["/four-cut-photo", "네컷사진 만들기", "사진 1~4장 선택"],
  ["/film-photo", "필름사진 효과", "사진 또는 파일 선택"],
] as const;

const guideRoutes = [
  ["/guide/passport-photo-413x531", "온라인 여권사진 413×531px 만드는 법"],
  ["/guide/photo-under-500kb", "사진을 500KB 이하로 줄이는 순서"],
  ["/guide/id-photo-size", "증명사진 크기: 3×4cm와 3.5×4.5cm"],
  ["/guide/dpi-vs-pixels", "DPI와 픽셀의 차이, 인화 크기 계산법"],
  ["/guide/youtube-banner-safe-area", "유튜브 배너 안전영역 계산과 배치"],
  ["/guide/favicon-files", "파비콘 파일 구성: ICO·PNG·manifest"],
  ["/guide/exif-photo-privacy", "EXIF 위치정보와 사진 개인정보 지우기"],
  ["/guide/jpeg-png-webp", "JPEG·PNG·WebP, 어떤 형식을 고를까"],
] as const;

const heroTitle = "용도를 고르고\n사진만 올리세요.";

async function expectNoSeriousAxeViolations(page: Page, context: string) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
  expect(serious, `${context}: ${serious.map((item) => `${item.id}(${item.nodes.length})`).join(", ")}`).toEqual([]);
}

test("홈 검색과 모든 도구 경로가 연결된다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "용도를 고르고 사진만 올리세요." })).toBeVisible();
  await expect(page.getByRole("region", { name: "자주 쓰는 도구" }).getByRole("article")).toHaveCount(4);
  await page.getByRole("button", { name: "JPG 변환" }).click();
  await expect(page.getByLabel("도구 검색")).toHaveValue("JPG 변환");
  await expect(page.getByRole("region", { name: "검색 결과" }).getByRole("heading", { name: "이미지 형식 변환" })).toBeVisible();
  await page.getByLabel("도구 검색").fill("");
  await page.getByRole("button", { name: "공식 사진" }).click();
  await expect(page.getByRole("region", { name: "공식 사진" }).getByRole("article")).toHaveCount(3);
  await page.getByText("전체 도구 14개 보기").click();
  await expect(page.locator("#all-tools")).toHaveAttribute("open", "");
  await expect(page.locator("#all-tools").getByRole("article")).toHaveCount(14);
  await page.getByLabel("도구 검색").fill("위치정보");
  await expect(page.getByRole("heading", { name: /사진 개인정보/ })).toBeVisible();
  await page.getByLabel("도구 검색").fill("없는도구");
  await expect(page.getByRole("region", { name: "검색 결과" }).getByRole("link", { name: "사진 용량 줄이기" })).toBeVisible();
  for (const [route, heading, uploadLabel] of toolRoutes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByLabel(uploadLabel)).toBeAttached();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route}/$`));
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og\/tools\/[a-z0-9-]+\.png$/);
  }
});

test("홈 전체 도구 링크는 JavaScript 없이도 펼쳐서 이동할 수 있다", async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "대표 브라우저에서 점진적 향상 경로를 한 번 검증합니다.");
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");

  const allTools = page.locator("#all-tools");
  await expect(allTools).not.toHaveAttribute("open", "");
  await page.getByText("전체 도구 14개 보기").click();
  await expect(allTools).toHaveAttribute("open", "");
  await expect(allTools.locator(".card-link")).toHaveCount(14);

  await context.close();
});

test("홈 제목은 데스크톱과 모바일에서 지정한 두 줄로만 보이고 모바일 메뉴를 모두 탐색할 수 있다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "한 Chromium 컨텍스트에서 대표 뷰포트를 직접 순회합니다.");

  const viewports = [
    { width: 1440, height: 900, mobile: false },
    { width: 1024, height: 768, mobile: false },
    { width: 390, height: 844, mobile: true },
    { width: 320, height: 800, mobile: true },
  ] as const;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const title = page.locator(".hero h1");
    await expect(title).toBeVisible();
    expect(await title.textContent(), `${viewport.width}px 제목 원문`).toBe(heroTitle);
    await expect(title).toHaveCSS("white-space", "pre");

    const titleGeometry = await title.evaluate((element) => {
      const glyphs: Array<{ value: string; left: number; top: number }> = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();

      while (node) {
        const text = node.textContent ?? "";
        for (let offset = 0; offset < text.length; offset += 1) {
          const value = text[offset];
          if (value === "\n") continue;

          const range = document.createRange();
          range.setStart(node, offset);
          range.setEnd(node, offset + 1);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 || rect.height > 0) glyphs.push({ value, left: rect.left, top: rect.top });
        }
        node = walker.nextNode();
      }

      const rows: Array<{ top: number; glyphs: typeof glyphs }> = [];
      for (const glyph of glyphs.sort((a, b) => a.top - b.top || a.left - b.left)) {
        const row = rows.find((candidate) => Math.abs(candidate.top - glyph.top) < 1);
        if (row) row.glyphs.push(glyph);
        else rows.push({ top: glyph.top, glyphs: [glyph] });
      }

      const rect = element.getBoundingClientRect();
      return {
        lines: rows
          .sort((a, b) => a.top - b.top)
          .map((row) => row.glyphs.sort((a, b) => a.left - b.left).map((glyph) => glyph.value).join("").trim()),
        elementInsideViewport: rect.left >= -1 && rect.right <= window.innerWidth + 1,
        elementHasNoHorizontalOverflow: element.scrollWidth <= element.clientWidth + 1,
        documentHasNoHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 1,
      };
    });

    expect(titleGeometry.lines, `${viewport.width}px 시각적 줄`).toEqual(["용도를 고르고", "사진만 올리세요."]);
    expect(titleGeometry.elementInsideViewport, `${viewport.width}px 제목 화면 경계`).toBe(true);
    expect(titleGeometry.elementHasNoHorizontalOverflow, `${viewport.width}px 제목 오버플로`).toBe(true);
    expect(titleGeometry.documentHasNoHorizontalOverflow, `${viewport.width}px 문서 오버플로`).toBe(true);

    const desktopNav = page.getByRole("navigation", { name: "주요 메뉴", exact: true });
    const mobileNav = page.getByRole("navigation", { name: "모바일 주요 메뉴", exact: true });
    if (!viewport.mobile) {
      await expect(desktopNav).toBeVisible();
      await expect(desktopNav.getByRole("link")).toHaveText(["도구", "가이드", "소개", "문의"]);
      await expect(mobileNav).toBeHidden();
      continue;
    }

    await expect(desktopNav).toBeHidden();
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByRole("link")).toHaveText(["도구", "가이드"]);
    const menuButton = mobileNav.getByRole("button", { name: "메뉴 열기" });
    await expect(menuButton).toHaveAttribute("aria-controls", "mobile-more-menu");
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");

    const navGeometry = await mobileNav.evaluate((nav) => {
      const navRect = nav.getBoundingClientRect();
      return Array.from(nav.querySelectorAll(":scope > a, :scope > .mobile-menu > button")).map((item) => {
        const rect = item.getBoundingClientRect();
        return {
          text: item.textContent?.trim(),
          insideNav: rect.left >= navRect.left - 1 && rect.right <= navRect.right + 1,
          insideViewport: rect.left >= -1 && rect.right <= window.innerWidth + 1,
          hasBox: rect.width > 0 && rect.height > 0,
        };
      });
    });

    expect(navGeometry, `${viewport.width}px 모바일 메뉴 배치`).toEqual([
      { text: "도구", insideNav: true, insideViewport: true, hasBox: true },
      { text: "가이드", insideNav: true, insideViewport: true, hasBox: true },
      { text: "메뉴", insideNav: true, insideViewport: true, hasBox: true },
    ]);

    await page.getByRole("link", { name: "픽셀핏 홈" }).focus();
    for (const label of ["도구", "가이드"]) {
      await page.keyboard.press("Tab");
      await expect(mobileNav.getByRole("link", { name: label, exact: true })).toBeFocused();
    }
    await page.keyboard.press("Tab");
    await expect(menuButton).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(mobileNav.getByRole("button", { name: "메뉴 닫기" })).toHaveAttribute("aria-expanded", "true");

    const moreMenu = page.getByLabel("더 보기 메뉴");
    await expect(moreMenu).toBeVisible();
    await expect(moreMenu.getByRole("link")).toHaveText(["소개", "문의", "개인정보", "이용약관", "GitHub"]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${viewport.width}px 열린 메뉴 문서 오버플로`).toBe(true);

    await page.keyboard.press("Escape");
    await expect(mobileNav.getByRole("button", { name: "메뉴 열기" })).toBeFocused();
    await expect(moreMenu).toBeHidden();

    await mobileNav.getByRole("button", { name: "메뉴 열기" }).click();
    await page.locator("main").click({ position: { x: 1, y: 1 } });
    await expect(moreMenu).toBeHidden();

    await mobileNav.getByRole("button", { name: "메뉴 열기" }).click();
    await moreMenu.getByRole("link", { name: "소개" }).click();
    await expect(page).toHaveURL(/\/about\/$/u);
    await expect(page.getByRole("button", { name: "메뉴 열기" })).toHaveAttribute("aria-expanded", "false");
  }
});

test("가이드 허브와 8개 상세 가이드가 정적으로 연결된다", async ({ page }) => {
  await page.goto("/guide");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1, name: "숫자를 이해하면 결과를 더 정확히 확인할 수 있습니다." })).toBeVisible();
  for (const [route, heading] of guideRoutes) {
    await expect(page.getByRole("link", { name: `${heading} 읽기` })).toHaveAttribute("href", `${route}/`);
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route}/$`));
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og\/guides\/[a-z0-9-]+\.png$/);
    await page.goto("/guide");
    await page.waitForLoadState("networkidle");
  }
});

test("자체 제작 샘플은 스크롤 전 요청되지 않고 카드 안에서 잘리지 않는다", async ({ page }) => {
  const sampleRoutes = [
    ["/image-compressor", 4],
    ["/youtube-thumbnail", 4],
    ["/four-cut-photo", 4],
    ["/film-photo", 5],
    ["/passport-photo", 5],
  ] as const;
  let sampleRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.includes("/samples/")) sampleRequests.push(request.url());
  });

  for (const [route, expectedCount] of sampleRoutes) {
    sampleRequests = [];
    await page.goto(route);
    await page.waitForTimeout(250);
    expect(sampleRequests, `${route} 초기 샘플 요청`).toEqual([]);

    const gallery = page.locator('section[aria-labelledby$="-sample-gallery-title"]');
    await gallery.scrollIntoViewIfNeeded();
    const images = gallery.getByRole("img");
    await expect(images).toHaveCount(expectedCount);
    await expect.poll(
      () => images.evaluateAll((elements) => elements.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)),
      { message: `${route} 샘플 이미지 decode` },
    ).toBe(true);
    await expect.poll(() => new Set(sampleRequests).size, { message: `${route} 샘플 요청 수` }).toBe(expectedCount);

    if (route === "/image-compressor") {
      expect(sampleRequests.every((url) => new URL(url).pathname.includes("/samples/image-compressor/thumbnails/"))).toBe(true);
      expect(sampleRequests.some((url) => /\/samples\/image-compressor\/(?:original|target-)/u.test(new URL(url).pathname))).toBe(false);
    }

    for (let index = 0; index < expectedCount; index += 1) {
      const geometry = await images.nth(index).evaluate((image) => {
        const imageRect = image.getBoundingClientRect();
        const mediaRect = image.parentElement?.getBoundingClientRect();
        return {
          hasMedia: Boolean(mediaRect),
          insideHorizontally: Boolean(mediaRect && imageRect.left >= mediaRect.left - 1 && imageRect.right <= mediaRect.right + 1),
          insideVertically: Boolean(mediaRect && imageRect.top >= mediaRect.top - 1 && imageRect.bottom <= mediaRect.bottom + 1),
        };
      });
      expect(geometry, `${route} 샘플 ${index + 1}`).toEqual({
        hasMedia: true,
        insideHorizontally: true,
        insideVertically: true,
      });
    }
  }
});

test("@a11y 홈과 14개 도구의 초기 상태에 심각한 접근성 위반이 없다", async ({ page }) => {
  for (const route of ["/", ...toolRoutes.map(([toolRoute]) => toolRoute), "/guide", "/guide/exif-photo-privacy"]) {
    await page.goto(route);
    await expectNoSeriousAxeViolations(page, route);
  }
});

test("@a11y 신규 편집기를 키보드로 조작하고 결과 상태를 검사한다", async ({ page, qaGuard }) => {
  test.setTimeout(150_000);
  qaGuard.protectOutgoingValues(
    "keyboard-compressor.png",
    "keyboard-resizer.png",
    "keyboard-converter.png",
    "keyboard-thumbnail.png",
    "keyboard-first.png",
    "keyboard-second.png",
  );

  await page.goto("/image-compressor");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({
    name: "keyboard-compressor.png",
    mimeType: "image/png",
    buffer: makePng(640, 800),
  });
  await expect(page.getByRole("heading", { name: "목표 용량", exact: true })).toBeVisible({ timeout: 30_000 });

  const targetSize = page.getByLabel("직접 입력");
  await targetSize.focus();
  await targetSize.press("ControlOrMeta+A");
  await targetSize.pressSequentially("100");
  await expect(targetSize).toHaveValue("100");

  const allowDownscale = page.getByLabel(/필요하면 해상도도 줄이기/);
  await allowDownscale.focus();
  await page.keyboard.press("Space");
  await expect(allowDownscale).toBeChecked();

  const jpegFormat = page.getByRole("button", { name: "JPG", exact: true });
  await jpegFormat.focus();
  await page.keyboard.press("Enter");
  await expect(jpegFormat).toHaveAttribute("aria-pressed", "true");

  const compress = page.getByRole("button", { name: "목표 용량으로 만들기" });
  await compress.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "압축 결과를 실제 파일로 확인했습니다." })).toBeVisible({ timeout: 30_000 });

  await expectNoSeriousAxeViolations(page, "compressor result");

  await page.goto("/image-resizer");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({
    name: "keyboard-resizer.png",
    mimeType: "image/png",
    buffer: makePng(640, 800),
  });
  await expect(page.getByRole("heading", { name: "크기 지정 방식" })).toBeVisible();

  const resizeWidth = page.getByLabel("가로(px)");
  await resizeWidth.focus();
  await resizeWidth.press("ControlOrMeta+A");
  await resizeWidth.pressSequentially("320");
  await expect(page.getByLabel("세로(px)")).toHaveValue("400");

  const resize = page.getByRole("button", { name: "새 크기로 만들기" });
  await resize.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "요청한 픽셀 크기로 만들었습니다." })).toBeVisible({ timeout: 30_000 });
  await expectNoSeriousAxeViolations(page, "resizer result");

  await page.goto("/image-converter");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({
    name: "keyboard-converter.png",
    mimeType: "image/png",
    buffer: makePng(320, 400, true),
  });
  await expect(page.getByRole("heading", { name: "출력 파일 형식" })).toBeVisible();

  const removeMetadata = page.getByLabel(/개인정보성 촬영 정보 제거/);
  await expect(removeMetadata).toBeChecked();
  const converterJpeg = page.getByRole("button", { name: "JPG", exact: true });
  await converterJpeg.focus();
  await page.keyboard.press("Enter");
  await expect(converterJpeg).toHaveAttribute("aria-pressed", "true");

  const convert = page.getByRole("button", { name: "JPG 파일 만들기" });
  await convert.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "변환 결과의 형식과 크기를 확인했습니다." })).toBeVisible({ timeout: 30_000 });
  await expectNoSeriousAxeViolations(page, "converter result");

  await page.goto("/youtube-thumbnail");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("사진 또는 파일 선택").setInputFiles({
    name: "keyboard-thumbnail.png",
    mimeType: "image/png",
    buffer: makePng(960, 540),
  });
  await expect(page.getByRole("heading", { name: "완성형 템플릿 4종" })).toBeVisible();

  const lowerThird = page.getByRole("button", { name: /로어 서드/ });
  await lowerThird.focus();
  await page.keyboard.press("Enter");
  await expect(lowerThird).toHaveAttribute("aria-pressed", "true");

  const title = page.getByLabel("제목", { exact: true });
  await title.focus();
  await title.press("ControlOrMeta+A");
  await title.pressSequentially("키보드 썸네일 제목");
  await expect(title).toHaveValue("키보드 썸네일 제목");

  const titleSize = page.getByLabel(/^제목 크기/);
  await titleSize.focus();
  await page.keyboard.press("End");
  await expect(titleSize).toHaveValue("300");

  await page.goto("/four-cut-photo");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("사진 1~4장 선택").setInputFiles([
    { name: "keyboard-first.png", mimeType: "image/png", buffer: makePng(480, 640) },
    { name: "keyboard-second.png", mimeType: "image/png", buffer: makePng(640, 480) },
  ]);
  await expect(page.getByRole("group", { name: "네컷 순서와 크롭 예상" })).toBeVisible();

  const secondSlot = page.getByRole("button", { name: "2칸", exact: true });
  await secondSlot.focus();
  await page.keyboard.press("Enter");
  await expect(secondSlot).toHaveAttribute("aria-pressed", "true");

  const horizontalCrop = page.getByLabel(/^가로 위치/);
  await horizontalCrop.focus();
  await page.keyboard.press("ArrowRight");
  await expect(horizontalCrop).toHaveValue("0.01");

  const frameColor = page.getByLabel("프레임 색상 선택");
  await expect(frameColor).toHaveValue("#f8f3e9");
  await expect(page.getByText("현재 프레임 색상 #F8F3E9", { exact: true })).toBeVisible();

  const moveForward = page.getByRole("button", { name: "앞으로", exact: true });
  await expect(moveForward).toBeEnabled();
  await moveForward.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/현재 1번 사진: keyboard-first\.png/)).toBeVisible();
});

test("404와 공통 정보 페이지가 정적으로 렌더링된다", async ({ page, qaGuard }) => {
  for (const route of ["/about", "/contact", "/privacy", "/terms", "/guide"]) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
  }
  qaGuard.expectNextConsoleError(/^Failed to load resource: the server responded with a status of 404 \(Not Found\)$/);
  await page.goto("/missing-route");
  await expect(page.getByText("이 페이지는 규격 밖이에요.")).toBeVisible();
});
