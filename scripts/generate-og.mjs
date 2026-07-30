import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { deflateSync } from "node:zlib";

const WIDTH = 1200;
const HEIGHT = 630;
const NAVY = color("#14213d");
const PAPER = color("#fbfaf7");
const WHITE = color("#ffffff");
const MUTED = color("#627086");

const cards = [
  { id: "home", file: "home.png", title: ["이미지 도구", "용도에 맞게"], spec: "14 TOOLS / BROWSER ONLY", motif: "home", accent: "#36c99b", second: "#ff725e" },
  { id: "passport-photo", title: ["여권사진", "규격 맞추기"], spec: "413 X 531 PX / JPG", motif: "portrait", accent: "#30c594", second: "#69a8ff" },
  { id: "id-photo", title: ["증명사진", "크기 맞추기"], spec: "354 X 472 PX", motif: "id", accent: "#6faaf8", second: "#ff8a72" },
  { id: "resident-id-photo", title: ["주민등록증 사진", "크기 맞추기"], spec: "413 X 531 PX", motif: "resident", accent: "#ff806a", second: "#53caa6" },
  { id: "youtube-banner", title: ["유튜브 배너", "안전영역 확인"], spec: "2560 X 1440 / SAFE AREA", motif: "banner", accent: "#ff665a", second: "#ffd15c" },
  { id: "favicon-maker", title: ["파비콘 만들기", "파일 세트 생성"], spec: "ICO / PNG / MANIFEST", motif: "favicon", accent: "#7a82ff", second: "#43d3ae" },
  { id: "photo-privacy-cleaner", title: ["사진 개인정보", "메타데이터 정리"], spec: "EXIF / GPS / DEVICE DATA", motif: "privacy", accent: "#24b993", second: "#7aa8ff" },
  { id: "image-compressor", title: ["사진 용량 줄이기", "목표 크기 맞추기"], spec: "TARGET KB / MB", motif: "compressor", accent: "#ff9867", second: "#4bbf9d" },
  { id: "image-resizer", title: ["이미지 크기 조절", "픽셀과 비율 변경"], spec: "PIXELS / LONG EDGE / PERCENT", motif: "resizer", accent: "#5b9df4", second: "#ffc861" },
  { id: "image-converter", title: ["이미지 형식 변환", "파일 형식 바꾸기"], spec: "JPEG / PNG / WEBP", motif: "converter", accent: "#8f78f4", second: "#54c9a7" },
  { id: "social-image-pack", title: ["SNS 이미지 세트", "세 가지 비율"], spec: "1:1 / 4:5 / 9:16", motif: "social", accent: "#ee6f91", second: "#6d99f7" },
  { id: "instagram-profile-picture", title: ["인스타 프로필", "원형 테두리"], spec: "1080 X 1080 / CIRCLE", motif: "profile", accent: "#ff725e", second: "#8b7cf6" },
  { id: "youtube-thumbnail", title: ["유튜브 썸네일", "제목 배치 만들기"], spec: "3840 X 2160 / 16:9", motif: "thumbnail", accent: "#ff6259", second: "#4f92ef" },
  { id: "four-cut-photo", title: ["네컷사진 만들기", "네 칸 배치"], spec: "4 FRAMES / JPG / PNG", motif: "four-cut", accent: "#f08aa5", second: "#43c9a8" },
  { id: "film-photo", title: ["필름사진 효과", "네 가지 모드"], spec: "GRAIN / VIGNETTE / LIGHT", motif: "film", accent: "#d98c53", second: "#6ca59a" },
];

const FONT = {
  " ": [0, 0, 0, 0, 0, 0, 0],
  "-": [0, 0, 0, 31, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 6, 6],
  ":": [0, 6, 6, 0, 6, 6, 0],
  "/": [1, 2, 4, 8, 16, 0, 0],
  "?": [14, 17, 1, 2, 4, 0, 4],
  "0": [14, 17, 19, 21, 25, 17, 14],
  "1": [4, 12, 4, 4, 4, 4, 14],
  "2": [14, 17, 1, 2, 4, 8, 31],
  "3": [30, 1, 1, 14, 1, 1, 30],
  "4": [2, 6, 10, 18, 31, 2, 2],
  "5": [31, 16, 16, 30, 1, 1, 30],
  "6": [14, 16, 16, 30, 17, 17, 14],
  "7": [31, 1, 2, 4, 8, 8, 8],
  "8": [14, 17, 17, 14, 17, 17, 14],
  "9": [14, 17, 17, 15, 1, 1, 14],
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14], J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
};

