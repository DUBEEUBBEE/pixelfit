import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const PAGE_SITE_URL = "https://dubeeubbee.github.io/pixelfit";
const PAGE_BASE_PATH = "/pixelfit";
const DEFAULT_SITEMAP_URL_COUNT = 27;
const TEXT_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".map", ".txt", ".webmanifest", ".xml"]);
const ADSENSE_MARKERS = ["pagead2.googlesyndication.com", "adsbygoogle", "data-pixelfit-adsense"];
const STATIC_ROUTE_PATHS = new Set(["/", "/about", "/contact", "/guide", "/privacy", "/terms"]);
const UNSUPPORTED_STRUCTURED_DATA_TYPES = new Set(["SoftwareApplication", "TechArticle", "WebApplication"]);

const argumentsMap = new Map(process.argv.slice(2).map((argument) => {
  const [key, ...value] = argument.split("=");
  return [key, value.join("=")];
}));

if (argumentsMap.has("--help")) {
  process.stdout.write([
    "Usage: node scripts/verify-static-export.mjs --mode=pages|custom",
    "",
    "Environment:",
    "  PIXELFIT_EXPECTED_SITEMAP_URLS  Expected sitemap URL count (default: 27)",
    "  NEXT_PUBLIC_CUSTOM_DOMAIN or CUSTOM_DOMAIN is required in custom mode.",
    "  AdSense and URL environment variables must match the preceding build.",
    "",
  ].join("\n"));
  process.exit(0);
}

function selectedEnvironmentValue(publicKey, fallbackKey) {
  return process.env[publicKey]?.trim() || process.env[fallbackKey]?.trim() || "";
}

const customDomain = selectedEnvironmentValue("NEXT_PUBLIC_CUSTOM_DOMAIN", "CUSTOM_DOMAIN").toLowerCase();
const requestedMode = argumentsMap.get("--mode") || process.env.PIXELFIT_EXPORT_MODE || "auto";
const mode = requestedMode === "auto" ? (customDomain ? "custom" : "pages") : requestedMode;

if (mode !== "pages" && mode !== "custom") {
  throw new Error(`지원하지 않는 export 검증 mode입니다: ${mode}`);
}
if (mode === "custom" && !customDomain) {
  throw new Error("custom mode 검증에는 NEXT_PUBLIC_CUSTOM_DOMAIN 또는 CUSTOM_DOMAIN이 필요합니다.");
}

const expectedSiteUrl = mode === "pages" ? PAGE_SITE_URL : `https://${customDomain}`;
const expectedOrigin = new URL(expectedSiteUrl).origin;
const expectedBasePath = mode === "pages" ? PAGE_BASE_PATH : "";
const expectedUrlCount = Number.parseInt(process.env.PIXELFIT_EXPECTED_SITEMAP_URLS || `${DEFAULT_SITEMAP_URL_COUNT}`, 10);

if (!Number.isSafeInteger(expectedUrlCount) || expectedUrlCount < 1) {
  throw new Error("PIXELFIT_EXPECTED_SITEMAP_URLS는 1 이상의 정수여야 합니다.");
}

const outputDirectory = path.resolve(process.cwd(), "out");
const failures = [];
const passes = [];

function check(condition, successMessage, failureMessage) {
  if (condition) passes.push(successMessage);
  else failures.push(failureMessage);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "iu"));
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, "giu")) ?? [];
}

function findCanonical(html) {
  const tag = tags(html, "link").find((candidate) => getAttribute(candidate, "rel")?.split(/\s+/u).includes("canonical"));
  return tag ? getAttribute(tag, "href") : undefined;
}

function findOpenGraphImage(html) {
  const tag = tags(html, "meta").find((candidate) => getAttribute(candidate, "property") === "og:image");
  return tag ? getAttribute(tag, "content") : undefined;
}

