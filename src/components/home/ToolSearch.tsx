"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, SearchX } from "lucide-react";
import Link from "next/link";
import type { HomeCategorySummary, ToolSearchSummary } from "@/config/client-tools";
import { PresetCard } from "@/components/preset/PresetCard";

const featuredToolIds = ["image-compressor", "image-resizer", "image-converter", "social-image-pack"] as const;

const quickSearches = [
  { label: "500KB", query: "500KB" },
  { label: "JPG 변환", query: "JPG 변환" },
  { label: "크기 조절", query: "크기 조절" },
  { label: "유튜브 썸네일", query: "유튜브 썸네일" },
  { label: "네컷사진", query: "네컷사진" },
  { label: "여권사진", query: "여권사진" },
] as const;

function QuickSearchChips({ normalizedQuery, onSearch }: { normalizedQuery: string; onSearch: (query: string) => void }) {
  return (
    <div className="quick-search" role="group" aria-labelledby="quick-search-label">
      <span className="quick-search-label" id="quick-search-label">빠른 검색</span>
      <div className="quick-search-chips">
        {quickSearches.map((item) => (
          <button
            className="quick-search-chip"
            type="button"
            key={item.label}
            aria-pressed={normalizedQuery === item.query.toLocaleLowerCase("ko-KR")}
            onClick={() => onSearch(item.query)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ToolSearch({ presets, categories }: { presets: readonly ToolSearchSummary[]; categories: readonly HomeCategorySummary[] }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(() => categories.find((category) => category.id === "creator")?.id ?? categories[0]?.id ?? "");
  const normalized = query.trim().toLocaleLowerCase("ko-KR");
  const filtered = useMemo(() => {
    if (!normalized) return presets;
    const terms = normalized.split(/\s+/u);
    return presets.filter((preset) => {
      const haystack = [preset.title, preset.shortDescription, ...preset.searchTerms, ...preset.searchAliases].join(" ").toLocaleLowerCase("ko-KR");
      return terms.every((term) => haystack.includes(term));
    });
  }, [normalized, presets]);
  const featured = featuredToolIds.flatMap((id) => {
    const preset = presets.find((candidate) => candidate.id === id);
    return preset ? [preset] : [];
  });
  const selectedCategoryDetails = categories.find((category) => category.id === selectedCategory);
  const categoryTools = presets.filter((preset) => preset.category === selectedCategory);

  return (
    <>
      <div className="tool-search">
        <Search size={21} aria-hidden="true" />
        <label className="sr-only" htmlFor="tool-query">도구 검색</label>
        <input id="tool-query" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="500KB, 크기 조절, JPG 변환, 유튜브, 네컷…" autoComplete="off" />
      </div>
      <p className="sr-only" aria-live="polite">{normalized ? `검색 결과 ${filtered.length}개` : `전체 도구 ${presets.length}개`}</p>
      {normalized ? (
        <>
          <QuickSearchChips normalizedQuery={normalized} onSearch={setQuery} />
          <section className="search-results" aria-labelledby="search-results-title">
            <div className="category-heading">
              <h2 id="search-results-title">검색 결과</h2>
              <p>{filtered.length > 0 ? `${filtered.length}개 도구를 찾았습니다.` : "정확히 일치하는 도구가 없습니다."}</p>
            </div>
            <div className="tool-grid">
              {filtered.map((preset) => <PresetCard key={preset.id} preset={preset} />)}
              {filtered.length === 0 && (
                <div className="empty-search"><SearchX size={28} aria-hidden="true" /><p>다른 말로 다시 검색하거나 아래 기본 도구에서 시작해 보세요.</p><div className="empty-links"><Link href="/image-compressor" prefetch={false}>사진 용량 줄이기</Link><Link href="/image-resizer" prefetch={false}>이미지 크기 조절</Link><Link href="/image-converter" prefetch={false}>JPG·PNG·WebP 변환</Link></div></div>
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="featured-tools" aria-labelledby="featured-tools-title">
            <div className="featured-heading">
              <h2 id="featured-tools-title">자주 쓰는 도구</h2>
              <p>용량·크기·형식을 빠르게 맞추거나 SNS용 이미지를 한 번에 준비하세요.</p>
            </div>
            <div className="tool-grid">
              {featured.map((preset) => <PresetCard key={preset.id} preset={preset} />)}
            </div>
          </section>

          <QuickSearchChips normalizedQuery={normalized} onSearch={setQuery} />

          <section className="category-explorer" aria-labelledby="category-explorer-title">
            <div className="category-heading">
              <h2 id="category-explorer-title">카테고리로 찾아보기</h2>
              <p>필요한 종류를 고르면 관련 도구만 짧게 보여드립니다.</p>
            </div>
            <div className="category-filter-list" role="group" aria-label="도구 카테고리">
              {categories.map((category) => (
                <button
                  className="category-filter"
                  type="button"
                  key={category.id}
                  aria-pressed={category.id === selectedCategory}
                  aria-controls="category-results"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.title}
                </button>
              ))}
            </div>
            <section className="category-results" id="category-results" aria-labelledby={`selected-category-${selectedCategory}`}>
              <div className="category-heading">
                <h3 id={`selected-category-${selectedCategory}`}>{selectedCategoryDetails?.title}</h3>
                <p>{selectedCategoryDetails?.description}</p>
              </div>
              <div className="tool-grid">
                {categoryTools.map((preset) => <PresetCard key={preset.id} preset={preset} />)}
              </div>
            </section>
          </section>

          <details className="all-tools-disclosure" id="all-tools">
            <summary className="all-tools-summary">
              <span>전체 도구 {presets.length}개 보기</span>
              <ChevronDown size={19} aria-hidden="true" />
            </summary>
            <div className="all-tools-panel">
              <p>필터를 사용하지 않아도 아래 링크에서 모든 도구를 열 수 있습니다.</p>
              <div className="tool-grid">
                {presets.map((preset) => <PresetCard key={preset.id} preset={preset} />)}
              </div>
            </div>
          </details>
        </>
      )}
    </>
  );
}
