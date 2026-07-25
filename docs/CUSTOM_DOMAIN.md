# Custom domain readiness

Last verified: 2026-07-25

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

## `pixelfit.me` migration sequence

These steps have not been performed by this code change:

1. Confirm `pixelfit.me` registration and account ownership.
2. Verify the domain in GitHub when possible and set repository variables to `NEXT_PUBLIC_CUSTOM_DOMAIN=pixelfit.me`.
3. Save `pixelfit.me` in repository **Settings → Pages → Custom domain** before pointing DNS at GitHub.
4. Configure the apex `A`/`AAAA` records to GitHub Pages, and optionally set `www` as a CNAME directly to `dubeeubbee.github.io`.
5. Avoid wildcard DNS records, wait for propagation, confirm Pages' DNS check, and enable HTTPS.
6. Deploy the candidate and verify strict HTTPS, canonical URLs, redirects, `robots.txt`, `sitemap.xml`, assets, direct route refresh, MIME, and 404 behavior.
7. Add and verify the new Search Console property, submit `https://pixelfit.me/sitemap.xml`, and only then proceed with AdSense site review while ad serving remains OFF.
8. If `pixelfit.o-r.kr` must keep working, move that hostname to a separate redirect service/repository. One GitHub Pages site cannot retain it as a second custom domain, and canonical markup alone does not redirect users or crawlers.

DNS changes and the HTTPS option can each take up to 24 hours. Code readiness must not be reported as DNS application, domain verification, HTTPS completion, or a successful public migration.

Official reference: [Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