function topLevelJsonLdTypes(value) {
  if (Array.isArray(value)) return value.flatMap(topLevelJsonLdTypes);
  if (!value || typeof value !== "object") return [];
  const type = value["@type"];
  return Array.isArray(type)
    ? type.filter((candidate) => typeof candidate === "string")
    : typeof type === "string" ? [type] : [];
}

function expectedStructuredDataTypes(routePath) {
  if (routePath === "/") return ["WebSite"];
  if (routePath === "/about") return ["Organization"];
  if (routePath === "/guide") return ["ItemList"];
  if (routePath.startsWith("/guide/")) return ["Article", "BreadcrumbList"];
  if (!STATIC_ROUTE_PATHS.has(routePath)) return ["BreadcrumbList"];
  return [];
}

function incrementOccurrence(map, value, publicUrl) {
  const urls = map.get(value) ?? [];
  urls.push(publicUrl);
  map.set(value, urls);
}

function htmlReferences(html, attribute) {
  const values = [];
  for (const tag of html.match(/<(?:a|link|script)\b[^>]*>/giu) ?? []) {
    const value = getAttribute(tag, attribute);
    if (value) values.push(value);
  }
  return values;
}

function stripExpectedBasePath(pathname) {
  if (!expectedBasePath) return pathname;
  if (pathname === `${expectedBasePath}/`) return "/";
  if (!pathname.startsWith(`${expectedBasePath}/`)) return undefined;
  return pathname.slice(expectedBasePath.length);
}

