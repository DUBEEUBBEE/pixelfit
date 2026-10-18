import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, "").split("=")));
const origin = args.origin ?? "https://pixelfit.me";
const baseline = JSON.parse(await readFile(args.baseline ?? "output/seo-2026-10-12/public-before/audit.json", "utf8"));
const output = args.output ?? "output/seo-2026-10-12/rendered-public";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await context.newPage();
const records = [];
const priority = new Set(["/", "/image-compressor/", "/image-resizer/", "/passport-photo/", "/photo-privacy-cleaner/", "/guide/jpeg-png-webp/"]);
for (const source of baseline.pages) {
  const route = new URL(source.requestedUrl).pathname;
  const errors = [];
  const failedRequests = [];
  const externalRequests = [];
  const consoleListener = (message) => { if (["error", "warning"].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`); };
  const errorListener = (error) => errors.push(error.message);
  const failureListener = (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText });
  const requestListener = (request) => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) externalRequests.push(request.url()); };
  page.on("console", consoleListener);
  page.on("pageerror", errorListener);
  page.on("requestfailed", failureListener);
  page.on("request", requestListener);
  const start = Date.now();
  const response = await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
  const isTool = source.structuredData.some((item) => item["@type"] === "WebApplication") && route !== "/";
  let editorReady = null;
  if (isTool) {
    try { await page.locator('input[type="file"]').waitFor({ state: "attached", timeout: 10000 }); editorReady = true; } catch { editorReady = false; }
  }
  const readyMs = Date.now() - start;
  const viewportWidth = page.viewportSize().width;
  const gallery = page.locator("section").filter({ has: page.locator('h2[id$="-sample-gallery-title"]') });
  if (await gallery.count()) {
    await gallery.scrollIntoViewIfNeeded();
    await gallery.locator("img").first().waitFor({ state: "attached", timeout: 10000 });
  }
  for (const image of await page.locator("main img").all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((element) => element.decode().catch(() => null));
  }
  const rendered = await page.evaluate((viewportWidth) => ({
    title: document.title,
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    headings: [...document.querySelectorAll("main h1,main h2,main h3,main h4")].map((el) => ({ level: Number(el.tagName.slice(1)), text: el.textContent.trim() })),
    layoutViewportWidth: innerWidth,
    horizontalOverflow: document.documentElement.scrollWidth > viewportWidth + 1,
    images: [...document.querySelectorAll("main img")].map((el) => ({ src: el.currentSrc, loaded: el.complete && el.naturalWidth > 0 })),
    loadingRegions: document.querySelectorAll('[aria-label="이미지 도구 불러오는 중"]').length,
    adRuntime: document.querySelectorAll('script[src*="pagead2"],ins.adsbygoogle,[data-ad-slot]').length,
  }), viewportWidth);
  const missingStaticHeadings = source.headings.filter((heading) => heading.level <= 2 && !rendered.headings.some((candidate) => heading.level === candidate.level && heading.text === candidate.text));
  records.push({ route, status: response.status(), editorReady, readyMs, ...rendered, missingStaticHeadings, errors, failedRequests, externalRequests });
  console.log(`${route} ${response.status()} editor=${editorReady} errors=${errors.length}`);
  if (priority.has(route)) {
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${output}/${route.replaceAll("/", "_") || "home"}.png` });
    const evidence = page.locator(".processing-evidence");
    if (await evidence.count()) await evidence.screenshot({ path: `${output}/${route.replaceAll("/", "_")}-evidence.png` });
  }
  page.off("console", consoleListener); page.off("pageerror", errorListener); page.off("requestfailed", failureListener); page.off("request", requestListener);
}
const noScriptContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
const noScriptPage = await noScriptContext.newPage();
const noScriptRecords = [];
for (const route of priority) {
  await noScriptPage.goto(`${origin}${route}`);
  const notices = noScriptPage.locator("noscript");
  noScriptRecords.push({ route, h1: await noScriptPage.locator("h1").allTextContents(), headings: await noScriptPage.locator("main h2").allTextContents(), textLength: (await noScriptPage.locator("main").innerText()).length, javaScriptNotice: await notices.count() ? await notices.allTextContents() : null });
}
await browser.close();
const observedOn = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
await writeFile(`${output}/audit.json`, `${JSON.stringify({ observedOn, origin, viewport: "390×844", records, noScriptRecords }, null, 2)}\n`);
console.log(JSON.stringify({ output, pages: records.length, problems: records.filter((record) => record.status !== 200 || record.editorReady === false || record.loadingRegions || record.horizontalOverflow || record.errors.length || record.failedRequests.length || record.missingStaticHeadings.length || record.images.some((image) => !image.loaded)), noScriptRecords }, null, 2));
