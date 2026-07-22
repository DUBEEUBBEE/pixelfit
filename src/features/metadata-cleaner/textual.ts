import { ascii, uniqueBy, utf8 } from "./binary";
import type { MetadataCategory, MetadataFinding, MetadataSource } from "./types";

interface ByteSpan {
  readonly start: number;
  readonly end: number;
  readonly category: MetadataCategory;
  readonly preserveMarkup: boolean;
}

interface IptcDataset {
  readonly record: number;
  readonly dataset: number;
  readonly valueStart: number;
  readonly valueEnd: number;
}

const CATEGORY_LABELS: Record<MetadataCategory, string> = {
  gps: "GPS 위치",
  device: "촬영 기기",
  lens: "렌즈 정보",
  date: "촬영일",
  software: "편집 프로그램",
  author: "작성자",
  description: "설명",
  thumbnail: "미리보기 이미지",
  xmpIptc: "기타 XMP/IPTC 정보",
};

function normalizedName(name: string): { full: string; prefix: string; local: string } {
  const full = name.toLowerCase();
  const separator = full.indexOf(":");
  return separator < 0
    ? { full, prefix: "", local: full }
    : { full, prefix: full.slice(0, separator), local: full.slice(separator + 1) };
}

function xmpPropertyCategory(name: string): MetadataCategory | undefined {
  const { full, prefix, local } = normalizedName(name);

  if (
    local.includes("gps") ||
    ["location", "sublocation", "city", "state", "province", "country", "countrycode"].includes(local)
  ) {
    return "gps";
  }
  if (local.includes("lens")) {
    return "lens";
  }
  if (
    [
      "make",
      "model",
      "serialnumber",
      "bodyserialnumber",
      "cameraownername",
      "imageuniqueid",
    ].includes(local) ||
    full.includes("camera:model")
  ) {
    return "device";
  }
  if (
    local.includes("date") ||
    local.includes("datetime") ||
    ["timecreated", "metadata-time"].includes(local)
  ) {
    return "date";
  }
  if (
    ["software", "creatortool", "originatingprogram", "programversion"].includes(local) ||
    local.includes("softwareagent")
  ) {
    return "software";
  }
  if (
    [
      "artist",
      "creator",
      "author",
      "rights",
      "copyright",
      "credit",
      "byline",
      "captionwriter",
      "source",
    ].includes(local)
  ) {
    return "author";
  }
  if (
    ["title", "subject", "headline", "caption", "comment", "usercomment"].includes(local) ||
    (local === "description" && prefix !== "rdf")
  ) {
    return "description";
  }
  return undefined;
}

function cleanDisplayValue(value: string): string | undefined {
  const cleaned = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/gi, " ")
    .replace(/[\u0000\s]+/g, " ")
    .trim();
  if (!cleaned) {
    return undefined;
  }
  return cleaned.length > 160 ? `${cleaned.slice(0, 157)}…` : cleaned;
}

function finding(
  source: MetadataSource,
  category: MetadataCategory,
  offset: number,
  value?: string,
  label = CATEGORY_LABELS[category],
): MetadataFinding {
  return {
    id: `${source}:${offset}:${category}`,
    category,
    label,
    ...(value ? { value } : {}),
    source,
    removable: true,
  };
}

