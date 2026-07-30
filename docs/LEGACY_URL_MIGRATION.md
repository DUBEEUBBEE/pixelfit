# 기존 URL 이전 확인

이 문서는 기존 GitHub Pages 주소와 `www` 주소가 현재 운영 도메인 `https://pixelfit.me/`로 이동하는지 확인한 읽기 전용 기록이다.

## 2026-07-26 공개 응답 확인

2026-07-26에 `curl`과 Playwright로 다음 공개 URL을 확인했다.

| 시작 URL | 최초 응답 | 최종 URL | 최종 응답 | 확인 결과 |
| --- | ---: | --- | ---: | --- |
| `https://www.pixelfit.me/` | `301` | `https://pixelfit.me/` | `200` | apex HTTPS 루트로 이동 |
| `https://dubeeubbee.github.io/pixelfit/` | `301` | `https://pixelfit.me/` | `200` | GitHub Pages 루트에서 custom-domain 루트로 이동 |
| `https://dubeeubbee.github.io/pixelfit/image-compressor/?from=legacy` | `301` | `https://pixelfit.me/image-compressor/?from=legacy` | `200` | 경로와 `from=legacy` query 보존 |
| `https://dubeeubbee.github.io/pixelfit/passport-photo/` | `301` | `https://pixelfit.me/passport-photo/` | `200` | 도구 경로 보존 |

Playwright에서도 각 이동 뒤의 최종 URL과 최종 문서의 canonical을 확인했다. 루트와 여권사진의 canonical은 각각 대응하는 `pixelfit.me` URL과 일치했고, query를 보존해 도착한 이미지 압축 페이지의 canonical은 query를 제외한 `https://pixelfit.me/image-compressor/`였다. 확인 흐름에서 브라우저 console error는 `0`건이었다.

## 구현 판단

공개 GitHub Pages 응답이 이미 HTTP `301`로 경로와 query를 보존해 custom domain으로 이동한다. 따라서 hostname을 검사하는 별도 JavaScript redirect는 추가하지 않는다. 클라이언트 redirect를 더하면 이중 이동, 화면 깜박임, redirect loop 같은 불필요한 위험만 늘어난다.

이 기록은 2026-07-26 당시 공개되어 있던 응답을 설명한다. 이번 저장소 작업에서는 git push나 배포를 수행하지 않았으므로, 위 공개 확인 결과가 현재 작업 중인 새 로컬 코드의 배포를 의미하지 않는다.

## `curl` 재검증

아래 명령은 상태 코드와 `Location`을 포함한 전체 redirect chain을 읽기 전용으로 출력한다.

```bash
curl --silent --show-error --location --max-redirs 5 --dump-header - --output /dev/null 'https://www.pixelfit.me/'
curl --silent --show-error --location --max-redirs 5 --dump-header - --output /dev/null 'https://dubeeubbee.github.io/pixelfit/'
curl --silent --show-error --location --max-redirs 5 --dump-header - --output /dev/null 'https://dubeeubbee.github.io/pixelfit/image-compressor/?from=legacy'
curl --silent --show-error --location --max-redirs 5 --dump-header - --output /dev/null 'https://dubeeubbee.github.io/pixelfit/passport-photo/'
```

첫 응답과 최종 응답을 구분해서 확인한다. 기대 계약은 최초 `301`, redirect loop 없음, 최종 `200`, 동일 경로 보존이며 이미지 압축 URL은 `from=legacy` query까지 보존해야 한다.

## Playwright 재검증

다음 명령은 실제 Chromium에서 최종 URL, canonical, console error와 page error를 읽기 전용으로 출력한다.

```bash
pnpm exec node --input-type=module <<'NODE'
import { chromium } from "@playwright/test";

const targets = [
  "https://www.pixelfit.me/",
  "https://dubeeubbee.github.io/pixelfit/",
  "https://dubeeubbee.github.io/pixelfit/image-compressor/?from=legacy",
  "https://dubeeubbee.github.io/pixelfit/passport-photo/",
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];

page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => {
  errors.push(`pageerror: ${error.message}`);
});

for (const target of targets) {
  errors.length = 0;
  const response = await page.goto(target, { waitUntil: "networkidle" });
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  console.log(JSON.stringify({
    target,
    finalStatus: response?.status(),
    finalUrl: page.url(),
    canonical,
    errors,
  }));
}

await browser.close();
NODE
```

공개 설정은 이후 바뀔 수 있으므로 배포 또는 DNS 변경 뒤에는 위 검사를 다시 실행하고, 새 결과를 날짜와 함께 별도로 기록한다.
