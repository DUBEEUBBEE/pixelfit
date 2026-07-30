# 픽셀핏 제품 명세

기준일: 2026-07-30

## 1. 버전 경계

- **공개 v1:** 2026-07-22 GitHub Pages에 배포된 기존 6개 도구 버전
- **현재 로컬 후보:** 공개 v2의 13개 도구에 인스타그램 프로필 사진을 더한 총 14개 도구와 8개 가이드, 중앙 환경설정, 자체 OG PNG, 같은 사진 전달, Search Console URL-prefix meta와 분리된 AdSense 계정 확인/광고 게이트를 포함한 작업 트리

이 명세는 v2 후보의 목표와 계약이다. 기능이 문서에 있다고 해서 빌드·E2E·접근성·배포가 완료된 것은 아니다. 공개 v1의 성공 기록을 v2 후보에 재사용하지 않으며 실제 상태는 [STATUS.md](./STATUS.md)를 따른다.

## 2. 제품 목표

픽셀핏은 이미지 편집 경험이 적은 사용자가 목적을 먼저 선택하고, 로컬 사진 한 장 또는 소수의 사진으로 정확한 결과 파일을 만드는 한국어 웹 앱이다. 범용 레이어 편집기가 아니라 각 목적에 필요한 입력과 선택지만 노출하는 제한형 제작 도구다.

대표 원칙:

- 용도를 먼저 고른다.
- 픽셀·비율·용량과 출력 형식은 결과 파일에서 다시 확인한다.
- 공식값, 일반 관행과 픽셀핏 서비스값을 구분한다.
- 사진은 이미지 처리 서버로 업로드하지 않는다.
- 자동 검사는 실제 접수, 승인, 검색 노출이나 성과를 보장하지 않는다.

기본 언어는 한국어이고 문서 root는 `lang="ko"`다. 배포 URL, 운영 주체, 연락처, 검색 검증과 광고값은 중앙 환경설정으로 관리한다.

## 3. 대상 사용자와 핵심 흐름

주요 사용자:

- 여권·신분증·채널 이미지처럼 규격을 모르는 일반 사용자
- 모바일에서 사진 용량·크기·형식을 빠르게 맞추려는 사용자
- 한 장을 SNS 비율, 썸네일, 네컷, 필름 효과로 재사용하려는 creator
- 사진을 외부 변환 서버에 보내지 않고 metadata를 정리하려는 사용자

핵심 흐름:

1. 홈 검색 또는 카테고리에서 목적을 고른다.
2. 로컬 파일을 선택하고 실제 원본 정보를 확인한다.
3. 도구가 허용한 범위 안에서 crop·크기·형식·효과를 조정한다.
4. 결과 Blob/ZIP의 치수·형식·byte와 주의사항을 확인한다.
5. 새 파일로 다운로드한다.
6. 원하면 명시적 CTA로 같은 `File`을 현재 탭 메모리에서 다음 도구에 한 번 전달한다.

## 4. 정보 구조

- 홈 `/`: 검색, 카테고리, 14개 도구 진입
- 도구 `/[tool]`: 편집기, 결과, 규격 설명, 출처·면책, visible FAQ, 관련 가이드와 다음 도구
- 가이드 `/guide`: 8개 가이드 인덱스
- 가이드 `/guide/[slug]`: 문제 중심 설명, 계산/조건 예시, 도구 CTA
- 신뢰 페이지: `/about`, `/privacy`, `/terms`, `/contact`
- 검색 파일: sitemap, robots, static 404

## 5. 도구 범위

### 5.1 기존 규격·개인정보 도구 6개

| 도구 | 경로 | 결과 계약 | 출처 경계 |
| --- | --- | --- | --- |
| 한국 온라인 여권사진 | `/passport-photo` | 413×531px JPEG, 500KB 이하 | 외교부 공식값, 승인 비보장 |
| 일반 증명사진 | `/id-photo` | 354×472px JPEG/PNG | 3×4cm·300dpi 서비스 환산 관행 |
| 주민등록증 사진 | `/resident-id-photo` | 413×531px JPEG/PNG | 공식 3.5×4.5cm를 300dpi로 환산 |
| YouTube 채널 배너 | `/youtube-banner` | 2560×1440, 6MB 이하 | YouTube 공식 최소·권장·안전영역 |
| 파비콘 패키지 | `/favicon-maker` | ICO·PNG·manifest·안내문 ZIP | 검색 파비콘 기준 + 제품 호환 구성 |
| 사진 개인정보 정리 | `/photo-privacy-cleaner` | JPEG/PNG/WebP metadata 정리 | 제품 개인정보 정책 |

