"use client";

import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import Link from "next/link";
import type { HomeCategorySummary, ToolSearchSummary } from "@/config/client-tools";
import { PresetCard } from "@/components/preset/PresetCard";

export function ToolSearch({ presets, categories }: { presets: readonly ToolSearchSummary[]; categories: readonly HomeCategorySummary[] }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("ko");
  const filtered = useMemo(() => {
    if (!normalized) return presets;
    return presets.filter((preset) => [preset.title, preset.shortDescription, ...preset.searchTerms, ...preset.searchAliases].join(" ").toLocaleLowerCase("ko").includes(normalized));
  }, [normalized, presets]);

  return (
    <>
      <div className="tool-search">
        <Search size={21} aria-hidden="true" />
        <label className="sr-only" htmlFor="tool-query">도구 검색</label>
        <input id="tool-query" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="여권, 유튜브, 위치정보…" autoComplete="off" />
      </div>
      <p className="sr-only" aria-live="polite">{normalized ? `검색 결과 ${filtered.length}개` : `전체 도구 ${presets.length}개`}</p>
      {normalized ? (
        <div className="tool-grid">
          {filtered.map((preset) => <PresetCard key={preset.id} preset={preset} />)}
          {filtered.length === 0 && (
            <div className="empty-search"><SearchX size={28} aria-hidden="true" /><p>맞는 도구를 찾지 못했어요. 아래 자주 쓰는 도구를 선택하거나 다른 말로 다시 검색해 보세요.</p><div className="empty-links"><Link href="/image-compressor">사진 용량 줄이기</Link><Link href="/image-resizer">이미지 크기 조절</Link><Link href="/image-converter">JPG·PNG·WebP 변환</Link></div></div>
          )}
        </div>
      ) : (
        <div className="tool-category-list">
          {categories.map((category) => {
            const categoryTools = presets.filter((tool) => tool.category === category.id);
            if (categoryTools.length === 0) return null;
            return <section className="tool-category" key={category.id} aria-labelledby={`category-${category.id}`}><div className="category-heading"><h2 id={`category-${category.id}`}>{category.title}</h2><p>{category.description}</p></div><div className="tool-grid">{categoryTools.map((preset) => <PresetCard key={preset.id} preset={preset} />)}</div></section>;
          })}
        </div>
      )}
    </>
  );
}
