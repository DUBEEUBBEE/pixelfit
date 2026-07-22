# 픽셀핏 v1 출시 체크리스트

기준일: 2026-07-22

표기 규칙: 완료는 `[x]`, 미완료는 `[ ]`로 둔다. 각 완료 항목은 명령 출력, 산출물 경로, 스크린샷 또는 공개 URL 같은 증거가 있어야 한다. 실행 불가 항목은 지우지 말고 [STATUS.md](./STATUS.md)에 `NOT_TESTED`와 이유를 기록한다.

## 제품 계약

- [x] 홈과 여섯 도구 route가 정적 build에 포함된다.
- [x] 여섯 도구 모두 로컬 파일 선택부터 실제 다운로드까지 완료된다.
- [x] 핵심 경로에 mock 결과, 작동하지 않는 버튼, 숨겨진 데모가 없다.
- [x] 모든 사용자 노출 문구가 한국어이며 문서 `lang="ko"`가 확인된다.
- [x] 브랜드명·설명·URL·연락처가 중앙 설정에서 변경 가능하다.
- [x] privacy, terms, guide/about, 404가 존재한다.

## 프리셋과 공식 정책

- [x] Registry runtime validation과 slug 중복 검사가 통과한다.
- [x] 모든 공식 프리셋에 기관·제목·URL·2026-07-22 확인일·`approvalGuaranteed: false`가 있다.
- [x] 일반 증명사진이 공식 규격으로 표시되지 않는다.
- [x] 주민등록증 413×531px가 300dpi 서비스 환산값으로 설명된다.
- [x] 여권사진에서 배경 제거·교체·보정·생성형 작업을 실행할 수 없다.
- [x] 승인·접수·검색 노출을 보장하는 문구가 없다.
- [x] UI의 출처와 값이 [PRESET_SOURCES.md](./PRESET_SOURCES.md)와 일치한다.

## 실제 출력

- [x] 여권 JPEG가 413×531px이고 실제 Blob이 500KB 이하다.
- [x] 일반 증명사진 결과가 354×472px다.
- [x] 주민등록증 결과가 413×531px이며 선택한 JPEG/PNG가 유효하다.
- [x] 약속한 300dpi가 결과 parse-back에서 허용 오차 내 확인된다.
- [x] YouTube 배너가 2560×1440px이고 실제 Blob이 6MB 이하다.
- [x] YouTube 안전영역 계산과 TV/desktop/mobile 예상 표시가 작동한다.
- [x] 파비콘 ZIP에 ICO, 필수 PNG, manifest, 설치 안내, README가 있다.
- [x] ICO/PNG 크기와 manifest JSON을 ZIP에서 다시 검증했다.
- [x] 개인정보 정리 결과에서 선택 필드 제거가 재파싱으로 확인된다.
- [x] 보존한다고 표시한 metadata/pixel payload가 실제 결과와 일치한다.

## 오류와 fallback

- [x] 빈·손상·미지원·MIME 불일치 파일이 복구 안내와 함께 거부된다.
- [x] byte/pixel 한도 초과가 decode 전에 가능한 범위에서 차단된다.
- [x] 얼굴 0명/다중/미지원 시 수동 크롭으로 계속할 수 있다.
- [x] 일반 증명사진 배경 분리 실패 시 원본 배경으로 돌아갈 수 있다.
- [x] 압축 목표 미달, ZIP 실패, 다운로드 차단이 성공으로 표시되지 않는다.
- [x] 처리 중 새 파일·취소·페이지 이탈에서 stale 결과가 나타나지 않는다.

## 개인정보와 보안

- [x] 사용자 파일/Blob/픽셀/얼굴/metadata가 서버로 전송되지 않는다.
- [x] 이미지 처리 중 POST/PUT/PATCH 요청이 0건이다.
- [x] localStorage/sessionStorage/IndexedDB/Cache Storage에 이미지가 없다.
- [x] Object URL과 bitmap/buffer 참조가 초기화·이탈 때 해제된다.
- [x] 외부 이미지 URL과 안전하지 않은 SVG 입력이 차단된다.
- [x] 콘솔·분석 이벤트에 파일명, EXIF, 얼굴 좌표가 없다.
- [x] C2PA/JUMBF/Content Credentials 제거 옵션이 없다.
- [x] 출처 자격 증명 영향과 보존 한계가 사용자에게 표시된다.
- [ ] 실제 호스트에서 CSP, Referrer-Policy, nosniff, Permissions-Policy, frame 제한을 확인했다.
- [x] GitHub Pages HTTPS, static MIME과 실제 JPG 다운로드 동작을 확인했다.

