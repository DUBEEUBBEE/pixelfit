import { AlertTriangle, Check, Info } from "lucide-react";
import type { ResultCheck } from "@/features/image-core/checks";

const labels = { pass: "통과", warning: "주의", info: "정보" } as const;

export function CheckList({ checks }: { checks: ResultCheck[] }) {
  return (
    <div className="check-list" aria-label="결과 검사">
      {checks.map((check) => (
        <div className={`check-item ${check.level}`} key={check.id}>
          <span className="check-icon" aria-hidden="true">
            {check.level === "pass" ? <Check size={15} /> : check.level === "warning" ? <AlertTriangle size={14} /> : <Info size={14} />}
          </span>
          <div><strong>{labels[check.level]} · {check.label}</strong><span>{check.detail}</span></div>
        </div>
      ))}
    </div>
  );
}
