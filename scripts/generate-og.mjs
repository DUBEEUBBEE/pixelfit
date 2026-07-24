import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { deflateSync } from "node:zlib";

const WIDTH = 1200;
const HEIGHT = 630;
const NAVY = color("#14213d");
const PAPER = color("#fbfaf7");
const WHITE = color("#ffffff");
const MUTED = color("#627086");

const cards = [
  { id: "home", file: "home.png", title: ["IMAGE TOOLS", "MADE TO FIT"], spec: "13 TOOLS / BROWSER ONLY", motif: "home", accent: "#36c99b", second: "#ff725e" },
  { id: "passport-photo", title: ["PASSPORT", "PHOTO"], spec: "413 X 531 PX / JPG", motif: "portrait", accent: "#30c594", second: "#69a8ff" },
  { id: "id-photo", title: ["ID PHOTO", "3 X 4"], spec: "354 X 472 PX", motif: "id", accent: "#6faaf8", second: "#ff8a72" },
  { id: "resident-id-photo", title: ["RESIDENT ID", "PHOTO"], spec: "413 X 531 PX", motif: "resident", accent: "#ff806a", second: "#53caa6" },
  { id: "youtube-banner", title: ["YOUTUBE", "BANNER"], spec: "2560 X 1440 / SAFE AREA", motif: "banner", accent: "#ff665a", second: "#ffd15c" },
  { id: "favicon-maker", title: ["FAVICON", "MAKER"], spec: "ICO / PNG / MANIFEST", motif: "favicon", accent: "#7a82ff", second: "#43d3ae" },
  { id: "photo-privacy-cleaner", title: ["PHOTO", "PRIVACY"], spec: "EXIF / GPS / DEVICE DATA", motif: "privacy", accent: "#24b993", second: "#7aa8ff" },
  { id: "image-compressor", title: ["IMAGE", "COMPRESSOR"], spec: "TARGET KB / MB", motif: "compressor", accent: "#ff9867", second: "#4bbf9d" },
  { id: "image-resizer", title: ["IMAGE", "RESIZER"], spec: "PIXELS / LONG EDGE / PERCENT", motif: "resizer", accent: "#5b9df4", second: "#ffc861" },
  { id: "image-converter", title: ["IMAGE", "CONVERTER"], spec: "JPEG / PNG / WEBP", motif: "converter", accent: "#8f78f4", second: "#54c9a7" },
  { id: "social-image-pack", title: ["SOCIAL", "IMAGE PACK"], spec: "1:1 / 4:5 / 9:16", motif: "social", accent: "#ee6f91", second: "#6d99f7" },
  { id: "youtube-thumbnail", title: ["YOUTUBE", "THUMBNAIL"], spec: "3840 X 2160 / 16:9", motif: "thumbnail", accent: "#ff6259", second: "#4f92ef" },
  { id: "four-cut-photo", title: ["FOUR CUT", "PHOTO"], spec: "4 FRAMES / JPG / PNG", motif: "four-cut", accent: "#f08aa5", second: "#43c9a8" },
  { id: "film-photo", title: ["FILM PHOTO", "EFFECT"], spec: "GRAIN / VIGNETTE / LIGHT", motif: "film", accent: "#d98c53", second: "#6ca59a" },
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
      drawText(raster, "24 07 23", 838, 468, 4, accent);
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
    drawText(raster, line, 61, 190 + index * 78 + 4, 8, NAVY, 0.12);
    drawText(raster, line, 57, 186 + index * 78, 8, NAVY);
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
await mkdir(toolDirectory, { recursive: true });

for (const card of cards) {
  const outputPath = card.id === "home"
    ? path.join(projectRoot, "public", "og", "home.png")
    : path.join(toolDirectory, card.file ?? `${card.id}.png`);
  await writeFile(outputPath, renderCard(card));
  process.stdout.write(`${path.relative(projectRoot, outputPath)}\n`);
}