### 5.2 추가 도구 8개

| 도구 | 경로 | 결과 계약 | 출처 경계 |
| --- | --- | --- | --- |
| 사진 용량 줄이기 | `/image-compressor` | 목표 KB/MB와 실제 결과 byte | 제품 기능값 |
| 이미지 크기 조절 | `/image-resizer` | 직접 픽셀·긴 변·퍼센트 | 제품 기능값 |
| 이미지 형식 변환 | `/image-converter` | JPEG/PNG/WebP | 브라우저 구현 범위 |
| SNS 이미지 세트 | `/social-image-pack` | 1:1·4:5·9:16 개별/ZIP | 픽셀핏 서비스 preset |
| 인스타그램 프로필 사진 | `/instagram-profile-picture` | 1080×1080 PNG/JPEG, 작은 원 안의 contain 배치와 색 테두리 | 픽셀핏 서비스 preset; Instagram 의무 픽셀값 아님 |
| YouTube 썸네일 | `/youtube-thumbnail` | 3840×2160, 16:9 | YouTube 최신 공식 권장값 |
| 네컷사진 | `/four-cut-photo` | 세로 1200×1800 또는 가로 1800×1200 | 디지털 공유용 서비스값 |
| 필름사진 | `/film-photo` | 결정적 로컬 필터 JPEG/PNG | 제품 효과값 |

## 6. 도구별 핵심 요구사항

### 한국 온라인 여권사진

- 413×531px JPEG와 실제 512,000바이트 이하를 parse-back한다.
- 크롭·회전·리사이즈·제한적 압축만 허용한다.
- 배경 제거·교체, 미화, 얼굴 비율 변형, 생성형 수정은 UI와 실행 경계에서 차단한다.
- 얼굴 자동 맞춤과 머리 길이는 참고값이며 촬영일·표정·최종 심사를 확정하지 않는다.

### 일반 증명사진·주민등록증 사진

- 3×4cm는 354×472px, 3.5×4.5cm는 413×531px의 300dpi 환산값을 사용한다.
- 환산값을 모든 기관의 공식 온라인 픽셀 규격이라 하지 않는다.
- 일반 증명은 원본/흰색/연회색/연파랑 후보를 제공하고 자동 분리 실패 시 원본으로 돌아간다.
- 주민등록증은 원본 배경을 우선하며 제출 경로의 형식·용량을 다시 확인하게 한다.

### YouTube 채널 배너

- 권장 2560×1440px, 16:9, 실제 6MiB 이하를 만든다.
- 공식 최소 2048×1152와 그 기준의 1235×338 텍스트·로고 안전영역을 비율 환산한다.
- TV·desktop·mobile overlay는 예상치이며 실제 기기 렌더링을 보장하지 않는다.

### 파비콘 패키지

- 16/32/48px PNG, 다중 크기 ICO, 180px Apple touch icon, 192/512px 아이콘, manifest와 설치 문서를 ZIP으로 만든다.
- 생성한 ZIP, ICO와 PNG를 다시 열어 파일명·dimensions·JSON을 검사한다.
- 래스터 입력을 벡터 SVG로 바꿨다고 주장하지 않는다.

### 사진 개인정보 정리

- JPEG, PNG, WebP의 알려진 개인정보성 metadata를 범주별로 보여 주고 선택 제거한다.
- 지원 경로의 pixel payload 보존과 결과 재파싱을 우선하되 실제 확인한 항목만 보존됐다고 표시한다.
- 픽셀에 보이는 개인정보는 제거하지 않으며 완전한 익명화를 보장하지 않는다.
- C2PA/JUMBF/Content Credentials를 제거 선택지로 제공하지 않는다.

### 사진 용량 줄이기

