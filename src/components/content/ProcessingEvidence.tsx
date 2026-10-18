import { publicPath } from "@/config/brand";
import evidence from "@/config/processing-evidence.json";

const examples: Record<string, { title: string; method: string; ids: string[]; meanings: string[] }> = {
  "image-compressor": {
    title: "같은 원본을 실제로 100KB 목표로 처리한 결과",
    method: "기존 자체 제작 원본 PNG(1200×800px, 1,045,528바이트)를 압축 편집기에 넣고 해상도 축소를 끈 채 각각 저장했습니다. 위의 색 단계 비교 도식과 별도로 실제 엔진을 실행해 다운로드한 파일을 측정했습니다.",
    ids: ["compress-jpeg", "compress-png"],
    meanings: ["102,400바이트 이하 확인. 글자·경계 품질은 직접 비교해야 합니다.", "목표 초과를 표시했습니다. 다시 저장한 PNG가 원본보다 커질 수도 있습니다."],
  },
  "image-resizer": {
    title: "50% 크기 조절을 실제 파일로 확인",
    method: "같은 자체 제작 원본 PNG(1200×800px, 1,045,528바이트)를 퍼센트 50%·전체 포함·PNG로 저장했습니다. 가로와 세로가 절반이 되는지 다운로드한 파일을 다시 읽었습니다.",
    ids: ["resize-half"],
    meanings: ["픽셀 수는 25%가 됐지만 파일 용량은 25%가 아닙니다. 실제 크기와 용량을 따로 확인하세요."],
  },
  "passport-photo": {
    title: "도형 테스트로 확인한 여권사진 파일 출력",
    method: "실제 사람이 없는 자체 도형 PNG(640×800px, 6,888바이트)를 초기 크롭으로 처리했습니다. 이 검사는 파일 출력만 확인하며 여권사진 내용의 적합성이나 접수 결과를 검증하지 않습니다.",
    ids: ["passport-jpeg"],
    meanings: ["JPG·413×531px·512,000바이트 이하만 확인한 예시입니다. 얼굴·배경·촬영일 심사는 별도입니다."],
  },
  "photo-privacy-cleaner": {
    title: "알려진 PNG 정보 3개를 제거한 실제 결과",
    method: "자체 도형 PNG(320×400px)에 작성자·설명·편집 프로그램이라는 합성 텍스트 정보 3개를 넣고 기본 선택으로 정리했습니다. 다운로드 파일에서 세 값이 사라졌고 압축된 이미지 데이터가 바이트 단위로 같음을 검사했습니다. 실제 GPS나 사람의 정보는 사용하지 않았습니다.",
    ids: ["privacy-png"],
    meanings: ["이 PNG에서 선택한 3개 정보와 이미지 데이터만 검증했습니다. 모든 사진의 정보 삭제나 출처 자격 증명 보존을 뜻하지 않습니다."],
  },
  "jpeg-png-webp": {
    title: "동일한 1200×800 원본의 형식별 실제 저장 결과",
    method: "같은 자체 제작 PNG(1,045,528바이트)를 형식 변환 편집기에 넣고 픽셀을 유지해 저장했습니다. JPG·WebP는 품질 90%, PNG는 품질값 없이 저장하고 다운로드 파일의 실제 형식·픽셀·바이트를 검사했습니다.",
    ids: ["convert-jpeg", "convert-png", "convert-webp"],
    meanings: ["투명 배경을 지원하지 않습니다. 작은 글자와 선의 손실을 비교하세요.", "다시 인코딩해 원본보다 커졌습니다. PNG가 항상 작은 파일은 아닙니다.", "이 원본·브라우저의 결과입니다. 같은 품질 숫자가 JPG와 동등한 화질을 뜻하지 않습니다."],
  },
};

const number = (value: number) => value.toLocaleString("en-US");

export function ProcessingEvidence({ context }: { context: string }) {
  const example = examples[context];
  if (!example) return null;
  const headingId = `${context}-processing-evidence-title`;
  return (
    <section className="processing-evidence" aria-labelledby={headingId}>
      <h2 id={headingId}>{example.title}</h2>
      <p>{example.method}</p>
      <div className="evidence-table-wrap" role="region" aria-label={`${example.title} 표`} tabIndex={0}>
        <table className="evidence-table">
          <caption>측정일 {evidence.measuredOn} · Chromium {evidence.browser} · 실제 다운로드 파일 기준</caption>
          <thead><tr><th scope="col">설정</th><th scope="col">입력 용량</th><th scope="col">다운로드 결과</th><th scope="col">확인한 점</th></tr></thead>
          <tbody>{example.ids.map((id, index) => {
            const record = evidence.records.find((item) => item.id === id);
            if (!record) throw new Error(`측정 기록 누락: ${id}`);
            return <tr key={id}><th scope="row">{record.settings}</th><td>{number(record.inputBytes)}바이트</td><td>{record.format.toUpperCase()} · {record.width}×{record.height}px<br />{number(record.bytes)}바이트</td><td>{example.meanings[index]}</td></tr>;
          })}</tbody>
        </table>
      </div>
      <p>이 수치는 해당 입력과 브라우저에서 얻은 한 번의 측정이며 평균 압축률이나 화질 보장이 아닙니다. 다른 이미지·브라우저에서는 달라질 수 있습니다.</p>
      {["image-compressor", "image-resizer", "jpeg-png-webp"].includes(context) && <p><a href={publicPath("/samples/image-compressor/original.png")} target="_blank" rel="noreferrer">측정에 사용한 자체 제작 원본 PNG 열기</a> · 내려받아 같은 설정으로 비교할 수 있습니다.</p>}
    </section>
  );
}
