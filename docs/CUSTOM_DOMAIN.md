# Custom domain readiness

Last verified: 2026-07-23

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

The deployment workflow reads the optional repository variable `NEXT_PUBLIC_CUSTOM_DOMAIN` and falls back to `CUSTOM_DOMAIN` for compatibility.

- When absent, it builds `https://dubeeubbee.github.io/pixelfit` with `/pixelfit`.
- When present, it builds `https://<CUSTOM_DOMAIN>` at `/` and adds `out/CNAME` to the uploaded artifact.
- It never creates a `CNAME` file when the domain variable is empty.

Important: GitHub's documentation says a custom GitHub Actions Pages workflow ignores a `CNAME` file and does not require one. The conditional artifact is therefore a declaration/readiness file, not a substitute for the Pages setting. A working custom domain still requires an administrator to save the domain under repository **Settings → Pages → Custom domain** and configure DNS.

## Operator-owned external steps

These steps have not been performed by this code change:

1. Verify ownership of the domain in GitHub when possible.
2. Add the custom domain to the repository's Pages settings before pointing DNS at GitHub.
3. For an apex domain, configure the GitHub Pages `A`/`AAAA` addresses or a supported `ALIAS`/`ANAME`.
4. For a subdomain, point its `CNAME` directly to `dubeeubbee.github.io`, without `/pixelfit`.
5. Avoid wildcard DNS records, wait for DNS propagation, and then enable HTTPS in Pages.
6. Verify the live canonical URLs, redirects, `robots.txt`, `sitemap.xml`, assets, and 404 response after propagation.

DNS changes and the HTTPS option can each take up to 24 hours. Code readiness must not be reported as DNS application, domain verification, HTTPS completion, or a successful public migration.

Official reference: [Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
