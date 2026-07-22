import { ICO_SIZES, type FaviconPngBytes, type IcoSize } from "./types";
import { readPngDimensions } from "./png";

const ICON_DIRECTORY_BYTES = 6;
const ICON_ENTRY_BYTES = 16;

export interface ParsedIcoEntry {
  size: IcoSize;
  width: number;
  height: number;
  byteLength: number;
  offset: number;
}

export interface ParsedIco {
  type: number;
  entries: ParsedIcoEntry[];
}

function getRequiredPngs(pngs: Pick<FaviconPngBytes, IcoSize>) {
  return ICO_SIZES.map((size) => {
    const png = pngs[size];
    const dimensions = readPngDimensions(png);

    if (dimensions.width !== size || dimensions.height !== size) {
      throw new Error(`${size}px ICO 항목은 ${size}×${size} PNG여야 합니다.`);
    }

    return { size, png };
  });
}

/** Builds an ICO container whose three image payloads are PNG files. */
export function createFaviconIco(
  pngs: Pick<FaviconPngBytes, IcoSize>,
): Uint8Array {
  const images = getRequiredPngs(pngs);
  const payloadOffset = ICON_DIRECTORY_BYTES + ICON_ENTRY_BYTES * images.length;
  const payloadBytes = images.reduce((total, image) => total + image.png.byteLength, 0);
  const output = new Uint8Array(payloadOffset + payloadBytes);
  const view = new DataView(output.buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);

  let nextPayloadOffset = payloadOffset;

  images.forEach(({ size, png }, index) => {
    const entryOffset = ICON_DIRECTORY_BYTES + index * ICON_ENTRY_BYTES;
    output[entryOffset] = size;
    output[entryOffset + 1] = size;
    output[entryOffset + 2] = 0;
    output[entryOffset + 3] = 0;
    view.setUint16(entryOffset + 4, 1, true);
    view.setUint16(entryOffset + 6, 32, true);
    view.setUint32(entryOffset + 8, png.byteLength, true);
    view.setUint32(entryOffset + 12, nextPayloadOffset, true);
    output.set(png, nextPayloadOffset);
    nextPayloadOffset += png.byteLength;
  });

  return output;
}

/** Parses the ICO directory without decoding its image payloads. */
export function parseFaviconIco(input: Uint8Array | ArrayBuffer): ParsedIco {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);

  if (bytes.byteLength < ICON_DIRECTORY_BYTES) {
    throw new Error("ICO 헤더가 너무 짧습니다.");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const reserved = view.getUint16(0, true);
  const type = view.getUint16(2, true);
  const count = view.getUint16(4, true);

  if (reserved !== 0 || type !== 1 || count === 0) {
    throw new Error("유효한 아이콘 ICO 헤더가 아닙니다.");
  }

  const directoryEnd = ICON_DIRECTORY_BYTES + count * ICON_ENTRY_BYTES;
  if (directoryEnd > bytes.byteLength) {
    throw new Error("ICO 디렉터리가 잘렸습니다.");
  }

  const entries: ParsedIcoEntry[] = [];
  for (let index = 0; index < count; index += 1) {
    const entryOffset = ICON_DIRECTORY_BYTES + index * ICON_ENTRY_BYTES;
    const width = bytes[entryOffset] || 256;
    const height = bytes[entryOffset + 1] || 256;
    const byteLength = view.getUint32(entryOffset + 8, true);
    const offset = view.getUint32(entryOffset + 12, true);

    if (offset < directoryEnd || offset + byteLength > bytes.byteLength) {
      throw new Error("ICO 이미지 데이터 범위가 올바르지 않습니다.");
    }

    entries.push({
      size: width as IcoSize,
      width,
      height,
      byteLength,
      offset,
    });
  }

  return { type, entries };
}
