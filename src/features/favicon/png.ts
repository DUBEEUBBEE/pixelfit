const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function toBytes(input: Uint8Array | ArrayBuffer): Uint8Array {
  return input instanceof Uint8Array ? input : new Uint8Array(input);
}

export function hasPngSignature(input: Uint8Array | ArrayBuffer): boolean {
  const bytes = toBytes(input);
  return (
    bytes.byteLength >= PNG_SIGNATURE.byteLength &&
    PNG_SIGNATURE.every((value, index) => bytes[index] === value)
  );
}

export function readPngDimensions(
  input: Uint8Array | ArrayBuffer,
): { width: number; height: number } {
  const bytes = toBytes(input);

  if (bytes.byteLength < 24 || !hasPngSignature(bytes)) {
    throw new Error("유효한 PNG 파일이 아닙니다.");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerLength = view.getUint32(8, false);
  const headerType = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);

  if (headerLength !== 13 || headerType !== "IHDR") {
    throw new Error("PNG IHDR 헤더를 찾을 수 없습니다.");
  }

  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);

  if (width === 0 || height === 0) {
    throw new Error("PNG 크기가 올바르지 않습니다.");
  }

  return { width, height };
}