function color(value) {
  const hex = value.replace("#", "");
  return [Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16)];
}

function mix(a, b, amount) {
  return a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount));
}

function hash(value) {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.codePointAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function randomGenerator(seed) {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

class Raster {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.pixels = new Uint8Array(width * height * 3);
  }

  pixel(x, y, fill, alpha = 1) {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height || alpha <= 0) return;
    const offset = (py * this.width + px) * 3;
    const inverse = 1 - alpha;
    this.pixels[offset] = Math.round(this.pixels[offset] * inverse + fill[0] * alpha);
    this.pixels[offset + 1] = Math.round(this.pixels[offset + 1] * inverse + fill[1] * alpha);
    this.pixels[offset + 2] = Math.round(this.pixels[offset + 2] * inverse + fill[2] * alpha);
  }

  rect(x, y, width, height, fill, alpha = 1) {
    const startX = Math.max(0, Math.floor(x));
    const startY = Math.max(0, Math.floor(y));
    const endX = Math.min(this.width, Math.ceil(x + width));
    const endY = Math.min(this.height, Math.ceil(y + height));
    for (let py = startY; py < endY; py += 1) {
      for (let px = startX; px < endX; px += 1) this.pixel(px, py, fill, alpha);
    }
  }

  roundedRect(x, y, width, height, radius, fill, alpha = 1) {
    const startX = Math.max(0, Math.floor(x));
    const startY = Math.max(0, Math.floor(y));
    const endX = Math.min(this.width, Math.ceil(x + width));
    const endY = Math.min(this.height, Math.ceil(y + height));
    const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
    for (let py = startY; py < endY; py += 1) {
      for (let px = startX; px < endX; px += 1) {
        const closestX = Math.max(x + safeRadius, Math.min(px, x + width - safeRadius));
        const closestY = Math.max(y + safeRadius, Math.min(py, y + height - safeRadius));
        const dx = px - closestX;
        const dy = py - closestY;
        if (dx * dx + dy * dy <= safeRadius * safeRadius) this.pixel(px, py, fill, alpha);
      }
    }
  }

  circle(centerX, centerY, radius, fill, alpha = 1) {
    const squared = radius * radius;
    for (let y = Math.floor(centerY - radius); y <= Math.ceil(centerY + radius); y += 1) {
      for (let x = Math.floor(centerX - radius); x <= Math.ceil(centerX + radius); x += 1) {
        const dx = x - centerX;
        const dy = y - centerY;
        if (dx * dx + dy * dy <= squared) this.pixel(x, y, fill, alpha);
      }
    }
  }

  ring(centerX, centerY, radius, width, fill, alpha = 1) {
    const outerSquared = radius * radius;
    const innerSquared = Math.max(0, radius - width) ** 2;
    for (let y = Math.floor(centerY - radius); y <= Math.ceil(centerY + radius); y += 1) {
      for (let x = Math.floor(centerX - radius); x <= Math.ceil(centerX + radius); x += 1) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = dx * dx + dy * dy;
        if (distance <= outerSquared && distance >= innerSquared) this.pixel(x, y, fill, alpha);
      }
    }
  }

  line(x1, y1, x2, y2, width, fill, alpha = 1) {
    const distance = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.ceil(distance / Math.max(1, width / 3)));
    for (let step = 0; step <= steps; step += 1) {
      const amount = step / steps;
      this.circle(x1 + (x2 - x1) * amount, y1 + (y2 - y1) * amount, width / 2, fill, alpha);
    }
  }

  triangle(a, b, c, fill, alpha = 1) {
    const minX = Math.floor(Math.min(a[0], b[0], c[0]));
    const maxX = Math.ceil(Math.max(a[0], b[0], c[0]));
    const minY = Math.floor(Math.min(a[1], b[1], c[1]));
    const maxY = Math.ceil(Math.max(a[1], b[1], c[1]));
    const area = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const first = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / area;
        const second = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / area;
        const third = 1 - first - second;
        if (first >= 0 && second >= 0 && third >= 0) this.pixel(x, y, fill, alpha);
      }
    }
  }
}

function drawText(raster, text, x, y, scale, fill, alpha = 1) {
  let cursor = x;
  for (const sourceCharacter of text.toUpperCase()) {
    const glyph = FONT[sourceCharacter] ?? FONT["?"];
    for (let row = 0; row < glyph.length; row += 1) {
      for (let column = 0; column < 5; column += 1) {
        if ((glyph[row] & (1 << (4 - column))) !== 0) {
          raster.rect(cursor + column * scale, y + row * scale, scale, scale, fill, alpha);
        }
      }
    }
    cursor += scale * 6;
  }
}

