import { ascii, startsWithBytes, uniqueBy } from "./binary";
import type { ProvenanceIndicator, ProvenanceKind } from "./types";

const C2PA_UUID = [
  0x63, 0x32, 0x70, 0x61, 0x00, 0x11, 0x00, 0x10,
  0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71,
] as const;

const LABELS: Record<ProvenanceKind, string> = {
  c2pa: "C2PA 콘텐츠 출처 정보",
  jumbf: "JUMBF 콘텐츠 출처 컨테이너",
  contentCredentials: "Content Credentials 표시",
};

function includesBytes(haystack: Uint8Array, needle: readonly number[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) {
    return false;
  }
  for (let offset = 0; offset <= haystack.length - needle.length; offset += 1) {
    if (startsWithBytes(haystack, needle, offset)) {
      return true;
    }
  }
  return false;
}

export function detectProvenance(
  bytes: Uint8Array,
  container: string,
  structuralKinds: readonly ProvenanceKind[] = [],
): ProvenanceIndicator[] {
  // C2PA labels and box types are ASCII. Limiting the decoded view avoids making
  // an attacker-controlled metadata block create a very large temporary string.
  const text = ascii(bytes.subarray(0, Math.min(bytes.length, 8 * 1024 * 1024))).toLowerCase();
  const kinds = new Set<ProvenanceKind>(structuralKinds);

  if (text.includes("c2pa") || includesBytes(bytes, C2PA_UUID)) {
    kinds.add("c2pa");
  }
  if (
    text.includes("jumbf") ||
    text.includes("jumb") ||
    text.includes("#jumbf=") ||
    (bytes.length >= 2 && bytes[0] === 0x4a && bytes[1] === 0x50)
  ) {
    kinds.add("jumbf");
  }
  if (text.includes("content credentials") || text.includes("contentcredentials")) {
    kinds.add("contentCredentials");
  }

  return uniqueBy(
    [...kinds].map((kind) => ({
      id: `${container}:${kind}`,
      kind,
      label: LABELS[kind],
      container,
      removable: false as const,
    })),
    (indicator) => indicator.id,
  );
}

export function isProtectedProvenanceContainer(
  indicators: readonly ProvenanceIndicator[],
): boolean {
  return indicators.length > 0;
}
