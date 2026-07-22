export const METADATA_CATEGORIES = [
  "gps",
  "device",
  "lens",
  "date",
  "software",
  "author",
  "description",
  "thumbnail",
  "xmpIptc",
] as const;

export type MetadataCategory = (typeof METADATA_CATEGORIES)[number];

export type SupportedMetadataFormat = "jpeg" | "png" | "webp";

export type MetadataSource =
  | "exif"
  | "xmp"
  | "iptc"
  | "jpeg-comment"
  | "png-text";

export type ProvenanceKind = "c2pa" | "jumbf" | "contentCredentials";

export interface MetadataFinding {
  readonly id: string;
  readonly category: MetadataCategory;
  readonly label: string;
  readonly value?: string;
  readonly source: MetadataSource;
  readonly removable: true;
}

export interface ProvenanceIndicator {
  readonly id: string;
  readonly kind: ProvenanceKind;
  readonly label: string;
  readonly container: string;
  /** Provenance records are intentionally never exposed as removable fields. */
  readonly removable: false;
}

export interface MetadataPreservationCapabilities {
  readonly pixelPayload: "preserved";
  readonly colorProfile: "preserved-when-present";
  readonly orientation: "preserved-when-present";
  readonly density: "preserved-when-present";
  readonly alpha: "preserved-when-present";
  readonly provenance: "bytes-preserved-validity-not-guaranteed";
}

export interface MetadataInspection {
  readonly format: SupportedMetadataFormat;
  readonly detectedMime: "image/jpeg" | "image/png" | "image/webp";
  readonly suppliedMime: string;
  readonly mimeMatchesSignature: boolean;
  readonly fields: readonly MetadataFinding[];
  readonly categories: readonly MetadataCategory[];
  readonly provenance: readonly ProvenanceIndicator[];
  readonly hasProvenance: boolean;
  readonly losslessCleaningSupported: true;
  readonly preservation: MetadataPreservationCapabilities;
}

export interface MetadataCleanPreservationReport {
  readonly pixelPayloadPreserved: true;
  readonly reencoded: false;
  readonly qualityChangeExpected: false;
  readonly colorProfilePreserved: boolean;
  readonly orientationPreserved: boolean;
  readonly densityPreserved: boolean;
  readonly alphaPreserved: boolean;
  readonly provenanceBytesPreserved: boolean;
}

export interface MetadataCleanReport {
  readonly format: SupportedMetadataFormat;
  readonly changed: boolean;
  readonly inputBytes: number;
  readonly outputBytes: number;
  readonly selectedCategories: readonly MetadataCategory[];
  readonly removedCategories: readonly MetadataCategory[];
  readonly remainingSelectedCategories: readonly MetadataCategory[];
  readonly removedFields: readonly MetadataFinding[];
  readonly remainingFields: readonly MetadataFinding[];
  readonly provenance: readonly ProvenanceIndicator[];
  /** Any byte-level edit can invalidate a credential even when its bytes survive. */
  readonly provenanceMayBeInvalidated: boolean;
  readonly preservation: MetadataCleanPreservationReport;
  readonly warnings: readonly string[];
}

export interface MetadataCleanResult {
  readonly bytes: Uint8Array;
  readonly report: MetadataCleanReport;
}

export type MetadataCleanerErrorCode =
  | "UNSUPPORTED_FORMAT"
  | "MALFORMED_IMAGE"
  | "INVALID_CATEGORY";

export class MetadataCleanerError extends Error {
  readonly code: MetadataCleanerErrorCode;

  constructor(code: MetadataCleanerErrorCode, message: string) {
    super(message);
    this.name = "MetadataCleanerError";
    this.code = code;
  }
}
