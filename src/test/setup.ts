import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

if (typeof globalThis.ImageData === "undefined") {
  class TestImageData {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    readonly colorSpace = "srgb" as const;
    constructor(data: Uint8ClampedArray, width: number, height: number) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  }
  Object.defineProperty(globalThis, "ImageData", { configurable: true, value: TestImageData });
}

Object.defineProperty(URL, "createObjectURL", {
  configurable: true,
  value: () => "blob:pixelfit-test",
});
Object.defineProperty(URL, "revokeObjectURL", {
  configurable: true,
  value: () => undefined,
});