function xmpSpans(text: string): ByteSpan[] {
  const spans: ByteSpan[] = [];
  const attributePattern =
    /([A-Za-z_][\w.-]*(?::[A-Za-z_][\w.-]*)?)\s*=\s*(["'])([\s\S]*?)\2/g;
  for (const match of text.matchAll(attributePattern)) {
    const category = xmpPropertyCategory(match[1]);
    if (!category || match.index === undefined) {
      continue;
    }
    const assignment = match[0];
    const equalsAt = assignment.indexOf("=");
    const quoteAt = assignment.indexOf(match[2], equalsAt + 1);
    const start = match.index + quoteAt + 1;
    spans.push({ start, end: start + match[3].length, category, preserveMarkup: false });
  }

  const lowerText = text.toLowerCase();
  const openingTagPattern = /<([A-Za-z_][\w.-]*(?::[A-Za-z_][\w.-]*)?)\b[^>]*>/g;
  for (const match of text.matchAll(openingTagPattern)) {
    if (match.index === undefined || match[0].endsWith("/>")) {
      continue;
    }
    const category = xmpPropertyCategory(match[1]);
    if (!category) {
      continue;
    }
    const contentStart = match.index + match[0].length;
    const closingStart = lowerText.indexOf(`</${match[1].toLowerCase()}`, contentStart);
    if (closingStart >= contentStart) {
      spans.push({
        start: contentStart,
        end: closingStart,
        category,
        preserveMarkup: true,
      });
    }
  }
  return spans;
}

export function inspectXmp(bytes: Uint8Array, source: MetadataSource = "xmp"): MetadataFinding[] {
  const text = ascii(bytes.subarray(0, Math.min(bytes.length, 8 * 1024 * 1024)));
  const fields: MetadataFinding[] = [
    finding(source, "xmpIptc", 0, "XMP packet", "XMP 메타데이터"),
  ];
  for (const span of xmpSpans(text)) {
    const value = cleanDisplayValue(text.slice(span.start, span.end));
    if (value) {
      fields.push(finding(source, span.category, span.start, value));
    }
  }
  return uniqueBy(fields, (field) => `${field.source}:${field.category}:${field.value ?? ""}`);
}

export function cleanXmp(
  bytes: Uint8Array,
  selected: ReadonlySet<MetadataCategory>,
): { bytes: Uint8Array; changed: boolean } {
  const text = ascii(bytes.subarray(0, Math.min(bytes.length, 8 * 1024 * 1024)));
  const output = bytes.slice();
  let changed = false;

  for (const span of xmpSpans(text)) {
    if (!selected.has(span.category)) {
      continue;
    }
    let insideTag = false;
    for (let offset = span.start; offset < span.end; offset += 1) {
      if (span.preserveMarkup) {
        if (output[offset] === 0x3c) {
          insideTag = true;
        }
        if (insideTag) {
          if (output[offset] === 0x3e) {
            insideTag = false;
          }
          continue;
        }
      }
      if (output[offset] !== 0x20 && output[offset] !== 0x09 && output[offset] !== 0x0a && output[offset] !== 0x0d) {
        output[offset] = 0x20;
        changed = true;
      }
    }
  }
  return { bytes: changed ? output : bytes, changed };
}

const IPTC_CATEGORIES = new Map<number, MetadataCategory>([
  [5, "description"], // Object Name
  [25, "xmpIptc"], // Keywords
  [55, "date"],
  [60, "date"],
  [62, "date"],
  [63, "date"],
  [65, "software"],
  [70, "software"],
  [80, "author"],
  [85, "author"],
  [90, "gps"],
  [92, "gps"],
  [95, "gps"],
  [100, "gps"],
  [101, "gps"],
  [105, "description"],
  [110, "author"],
  [115, "author"],
  [116, "author"],
  [120, "description"],
  [122, "author"],
]);

function parseIptcDatasets(bytes: Uint8Array): IptcDataset[] {
  const datasets: IptcDataset[] = [];
  let offset = 0;
  while (offset <= bytes.length - 5) {
    if (bytes[offset] !== 0x1c) {
      offset += 1;
      continue;
    }
    const record = bytes[offset + 1];
    const dataset = bytes[offset + 2];
    const shortLength = bytes[offset + 3] * 0x100 + bytes[offset + 4];
    let valueStart = offset + 5;
    let valueLength = shortLength;
    if ((shortLength & 0x8000) !== 0) {
      const lengthBytes = shortLength & 0x7fff;
      if (lengthBytes < 1 || lengthBytes > 4 || valueStart + lengthBytes > bytes.length) {
        offset += 1;
        continue;
      }
      valueLength = 0;
      for (let index = 0; index < lengthBytes; index += 1) {
        valueLength = valueLength * 0x100 + bytes[valueStart + index];
      }
      valueStart += lengthBytes;
    }
    if (record > 9 || valueLength > bytes.length - valueStart) {
      offset += 1;
      continue;
    }
    datasets.push({ record, dataset, valueStart, valueEnd: valueStart + valueLength });
    offset = valueStart + valueLength;
  }
  return datasets;
}

export function inspectIptc(bytes: Uint8Array): MetadataFinding[] {
  const datasets = parseIptcDatasets(bytes);
  if (datasets.length === 0) {
    return [];
  }
  const fields: MetadataFinding[] = [
    finding("iptc", "xmpIptc", datasets[0].valueStart, "IPTC record", "IPTC 메타데이터"),
  ];
  for (const item of datasets) {
    if (item.record !== 2) {
      continue;
    }
    const category = IPTC_CATEGORIES.get(item.dataset);
    if (!category) {
      continue;
    }
    const value = cleanDisplayValue(utf8(bytes.subarray(item.valueStart, item.valueEnd)));
    if (value) {
      fields.push(finding("iptc", category, item.valueStart, value));
    }
  }
  return uniqueBy(fields, (field) => `${field.category}:${field.value ?? ""}`);
}

export function cleanIptc(
  bytes: Uint8Array,
  selected: ReadonlySet<MetadataCategory>,
): { bytes: Uint8Array; changed: boolean } {
  const output = bytes.slice();
  let changed = false;
  for (const item of parseIptcDatasets(bytes)) {
    const category = item.record === 2 ? IPTC_CATEGORIES.get(item.dataset) : undefined;
    if (!selected.has("xmpIptc") && (!category || !selected.has(category))) {
      continue;
    }
    for (let offset = item.valueStart; offset < item.valueEnd; offset += 1) {
      if (output[offset] !== 0x20) {
        output[offset] = 0x20;
        changed = true;
      }
    }
  }
  return { bytes: changed ? output : bytes, changed };
}

export function categorizeTextKeyword(keyword: string): MetadataCategory {
  const normalized = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (/gps|location|latitude|longitude|city|country/.test(normalized)) {
    return "gps";
  }
  if (/lens/.test(normalized)) {
    return "lens";
  }
  if (/make|model|camera|device|serial/.test(normalized)) {
    return "device";
  }
  if (/date|time|created|modified/.test(normalized)) {
    return "date";
  }
  if (/software|program|tool|application/.test(normalized)) {
    return "software";
  }
  if (/author|artist|creator|copyright|credit|owner/.test(normalized)) {
    return "author";
  }
  if (/description|comment|caption|title|subject|headline/.test(normalized)) {
    return "description";
  }
  return "xmpIptc";
}

export function textFinding(
  keyword: string,
  value: string | undefined,
  offset: number,
): MetadataFinding {
  const category = categorizeTextKeyword(keyword);
  return finding("png-text", category, offset, value, keyword || CATEGORY_LABELS[category]);
}
