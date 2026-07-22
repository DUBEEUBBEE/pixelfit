const names: Record<string, string> = {
  "passport-photo": "passport-photo-413x531",
  "id-photo": "id-photo-354x472",
  "resident-id-photo": "resident-id-photo-413x531",
  "youtube-banner": "youtube-banner-2560x1440",
  "favicon-maker": "favicon-package",
  "photo-privacy-cleaner": "photo-private-metadata-removed",
};

export function createOutputFilename(presetId: string, format: "jpeg" | "png" | "webp" | "zip" | "ico"): string {
  const base = names[presetId] ?? "pixelfit-image";
  const extension = format === "jpeg" ? "jpg" : format;
  return `${base}.${extension}`;
}

export function safeDownload(blob: Blob, filename: string): boolean {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
    anchor.rel = "noopener";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    return true;
  } catch {
    return false;
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }
}