## 접근성과 UI

- [x] desktop과 mobile에서 키보드만으로 핵심 흐름을 완료한다.
- [x] 업로드 label/버튼, slider 이름·값, focus visible이 있다.
- [x] 처리 상태 `aria-busy`, 결과/오류 `aria-live`가 동작한다.
- [x] 상태가 색상만으로 전달되지 않는다.
- [x] 안전영역·crop에 스크린리더 텍스트 대안이 있다.
- [x] axe critical/serious violation이 주요 상태에서 0건이다.
- [x] reduced motion과 모바일 터치 타깃을 확인했다.
- [x] 1440×900, 768×1024, 390×844, 320×568 스크린샷을 직접 열어 확인했다.
- [x] overflow, 겹침, 잘림, sticky 버튼 가림, 낮은 대비가 없다.

## SEO·콘텐츠

- [x] 각 도구에 고유 title, description, canonical, OG/Twitter metadata가 있다.
- [x] heading 구조와 규격 설명, 공식/관행 구분, 출처·확인일·면책이 보인다.
- [x] visible FAQ와 FAQ structured data 내용이 일치한다.
- [x] WebApplication/Breadcrumb structured data가 유효하다.
- [x] sitemap, robots, 404가 공개 URL에서 동작한다.
- [x] 가짜 리뷰·별점·사용량 또는 검색어 반복 문구가 없다.

## 자동 검증

- [x] `pnpm install --frozen-lockfile`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test`
- [x] `pnpm build`
- [x] `pnpm check`
- [x] `pnpm test:e2e`
- [x] `pnpm test:a11y`
- [x] 모든 E2E에서 처리되지 않은 page error와 예상 밖 console error가 0건이다.
- [x] 비밀키 없는 GitHub CI에서 44개 단위 테스트와 Chromium/WebKit E2E 24/24가 통과한다.

## 성능·호환성

- [x] 홈에서 얼굴/배경용 무거운 코드나 모델을 선로드하지 않는다.
- [x] Worker/취소/fallback이 지원 환경과 미지원 환경에서 검증된다.
- [ ] 모바일 대형 이미지 처리 후 새 작업을 시작할 수 있다.
- [x] production build의 route/bundle 경고를 검토했다.
- [ ] Lighthouse를 실행했다면 실제 결과와 환경을 STATUS에 기록했다. 실행하지 않았다면 `NOT_TESTED`다.
- [x] Playwright WebKit iPhone 13 smoke를 실행했다.
- [ ] 실기기 Safari smoke를 실행했다. 실행하지 않아 `NOT_TESTED`로 명시했다.

## 배포

- [x] GitHub project Pages용 `/pixelfit` base path와 실제 canonical URL로 static export를 생성했다.
- [x] `.nojekyll`과 공식 GitHub Pages artifact/deploy workflow를 추가했다.
- [x] `out/`을 GitHub Pages에 배포하고 루트·여섯 도구·정보 페이지·404를 확인했다.
- [x] 새로고침과 직접 URL 접근이 clean route에서 동작한다.
- [ ] `_next` 자산 캐시와 HTML 갱신 정책이 적절하다.
- [x] 공개 배포 URL과 smoke 결과를 STATUS에 기록했다.
- [x] THIRD_PARTY_NOTICES의 직접 의존성·모델·fixture 목록을 최종 package와 비교했다.
- [x] 알려진 제한이 UI, README, STATUS에 일치하게 기록됐다.
- [x] 중요한 TODO/FIXME가 남지 않았음을 검색했다.

## 최종 승인 기록

| 항목 | 값 |
| --- | --- |
| release candidate | `pixelfit-v1-pages-1` |
| commit/build identifier | commit `522cc79` / CI `29924220607` / Pages `29924220581` |
| 검사 일시 | 2026-07-22 05:07~05:17 및 22:24~22:35 KST |
| 검사 환경 | macOS + GitHub Actions Ubuntu, Node 22/24.14.1, pnpm 11.9.0, Playwright Chromium/WebKit 1.61.1 |
| 공개 URL | `https://dubeeubbee.github.io/pixelfit/` — 배포·기능 smoke `PASS` |
| 최종 판정 | GitHub Pages 공개 릴리스 완료 |
| 승인자 | 자동 검사 + Codex 수동 QA |
