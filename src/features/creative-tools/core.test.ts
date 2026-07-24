import { describe, expect, it } from "vitest";
import { applyFilmEffects, applyFourCutTone, layoutFourCut, mapFourCutSources, wrapCanvasText } from "./core";

describe("creative tool primitives", () => {
  it("세로와 가로 네컷이 겹치지 않는 네 영역을 만든다", () => {
    for (const orientation of ["vertical", "horizontal"] as const) {
      const frames = layoutFourCut(orientation, 1200, 1800, 60, 20);
      expect(frames).toHaveLength(4);
      for (const frame of frames) {
        expect(frame.width).toBeGreaterThan(0);
        expect(frame.height).toBeGreaterThan(0);
      }
      for (let left = 0; left < frames.length; left += 1) for (let right = left + 1; right < frames.length; right += 1) {
        const a = frames[left]; const b = frames[right];
        const overlap = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
        expect(overlap).toBe(false);
      }
    }
  });

  it("사진 1~4장을 네 칸에 순환 배치한다", () => {
    expect(mapFourCutSources(1)).toEqual([0, 0, 0, 0]);
    expect(mapFourCutSources(2)).toEqual([0, 1, 0, 1]);
    expect(mapFourCutSources(4)).toEqual([0, 1, 2, 3]);
  });

  it("같은 seed의 필름 효과는 byte-identical하다", () => {
    const input = new ImageData(new Uint8ClampedArray([120, 80, 40, 255, 20, 50, 90, 255, 200, 180, 140, 255, 10, 20, 30, 255]), 2, 2);
    const options = { mode: "low-saturation" as const, strength: .7, grain: .5, vignette: .4, lightLeak: .3 };
    const first = applyFilmEffects(input, options, 42);
    const second = applyFilmEffects(input, options, 42);
    expect(Array.from(first.data)).toEqual(Array.from(second.data));
    expect(Array.from(applyFilmEffects(input, options, 43).data)).not.toEqual(Array.from(first.data));
  });

  it("네컷 톤은 alpha를 보존하며 메인 스레드와 워커가 공유하는 결정적 변환을 제공한다", () => {
    const source = new Uint8ClampedArray([120, 80, 40, 77, 250, 200, 150, 128]);
    expect(Array.from(applyFourCutTone(new Uint8ClampedArray(source), "mono"))).toEqual([
      87, 87, 87, 77, 209, 209, 209, 128,
    ]);
    expect(Array.from(applyFourCutTone(new Uint8ClampedArray(source), "vintage"))).toEqual([
      138, 83, 34, 77, 255, 196, 120, 128,
    ]);
  });

  it("긴 제목을 최대 두 줄과 말줄임으로 제한한다", () => {
    const lines = wrapCanvasText("아주 긴 유튜브 썸네일 제목이 안전영역을 넘지 않게 만들기", 12, (value) => value.length, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
  });
});
