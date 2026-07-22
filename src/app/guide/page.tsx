import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { presets } from "@/lib/presets";
import { publicUrl } from "@/config/brand";

export const metadata: Metadata = { title: "사진 규격 만들기 가이드", description: "사진 선택부터 자동 맞춤, 직접 조정, 검사와 다운로드까지 픽셀핏 사용 방법을 설명합니다.", alternates: { canonical: publicUrl("/guide") } };

export default function GuidePage() {
  return <div className="page-content site-shell"><article className="prose"><h1>사진 규격, 숫자 대신 용도로 시작하세요.</h1><p>픽셀핏은 범용 포토샵이 아닙니다. 만들 대상을 고르고 사진을 선택하면 그 규격의 크기·비율·형식을 적용합니다.</p><h2>1. 용도를 정확히 고르기</h2><p>공식 사진과 창작용 이미지는 허용되는 작업이 다릅니다. 특히 여권사진에서는 배경 제거, 합성, 얼굴 보정이 실행되지 않습니다.</p><h2>2. 원본이 좋은 사진 선택하기</h2><ul><li>가능하면 출력 크기보다 큰 원본을 사용하세요.</li><li>공식 사진은 정면, 고른 조명, 단순하고 밝은 원본 배경이 좋습니다.</li><li>파일 표시와 실제 시그니처가 다른 파일은 안전을 위해 거부합니다.</li></ul><h2>3. 위치와 확대만 조정하기</h2><p>미리보기를 드래그하거나 키보드 화살표로 이동할 수 있습니다. 확대 슬라이더와 90도 회전을 사용해 빈 가장자리가 생기지 않게 맞춥니다.</p><h2>4. 결과 검사 읽기</h2><p>검사는 통과·주의·정보 세 수준입니다. 픽셀과 실제 Blob 용량은 자동 확인하지만 표정, 촬영일과 기관의 최종 판단은 직접 확인해야 합니다.</p><h2>5. 다운로드 후 확인하기</h2><p>파일은 새 이름으로 내려받으며 원본을 덮어쓰지 않습니다. 브라우저가 다운로드를 차단하면 이 사이트의 다운로드 권한을 허용하세요.</p><h2>바로 시작</h2><ul>{presets.map((preset) => <li key={preset.id}><Link href={`/${preset.slug}`}>{preset.title} <ArrowRight size={14} style={{ display: "inline" }} /></Link></li>)}</ul></article></div>;
}
