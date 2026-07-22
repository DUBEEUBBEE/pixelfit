# Third-Party Notices

Inventory checked: 2026-07-22

PixelFit itself is marked `UNLICENSED`. The following inventory covers direct packages resolved in the local lockfile/install at the checked date. It is not a substitute for reviewing the complete transitive dependency license set in a release artifact.

## Runtime dependencies

| Package | Resolved version | License | Project |
| --- | ---: | --- | --- |
| JSZip | 3.10.1 | MIT OR GPL-3.0-or-later; PixelFit uses the MIT option | https://github.com/Stuk/jszip |
| lucide-react | 1.25.0 | ISC | https://github.com/lucide-icons/lucide |
| Next.js | 16.2.11 | MIT | https://nextjs.org |
| React | 19.2.8 | MIT | https://github.com/facebook/react |
| react-dom | 19.2.8 | MIT | https://github.com/facebook/react |
| Zod | 4.4.3 | MIT | https://github.com/colinhacks/zod |

## Development and test dependencies

These tools are not intended to be shipped as application runtime code, but they are recorded for reproducible development and CI.

| Package | Resolved version | License | Project |
| --- | ---: | --- | --- |
| @axe-core/playwright | 4.12.1 | MPL-2.0 | https://github.com/dequelabs/axe-core-npm |
| @playwright/test | 1.61.1 | Apache-2.0 | https://github.com/microsoft/playwright |
| @tailwindcss/postcss | 4.3.3 | MIT | https://github.com/tailwindlabs/tailwindcss |
| @testing-library/jest-dom | 7.0.0 | MIT | https://github.com/testing-library/jest-dom |
| @testing-library/react | 16.3.2 | MIT | https://github.com/testing-library/react-testing-library |
| @testing-library/user-event | 14.6.1 | MIT | https://github.com/testing-library/user-event |
| @types/node | 26.1.1 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| @types/react | 19.2.17 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| @types/react-dom | 19.2.3 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |
| ESLint | 9.39.2 | MIT | https://eslint.org |
| eslint-config-next | 16.2.11 | MIT | https://github.com/vercel/next.js |
| jsdom | 29.1.1 | MIT | https://github.com/jsdom/jsdom |
| serve | 14.2.5 | MIT | https://github.com/vercel/serve |
| Tailwind CSS | 4.3.3 | MIT | https://github.com/tailwindlabs/tailwindcss |
| TypeScript | 5.9.3 | Apache-2.0 | https://github.com/microsoft/TypeScript |
| Vitest | 4.1.10 | MIT | https://github.com/vitest-dev/vitest |

The authoritative license text and copyright notices for each package are distributed in that package's `LICENSE`, `LICENSE.md`, `COPYING`, or package metadata under `node_modules` and in its linked upstream repository. A release distributor must preserve the notices required by the selected licenses and review transitive packages produced by the lockfile.

## Models, remote services, fonts, and fixtures

- No third-party ML model is listed for v1. Optional face assistance uses the browser's native `FaceDetector` when available and otherwise falls back to manual cropping.
- Background-edge segmentation is project code using deterministic pixel/color calculations; it does not bundle a third-party segmentation model.
- Image processing does not call a remote image, face, background-removal, or metadata API.
- No third-party CDN-hosted runtime script or model is part of the documented architecture.
- Test fixtures must be generated in-project or have a separately recorded redistribution license. Personal identity photos must not be committed.

If a model, HEIC decoder, SVG sanitizer/rasterizer, font, icon set beyond Lucide, or externally sourced fixture is added, update this file with its exact version/source, license, redistribution terms, model/data license, and any required attribution before release.

## License references

- MIT License: https://opensource.org/license/mit
- ISC License: https://opensource.org/license/isc-license-txt
- Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0
- Mozilla Public License 2.0: https://www.mozilla.org/MPL/2.0/
- GNU General Public License 3.0: https://www.gnu.org/licenses/gpl-3.0.html