const HANGUL_INITIALS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const HANGUL_MEDIALS = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const HANGUL_FINALS = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const VERTICAL_VOWELS = new Set(["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅣ"]);
const HORIZONTAL_VOWELS = new Set(["ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ"]);
const DOUBLE_CONSONANTS = {
  ㄲ: ["ㄱ", "ㄱ"],
  ㄸ: ["ㄷ", "ㄷ"],
  ㅃ: ["ㅂ", "ㅂ"],
  ㅆ: ["ㅅ", "ㅅ"],
  ㅉ: ["ㅈ", "ㅈ"],
};
const COMPOUND_FINALS = {
  ㄳ: ["ㄱ", "ㅅ"],
  ㄵ: ["ㄴ", "ㅈ"],
  ㄶ: ["ㄴ", "ㅎ"],
  ㄺ: ["ㄹ", "ㄱ"],
  ㄻ: ["ㄹ", "ㅁ"],
  ㄼ: ["ㄹ", "ㅂ"],
  ㄽ: ["ㄹ", "ㅅ"],
  ㄾ: ["ㄹ", "ㅌ"],
  ㄿ: ["ㄹ", "ㅍ"],
  ㅀ: ["ㄹ", "ㅎ"],
  ㅄ: ["ㅂ", "ㅅ"],
};
const COMPOUND_VOWELS = {
  ㅘ: ["ㅗ", "ㅏ"],
  ㅙ: ["ㅗ", "ㅐ"],
  ㅚ: ["ㅗ", "ㅣ"],
  ㅝ: ["ㅜ", "ㅓ"],
  ㅞ: ["ㅜ", "ㅔ"],
  ㅟ: ["ㅜ", "ㅣ"],
  ㅢ: ["ㅡ", "ㅣ"],
};