- 100KB, 200KB, 500KB, 1MB, 2MB와 직접 입력 상한을 제공한다.
- 제한된 품질 탐색 뒤 실제 Blob byte로 성공 여부를 판단한다.
- 사용자가 허용한 경우에만 최대 4단계로 해상도를 축소한다.
- 현재 한 장씩 처리하고, 목표를 못 맞추면 결과와 이유를 표시한다.

### 이미지 크기 조절

- 직접 가로·세로, 긴 변, 퍼센트 모드를 제공한다.
- 비율 잠금이 기본이며 contain/cover를 구분한다.
- 업스케일은 없는 디테일을 복원하지 않음을 경고한다.
- JPEG/PNG/WebP 형식과 해당되는 품질을 선택한다.

### 이미지 형식 변환

- JPEG, PNG, WebP 사이에서 실제 출력 signature를 확인한다.
- JPEG는 alpha를 지원하지 않으므로 선택 배경과 합성한다.
- 형식 변경은 재인코딩이며 원본 EXIF·ICC·metadata 보존을 지원한다고 표시하지 않는다.
- HEIC은 검증된 로컬 decoder가 없어 입력·출력 성공 경로를 제공하지 않는다.

### SNS 이미지 세트

- 1080×1080, 1080×1350, 1080×1920을 각각 독립 crop으로 조정한다.
- 원형 profile preview와 상하 UI 가이드는 예상 표시다.
- 필요한 결과를 개별 또는 ZIP으로 다운로드한다.
- 플랫폼별 실제 노출 영역이나 성과를 보장하지 않는다.

### 인스타그램 프로필 사진

- 1080×1080은 픽셀핏의 서비스 출력값이며 Instagram의 공식 의무 픽셀값으로 표시하지 않는다.
- 원본 사진을 정사각형으로 잘라 채우지 않고 작은 원 안에 contain 방식으로 배치한다. 세로·가로 사진의 전체 구도를 보존하는 대신 원 안에 여백이 생길 수 있다.
- 작은 원 크기, 사진 크기, 가로·세로 위치, 테두리 두께와 테두리·안쪽 원·바깥 캔버스 색을 조절한다.
- 미리보기와 다운로드 파일은 같은 배치 계산을 사용하고 결과를 1080×1080 PNG 또는 JPEG로 다시 검사한다.
- 실제 Instagram 앱의 원형 마스크, 리샘플링과 UI 겹침은 앱 버전·기기에 따라 달라질 수 있음을 표시한다.

### YouTube 썸네일

- 최신 공식 권장 3840×2160, 16:9 JPEG/PNG를 만든다.
- 공식 안내의 동영상 custom thumbnail 한도는 모바일 2MB, desktop 50MB로 다르므로 하나의 공통 용량 통과를 약속하지 않고 실제 결과 byte를 표시한다.
- 제한된 템플릿, 제목·보조 문구·강조색과 사진 위치를 제공한다.
- 작은 모바일 preview에서 가독성과 overflow를 확인한다.
- 과거 1280×720을 최신 권장값처럼 사용하지 않고 조회수·CTR을 보장하지 않는다.

### 네컷사진

- 사진 1~4장을 사용하고 부족하면 선택한 사진을 순환 반복한다.
- 세로/가로, 각 slot crop·순서, frame, filter, 날짜와 짧은 문구를 제공한다.
- 특정 상표 서비스나 인화 규격이 아니라 디지털 공유용 preset임을 표시한다.
- 새 얼굴·장면을 생성하지 않는다.

### 필름사진

- grain, vignette, light leak, 날짜, 흑백, 저채도, flash와 강도를 제공한다.
- 같은 입력·설정·seed에서 재현 가능한 결정적 Canvas 연산을 사용한다.
- 원본 비교와 reset을 제공한다.
- 생성형 AI나 실제 필름·렌즈·현상 공정의 인증된 재현이라 하지 않는다.

## 7. 가이드 8개

