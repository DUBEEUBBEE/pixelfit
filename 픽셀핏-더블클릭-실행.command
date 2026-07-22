#!/bin/zsh

set -u

PROJECT_DIR="${0:A:h}"
PREVIEW_URL="http://127.0.0.1:4173"

cd "$PROJECT_DIR" || exit 1

open_preview() {
  if [[ "${PIXELFIT_SKIP_OPEN:-0}" != "1" ]]; then
    open "$PREVIEW_URL"
  fi
}

if curl --fail --silent "$PREVIEW_URL" >/dev/null 2>&1; then
  open_preview
  echo "픽셀핏이 이미 실행 중입니다: $PREVIEW_URL"
  exit 0
fi

if command -v pnpm >/dev/null 2>&1; then
  PNPM_COMMAND=(pnpm)
elif command -v corepack >/dev/null 2>&1; then
  PNPM_COMMAND=(corepack pnpm)
else
  osascript -e 'display alert "픽셀핏을 실행할 수 없습니다" message "Node.js와 pnpm이 설치되어 있는지 확인해 주세요." as critical'
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "처음 한 번만 필요한 패키지를 설치하고 있습니다..."
  "${PNPM_COMMAND[@]}" install --frozen-lockfile || {
    osascript -e 'display alert "설치 중 오류가 발생했습니다" message "열린 터미널의 오류 내용을 확인해 주세요." as critical'
    exit 1
  }
fi

(
  for _ in {1..80}; do
    if curl --fail --silent "$PREVIEW_URL" >/dev/null 2>&1; then
      open_preview
      exit 0
    fi
    sleep 0.25
  done
) &

echo "픽셀핏을 여는 중입니다. 이 터미널 창은 확인하는 동안 닫지 마세요."
echo "종료하려면 이 창을 닫거나 Control+C를 누르세요."
echo "주소: $PREVIEW_URL"

exec "${PNPM_COMMAND[@]}" preview --listen 4173