function drawJamo(raster, jamo, x, y, width, height, fill, alpha = 1) {
  const double = DOUBLE_CONSONANTS[jamo];
  const compoundFinal = COMPOUND_FINALS[jamo];
  if (double || compoundFinal) {
    const parts = double ?? compoundFinal;
    drawJamo(raster, parts[0], x, y, width * 0.46, height, fill, alpha);
    drawJamo(raster, parts[1], x + width * 0.54, y, width * 0.46, height, fill, alpha);
    return;
  }

  const compoundVowel = COMPOUND_VOWELS[jamo];
  if (compoundVowel) {
    drawJamo(raster, compoundVowel[0], x, y + height * 0.4, width * 0.62, height * 0.58, fill, alpha);
    drawJamo(raster, compoundVowel[1], x + width * 0.58, y, width * 0.42, height, fill, alpha);
    return;
  }

  const stroke = Math.max(5.5, Math.min(width, height) * 0.2);
  const line = (x1, y1, x2, y2, thickness = stroke) => {
    raster.line(x + width * x1, y + height * y1, x + width * x2, y + height * y2, thickness, fill, alpha);
  };
  const ring = (centerX, centerY, radiusX, radiusY = radiusX) => {
    const radius = Math.min(width * radiusX, height * radiusY);
    raster.ring(x + width * centerX, y + height * centerY, radius, stroke, fill, alpha);
  };

  switch (jamo) {
    case "ㄱ":
      line(.16, .18, .82, .18);
      line(.82, .18, .82, .84);
      break;
    case "ㄴ":
      line(.18, .16, .18, .82);
      line(.18, .82, .84, .82);
      break;
    case "ㄷ":
      line(.17, .18, .83, .18);
      line(.17, .18, .17, .82);
      line(.17, .82, .83, .82);
      line(.83, .18, .83, .82);
      break;
    case "ㄹ":
      line(.16, .16, .82, .16);
      line(.82, .16, .82, .43);
      line(.82, .43, .23, .43);
      line(.23, .43, .23, .66);
      line(.23, .66, .84, .66);
      line(.84, .66, .84, .84);
      line(.84, .84, .16, .84);
      break;
    case "ㅁ":
      line(.17, .17, .83, .17);
      line(.17, .17, .17, .83);
      line(.17, .83, .83, .83);
      line(.83, .17, .83, .83);
      break;
    case "ㅂ":
      line(.18, .16, .18, .84);
      line(.82, .16, .82, .84);
      line(.18, .18, .82, .18);
      line(.18, .5, .82, .5);
      line(.18, .82, .82, .82);
      break;
    case "ㅅ":
      line(.5, .14, .16, .84);
      line(.5, .14, .84, .84);
      break;
    case "ㅇ":
      ring(.5, .5, .36);
      break;
    case "ㅈ":
      line(.16, .15, .84, .15);
      line(.5, .27, .17, .84);
      line(.5, .27, .83, .84);
      break;
    case "ㅊ":
      line(.34, .08, .66, .08);
      line(.16, .28, .84, .28);
      line(.5, .38, .17, .88);
      line(.5, .38, .83, .88);
      break;
    case "ㅋ":
      line(.16, .16, .84, .16);
      line(.84, .16, .84, .84);
      line(.34, .5, .84, .5);
      break;
    case "ㅌ":
      line(.15, .17, .85, .17);
      line(.15, .5, .85, .5);
      line(.15, .83, .85, .83);
      line(.18, .17, .18, .83);
      line(.82, .17, .82, .83);
      break;
    case "ㅍ":
      line(.15, .26, .85, .26);
      line(.15, .74, .85, .74);
      line(.32, .14, .32, .86);
      line(.68, .14, .68, .86);
      break;
    case "ㅎ":
      line(.32, .1, .68, .1);
      line(.18, .3, .82, .3);
      ring(.5, .66, .25, .23);
      break;
    case "ㅏ":
      line(.42, .08, .42, .92);
      line(.42, .45, .9, .45);
      break;
    case "ㅐ":
      line(.25, .08, .25, .92);
      line(.25, .45, .62, .45);
      line(.78, .08, .78, .92);
      break;
    case "ㅑ":
      line(.4, .08, .4, .92);
      line(.4, .35, .9, .35);
      line(.4, .62, .9, .62);
      break;
    case "ㅒ":
      line(.22, .08, .22, .92);
      line(.22, .34, .58, .34);
      line(.22, .63, .58, .63);
      line(.78, .08, .78, .92);
      break;
    case "ㅓ":
      line(.58, .08, .58, .92);
      line(.1, .45, .58, .45);
      break;
    case "ㅔ":
      line(.22, .08, .22, .92);
      line(.22, .45, .6, .45);
      line(.78, .08, .78, .92);
      break;
    case "ㅕ":
      line(.6, .08, .6, .92);
      line(.1, .35, .6, .35);
      line(.1, .62, .6, .62);
      break;
    case "ㅖ":
      line(.22, .08, .22, .92);
      line(.22, .34, .58, .34);
      line(.22, .63, .58, .63);
      line(.78, .08, .78, .92);
      break;
    case "ㅗ":
      line(.08, .68, .92, .68);
      line(.5, .1, .5, .68);
      break;
    case "ㅛ":
      line(.08, .72, .92, .72);
      line(.34, .12, .34, .72);
      line(.66, .12, .66, .72);
      break;
    case "ㅜ":
      line(.08, .32, .92, .32);
      line(.5, .32, .5, .9);
      break;
    case "ㅠ":
      line(.08, .28, .92, .28);
      line(.34, .28, .34, .88);
      line(.66, .28, .66, .88);
      break;
    case "ㅡ":
      line(.08, .5, .92, .5);
      break;
    case "ㅣ":
      line(.5, .08, .5, .92);
      break;
    default:
      raster.roundedRect(x + width * .18, y + height * .18, width * .64, height * .64, stroke, fill, alpha * .28);
  }
}

function drawHangulSyllable(raster, character, x, y, size, fill, alpha = 1) {
  const value = character.codePointAt(0) - 0xac00;
  const initial = HANGUL_INITIALS[Math.floor(value / 588)];
  const medial = HANGUL_MEDIALS[Math.floor((value % 588) / 28)];
  const final = HANGUL_FINALS[value % 28];
  const margin = size * .06;
  const cellX = x + margin;
  const cellY = y + margin;
  const cellWidth = size - margin * 2;
  const cellHeight = size - margin * 2;
  const mainHeight = final ? cellHeight * .72 : cellHeight;

  if (VERTICAL_VOWELS.has(medial)) {
    drawJamo(raster, initial, cellX, cellY, cellWidth * .5, mainHeight, fill, alpha);
    drawJamo(raster, medial, cellX + cellWidth * .52, cellY, cellWidth * .46, mainHeight, fill, alpha);
  } else if (HORIZONTAL_VOWELS.has(medial)) {
    drawJamo(raster, initial, cellX + cellWidth * .16, cellY, cellWidth * .68, mainHeight * .52, fill, alpha);
    drawJamo(raster, medial, cellX, cellY + mainHeight * .53, cellWidth, mainHeight * .46, fill, alpha);
  } else {
    drawJamo(raster, initial, cellX, cellY, cellWidth * .47, mainHeight * .58, fill, alpha);
    drawJamo(raster, medial, cellX + cellWidth * .45, cellY, cellWidth * .54, mainHeight, fill, alpha);
  }

  if (final) {
    drawJamo(raster, final, cellX + cellWidth * .22, cellY + cellHeight * .76, cellWidth * .56, cellHeight * .22, fill, alpha);
  }
}

