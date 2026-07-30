# 제3자 고지

Inventory 확인일: 2026-07-26

픽셀핏 자체 package는 `UNLICENSED`다. 아래 목록은 확인일의 `package.json`과 lockfile/install에서 확인한 직접 의존성이다. release artifact의 전체 transitive dependency 라이선스 검토를 대신하지 않는다.

7개 추가 도구, 8개 가이드, 환경설정, 광고 게이트, OG 자산과 2026-07-26 안전성 보강을 위해 **새 직접 runtime 또는 development dependency를 추가하지 않았다.** 현재 `package.json`의 직접 dependency와 고정 버전은 아래와 같다.

## Runtime dependencies

| Package | 확인 버전 | License | Project |
| --- | ---: | --- | --- |
| JSZip | 3.10.1 | MIT OR GPL-3.0-or-later; 픽셀핏은 MIT 선택 | https://github.com/Stuk/jszip |
| lucide-react | 1.25.0 | ISC | https://github.com/lucide-icons/lucide |
| Next.js | 16.2.11 | MIT | https://nextjs.org |
| React | 19.2.8 | MIT | https://github.com/facebook/react |
| react-dom | 19.2.8 | MIT | https://github.com/facebook/react |
| Zod | 4.4.3 | MIT | https://github.com/colinhacks/zod |

## Development·test dependencies

다음 package는 앱 runtime으로 직접 제공하기 위한 것이 아니라 재현 가능한 개발·CI를 위해 기록한다.

| Package | 확인 버전 | License | Project |
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

각 package의 권위 있는 저작권·라이선스 문구는 설치된 package의 `LICENSE`, `LICENSE.md`, `COPYING`, package metadata와 위 upstream 저장소에 있다. 배포자는 lockfile이 만드는 transitive package도 검토하고 각 라이선스가 요구하는 고지를 보존해야 한다.

## Project-owned OG assets

- `public/og/home.png`, `public/og/tools/*.png`와 `public/og/guides/*.png`는 픽셀핏용 1200×630 공유 이미지다.
- 도구 OG PNG는 `scripts/generate-og.mjs`가 프로젝트 코드의 도형, 색상, 고정 seed와 자체 5×7 bitmap glyph로 생성한다.
- generator는 Node.js built-in `node:fs/promises`, `node:path`, `node:zlib`만 사용하며 이미지·폰트 package를 추가하지 않는다.
- 가이드 OG PNG와 보조 SVG도 프로젝트가 직접 만든 기하·타이포그래피 자산이며 외부 사진, 상표 로고, stock image 또는 사용자 업로드 이미지를 포함하지 않는다.
- 자체 생성이라는 설명은 제3자 상표권·콘텐츠를 가져왔다는 뜻이 아니다. 앞으로 외부 자산을 추가하면 source, creator, license와 redistribution 조건을 이 문서에 기록한다.

## Test fixtures

- 테스트 이미지는 코드로 만든 색상 블록, 기하 도형, 숫자 타일과 합성 metadata를 사용한다.
- GPS, 촬영일, 기기명, XMP/IPTC 예시는 실제 사람의 값이 아닌 가상 fixture여야 한다.
- 개인 여권·신분증·얼굴 사진 또는 사용자 업로드를 fixture로 commit하지 않는다.
- 실제 C2PA/Content Credentials fixture를 추가하려면 재배포 license, source와 hash를 먼저 기록한다. 준비되지 않았으면 검사를 `NOT_TESTED`로 두고 가짜 credential metadata로 성공을 주장하지 않는다.
- HEIC 지원을 가장하기 위해 확장자만 바꾼 fixture를 사용하지 않는다.

## Models, services, fonts와 icons

- third-party ML model을 bundle하지 않는다. 선택적 얼굴 보조는 브라우저 native `FaceDetector`가 있을 때만 사용하고 아니면 수동 crop으로 이어진다.
- 일반 증명사진 배경 분리와 필름 효과는 프로젝트의 deterministic pixel/color 계산이며 third-party segmentation·generative model이 아니다.
- 이미지 처리, 얼굴, 배경 제거, metadata 정리를 위한 remote API를 사용하지 않는다.
- AdSense를 명시적으로 활성화하면 Google의 remote script/service가 별도 조건으로 사용될 수 있다. 이는 이미지 처리 dependency가 아니며 운영자는 Google 약관, 개인정보·cookie/CMP 요구와 `ads.txt`를 별도로 검토해야 한다.
- runtime webfont나 외부 font file을 bundle하지 않는다. OG generator도 자체 bitmap glyph를 사용한다.
- 앱 icon library는 `lucide-react` 하나다. Lucide 외 icon set이나 상표 logo를 추가하면 정확한 source와 license를 기록한다.

모델, HEIC decoder, SVG sanitizer/rasterizer, font, Lucide 외 icon set, 외부 fixture 또는 stock image를 추가하면 release 전에 exact version/source, license, redistribution terms, model/data license와 필요한 attribution을 이 파일에 갱신한다.

## License references

- MIT License: https://opensource.org/license/mit
- ISC License: https://opensource.org/license/isc-license-txt
- Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0
- Mozilla Public License 2.0: https://www.mozilla.org/MPL/2.0/
- GNU General Public License 3.0: https://www.gnu.org/licenses/gpl-3.0.html