function localFileForUrl(urlValue) {
  const url = new URL(urlValue, expectedOrigin);
  if (url.origin !== expectedOrigin) return undefined;
  const routePath = stripExpectedBasePath(url.pathname);
  if (routePath === undefined) return undefined;
  return path.join(outputDirectory, decodeURIComponent(routePath.replace(/^\//u, "")));
}

function htmlFileForPublicUrl(urlValue) {
  const url = new URL(urlValue);
  const routePath = stripExpectedBasePath(url.pathname);
  if (routePath === undefined) return undefined;
  const relativePath = routePath.replace(/^\//u, "").replace(/\/$/u, "");
  return relativePath ? path.join(outputDirectory, relativePath, "index.html") : path.join(outputDirectory, "index.html");
}

function isFileLikePath(pathname) {
  return /\.[A-Za-z0-9]{1,12}$/u.test(pathname);
}

function inspectInternalLinks(html, htmlLabel) {
  for (const href of htmlReferences(html, "href")) {
    if (!href.startsWith("/")) continue;
    const pathname = href.split(/[?#]/u, 1)[0];
    if (mode === "pages" && !pathname.startsWith(`${PAGE_BASE_PATH}/`)) {
      failures.push(`${htmlLabel}: 내부 링크가 ${PAGE_BASE_PATH}/ 밖을 가리킵니다: ${href}`);
    }
    if (mode === "custom" && pathname.startsWith(`${PAGE_BASE_PATH}/`)) {
      failures.push(`${htmlLabel}: custom root 빌드에 ${PAGE_BASE_PATH} 링크가 남았습니다: ${href}`);
    }
    if (!isFileLikePath(pathname) && !pathname.endsWith("/")) {
      failures.push(`${htmlLabel}: route 링크에 trailing slash가 없습니다: ${href}`);
    }
  }
}

async function readPngDimensions(filePath) {
  const handle = await readFile(filePath);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (handle.length < 24 || !handle.subarray(0, 8).equals(pngSignature) || handle.toString("ascii", 12, 16) !== "IHDR") {
    return undefined;
  }
  return { width: handle.readUInt32BE(16), height: handle.readUInt32BE(20) };
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  }));
  return nested.flat();
}

await access(outputDirectory);

const sitemapPath = path.join(outputDirectory, "sitemap.xml");
const sitemapXml = await readFile(sitemapPath, "utf8");
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/giu)].map((match) => match[1].replaceAll("&amp;", "&"));

check(sitemapUrls.length === expectedUrlCount, `sitemap URL ${expectedUrlCount}개`, `sitemap URL 수가 ${expectedUrlCount}개가 아닙니다: ${sitemapUrls.length}개`);
check(new Set(sitemapUrls).size === sitemapUrls.length, "sitemap URL 중복 없음", "sitemap에 중복 URL이 있습니다.");

const expectedSitemapPrefix = `${expectedSiteUrl}/`;
const ogFiles = new Set();
const referencedJavascript = new Set();
const initialHtmlFiles = new Set();
const titleOccurrences = new Map();
const descriptionOccurrences = new Map();
let nextAssetReferenceCount = 0;

for (const publicUrl of sitemapUrls) {
  check(publicUrl.startsWith(expectedSitemapPrefix), `sitemap origin: ${publicUrl}`, `sitemap URL이 예상 site URL 밖입니다: ${publicUrl}`);
  check(publicUrl.endsWith("/"), `sitemap trailing slash: ${publicUrl}`, `sitemap URL에 trailing slash가 없습니다: ${publicUrl}`);

  const htmlPath = htmlFileForPublicUrl(publicUrl);
  if (!htmlPath || !(await exists(htmlPath))) {
    failures.push(`sitemap URL의 HTML이 없습니다: ${publicUrl}`);
    continue;
  }

  const relativeHtmlPath = path.relative(outputDirectory, htmlPath);
  const html = await readFile(htmlPath, "utf8");
  initialHtmlFiles.add(htmlPath);

  const htmlTag = tags(html, "html")[0];
  check(getAttribute(htmlTag ?? "", "lang") === "ko", `html lang: ${publicUrl}`, `${relativeHtmlPath}: html lang이 ko가 아닙니다.`);

  const titleMatches = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/giu)];
  const title = titleMatches[0]?.[1]?.trim();
  check(titleMatches.length === 1 && Boolean(title), `title 1개: ${publicUrl}`, `${relativeHtmlPath}: 비어 있지 않은 title이 정확히 1개여야 합니다.`);
  if (title) incrementOccurrence(titleOccurrences, title, publicUrl);

  const descriptionTags = tags(html, "meta").filter((candidate) => getAttribute(candidate, "name") === "description");
  const description = descriptionTags[0] ? getAttribute(descriptionTags[0], "content")?.trim() : undefined;
  check(descriptionTags.length === 1 && Boolean(description), `description 1개: ${publicUrl}`, `${relativeHtmlPath}: 비어 있지 않은 meta description이 정확히 1개여야 합니다.`);
  if (description) incrementOccurrence(descriptionOccurrences, description, publicUrl);

  const h1Count = (html.match(/<h1\b/giu) ?? []).length;
  check(h1Count === 1, `h1 1개: ${publicUrl}`, `${relativeHtmlPath}: h1이 정확히 1개가 아닙니다: ${h1Count}개`);

  const robotsTags = tags(html, "meta").filter((candidate) => getAttribute(candidate, "name") === "robots");
  const robotsContent = robotsTags[0] ? getAttribute(robotsTags[0], "content")?.toLowerCase() : undefined;
  check(
    robotsTags.length === 1 && Boolean(robotsContent?.includes("index")) && Boolean(robotsContent?.includes("follow")) && !robotsContent?.includes("noindex"),
    `robots index/follow: ${publicUrl}`,
    `${relativeHtmlPath}: robots meta가 유일한 index,follow 계약과 다릅니다.`,
  );

  const jsonLdTypes = [];
  for (const match of html.matchAll(/<script\b[^>]*type=(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/giu)) {
    try {
      jsonLdTypes.push(...topLevelJsonLdTypes(JSON.parse(match[1])));
    } catch {
      failures.push(`${relativeHtmlPath}: 파싱할 수 없는 JSON-LD가 있습니다.`);
    }
  }
  const routePathWithSlash = stripExpectedBasePath(new URL(publicUrl).pathname);
  const routePath = routePathWithSlash?.replace(/\/$/u, "") || "/";
  const expectedTypes = expectedStructuredDataTypes(routePath);
  check(
    JSON.stringify([...jsonLdTypes].sort()) === JSON.stringify(expectedTypes),
    `JSON-LD types ${expectedTypes.join(",") || "none"}: ${publicUrl}`,
    `${relativeHtmlPath}: JSON-LD 최상위 type이 예상과 다릅니다. expected=${expectedTypes.join(",") || "none"} actual=${jsonLdTypes.sort().join(",") || "none"}`,
  );
  for (const type of jsonLdTypes) {
    if (UNSUPPORTED_STRUCTURED_DATA_TYPES.has(type)) failures.push(`${relativeHtmlPath}: 근거 계약에서 제외한 JSON-LD type이 있습니다: ${type}`);
  }

  const canonical = findCanonical(html);
  check(canonical === publicUrl, `canonical: ${publicUrl}`, `${relativeHtmlPath}: canonical이 sitemap URL과 다릅니다. expected=${publicUrl} actual=${canonical ?? "MISSING"}`);
  inspectInternalLinks(html, relativeHtmlPath);

  const ogImage = findOpenGraphImage(html);
  if (!ogImage) {
    failures.push(`${relativeHtmlPath}: og:image가 없습니다.`);
  } else {
    const ogUrl = new URL(ogImage, expectedOrigin);
    const ogFile = localFileForUrl(ogUrl.href);
    if (ogUrl.origin !== expectedOrigin || !ogFile) failures.push(`${relativeHtmlPath}: og:image가 예상 origin/base path 밖입니다: ${ogImage}`);
    else ogFiles.add(ogFile);
  }

  const assetReferences = [...htmlReferences(html, "src"), ...htmlReferences(html, "href")].filter((value) => value.includes("/_next/"));
  nextAssetReferenceCount += assetReferences.length;
  for (const assetReference of assetReferences) {
    if (mode === "pages" && !assetReference.startsWith(`${PAGE_BASE_PATH}/_next/`)) {
      failures.push(`${relativeHtmlPath}: Pages asset이 ${PAGE_BASE_PATH}/_next/를 사용하지 않습니다: ${assetReference}`);
    }
    if (mode === "custom" && !assetReference.startsWith("/_next/")) {
      failures.push(`${relativeHtmlPath}: custom root asset이 /_next/를 사용하지 않습니다: ${assetReference}`);
    }
    const assetPath = localFileForUrl(assetReference);
    if (!assetPath || !(await exists(assetPath))) failures.push(`${relativeHtmlPath}: 참조한 Next asset 파일이 없습니다: ${assetReference}`);
    if (assetReference.endsWith(".js") && assetPath) referencedJavascript.add(assetPath);
  }
}