function hangulTextUnits(text) {
  return [...text].reduce((units, character) => {
    if (character === " ") return units + .44;
    if (FONT[character.toUpperCase()]) return units + .75;
    return units + 1;
  }, 0);
}

function drawHangulText(raster, text, centerX, y, maxWidth, maximumSize, fill, alpha = 1) {
  const units = hangulTextUnits(text);
  const size = Math.min(maximumSize, maxWidth / units);
  let cursor = centerX - (units * size) / 2;
  for (const character of text) {
    if (character === " ") {
      cursor += size * .44;
      continue;
    }
    const codePoint = character.codePointAt(0);
    if (codePoint >= 0xac00 && codePoint <= 0xd7a3) {
      drawHangulSyllable(raster, character, cursor, y, size, fill, alpha);
      cursor += size;
    } else if (FONT[character.toUpperCase()]) {
      drawText(raster, character, cursor, y + size * .06, size / 8, fill, alpha);
      cursor += size * .75;
    } else {
      raster.roundedRect(cursor + size * .18, y + size * .18, size * .64, size * .64, size * .08, fill, alpha * .3);
      cursor += size;
    }
  }
}

function drawOutlineCard(raster, x, y, width, height, radius, border, inside = WHITE) {
  raster.roundedRect(x + 10, y + 12, width, height, radius, NAVY, 0.1);
  raster.roundedRect(x, y, width, height, radius, border);
  raster.roundedRect(x + 5, y + 5, width - 10, height - 10, Math.max(2, radius - 5), inside);
}

function drawPerson(raster, centerX, top, size, accent) {
  raster.circle(centerX, top + size * 0.28, size * 0.18, mix(accent, WHITE, 0.28));
  raster.roundedRect(centerX - size * 0.29, top + size * 0.5, size * 0.58, size * 0.48, size * 0.22, accent);
  raster.line(centerX - size * 0.34, top + size * 0.46, centerX + size * 0.34, top + size * 0.46, 3, NAVY, 0.25);
}

function drawArrow(raster, x1, y1, x2, y2, fill) {
  raster.line(x1, y1, x2, y2, 8, fill);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  raster.line(x2, y2, x2 - 20 * Math.cos(angle - 0.65), y2 - 20 * Math.sin(angle - 0.65), 8, fill);
  raster.line(x2, y2, x2 - 20 * Math.cos(angle + 0.65), y2 - 20 * Math.sin(angle + 0.65), 8, fill);
}

function drawBackground(raster, accent, second, seed) {
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const firstDistance = Math.hypot((x - 1040) / 620, (y - 100) / 420);
      const secondDistance = Math.hypot((x - 110) / 500, (y - 650) / 500);
      const firstGlow = Math.max(0, 1 - firstDistance) ** 2 * 0.32;
      const secondGlow = Math.max(0, 1 - secondDistance) ** 2 * 0.18;
      const paper = mix(PAPER, accent, firstGlow);
      const final = mix(paper, second, secondGlow);
      const offset = (y * WIDTH + x) * 3;
      raster.pixels[offset] = final[0];
      raster.pixels[offset + 1] = final[1];
      raster.pixels[offset + 2] = final[2];
    }
  }

  const random = randomGenerator(seed);
  for (let index = 0; index < 110; index += 1) {
    const x = 680 + random() * 500;
    const y = 20 + random() * 590;
    const size = 2 + Math.floor(random() * 6);
    const fill = index % 3 === 0 ? second : accent;
    if (index % 2 === 0) raster.circle(x, y, size, fill, 0.14);
    else raster.rect(x, y, size, size, fill, 0.12);
  }
}