| slug | 사용자 문제 |
| --- | --- |
| `passport-photo-413x531` | 여권 413×531과 500KB, 자동 검사의 한계 |
| `photo-under-500kb` | 목표 byte를 맞추는 크기·형식·품질 순서 |
| `id-photo-size` | 3×4cm와 3.5×4.5cm, 300dpi 환산 차이 |
| `dpi-vs-pixels` | 픽셀 수와 출력 밀도의 차이와 계산 |
| `youtube-banner-safe-area` | 최소·권장 캔버스와 안전영역 배치 |
| `favicon-files` | ICO·PNG·manifest 파일의 역할 |
| `exif-photo-privacy` | metadata와 픽셀에 보이는 개인정보 구분 |
| `jpeg-png-webp` | 형식·투명도·용량·재인코딩 선택 |

가이드는 고유 title/description/canonical/OG, 출처·확인일, 관련 도구 CTA를 가진다. 조건 예시는 실제 사용자 파일의 metadata나 결과를 가장하지 않는다.

## 8. 공통 UX·접근성

- 모바일 우선, 한 화면에 명확한 주 행동
- drag/drop과 명시적 파일 선택 버튼
- 큰 preview, 터치/키보드 조작, reset과 처리 상태
- 자체 sample gallery는 viewport 진입 전 이미지를 요청하지 않고, 진입 뒤 현재 route의 자산만 요청
- 압축 비교 fixture는 480×320 thumbnail을 먼저 사용하고 1MB 이상일 수 있는 full PNG는 사용자가 원본 보기 링크를 눌렀을 때만 요청
- 압축 sample은 실제 사용자 파일을 도구로 처리한 결과가 아니라 결정적 비교 fixture임을 화면에서 명시
- 처리 중 `aria-busy`, 결과·오류 `aria-live`, visible focus
- 색상만이 아닌 icon·상태명·본문으로 결과 전달
- crop, 안전영역, 원형 preview의 텍스트 대안
- 긴 한국어, 200% zoom, reduced motion과 mobile touch target 고려

WCAG 2.2 AA를 목표로 하지만 자동 axe만으로 완료를 선언하지 않는다.

## 9. 같은 사진으로 다음 도구

결과 화면에서 사용자가 명시적으로 CTA를 누른 경우에만 현재 `File` 하나를 대상 도구로 전달한다.

- 현재 탭 React memory에만 보관
- 대상 도구 ID와 one-shot claim
- localStorage/sessionStorage/IndexedDB/Cache Storage 사용 금지
- 새로고침과 탭 종료 뒤 소멸
- 대상 mismatch 또는 두 번째 claim 차단

UI는 “저장된 프로젝트”가 아니라 새로고침하면 사라지는 일시 전달임을 설명한다.

## 10. 개인정보·파일 정책

- 이미지 업로드 API와 원격 변환·얼굴·배경 제거·생성형 모델 호출 금지
- MIME과 signature, byte와 pixel 한도 검사
- 결과는 예측 가능한 안전 파일명으로 새로 저장하고 원본을 덮어쓰지 않음
- 파일 교체·초기화·route 이동 때 Object URL과 작업 참조 해제
- 지원하지 않는 형식, 압축 목표 미달, ZIP·download 실패를 성공 처리하지 않음
- fake EXIF, 촬영일, GPS, 작성·수정 metadata 생성 금지

정적 자산 요청과 선택적으로 활성화한 광고/CMP 요청은 이미지 처리 네트워크와 분리해 고지·검사한다.

## 11. 광고 제품 계약

AdSense 광고 제공은 기본 OFF다. `ADSENSE_ENABLED=true`, 유효한 publisher client와 content slot이 모두 있어야 광고 스크립트와 슬롯을 렌더링한다.

허용 위치:

- 홈 콘텐츠 구분
- 가이드 콘텐츠 구분
- 도구의 편집·결과 뒤 설명 끝

금지 위치:

- upload, editor, preview, result, download
- navigation, privacy, terms, contact

계정 확인은 광고 제공과 분리한다. 유효한 실제 publisher client가 있으면 광고가 OFF여도 `google-adsense-account` meta와 custom-root `ads.txt`를 만들 수 있지만, 이는 계정·사이트 승인 또는 광고 요청을 뜻하지 않는다.