for (const [title, urls] of titleOccurrences) {
  check(urls.length === 1, `고유 title: ${title}`, `title이 중복됩니다: ${title} (${urls.join(", ")})`);
}
for (const [description, urls] of descriptionOccurrences) {
  check(urls.length === 1, `고유 description: ${urls[0]}`, `meta description이 중복됩니다: ${description} (${urls.join(", ")})`);
}

check(nextAssetReferenceCount > 0, "Next asset 참조 발견", "검증할 Next asset 참조가 없습니다.");

for (const ogFile of ogFiles) {
  const relativeOgPath = path.relative(outputDirectory, ogFile);
  if (!(await exists(ogFile))) {
    failures.push(`og:image 파일이 없습니다: ${relativeOgPath}`);
    continue;
  }
  const dimensions = await readPngDimensions(ogFile);
  check(dimensions?.width === 1200 && dimensions?.height === 630, `OG 1200x630: ${relativeOgPath}`, `OG 파일이 유효한 1200x630 PNG가 아닙니다: ${relativeOgPath}`);
}
check(ogFiles.size > 0, `OG 파일 ${ogFiles.size}개 참조`, "검증할 OG 파일 참조가 없습니다.");

const cnamePath = path.join(outputDirectory, "CNAME");
const cnameExists = await exists(cnamePath);
if (mode === "pages") {
  check(!cnameExists, "Pages mode CNAME 없음", "Pages mode artifact에 CNAME이 있으면 안 됩니다.");
} else {
  const cname = cnameExists ? (await readFile(cnamePath, "utf8")).trim().toLowerCase() : "";
  check(cname === customDomain, `custom CNAME: ${customDomain}`, `custom CNAME이 없거나 domain과 다릅니다. expected=${customDomain} actual=${cname || "MISSING"}`);
}

