export function ToolStepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="stepper" aria-label={`3단계 중 ${step}단계`}>
      {["사진 선택", "자동 맞춤 및 조정", "확인 및 다운로드"].map((label, index) => (
        <div className={`stepper-item ${index + 1 <= step ? "active" : ""}`} key={label} aria-current={index + 1 === step ? "step" : undefined}>
          <span className="number">{index + 1}</span><span>{label}</span>
        </div>
      ))}
    </div>
  );
}