기존 `pixelfit.o-r.kr`은 `o-r.kr`의 일반 하위 도메인이며, 이 프로젝트는 상위 `o-r.kr/ads.txt`를 게시할 수 없어 AdSense 사이트 등록이 차단됐다. 현재 `pixelfit.me`의 DNS·HTTPS·공개 root `ads.txt` 소유권 확인과 AdSense 검토 요청은 완료됐지만 계정은 `준비 중`이다. CMP, 최종 승인, 개인정보 동의·철회와 실제 광고 제공을 검증하기 전에는 광고를 OFF로 유지한다.

## 12. SEO 제품 계약

- 중앙 URL helper가 project Pages `/pixelfit`과 custom-domain root를 모두 지원
- 홈·도구·가이드별 고유 metadata와 자체 1200×630 OG PNG
- 홈 `WebSite`와 사실 기반 일반 `WebApplication`
- 가이드 허브 `ItemList`
- 도구 `BreadcrumbList`와 사실 기반 일반 `WebApplication`
- 가이드 상세 `BreadcrumbList`/`Article`
- 화면용 FAQ는 유지하되 `FAQPage` JSON-LD는 생성하지 않음
- 일반 `WebApplication`에는 실제 URL·설명·이미지·콘텐츠 수정일만 사용
- 실제 price·review·rating 근거가 없으므로 `offers`/`review`/`aggregateRating` 및 `SoftwareApplication` rich-result 표시 금지
- 가짜 review, rating, 사용자 수, 성과, 촬영일 또는 검증하지 않은 `dateModified` 금지
- 유효한 Google token이 있을 때 Search Console URL-prefix HTML 확인 meta 생성
- 유효한 Naver token이 있을 때만 verification meta 생성

Google token을 넣은 정적 HTML은 소유권 확인의 기술 전제일 뿐이다. Search Console 속성 등록, 실제 확인, sitemap 제출과 색인은 외부 운영 상태이며 공개 HTTPS가 유효하지 않으면 완료로 간주하지 않는다.

## 13. 배포 계약

static export인 `out/`을 사용한다. 두 환경을 각각 빌드·preview한다.

- GitHub project Pages: 실제 canonical + `/pixelfit`
- production custom domain: `pixelfit.me` HTTPS root canonical + 빈 base path

GitHub Actions는 custom-root를 production 계약으로 사용하며 환경변수가 없으면 `pixelfit.me`를 명시적 기본값으로 선택한다. repository variable이 있으면 기본값보다 우선하므로 실제 전환 전에 새 호스트와 일치시킨다. project Pages `/pixelfit`은 회귀 build다. 공개 URL, 404·직접 새로고침·MIME·보안 header·DNS·TLS를 실제 환경에서 확인해야 배포 완료다. Actions가 `CNAME`만으로 Pages Settings와 인증서를 완료한다고 가정하지 않는다.

## 14. 범위 밖

- 회원가입, 로그인, 결제, 사용자 project 저장과 협업
- 이미지 업로드 backend, cloud history와 계정별 복구
- 얼굴 신원 확인, 미화, 신체 변형, 정장 합성
- 공식 사진의 배경 생성·교체 또는 생성형 수정
- 범용 자유 레이어·벡터 편집기
- 외부 HEIC 변환 서버와 검증되지 않은 HEIC 지원
- SynthID, C2PA, JUMBF, Content Credentials, watermark 제거·우회
- 검색 노출, AdSense 승인, 영상 성과나 기관 접수 보장

## 15. 완료 조건

v2 완료는 다음이 실제 증거와 함께 모두 충족될 때만 선언한다.

- 14개 도구의 실제 다운로드와 결과 parse-back
- 8개 가이드·SEO route와 자체 OG PNG 검증
- 같은 사진 전달, 저장소 부재와 이미지 network request 부재
- 광고 OFF 안전성과, 광고를 켤 경우 별도 CMP·정책 검증
- lint, typecheck, unit/component, E2E, 접근성
- project Pages와 custom root 이중 build/preview
- 대표 route Lighthouse와 mobile/desktop 시각 QA
- GitHub Actions 및 공개 v2 URL smoke

실행하지 못한 항목은 `NOT_TESTED`, 실패는 `FAIL`로 남긴다. 자세한 절차는 [TEST_PLAN.md](./TEST_PLAN.md), 최종 승인 항목은 [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)를 따른다.
