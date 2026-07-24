# AdSense readiness

Last verified: 2026-07-24

AdSense ad serving is disabled by default. This repository separates account-identification surfaces from the ad-serving gate; neither path claims account approval, site approval, active ad serving, consent compliance, or revenue readiness.

## Ad-serving gate

All three values must be valid before any AdSense script or slot enters the DOM:

```text
NEXT_PUBLIC_ADSENSE_ENABLED=true
NEXT_PUBLIC_ADSENSE_CLIENT must match ^ca-pub-[0-9]{16}$
NEXT_PUBLIC_ADSENSE_CONTENT_SLOT must match ^[0-9]{10}$
```

The unprefixed `ADSENSE_ENABLED`, `ADSENSE_CLIENT`, and `ADSENSE_CONTENT_SLOT` names remain accepted for deployment-variable compatibility. When both forms are set, the `NEXT_PUBLIC_` value wins and conflicting values produce a development warning.

Use only values issued to the actual operator. If the switch is off, a value is missing, or either identifier is malformed, `AdSenseScript` and `AdSlot` return `null`. Development emits a warning for a requested but incomplete setup; production remains inert.

`AdSlot` accepts only these explicit content placements:

- `home-content-break`
- `guide-content-break`
- `tool-explainer-end`

Upload, editor, preview, result, download, navigation, privacy, terms, and contact surfaces are not valid placement identifiers. This keeps ads away from controls where users could make accidental clicks. Enabling Auto ads would bypass this placement review and therefore requires a separate product and policy decision.

The ads-enabled path has not been approved for production. Ads scripts, slots, and requests must remain OFF until an eligible site is accepted, the privacy disclosure is checked against actual behavior, a required certified CMP is configured, and the allowed placements pass desktop/mobile review.

## Account identification without serving ads

A valid real `NEXT_PUBLIC_ADSENSE_CLIENT` or compatibility `ADSENSE_CLIENT` is handled independently from the enabled flag and content slot:

- every rendered page receives a `google-adsense-account` meta tag;
- a custom-domain export receives `out/ads.txt`;
- no AdSense loader, slot element, or ad request is created while `ADSENSE_ENABLED` remains false.

This allows the account/site connection surface to be prepared without activating advertising. The export verifier checks the configured meta and `ads.txt` separately from the OFF-mode prohibition on `pagead2.googlesyndication.com`, `adsbygoogle`, and PixelFit ad-slot markup. Use only the publisher ID issued in the live account; never commit a placeholder.

The 2026-07-23 OFF-build result with no client remains a historical pass: it contained no loader, publisher marker, slot, or `ads.txt`. The 2026-07-24 implementation adds the decoupled account-identification path, but live publisher values, AdSense review, consent behavior, and live network requests remain `NOT_TESTED` until an eligible root domain exists.

## ads.txt

Google describes ads.txt as optional but strongly recommended. It must be reachable at the site's domain root and must contain the operator's real publisher ID in `pub-` form.

The build creates `out/ads.txt` only when both conditions are true:

- `NEXT_PUBLIC_CUSTOM_DOMAIN` or `CUSTOM_DOMAIN` is set;
- the selected AdSense client matches `ca-pub-` followed by 16 digits.

The enabled flag and content slot are intentionally irrelevant to this account-identification file. It never emits a placeholder. The project URL `dubeeubbee.github.io/pixelfit/ads.txt` is not the root of `dubeeubbee.github.io`, so it must not be described as a valid root-domain ads.txt deployment.

## Current domain blocker

`pixelfit.o-r.kr` cannot currently be used as the AdSense site:

- it is an ordinary subdomain of the registrable domain `o-r.kr`, not a platform subdomain made independently registrable through the Public Suffix List and not a documented AdSense platform-partner URL;
- the operator controls the delegated hostname but does not control the registrable root `o-r.kr`;
- Google validates site URLs at the registrable-domain/public-suffix boundary and its ads.txt crawler expects authorization at the applicable root, while this project cannot publish or reference the required `o-r.kr/ads.txt`;
- therefore a generated `https://pixelfit.o-r.kr/ads.txt` is not evidence that the root ads.txt requirement is satisfied.

AdSense registration must wait for a registrable root domain that the PixelFit operator owns and can configure in DNS, GitHub Pages, Search Console, and root `ads.txt`. Keep ad serving OFF on `pixelfit.o-r.kr`. Do not enter a parent domain that the operator does not own and do not claim the current subdomain was accepted without live dashboard evidence.

This is independent from the current TLS issue: at the 2026-07-24 check, `pixelfit.o-r.kr` resolved to GitHub Pages but the certificate did not validate that hostname. HTTPS provisioning must also finish before any external verification is recorded as complete.

## Consent and approval are external

Before activating ads, the operator must:

1. Acquire and deploy a registrable root domain controlled by the operator.
2. Confirm strict HTTPS, canonical URLs, Search Console ownership, and root `ads.txt` on that domain.
3. Add and verify that actual site in AdSense and request review.
4. Confirm that the privacy notice matches the deployed advertising and analytics behavior.
5. Choose and configure a Google-certified CMP integrated with the IAB TCF where Google's EEA, UK, and Switzerland requirements apply.
6. Test consent states and make sure ads do not load before the applicable choice.
7. Review every manual placement at desktop and mobile sizes for accidental-click risk and layout shift.
8. Verify `ads.txt`, policy center status, and live requests without clicking live ads.

Google states that site review usually takes several days and can take two to four weeks. CMP certification also does not establish full compliance with the TCF or applicable law; the publisher remains responsible for the consent message and legal implementation.

Official references:

- [Connect your site to AdSense](https://support.google.com/adsense/answer/7584263?hl=en)
- [Enter a valid site URL](https://support.google.com/adsense/answer/2784438?hl=en)
- [Manage sites in AdSense](https://support.google.com/adsense/answer/12170421?hl=en)
- [Ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en)
- [Ads.txt FAQ, including subdomains](https://support.google.com/adsense/answer/9785052?hl=en)
- [Public Suffix List](https://publicsuffix.org/list/public_suffix_list.dat)
- [Consent management requirements](https://support.google.com/adsense/answer/13554020?hl=en)
- [Ad placement policies](https://support.google.com/adsense/answer/1346295?hl=en)
- [Google publisher policies](https://support.google.com/adsense/answer/10502938?hl=en)
- [Required site content](https://support.google.com/adsense/answer/1348695?hl=en)
