# Custom domain readiness

Last verified: 2026-07-26

PixelFit supports two mutually exclusive static export modes. A repository-project deployment uses `/pixelfit`; a custom domain deployment uses the domain root. Setting `NEXT_PUBLIC_CUSTOM_DOMAIN` or the compatibility alias `CUSTOM_DOMAIN` always clears the base path and makes `https://<domain>` the canonical origin.

## Build modes

Current GitHub project Pages build:

```sh
pnpm build:pages
```

Root-path test build (the domain below is test-only and is not a production claim):

```sh
pnpm build:custom:test
```

Both scripts run the matching static-export verifier after the Next.js build. For a real custom domain, pass the same domain environment to both commands:

```sh
NEXT_PUBLIC_CUSTOM_DOMAIN=images.example.org \
NEXT_PUBLIC_SITE_URL=https://images.example.org \
NEXT_PUBLIC_BASE_PATH= \
pnpm build

NEXT_PUBLIC_CUSTOM_DOMAIN=images.example.org \
NEXT_PUBLIC_SITE_URL=https://images.example.org \
NEXT_PUBLIC_BASE_PATH= \
pnpm verify:export -- --mode=custom
```

`images.example.org` is documentation-only; it is not a configured PixelFit domain.

`BASE_PATH` remains accepted for compatibility, but `NEXT_PUBLIC_BASE_PATH` takes precedence when both are present. A conflicting non-empty base path is ignored when `CUSTOM_DOMAIN` is set.

## Site-name signal limitation

The project Pages URL `https://dubeeubbee.github.io/pixelfit/` is a subpath under `github.io`, not a root domain controlled by PixelFit. The page can truthfully emit a `WebSite` object for that canonical URL, but the markup does not turn the `github.io` host into a PixelFit-owned root-domain site-name signal. Only custom-domain mode gives PixelFit a root `WebSite` URL such as `https://<CUSTOM_DOMAIN>/`. Even then, structured data is a hint and does not guarantee that a search engine will show the requested site name.

## GitHub Actions behavior

The deployment workflow reads the optional repository variable `NEXT_PUBLIC_CUSTOM_DOMAIN`, falls back to `CUSTOM_DOMAIN` for compatibility, and finally uses the production candidate `pixelfit.me`.

- With no repository variables, it builds `https://pixelfit.me` at `/` and adds `out/CNAME`.
- When a domain variable is present, that value takes precedence over the workflow default.
- `pnpm build:pages` remains the explicit `https://dubeeubbee.github.io/pixelfit/` regression build and does not create `out/CNAME`.

Before the migration deployment, set `NEXT_PUBLIC_CUSTOM_DOMAIN=pixelfit.me` in repository variables and remove or align a conflicting legacy `CUSTOM_DOMAIN`. A still-configured `pixelfit.o-r.kr` variable overrides the new source fallback.

Important: GitHub's documentation says a custom GitHub Actions Pages workflow ignores a `CNAME` file and does not require one. The conditional artifact is therefore a declaration/readiness file, not a substitute for the Pages setting. A working custom domain still requires an administrator to save the domain under repository **Settings → Pages → Custom domain** and configure DNS.

## `pixelfit.me` migration state

Live checks on 2026-07-25 through 2026-07-26 established the following state:

1. `pixelfit.me` is registered through 2027-07-25; auto-renew is OFF and privacy is ON.
2. `NEXT_PUBLIC_CUSTOM_DOMAIN=pixelfit.me` is configured and the Pages custom domain belongs to `DUBEEUBBEE/pixelfit`.
3. The apex resolves to all four GitHub Pages IPv4 addresses and public HTTPS validates with a `pixelfit.me` certificate.
4. Pages DNS checking and certificate approval completed, and `Enforce HTTPS` was enabled. Edge HTTP redirects may take additional time to propagate.
5. On 2026-07-26, the Namecheap `www` CNAME was corrected from the apex to `dubeeubbee.github.io`. Authoritative DNS, Google, Cloudflare, Quad9 and the local resolver all returned the new target. All four GitHub Pages edges then served a certificate covering both `pixelfit.me` and `www.pixelfit.me`; strict HTTP and HTTPS requests to `www` redirect to the HTTPS apex.
6. The public home, `robots.txt`, `sitemap.xml`, `ads.txt`, canonical and account verification meta were checked. The export contains no AdSense loader while ad serving is OFF.
7. The Search Console URL-prefix property was verified and `/sitemap.xml` processed successfully with 27 discovered pages.
8. AdSense ownership was verified through root `ads.txt` and review was requested; the live account remains `준비 중`.
9. If `pixelfit.o-r.kr` must keep working, move that hostname to a separate redirect service/repository. One GitHub Pages site cannot retain it as a second custom domain, and canonical markup alone does not redirect users or crawlers.

DNS changes and the HTTPS option can each take up to 24 hours. Code readiness must not be reported as DNS application, domain verification, HTTPS completion, or a successful public migration.

Official reference: [Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