const adsEnabledValue = selectedEnvironmentValue("NEXT_PUBLIC_ADSENSE_ENABLED", "ADSENSE_ENABLED");
const adsClient = selectedEnvironmentValue("NEXT_PUBLIC_ADSENSE_CLIENT", "ADSENSE_CLIENT");
const adsSlot = selectedEnvironmentValue("NEXT_PUBLIC_ADSENSE_CONTENT_SLOT", "ADSENSE_CONTENT_SLOT");
const googleVerification = selectedEnvironmentValue("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION", "GOOGLE_SITE_VERIFICATION");
const naverVerification = selectedEnvironmentValue("NEXT_PUBLIC_NAVER_SITE_VERIFICATION", "NAVER_SITE_VERIFICATION");
const adsAccountExpected = /^ca-pub-\d{16}$/u.test(adsClient);
const adsTxtExpected = mode === "custom" && adsAccountExpected;
const adsPath = path.join(outputDirectory, "ads.txt");
const adsExists = await exists(adsPath);

for (const htmlPath of initialHtmlFiles) {
  const html = await readFile(htmlPath, "utf8");
  for (const [name, expectedContent] of [
    ["google-site-verification", googleVerification],
    ["naver-site-verification", naverVerification],
  ]) {
    const verificationTags = tags(html, "meta").filter((tag) => getAttribute(tag, "name") === name);
    if (expectedContent) {
      check(
        verificationTags.length === 1 && getAttribute(verificationTags[0], "content") === expectedContent,
        `${name} meta: ${path.relative(outputDirectory, htmlPath)}`,
        `${path.relative(outputDirectory, htmlPath)}: ${name} meta가 없거나 설정값과 다릅니다.`,
      );
    } else {
      check(
        verificationTags.length === 0,
        `${name} meta 미설정: ${path.relative(outputDirectory, htmlPath)}`,
        `${path.relative(outputDirectory, htmlPath)}: 설정 없이 ${name} meta가 있습니다.`,
      );
    }
  }

  const accountTags = tags(html, "meta").filter((tag) => getAttribute(tag, "name") === "google-adsense-account");
  if (adsAccountExpected) {
    check(
      accountTags.length === 1 && getAttribute(accountTags[0], "content") === adsClient,
      `AdSense account meta: ${path.relative(outputDirectory, htmlPath)}`,
      `${path.relative(outputDirectory, htmlPath)}: google-adsense-account meta가 없거나 client와 다릅니다.`,
    );
  } else {
    check(
      accountTags.length === 0,
      `AdSense account meta 미설정: ${path.relative(outputDirectory, htmlPath)}`,
      `${path.relative(outputDirectory, htmlPath)}: client 없이 google-adsense-account meta가 있습니다.`,
    );
  }
}

if (adsTxtExpected) {
  const expectedAds = `google.com, ${adsClient.slice(3)}, DIRECT, f08c47fec0942fa0`;
  const actualAds = adsExists ? (await readFile(adsPath, "utf8")).trim() : "";
  check(actualAds === expectedAds, "custom ads.txt publisher 일치", `ads.txt가 없거나 publisher line이 다릅니다. expected=${expectedAds} actual=${actualAds || "MISSING"}`);
} else {
  check(!adsExists, "ads.txt 비활성 조건에서 없음", "현재 mode/환경에서는 ads.txt가 없어야 합니다.");
}