function drawMotif(raster, motif, accent, second, seed) {
  const panel = mix(WHITE, accent, 0.06);
  switch (motif) {
    case "home": {
      const sizes = [[128, 150], [128, 190], [128, 230], [128, 165], [128, 205], [128, 245]];
      sizes.forEach(([width, height], index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        const x = 750 + column * 140;
        const y = 95 + row * 270 + (245 - height) / 2;
        drawOutlineCard(raster, x, y, width, height, 22, index % 2 ? second : accent, panel);
        raster.roundedRect(x + 22, y + 24, 42, 42, 12, index % 2 ? second : accent);
        raster.rect(x + 22, y + 84, 80, 8, NAVY, 0.62);
        raster.rect(x + 22, y + 104, 58, 6, MUTED, 0.45);
      });
      break;
    }
    case "portrait":
    case "id":
    case "resident": {
      const frameWidth = motif === "id" ? 238 : 224;
      const frameHeight = motif === "id" ? 318 : 288;
      drawOutlineCard(raster, 842, 108, frameWidth, frameHeight, 28, accent, panel);
      drawPerson(raster, 842 + frameWidth / 2, 156, 205, accent);
      raster.line(824, 476, 1104, 476, 4, second);
      raster.line(824, 460, 824, 491, 4, second);
      raster.line(1104, 460, 1104, 491, 4, second);
      drawText(raster, motif === "id" ? "3 X 4" : "413 X 531", 868, 506, 4, NAVY, 0.76);
      break;
    }
    case "banner": {
      drawOutlineCard(raster, 708, 170, 430, 242, 30, accent, panel);
      raster.circle(1048, 238, 40, second, 0.85);
      raster.triangle([720, 395], [865, 245], [974, 395], accent, 0.78);
      raster.triangle([850, 395], [1005, 220], [1125, 395], second, 0.62);
      raster.roundedRect(802, 263, 242, 72, 12, NAVY, 0.1);
      raster.line(802, 263, 1044, 263, 4, NAVY, 0.62);
      raster.line(1044, 263, 1044, 335, 4, NAVY, 0.62);
      raster.line(1044, 335, 802, 335, 4, NAVY, 0.62);
      raster.line(802, 335, 802, 263, 4, NAVY, 0.62);
      drawText(raster, "SAFE", 859, 286, 4, NAVY, 0.72);
      break;
    }
    case "favicon": {
      const icons = [[770, 188, 210], [955, 126, 148], [992, 337, 98]];
      icons.forEach(([x, y, size], index) => {
        raster.roundedRect(x + 10, y + 12, size, size, size * 0.24, NAVY, 0.12);
        raster.roundedRect(x, y, size, size, size * 0.24, index === 0 ? accent : second);
        raster.roundedRect(x + size * 0.24, y + size * 0.24, size * 0.52, size * 0.52, size * 0.15, NAVY);
        raster.circle(x + size * 0.42, y + size * 0.4, size * 0.09, WHITE);
        raster.rect(x + size * 0.24, y + size * 0.66, size * 0.52, size * 0.1, WHITE, 0.78);
        drawText(raster, index === 0 ? "ICO" : `${Math.round(size)}`, x + 8, y + size + 18, 3, NAVY, 0.72);
      });
      break;
    }
    case "privacy": {
      raster.circle(925, 303, 182, accent, 0.18);
      raster.roundedRect(776, 162, 298, 288, 28, WHITE, 0.94);
      for (let index = 0; index < 5; index += 1) {
        raster.circle(814, 218 + index * 42, 8, index < 3 ? second : accent);
        raster.rect(838, 212 + index * 42, 184 - index * 12, 12, NAVY, 0.23);
      }
      raster.triangle([978, 234], [1096, 276], [1056, 422], accent);
      raster.triangle([978, 234], [978, 405], [1056, 422], accent);
      raster.line(999, 332, 1023, 357, 12, WHITE);
      raster.line(1023, 357, 1067, 307, 12, WHITE);
      raster.line(760, 455, 1104, 154, 12, second, 0.84);
      break;
    }
    case "compressor": {
      drawOutlineCard(raster, 752, 128, 210, 310, 26, second, panel);
      drawOutlineCard(raster, 930, 200, 174, 238, 24, accent, panel);
      raster.rect(790, 190, 134, 14, NAVY, 0.18);
      raster.rect(790, 228, 98, 14, NAVY, 0.18);
      raster.rect(790, 266, 120, 14, NAVY, 0.18);
      raster.rect(966, 258, 100, 12, NAVY, 0.18);
      raster.rect(966, 291, 72, 12, NAVY, 0.18);
      drawArrow(raster, 890, 470, 1012, 470, NAVY);
      drawText(raster, "2.4 MB", 770, 486, 3, MUTED);
      drawText(raster, "500 KB", 984, 486, 3, NAVY);
      break;
    }
    case "resizer": {
      drawOutlineCard(raster, 792, 148, 278, 278, 30, accent, panel);
      raster.circle(1006, 216, 38, second, 0.82);
      raster.triangle([812, 407], [916, 285], [996, 407], accent, 0.7);
      raster.triangle([900, 407], [1025, 258], [1052, 407], second, 0.55);
      [[756, 112, 820, 112], [756, 112, 756, 176], [1106, 112, 1042, 112], [1106, 112, 1106, 176], [756, 462, 820, 462], [756, 462, 756, 398], [1106, 462, 1042, 462], [1106, 462, 1106, 398]].forEach(([x1, y1, x2, y2]) => raster.line(x1, y1, x2, y2, 7, NAVY));
      drawArrow(raster, 800, 506, 1064, 506, second);
      break;
    }
    case "converter": {
      const formats = [[742, 164, "JPG", accent], [900, 118, "PNG", second], [968, 328, "WEBP", mix(accent, second, 0.48)]];
      formats.forEach(([x, y, label, fill], index) => {
        drawOutlineCard(raster, x, y, 166, 206, 22, fill, panel);
        raster.rect(x + 26, y + 42, 114, 76, fill, 0.3);
        raster.circle(x + 55, y + 66, 13, fill);
        raster.triangle([x + 28, y + 116], [x + 78, y + 72], [x + 138, y + 116], fill, 0.84);
        drawText(raster, label, x + 33, y + 151, index === 2 ? 3 : 4, NAVY);
      });
      drawArrow(raster, 872, 384, 946, 384, NAVY);
      break;
    }
    case "social": {
      const formats = [[735, 214, 154, 154, "1:1"], [908, 178, 148, 185, "4:5"], [1064, 132, 100, 218, "9:16"]];
      formats.forEach(([x, y, width, height, label], index) => {
        const fill = index === 1 ? second : accent;
        drawOutlineCard(raster, x, y, width, height, 22, fill, panel);
        raster.circle(x + width * 0.68, y + height * 0.29, Math.min(width, height) * 0.11, fill);
        raster.triangle([x + 8, y + height - 8], [x + width * 0.52, y + height * 0.4], [x + width - 8, y + height - 8], fill, 0.7);
        drawText(raster, label, x + 16, y + height + 22, 3, NAVY);
      });
      raster.circle(812, 456, 56, WHITE, 0.9);
      raster.circle(812, 456, 49, accent, 0.25);
      drawPerson(raster, 812, 416, 76, accent);
      break;
    }
    case "profile": {
      raster.circle(936, 306, 220, NAVY, 0.1);
      raster.circle(926, 296, 220, WHITE);
      raster.circle(926, 296, 184, accent);
      raster.circle(926, 296, 144, panel);
      drawPerson(raster, 926, 194, 216, second);
      raster.circle(926, 296, 214, second, 0.08);
      raster.ring(926, 296, 218, 5, NAVY, 0.32);
      drawText(raster, "1080 X 1080", 838, 548, 3, NAVY, 0.72);
      break;
    }
    case "thumbnail": {
      drawOutlineCard(raster, 710, 154, 440, 248, 30, accent, NAVY);
      raster.circle(1037, 232, 54, second, 0.9);
      raster.triangle([1022, 202], [1022, 262], [1064, 232], WHITE);
      raster.rect(754, 236, 206, 24, WHITE, 0.92);
      raster.rect(754, 278, 158, 24, WHITE, 0.92);
      raster.roundedRect(746, 344, 152, 34, 17, accent);
      drawText(raster, "16:9", 786, 443, 5, NAVY);
      break;
    }
    case "four-cut": {
      raster.roundedRect(824, 74, 242, 484, 24, NAVY, 0.13);
      raster.roundedRect(810, 60, 242, 484, 24, WHITE);
      for (let index = 0; index < 4; index += 1) {
        const y = 82 + index * 104;
        raster.roundedRect(832, y, 198, 88, 12, index % 2 ? second : accent, 0.22);
        raster.circle(978, y + 28, 16, index % 2 ? second : accent);
        raster.triangle([836, y + 84], [908, y + 28], [1026, y + 84], index % 2 ? second : accent, 0.66);
      }
      drawText(raster, "PIXELFIT", 842, 505, 3, NAVY, 0.8);
      break;
    }
    case "film": {
      raster.roundedRect(716, 135, 440, 292, 26, NAVY);
      raster.roundedRect(750, 174, 372, 214, 18, mix(accent, second, 0.5));
      for (let index = 0; index < 9; index += 1) {
        raster.roundedRect(738 + index * 46, 146, 26, 14, 4, PAPER);
        raster.roundedRect(738 + index * 46, 402, 26, 14, 4, PAPER);
      }
      raster.circle(1048, 226, 42, second, 0.72);
      raster.triangle([752, 386], [876, 246], [990, 386], accent, 0.76);
      raster.triangle([900, 386], [1042, 210], [1120, 386], second, 0.58);
      const random = randomGenerator(seed ^ 0xa5a5a5a5);
      for (let index = 0; index < 210; index += 1) {
        raster.circle(752 + random() * 368, 176 + random() * 208, 1 + random() * 2, WHITE, 0.22);
      }
      drawText(raster, "SAMPLE", 870, 468, 4, accent);
      break;
    }
    default:
      throw new Error(`Unknown motif: ${motif}`);
  }
}

