# SEO operations

Last verified: 2026-07-25

This document separates build-time SEO readiness from external search-engine operations. Source changes do not prove crawling, indexing, rich-result eligibility, ranking, or ownership verification.

## Canonical URL modes

- Project Pages: origin and path base `https://dubeeubbee.github.io/pixelfit`, asset base `/pixelfit`.
- Production custom domain: origin `https://pixelfit.me`, asset base empty.
- Generic custom-domain test: origin `https://<CUSTOM_DOMAIN>`, asset base empty.

`src/config/env.ts` validates both modes, and `src/config/brand.ts` is the shared source for canonical URLs and public asset paths. Next static export uses trailing slashes for page routes. Both modes must be built and inspected before a domain migration.

The project Pages canonical URL is a `/pixelfit/` subpath on `github.io`. Its `WebSite` JSON-LD can describe the deployed site, but it cannot establish PixelFit as the root-domain site name for `github.io`. The production build emits root canonical URLs for `pixelfit.me`; search engines still decide whether to display that site name.

The existing `pixelfit.o-r.kr` deployment, HTTPS and Search Console property are historical evidence for the previous host only. The Pages custom domain now belongs to `pixelfit.me`. Because one Pages site can have only one custom domain, preserving the previous address after the switch requires a separately operated redirect endpoint; changing the canonical alone is not a redirect.

## Search verification tokens

`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is optional and validated as a plain token. The compatibility alias `GOOGLE_SITE_VERIFICATION` is also accepted, but the public value wins if both differ. A valid value renders the `google-site-verification` meta used by a Google Search Console URL-prefix property.

The URL-prefix property `https://pixelfit.me/` was verified with the validated HTML meta on 2026-07-25. The live Search Console account processed `https://pixelfit.me/sitemap.xml` successfully and reported 27 discovered pages. This proves ownership and sitemap processing only; it does not claim that every URL is indexed or ranked. Preserve the previous `https://pixelfit.o-r.kr/` property as migration history.

`NEXT_PUBLIC_NAVER_SITE_VERIFICATION` is also optional and the legacy alias `NAVER_SITE_VERIFICATION` remains accepted. A local or deployed verification meta does not prove that either search service accepted ownership.

Official references:

- [Add a website property to Search Console](https://support.google.com/webmasters/answer/34592?hl=en)
- [Verify your site ownership](https://support.google.com/webmasters/answer/9008080?hl=en)
- [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=en)

## Structured data policy

The emitted types are deliberately narrow:

- home: `WebSite` only;
- guide hub: `ItemList` only;
- tool routes: `BreadcrumbList` only;
- guide detail routes: `BreadcrumbList` and `Article`.

Use structured data only when every property is visible or otherwise supported by the page. PixelFit does not emit home `WebApplication` or tool `SoftwareApplication` markup because the current pages have no real price/offer plus eligible user rating or review evidence for the software-app rich-result contract. Do not fabricate authors, organizations, reviews, ratings, dates, offers, or approval claims.

Google stopped showing FAQ rich results on 2026-05-07 and removed its FAQ feature documentation on 2026-06-15. Visible FAQ content can remain useful to readers, but PixelFit should not emit `FAQPage` JSON-LD for a Google rich-result benefit that no longer exists. Structured data validity never guarantees a special search appearance.

Official references:

- [Google Search documentation updates: FAQ removal](https://developers.google.com/search/updates#removing-faq-rich-result)
- [Introduction to structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Software app structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app)
- [Structured data general guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Control title links](https://developers.google.com/search/docs/appearance/title-link)
- [Canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

## Release checks

For both URL modes, verify from the built HTML rather than relying only on source code:

1. one unique title, description, canonical, Open Graph URL, and representative image per indexable page;
2. canonical, Open Graph, sitemap, JSON-LD, icon, and internal-link URLs use the same origin/base-path policy;
3. `robots.txt` and `sitemap.xml` point at the selected public origin;
4. trust pages and guide/tool routes are present, while test pages and 404 pages are absent from the sitemap;
5. structured data contains only the route-specific types listed above and no unsupported claims;
6. a root custom-domain build contains no `/pixelfit` asset or internal-route leakage;
7. configured Google/Naver verification meta exactly matches the selected real token;
8. after a real deployment, strict HTTPS, redirects, indexability and rendered metadata are checked again.

Any external dashboard state that was not checked must be recorded as `NOT_TESTED`, not inferred from a successful build.