const adsRenderEnabled = adsEnabledValue.toLowerCase() === "true"
  && /^ca-pub-\d{16}$/u.test(adsClient)
  && /^\d{10}$/u.test(adsSlot);

if (!adsRenderEnabled) {
  for (const htmlPath of initialHtmlFiles) {
    const html = await readFile(htmlPath, "utf8");
    for (const marker of ADSENSE_MARKERS) {
      if (html.includes(marker)) failures.push(`AdSense OFF인데 초기 HTML에 ${marker}가 있습니다: ${path.relative(outputDirectory, htmlPath)}`);
    }
  }
  for (const javascriptPath of referencedJavascript) {
    if (!(await exists(javascriptPath))) {
      failures.push(`초기 HTML 참조 JS가 없습니다: ${path.relative(outputDirectory, javascriptPath)}`);
      continue;
    }
    const javascript = await readFile(javascriptPath, "utf8");
    for (const marker of ADSENSE_MARKERS) {
      if (javascript.includes(marker)) failures.push(`AdSense OFF인데 초기 JS에 ${marker}가 있습니다: ${path.relative(outputDirectory, javascriptPath)}`);
    }
  }
  passes.push(`AdSense OFF 초기 JS ${referencedJavascript.size}개 marker 없음`);
}

const robotsPath = path.join(outputDirectory, "robots.txt");
const robots = await readFile(robotsPath, "utf8");
check(robots.includes(`Sitemap: ${expectedSiteUrl}/sitemap.xml`), "robots sitemap URL 일치", "robots.txt의 Sitemap URL이 현재 mode와 다릅니다.");

const productionTextFiles = (await listFiles(outputDirectory)).filter((filePath) => TEXT_EXTENSIONS.has(path.extname(filePath)));
for (const filePath of productionTextFiles) {
  let content = await readFile(filePath, "utf8");
  if (mode === "custom") {
    content = content.replaceAll(expectedSiteUrl, "").replaceAll(customDomain, "");
  }
  if (/\b(?:[a-z0-9-]+\.)+example\b/iu.test(content)) failures.push(`예약 .example 도메인이 production artifact에 남았습니다: ${path.relative(outputDirectory, filePath)}`);
}

if (mode === "pages") {
  for (const publicUrl of sitemapUrls) {
    const htmlPath = htmlFileForPublicUrl(publicUrl);
    if (!htmlPath || !(await exists(htmlPath))) continue;
    const html = await readFile(htmlPath, "utf8");
    if (html.replaceAll(`${PAGE_BASE_PATH}/_next/`, "").includes("/_next/")) {
      failures.push(`${path.relative(outputDirectory, htmlPath)}: Pages 빌드에 root /_next/ leak가 있습니다.`);
    }
  }
} else {
  const publicText = [sitemapXml, robots];
  for (const publicUrl of sitemapUrls) {
    const htmlPath = htmlFileForPublicUrl(publicUrl);
    if (htmlPath && await exists(htmlPath)) publicText.push(await readFile(htmlPath, "utf8"));
  }
  const projectPathLeak = /(?:^|["'=(:])\/pixelfit(?:\/|["'<\s])/u;
  check(!publicText.some((content) => projectPathLeak.test(content)), "custom root /pixelfit leak 없음", "custom root HTML/sitemap/robots에 내부 /pixelfit 경로가 남았습니다.");
}

if (failures.length > 0) {
  process.stderr.write(`[static-export] ${mode} 검증 실패 (${failures.length})\n${failures.map((failure) => `- ${failure}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`[static-export] ${mode} 검증 PASS — ${passes.length} checks, ${sitemapUrls.length} URLs, ${ogFiles.size} OG files\n`);
}