function renderCard(card) {
  const accent = color(card.accent);
  const second = color(card.second);
  const seed = hash(card.id);
  const raster = new Raster(WIDTH, HEIGHT);
  drawBackground(raster, accent, second, seed);

  raster.roundedRect(54, 42, 54, 54, 17, NAVY);
  raster.roundedRect(78, 66, 30, 30, 9, accent);
  raster.circle(72, 60, 7, second);
  drawText(raster, "PIXELFIT", 126, 52, 5, NAVY);
  drawText(raster, "LOCAL IMAGE TOOL", 128, 88, 2, MUTED);

  card.title.forEach((line, index) => {
    drawHangulText(raster, line, 332, 178 + index * 88 + 4, 548, 70, NAVY, 0.12);
    drawHangulText(raster, line, 328, 174 + index * 88, 548, 70, NAVY);
  });

  raster.roundedRect(58, 403, 282, 42, 21, accent, 0.2);
  raster.circle(83, 424, 7, accent);
  drawText(raster, "NO IMAGE UPLOAD", 101, 414, 3, NAVY, 0.82);
  drawText(raster, card.spec, 60, 493, 3, MUTED);
  drawText(raster, card.id === "home" ? "PIXELFIT IMAGE WORKBENCH" : card.id.replaceAll("-", " / "), 60, 556, 2, NAVY, 0.54);

  drawMotif(raster, card.motif, accent, second, seed);
  return encodePng(raster);
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng(raster) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(raster.width, 0);
  header.writeUInt32BE(raster.height, 4);
  header[8] = 8;
  header[9] = 2;
  const rowLength = raster.width * 3;
  const scanlines = Buffer.alloc((rowLength + 1) * raster.height);
  for (let y = 0; y < raster.height; y += 1) {
    const outputOffset = y * (rowLength + 1);
    scanlines[outputOffset] = 0;
    scanlines.set(raster.pixels.subarray(y * rowLength, (y + 1) * rowLength), outputOffset + 1);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND"),
  ]);
}

