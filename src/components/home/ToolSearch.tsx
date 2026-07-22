"use client";

import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import type { ImagePreset } from "@/lib/presets";
import { PresetCard } from "@/components/preset/PresetCard";

export function ToolSearch({ presets }: { presets: ImagePreset[] }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("ko");
  const filtered = useMemo(() => {
    if (!normalized) return presets;
    return presets.filter((preset) => [preset.title, preset.shortDescription, ...preset.searchTerms].join(" ").toLocaleLowerCase("ko").includes(normalized));
  }, [normalized, presets]);

  return (
    <>
      <div className="tool-search">
        <Search size={21} aria-hidden="true" />
        <label className="sr-only" htmlFor="tool-query">도구 검색</label>
        <input id="tool-query" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="여권, 유튜브, 위치정보…" autoComplete="off" />
      </div>
      <div className="tool-grid" aria-live="polite">
        {filtered.map((preset) => <PresetCard key={preset.id} preset={preset} />)}
        {filtered.length === 0 && (
          <div className="empty-search"><SearchX size={28} aria-hidden="true" /><p>맞는 도구를 찾지 못했어요. “사진” 또는 “개인정보”처럼 다시 검색해 보세요.</p></div>
        )}
      </div>
    </>
  );
}
