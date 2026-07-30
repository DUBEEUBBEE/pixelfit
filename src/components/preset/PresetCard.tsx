import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import type { ToolCardSummary } from "@/config/client-tools";
import { isOfficialBadge, toolBadgeCopy } from "@/config/tool-badges";
import { PresetIcon } from "./PresetIcon";

export function PresetCard({ preset }: { preset: ToolCardSummary }) {
  return (
    <article className="tool-card">
      <div className="card-top">
        <span className="icon-well"><PresetIcon id={preset.id} /></span>
        <span className={`badge ${isOfficialBadge(preset.badgeKind) ? "official" : ""}`}>
          {isOfficialBadge(preset.badgeKind) && <Landmark size={12} aria-hidden="true" />}
          {toolBadgeCopy[preset.badgeKind]}
        </span>
      </div>
      <h3>{preset.title}</h3>
      <p>{preset.shortDescription}</p>
      <div className="card-spec">{preset.displaySpec}</div>
      <Link className="card-link" href={`/${preset.slug}`} prefetch={false} aria-label={`${preset.title} 바로 만들기`}>
        바로 만들기 <ArrowRight size={17} aria-hidden="true" />
      </Link>
    </article>
  );
}