const projectRoot = process.cwd();
const toolDirectory = path.join(projectRoot, "public", "og", "tools");
const checkOnly = process.argv.includes("--check");
if (cards.length !== 15 || new Set(cards.map((card) => card.id)).size !== cards.length) {
  throw new Error(`OG 카드 목록이 중복됐거나 누락됐습니다. expected=15 actual=${cards.length}`);
}
if (!checkOnly) await mkdir(toolDirectory, { recursive: true });

const renderedCards = [];
for (const card of cards) {
  const outputPath = card.id === "home"
    ? path.join(projectRoot, "public", "og", "home.png")
    : path.join(toolDirectory, card.file ?? `${card.id}.png`);
  const rendered = renderCard(card);
  renderedCards.push({ card, outputPath, rendered });
  if (checkOnly) {
    let current;
    try {
      current = await readFile(outputPath);
    } catch {
      throw new Error(`OG 산출물이 없습니다: ${path.relative(projectRoot, outputPath)}`);
    }
    if (!current.equals(rendered)) {
      throw new Error(`OG 산출물이 현재 한국어 생성기와 다릅니다: ${path.relative(projectRoot, outputPath)}`);
    }
  } else {
    await writeFile(outputPath, rendered);
  }
}

const digest = createHash("sha256")
  .update(Buffer.concat(renderedCards.map(({ rendered }) => rendered)))
  .digest("hex")
  .slice(0, 16);
process.stdout.write(`[og] ${checkOnly ? "check" : "generate"} PASS — ${renderedCards.length} PNG, 1200x630, sha256:${digest}\n`);
