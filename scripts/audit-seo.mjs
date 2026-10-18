import { JSDOM } from "jsdom";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Read-only audit. Never runs page scripts or changes search/hosting settings.
const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, "").split("=")));
const origin = args.origin ?? "https://pixelfit.me";
const output = args.output ?? "output/seo-2026-10-12/public-before";
await mkdir(`${output}/html`, { recursive: true });

async function request(url) {
  const chain = [];
  try {
    for (let i = 0; i < 8; i += 1) {
      const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20000) });
      chain.push({ url, status: response.status, location: response.headers.get("location") });
      if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
        url = new URL(response.headers.get("location"), url).href;
        await response.body?.cancel();
        continue;
      }
      return { url, status: response.status, chain, headers: Object.fromEntries(response.headers), bytes: Buffer.from(await response.arrayBuffer()) };
    }
    throw new Error("redirect limit");
  } catch (error) {
    return { url, chain, error: `${error.message}: ${error.cause?.code ?? ""}` };
  }
}

async function load(relative) {
  if (!args.export) return request(new URL(relative, origin).href);
  const filename = relative === "/" ? "index.html" : relative.endsWith("/") ? `${relative.slice(1)}index.html` : relative.slice(1);
  return { url: new URL(relative, origin).href, status: 200, chain: [], headers: {}, bytes: await readFile(path.join(args.export, filename)) };
}

const sitemap = await load("/sitemap.xml");
if (!sitemap.bytes) throw new Error(`sitemap unavailable: ${sitemap.error}`);
const xml = new JSDOM(sitemap.bytes.toString(), { contentType: "text/xml" }).window.document;
const urls = [...xml.querySelectorAll("url")].map((item) => ({ url: item.querySelector("loc").textContent, lastmod: item.querySelector("lastmod")?.textContent }));
const robots = await load("/robots.txt");
const pages = [];
for (let start = 0; start < urls.length; start += 4) {
  pages.push(...await Promise.all(urls.slice(start, start + 4).map(async ({ url, lastmod }) => {
    const relative = new URL(url).pathname;
    const result = await load(relative);
    if (!result.bytes) return { requestedUrl: url, ...result };
    const html = result.bytes.toString();
    await writeFile(`${output}/html/${relative.replaceAll("/", "_") || "home"}.html`, html);
    const document = new JSDOM(html).window.document;
    const meta = (name) => document.querySelector(`meta[name="${name}"],meta[property="${name}"]`)?.getAttribute("content") ?? null;
    const structuredData = [...document.querySelectorAll('script[type="application/ld+json"]')].map((el) => {
      try { return JSON.parse(el.textContent); } catch (error) { return { error: error.message }; }
    });
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((el) => ({ level: Number(el.tagName.slice(1)), text: el.textContent.trim() }));
    const links = [...document.querySelectorAll("a[href]")].map((el) => ({ href: new URL(el.getAttribute("href"), url).href, text: el.textContent.trim(), label: el.getAttribute("aria-label") }));
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    const content = (document.querySelector("main") ?? document.body).cloneNode(true);
    content.querySelectorAll("script,style,nav").forEach((el) => el.remove());
    return {
      requestedUrl: url, finalUrl: result.url, status: result.status, redirects: result.chain, lastmod,
      xRobotsTag: result.headers["x-robots-tag"] ?? null,
      title: document.title, description: meta("description"), canonical, robots: meta("robots"), googlebot: meta("googlebot"),
      headings, links, structuredData, og: Object.fromEntries(["og:title", "og:description", "og:url", "og:image", "og:type"].map((key) => [key, meta(key)])),
      adsenseAccount: meta("google-adsense-account"), googleVerification: Boolean(meta("google-site-verification")),
      adLoader: Boolean(document.querySelector('script[src*="pagead2"],ins.adsbygoogle,[data-ad-slot]')),
      htmlBytes: result.bytes.length, text: content.textContent.replace(/\s+/g, " ").trim(),
      issues: [
        ...(result.status !== 200 ? [`HTTP ${result.status}`] : []),
        ...(canonical !== url ? [`canonical mismatch: ${canonical}`] : []),
        ...(headings.filter((h) => h.level === 1).length !== 1 ? ["H1 count"] : []),
        ...(!meta("description") || !document.title ? ["missing metadata"] : []),
        ...(structuredData.some((item) => item.error) ? ["invalid JSON-LD syntax"] : []),
        ...(/noindex|nofollow/.test(`${meta("robots")} ${result.headers["x-robots-tag"]}`) ? ["robots restriction"] : []),
      ],
    };
  })));
}

const images = [];
for (const url of new Set(pages.map((page) => page.og?.["og:image"]).filter(Boolean))) {
  const response = await load(new URL(url).pathname);
  const bytes = response.bytes;
  images.push({ url, status: response.status, error: response.error, bytes: bytes?.length, width: bytes?.subarray(1, 4).toString() === "PNG" ? bytes.readUInt32BE(16) : null, height: bytes?.subarray(1, 4).toString() === "PNG" ? bytes.readUInt32BE(20) : null });
}
const probes = args.export ? [] : await Promise.all([
  "http://pixelfit.me/", "http://www.pixelfit.me/", "https://www.pixelfit.me/",
  "https://www.pixelfit.me/image-compressor/?from=audit", "https://dubeeubbee.github.io/pixelfit/",
  "https://dubeeubbee.github.io/pixelfit/passport-photo/?from=audit", "https://pixelfit.o-r.kr/", "http://pixelfit.o-r.kr/", "https://pixelfit.o-r.kr/image-compressor/?from=audit",
  `${origin}/image-compressor`, `${origin}/image-compressor/index.html`, `${origin}/missing-pixelfit-audit-20261012/`, `${origin}/guide/missing-pixelfit-audit-20261012/`, `${origin}/404.html`, `${origin}/ads.txt`,
].map(async (url) => {
  const result = await request(url);
  const html = result.headers?.["content-type"]?.includes("text/html") && result.bytes ? new JSDOM(result.bytes.toString()).window.document : null;
  return { requestedUrl: url, finalUrl: result.url, status: result.status, chain: result.chain, error: result.error, xRobotsTag: result.headers?.["x-robots-tag"], canonical: html?.querySelector('link[rel="canonical"]')?.href, robots: html?.querySelector('meta[name="robots"]')?.content, bodySnippet: result.bytes?.toString().slice(0, 200) };
}));
const known = new Set(urls.map(({ url }) => url));
const unknownInternalLinks = [...new Set(pages.flatMap((page) => page.links ?? []).map(({ href }) => href.split("#")[0]).filter((href) => href.startsWith(`${origin}/`) && !known.has(href) && !/\.[a-z0-9]+$/i.test(href)))];
const observedOn = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
const report = { observedOn, source: args.export ?? origin, sitemapUrls: urls, sitemapDuplicates: urls.length - known.size, robots: robots.bytes?.toString(), pages, images, probes, unknownInternalLinks };
await writeFile(`${output}/audit.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output, pages: pages.length, issues: pages.filter((page) => page.error || page.issues?.length).map(({ requestedUrl, error, issues }) => ({ requestedUrl, error, issues })), images: images.length, unknownInternalLinks, probes }, null, 2));
