import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import path from "node:path";

const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, "public", "samples");
const checkOnly = process.argv.includes("--check");

const palette = {
  ink: "#14213d",
  muted: "#607085",
  paper: "#fbfaf7",
  white: "#ffffff",
  mint: "#36c99b",
  mintDark: "#16775f",
  coral: "#ff725e",
  blue: "#5597eb",
  yellow: "#f5c451",
  lavender: "#8873df",
  warm: "#d78a52",
};

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return crc >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function quantize(value, step) {
  return clampByte(Math.round(value / step) * step);
}

function deterministicNoise(x, y) {
  let value = Math.imul(x + 17, 374761393) ^ Math.imul(y + 29, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 0xffffffff;
}

const pixelGlyphs = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
};

function isPixelText(x, y, width, height) {
  const text = "PIXELFIT SAMPLE";
  const scale = Math.max(1, Math.round(width / 600));
  const startX = Math.round(width * 0.07);
  const startY = Math.round(height * 0.11);
  const localX = x - startX;
  const localY = y - startY;
  if (localX < 0 || localY < 0 || localY >= 7 * scale) return false;

  const characterIndex = Math.floor(localX / (6 * scale));
  if (characterIndex < 0 || characterIndex >= text.length) return false;
  const character = text[characterIndex];
  if (character === " ") return false;
  const glyph = pixelGlyphs[character];
  const glyphX = Math.floor((localX % (6 * scale)) / scale);
  const glyphY = Math.floor(localY / scale);
  return glyphX < 5 && glyph?.[glyphY]?.[glyphX] === "1";
}

function syntheticPixel(x, y, width, height, sample) {
  const nx = x / Math.max(1, width - 1);
  const ny = y / Math.max(1, height - 1);
  let red = 56 + nx * 138 + ny * 22;
  let green = 116 + nx * 64 + ny * 66;
  let blue = 182 - nx * 74 + ny * 26;

  const circleDistance = Math.hypot(nx - 0.78, ny - 0.24);
  if (circleDistance < 0.112) {
    red = 247;
    green = 196;
    blue = 81;
  }

  if (nx > 0.06 && nx < 0.36 && ny > 0.58 && ny < 0.87) {
    red = 42;
    green = 179;
    blue = 139;
  }
  if (nx > 0.39 && nx < 0.65 && ny > 0.58 && ny < 0.87) {
    red = 255;
    green = 114;
    blue = 94;
  }
  if (nx > 0.68 && nx < 0.94 && ny > 0.58 && ny < 0.87) {
    red = 85;
    green = 151;
    blue = 235;
  }

  const diagonal = Math.abs(ny - (0.48 + nx * 0.2));
  if (diagonal < 0.0045) {
    red = 250;
    green = 248;
    blue = 226;
  }

  if (isPixelText(x, y, width, height)) {
    red = 20;
    green = 33;
    blue = 61;
  }

  const gridSpacing = Math.max(18, Math.round(width / 52));
  if ((x % gridSpacing) < 1 || (y % gridSpacing) < 1) {
    red *= 0.78;
    green *= 0.82;
    blue *= 0.88;
  }

  const noiseBlock = sample.noiseBlock ?? 1;
  const noiseX = Math.floor(x / noiseBlock) * noiseBlock;
  const noiseY = Math.floor(y / noiseBlock) * noiseBlock;
  const noise = (deterministicNoise(noiseX, noiseY) - 0.5) * 18;
  return [
    quantize(red + noise, sample.quantization),
    quantize(green + noise, sample.quantization),
    quantize(blue + noise, sample.quantization),
  ];
}

function createSyntheticPng(sample) {
  const stride = sample.width * 3;
  const filtered = Buffer.alloc((stride + 1) * sample.height);
  for (let y = 0; y < sample.height; y += 1) {
    const rowOffset = y * (stride + 1);
    filtered[rowOffset] = 1;
    let previous = [0, 0, 0];
    for (let x = 0; x < sample.width; x += 1) {
      const pixel = syntheticPixel(x, y, sample.width, sample.height, sample);
      const pixelOffset = rowOffset + 1 + x * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        filtered[pixelOffset + channel] = (pixel[channel] - previous[channel] + 256) & 0xff;
      }
      previous = pixel;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(sample.width, 0);
  header.writeUInt32BE(sample.height, 4);
  header[8] = 8;
  header[9] = 2;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("tEXt", Buffer.from("Comment\0PixelFit self-produced synthetic compression sample", "utf8")),
    pngChunk("IDAT", deflateSync(filtered, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function svgDocument({ width, height, title, description, body }) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc" data-pixelfit-sample="true">`,
    `<title id="title">${escapeXml(title)}</title>`,
    `<desc id="desc">${escapeXml(description)}</desc>`,
    `<rect width="${width}" height="${height}" rx="${Math.round(Math.min(width, height) * 0.035)}" fill="${palette.paper}"/>`,
    body,
    "</svg>",
    "",
  ].join("\n");
}

function label(text, x, y, options = {}) {
  const {
    size = 36,
    weight = 800,
    fill = palette.ink,
    anchor = "start",
    opacity = 1,
    family = "Pretendard,Apple SD Gothic Neo,sans-serif",
  } = options;
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" opacity="${opacity}">${escapeXml(text)}</text>`;
}

function abstractScene({ width, height, id, filter = "none" }) {
  const prefix = `scene-${id}`;
  const grain = Array.from({ length: 26 }, (_, index) => {
    const x = 35 + ((index * 83 + id.length * 19) % Math.max(1, width - 70));
    const y = 30 + ((index * 47 + id.length * 31) % Math.max(1, height - 60));
    const radius = 1 + (index % 3);
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${index % 2 ? palette.white : palette.ink}" opacity=".16"/>`;
  }).join("");
  const filters = {
    none: "",
    warm: `<rect width="${width}" height="${height}" fill="#bd6f3f" opacity=".2"/>`,
    mono: `<rect width="${width}" height="${height}" fill="#344152" opacity=".45"/><rect width="${width}" height="${height}" fill="#ffffff" opacity=".16"/>`,
    muted: `<rect width="${width}" height="${height}" fill="#8aa096" opacity=".35"/>`,
    flash: `<ellipse cx="${width * 0.28}" cy="${height * 0.2}" rx="${width * 0.42}" ry="${height * 0.48}" fill="#fff7dc" opacity=".46"/>`,
  };
  return [
    `<defs><linearGradient id="${prefix}-sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#709fce"/><stop offset="1" stop-color="#b7d6d0"/></linearGradient><linearGradient id="${prefix}-ground" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#d98962"/><stop offset="1" stop-color="#efc267"/></linearGradient></defs>`,
    `<rect width="${width}" height="${height}" fill="url(#${prefix}-sky)"/>`,
    `<circle cx="${width * 0.78}" cy="${height * 0.22}" r="${Math.min(width, height) * 0.1}" fill="#ffe79b"/>`,
    `<path d="M0 ${height * 0.7} L${width * 0.2} ${height * 0.43} L${width * 0.36} ${height * 0.65} L${width * 0.56} ${height * 0.36} L${width * 0.78} ${height * 0.68} L${width} ${height * 0.48} V${height} H0Z" fill="#356a66" opacity=".82"/>`,
    `<path d="M0 ${height * 0.75} Q${width * 0.28} ${height * 0.57} ${width * 0.52} ${height * 0.78} T${width} ${height * 0.67} V${height} H0Z" fill="url(#${prefix}-ground)"/>`,
    `<path d="M${width * 0.18} ${height * 0.66} C${width * 0.31} ${height * 0.54},${width * 0.48} ${height * 0.52},${width * 0.69} ${height * 0.7}" fill="none" stroke="#fff8dc" stroke-width="${Math.max(8, width * 0.016)}" stroke-linecap="round" opacity=".72"/>`,
    filters[filter] ?? "",
    grain,
  ].join("");
}

function portraitSilhouette({ cx, cy, scale = 1, fill = palette.ink }) {
  return [
    `<g transform="translate(${cx} ${cy}) scale(${scale})">`,
    `<circle cx="0" cy="-112" r="82" fill="#efbc95"/>`,
    `<path d="M-83 -112 C-76 -232 78 -230 84 -108 C48 -144 25 -158 0 -158 C-29 -158 -54 -142 -83 -112Z" fill="${fill}"/>`,
    `<path d="M-142 158 C-136 4 -74 -38 0 -38 C74 -38 136 4 142 158Z" fill="${fill}"/>`,
    `<path d="M-55 -84 Q0 -42 55 -84" fill="none" stroke="#ffffff" stroke-width="5" opacity=".56"/>`,
    "</g>",
  ].join("");
}

function youtubeSample(template) {
  const width = 1280;
  const height = 720;
  const scene = abstractScene({ width, height, id: template.id });
  const common = [
    scene,
    `<rect x="32" y="30" width="172" height="48" rx="24" fill="${palette.coral}"/>`,
    label("자체 제작 샘플", 118, 63, { size: 20, anchor: "middle", fill: palette.white }),
  ];

  if (template.id === "editorial-left") {
    common.push(
      `<linearGradient id="youtube-right-title-shade" x1="1" y1="0" x2="0" y2="0"><stop stop-color="#08101f" stop-opacity=".94"/><stop offset=".78" stop-color="#08101f" stop-opacity="0"/></linearGradient>`,
      `<rect x="410" width="870" height="${height}" fill="url(#youtube-right-title-shade)"/>`,
      portraitSilhouette({ cx: 250, cy: 458, scale: 1.35 }),
      label("오늘의 색을", 1190, 320, { size: 78, fill: palette.white, anchor: "end" }),
      label("기록하는 법", 1190, 408, { size: 78, fill: palette.white, anchor: "end" }),
      label("인물 왼쪽 · 제목 오른쪽", 1188, 480, { size: 27, fill: "#dce7e6", anchor: "end" }),
    );
  } else if (template.id === "editorial-right") {
    common.push(
      `<linearGradient id="youtube-left-title-shade" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#08101f" stop-opacity=".94"/><stop offset=".78" stop-color="#08101f" stop-opacity="0"/></linearGradient>`,
      `<rect width="870" height="${height}" fill="url(#youtube-left-title-shade)"/>`,
      portraitSilhouette({ cx: 1030, cy: 458, scale: 1.35 }),
      label("한 장으로", 82, 320, { size: 78, fill: palette.white }),
      label("완성하는 썸네일", 82, 408, { size: 78, fill: palette.white }),
      label("제목 왼쪽 · 인물 오른쪽", 84, 480, { size: 27, fill: "#dce7e6" }),
    );
  } else if (template.id === "center-impact") {
    common.push(
      `<linearGradient id="youtube-bottom-shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".1" stop-color="#08101f" stop-opacity=".12"/><stop offset="1" stop-color="#08101f" stop-opacity=".92"/></linearGradient>`,
      `<rect width="${width}" height="${height}" fill="url(#youtube-bottom-shade)"/>`,
      portraitSilhouette({ cx: 1050, cy: 450, scale: 1.08, fill: "#22304d" }),
      label("사진 한 장의 힘", width / 2, 418, { size: 92, fill: palette.white, anchor: "middle" }),
      label("중앙 임팩트", width / 2, 494, { size: 30, fill: "#f4e8c0", anchor: "middle" }),
    );
  } else {
    common.push(
      `<linearGradient id="youtube-lower-shade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#08101f" stop-opacity="0"/><stop offset="1" stop-color="#08101f" stop-opacity=".96"/></linearGradient>`,
      `<rect y="330" width="${width}" height="390" fill="url(#youtube-lower-shade)"/>`,
      portraitSilhouette({ cx: 1030, cy: 362, scale: 1.05, fill: "#22304d" }),
      `<rect x="72" y="508" width="18" height="118" rx="9" fill="${palette.mint}"/>`,
      label("사진을 넓게 보여주는", 116, 557, { size: 58, fill: palette.white }),
      label("로어 서드", 116, 619, { size: 58, fill: palette.white }),
    );
  }

  return svgDocument({
    width,
    height,
    title: `유튜브 썸네일 ${template.label} 예시`,
    description: `외부 사진 없이 직접 만든 추상 풍경으로 ${template.label} 템플릿 배치를 보여주는 예시입니다.`,
    body: common.join("\n"),
  });
}

function fourCutFrame({ x, y, width, height, id, tone }) {
  return [
    `<g transform="translate(${x} ${y})">`,
    abstractScene({ width, height, id, filter: tone }),
    `<rect width="${width}" height="${height}" fill="none" stroke="${palette.white}" stroke-width="8"/>`,
    "</g>",
  ].join("");
}

function fourCutSample(sample) {
  const vertical = sample.orientation === "vertical";
  const width = vertical ? 800 : 1200;
  const height = vertical ? 1200 : 800;
  const frameColor = sample.frameColor;
  const body = [`<rect x="32" y="32" width="${width - 64}" height="${height - 64}" rx="30" fill="${frameColor}"/>`];

  if (vertical) {
    for (let index = 0; index < 4; index += 1) {
      body.push(fourCutFrame({
        x: 70,
        y: 70 + index * 246,
        width: width - 140,
        height: 220,
        id: `${sample.id}-${index}`,
        tone: sample.tone,
      }));
    }
    body.push(label(sample.caption, width / 2, 1124, { size: 32, anchor: "middle", fill: sample.textColor }));
  } else {
    const cellWidth = 506;
    const cellHeight = 302;
    for (let index = 0; index < 4; index += 1) {
      body.push(fourCutFrame({
        x: 70 + (index % 2) * 530,
        y: 70 + Math.floor(index / 2) * 326,
        width: cellWidth,
        height: cellHeight,
        id: `${sample.id}-${index}`,
        tone: sample.tone,
      }));
    }
    body.push(label(sample.caption, width / 2, 750, { size: 30, anchor: "middle", fill: sample.textColor }));
  }

  return svgDocument({
    width,
    height,
    title: `네컷사진 ${sample.label} 예시`,
    description: `직접 만든 추상 풍경 네 장을 ${sample.label} 레이아웃으로 배치한 결과 예시입니다.`,
    body: body.join("\n"),
  });
}

function filmSample(sample) {
  const width = 1200;
  const height = 800;
  const scene = abstractScene({ width, height, id: `film-${sample.id}`, filter: "none" });
  const renderedScene = sample.id === "mono"
    ? `<defs><filter id="film-mono-grayscale"><feColorMatrix type="saturate" values="0"/></filter></defs><g filter="url(#film-mono-grayscale)">${scene}</g>`
    : scene;
  const body = [
    renderedScene,
    `<rect x="26" y="26" width="${width - 52}" height="${height - 52}" rx="28" fill="none" stroke="${palette.paper}" stroke-width="12" opacity=".82"/>`,
    `<rect x="54" y="590" width="520" height="126" rx="24" fill="${palette.ink}" opacity=".76"/>`,
    label(sample.label, 88, 650, { size: 40, fill: palette.white }),
    label(sample.settings, 90, 692, { size: 22, fill: "#dfe9e8", weight: 650 }),
  ];
  if (sample.id !== "original") {
    body.push(
      `<defs><clipPath id="film-${sample.id}-weak"><rect width="600" height="800"/></clipPath><clipPath id="film-${sample.id}-strong"><rect x="600" width="600" height="800"/></clipPath></defs>`,
    );
    if (sample.id === "mono") {
      body.push(
        `<g clip-path="url(#film-${sample.id}-weak)"><rect width="1200" height="800" fill="#344152" opacity=".34"/><rect width="1200" height="800" fill="#ffffff" opacity=".12"/></g>`,
        `<g clip-path="url(#film-${sample.id}-strong)"><rect width="1200" height="800" fill="#1f2937" opacity=".68"/><rect width="1200" height="800" fill="#ffffff" opacity=".2"/></g>`,
      );
    } else if (sample.id === "low-saturation") {
      body.push(
        `<rect width="600" height="800" fill="#8aa096" opacity=".2"/>`,
        `<rect x="600" width="600" height="800" fill="#71857e" opacity=".52"/>`,
      );
    } else if (sample.id === "flash") {
      body.push(
        `<g clip-path="url(#film-${sample.id}-weak)"><ellipse cx="310" cy="170" rx="360" ry="410" fill="#fff7dc" opacity=".28"/></g>`,
        `<g clip-path="url(#film-${sample.id}-strong)"><ellipse cx="880" cy="165" rx="430" ry="500" fill="#fff7dc" opacity=".62"/></g>`,
      );
    } else if (sample.id === "light-leak") {
      body.push(
        `<g clip-path="url(#film-${sample.id}-weak)"><ellipse cx="570" cy="210" rx="190" ry="430" fill="#ff8c5e" opacity=".2"/><ellipse cx="600" cy="178" rx="90" ry="320" fill="#ffe177" opacity=".16"/></g>`,
        `<g clip-path="url(#film-${sample.id}-strong)"><ellipse cx="1120" cy="210" rx="300" ry="500" fill="#ff765e" opacity=".48"/><ellipse cx="1160" cy="178" rx="140" ry="370" fill="#ffe177" opacity=".34"/></g>`,
      );
    }
    const speckles = Array.from({ length: 64 }, (_, index) => {
      const x = 22 + ((index * 157 + sample.id.length * 31) % 1150);
      const y = 18 + ((index * 97 + sample.id.length * 43) % 750);
      return `<circle cx="${x}" cy="${y}" r="${index % 4 === 0 ? 2.4 : 1.2}" fill="#fff" opacity="${index % 3 === 0 ? .28 : .16}"/>`;
    }).join("");
    body.push(
      speckles,
      `<line x1="600" y1="42" x2="600" y2="758" stroke="${palette.paper}" stroke-width="5" opacity=".86"/>`,
      `<rect x="72" y="68" width="150" height="54" rx="27" fill="${palette.ink}" opacity=".72"/>`,
      `<rect x="978" y="68" width="150" height="54" rx="27" fill="${palette.ink}" opacity=".72"/>`,
      label("약하게", 147, 105, { size: 24, anchor: "middle", fill: palette.white }),
      label("강하게", 1053, 105, { size: 24, anchor: "middle", fill: palette.white }),
    );
  }

  return svgDocument({
    width,
    height,
    title: `필름사진 ${sample.label} 결과 예시`,
    description: `동일한 직접 제작 추상 풍경에 ${sample.label} 설정을 표현한 비교 결과입니다.`,
    body: body.join("\n"),
  });
}

function passportCard(sample) {
  const width = 826;
  const height = 1062;
  const cardX = 104;
  const cardY = 76;
  const cardWidth = 618;
  const cardHeight = 814;
  const subjectTransform = [
    `translate(${sample.offsetX} ${sample.offsetY})`,
    "translate(413 455)",
    `scale(${sample.scale})`,
    "translate(-413 -455)",
  ].join(" ");
  const body = [
    label("규격 확인 예시", 413, 50, { size: 26, anchor: "middle", fill: palette.mintDark }),
    `<rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="28" fill="${palette.white}" stroke="#cbd6d8" stroke-width="6"/>`,
    `<rect x="${cardX + 34}" y="${cardY + 34}" width="${cardWidth - 68}" height="${cardHeight - 68}" rx="18" fill="#e8f0ed"/>`,
    `<line x1="413" y1="112" x2="413" y2="852" stroke="${palette.coral}" stroke-width="3" stroke-dasharray="12 12" opacity=".72"/>`,
    `<line x1="164" y1="206" x2="662" y2="206" stroke="${palette.yellow}" stroke-width="5" stroke-dasharray="14 10" opacity=".82"/>`,
    `<ellipse cx="413" cy="408" rx="176" ry="265" fill="none" stroke="${palette.yellow}" stroke-width="6" opacity=".82"/>`,
  ];

  if (sample.shadow) {
    body.push(
      `<ellipse cx="482" cy="483" rx="174" ry="286" fill="#596b73" opacity=".28"/>`,
      `<path d="M374 226 C526 256 573 396 559 642" fill="none" stroke="#4b5b62" stroke-width="32" opacity=".2"/>`,
    );
  }

  body.push(
    `<g transform="${subjectTransform}">`,
    `<circle cx="413" cy="348" r="118" fill="#e7b38e"/>`,
    `<path d="M284 351 C295 185 530 176 544 351 C502 304 470 278 414 278 C356 278 324 304 284 351Z" fill="${palette.ink}"/>`,
    `<path d="M247 784 C253 592 332 522 413 522 C494 522 573 592 579 784Z" fill="${palette.blue}"/>`,
    `<path d="M316 319 Q413 235 510 319" fill="none" stroke="#ffffff" stroke-width="4" opacity=".72"/>`,
    "</g>",
    `<rect x="134" y="914" width="558" height="78" rx="24" fill="${sample.nearRecommended ? "#e5f7f0" : "#fff0ed"}" stroke="${sample.nearRecommended ? palette.mintDark : palette.coral}" stroke-width="3"/>`,
    label(sample.outcome, 413, 964, {
      size: 28,
      anchor: "middle",
      fill: sample.nearRecommended ? palette.mintDark : "#9b3527",
    }),
    label("자동 검사는 참고용 · 실제 심사 결과와 다를 수 있음", 413, 1030, { size: 22, anchor: "middle", fill: palette.muted, weight: 650 }),
  );

  return svgDocument({
    width,
    height,
    title: `여권사진 규격 확인 도식 — ${sample.label}`,
    description: `실제 얼굴 사진이 아닌 추상 인물 도형으로 ${sample.description}을 설명하는 참고 도식입니다.`,
    body: body.join("\n"),
  });
}

const youtubeTemplates = [
  { id: "editorial-left", label: "왼쪽 에디토리얼" },
  { id: "editorial-right", label: "오른쪽 에디토리얼" },
  { id: "center-impact", label: "중앙 임팩트" },
  { id: "lower-third", label: "로어 서드" },
];

const fourCutExamples = [
  { id: "vertical-mint", label: "세로 민트 프레임", orientation: "vertical", tone: "none", frameColor: "#d9f2e8", textColor: palette.ink, caption: "오늘의 네 장" },
  { id: "vertical-mono", label: "세로 흑백 프레임", orientation: "vertical", tone: "mono", frameColor: "#151b25", textColor: palette.white, caption: "MONO STRIP" },
  { id: "horizontal-coral", label: "가로 코랄 프레임", orientation: "horizontal", tone: "none", frameColor: "#ffd5ce", textColor: palette.ink, caption: "가로 네컷 · 2×2" },
  { id: "horizontal-vintage", label: "가로 빈티지 프레임", orientation: "horizontal", tone: "warm", frameColor: "#efe1c8", textColor: "#5e3f2d", caption: "VINTAGE DAY" },
];

const filmExamples = [
  { id: "original", label: "원본", filter: "none", settings: "강도 0 · 그레인 0 · 비네팅 0" },
  { id: "light-leak", label: "빛샘 효과", filter: "warm", settings: "따뜻한 빛샘 · 같은 설정의 그레인 · 비네팅" },
  { id: "mono", label: "흑백 필름", filter: "mono", settings: "흑백 변환 · 같은 설정의 그레인 · 비네팅" },
  { id: "low-saturation", label: "저채도 필름", filter: "muted", settings: "차분한 채도 · 같은 설정의 그레인 · 약/강 비교" },
  { id: "flash", label: "플래시 카메라", filter: "flash", settings: "밝은 중심부 · 같은 설정의 그레인 · 약/강 비교" },
];

const passportExamples = [
  { id: "top-margin-tight", label: "머리 위 여백이 부족한 예", description: "머리 위 여백을 다시 봐야 하는 배치", offsetX: 0, offsetY: -132, scale: 1.04, shadow: false, nearRecommended: false, outcome: "확인이 필요한 배치 · 위 여백" },
  { id: "face-too-small", label: "얼굴이 너무 작은 예", description: "얼굴 크기와 상하 여백을 다시 봐야 하는 배치", offsetX: 0, offsetY: 92, scale: 0.64, shadow: false, nearRecommended: false, outcome: "확인이 필요한 배치 · 얼굴 크기" },
  { id: "off-center", label: "좌우로 치우친 예", description: "얼굴 중심을 다시 봐야 하는 배치", offsetX: 132, offsetY: 0, scale: 0.94, shadow: false, nearRecommended: false, outcome: "확인이 필요한 배치 · 좌우 중심" },
  { id: "background-shadow", label: "배경 그림자가 의심되는 예", description: "배경 그림자를 직접 확인해야 하는 배치", offsetX: 0, offsetY: 0, scale: 0.94, shadow: true, nearRecommended: false, outcome: "확인이 필요한 배치 · 배경 그림자" },
  { id: "near-recommended", label: "권장 범위에 가까운 배치 예", description: "참고 안내선에 가깝지만 실제 심사 결과와 다를 수 있는 배치", offsetX: 0, offsetY: 0, scale: 0.94, shadow: false, nearRecommended: true, outcome: "권장 범위에 가까운 배치" },
];

const compressorExamples = [
  { id: "original", width: 1200, height: 800, targetBytes: null, quantization: 3, noiseBlock: 1, downscaled: false },
  { id: "target-500kb", width: 1200, height: 800, targetBytes: 500 * 1024, quantization: 10, noiseBlock: 2, downscaled: false },
  { id: "target-200kb", width: 1200, height: 800, targetBytes: 200 * 1024, quantization: 18, noiseBlock: 4, downscaled: false },
  { id: "target-100kb-downscaled", width: 900, height: 600, targetBytes: 100 * 1024, quantization: 30, noiseBlock: 8, downscaled: true },
];

const sampleAssets = [
  ...compressorExamples.map((sample) => ({
    file: `image-compressor/${sample.id}.png`,
    width: sample.width,
    height: sample.height,
    content: createSyntheticPng(sample),
    targetBytes: sample.targetBytes,
  })),
  ...youtubeTemplates.map((template) => ({
    file: `youtube-thumbnail/${template.id}.svg`,
    width: 1280,
    height: 720,
    content: youtubeSample(template),
  })),
  ...fourCutExamples.map((sample) => ({
    file: `four-cut-photo/${sample.id}.svg`,
    width: sample.orientation === "vertical" ? 800 : 1200,
    height: sample.orientation === "vertical" ? 1200 : 800,
    content: fourCutSample(sample),
  })),
  ...filmExamples.map((sample) => ({
    file: `film-photo/${sample.id}.svg`,
    width: 1200,
    height: 800,
    content: filmSample(sample),
  })),
  ...passportExamples.map((sample) => ({
    file: `passport-photo/${sample.id}.svg`,
    width: 826,
    height: 1062,
    content: passportCard(sample),
  })),
];

const thumbnailAssets = compressorExamples.map((sample) => ({
  file: `image-compressor/thumbnails/${sample.id}.png`,
  width: 480,
  height: 320,
  content: createSyntheticPng({
    ...sample,
    width: 480,
    height: 320,
    targetBytes: null,
  }),
  targetBytes: null,
}));

const assets = [...sampleAssets, ...thumbnailAssets];

function validateAsset(asset) {
  const buffer = Buffer.isBuffer(asset.content) ? asset.content : Buffer.from(asset.content, "utf8");
  if (!/\.(?:png|svg)$/u.test(asset.file) || asset.file.startsWith("/") || asset.file.includes("..")) {
    throw new Error(`안전하지 않은 샘플 경로입니다: ${asset.file}`);
  }
  if (asset.file.endsWith(".svg")) {
    if (typeof asset.content !== "string" || !asset.content.startsWith("<svg ") || !asset.content.endsWith("</svg>\n")) {
      throw new Error(`완전한 SVG가 아닙니다: ${asset.file}`);
    }
    if (/(?:href|src)\s*=\s*["'](?:https?:|\/\/|data:)/iu.test(asset.content)) {
      throw new Error(`외부 또는 인라인 리소스 URL이 포함됐습니다: ${asset.file}`);
    }
    const dimensions = `<svg xmlns="http://www.w3.org/2000/svg" width="${asset.width}" height="${asset.height}"`;
    if (!asset.content.startsWith(dimensions)) {
      throw new Error(`SVG 치수가 선언과 다릅니다: ${asset.file}`);
    }
  } else {
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (!buffer.subarray(0, 8).equals(pngSignature)) {
      throw new Error(`PNG signature가 올바르지 않습니다: ${asset.file}`);
    }
    if (buffer.readUInt32BE(16) !== asset.width || buffer.readUInt32BE(20) !== asset.height) {
      throw new Error(`PNG 치수가 선언과 다릅니다: ${asset.file}`);
    }
    if (!buffer.includes(Buffer.from("PixelFit self-produced synthetic compression sample", "utf8"))) {
      throw new Error(`자체 제작 marker가 없습니다: ${asset.file}`);
    }
  }
  if (asset.targetBytes !== null && asset.targetBytes !== undefined && buffer.byteLength > asset.targetBytes) {
    throw new Error(`목표 바이트를 초과했습니다: ${asset.file} (${buffer.byteLength} > ${asset.targetBytes})`);
  }
  return buffer;
}

const uniqueFiles = new Set(assets.map((asset) => asset.file));
if (uniqueFiles.size !== assets.length || sampleAssets.length !== 22 || thumbnailAssets.length !== 4) {
  throw new Error(`샘플 목록이 중복됐거나 누락됐습니다. samples=${sampleAssets.length} thumbnails=${thumbnailAssets.length} files=${uniqueFiles.size}`);
}

const compressorManifest = Object.fromEntries(compressorExamples.map((sample) => {
  const asset = assets.find((candidate) => candidate.file === `image-compressor/${sample.id}.png`);
  if (!asset) throw new Error(`압축 샘플이 없습니다: ${sample.id}`);
  const buffer = validateAsset(asset);
  return [sample.id, {
    width: sample.width,
    height: sample.height,
    actualBytes: buffer.byteLength,
    format: "PNG",
    targetBytes: sample.targetBytes,
    downscaled: sample.downscaled,
  }];
}));
const manifestPath = path.join(outputRoot, "image-compressor", "manifest.json");
const manifestBuffer = Buffer.from(`${JSON.stringify(compressorManifest, null, 2)}\n`, "utf8");

async function listGeneratedImages(directory, relativeDirectory = "") {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listGeneratedImages(path.join(directory, entry.name), relativePath));
    } else if (entry.isFile() && /\.(?:png|svg)$/u.test(entry.name)) {
      files.push(relativePath);
    }
  }
  return files.sort();
}

for (const asset of assets) {
  const expected = validateAsset(asset);
  const outputPath = path.join(outputRoot, asset.file);
  if (checkOnly) {
    let actual;
    try {
      actual = await readFile(outputPath);
    } catch {
      throw new Error(`샘플 산출물이 없습니다: ${path.relative(projectRoot, outputPath)}`);
    }
    if (!actual.equals(expected)) {
      throw new Error(`샘플 산출물이 생성기와 다릅니다: ${path.relative(projectRoot, outputPath)}`);
    }
  } else {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, expected);
  }
}

if (checkOnly) {
  let actualManifest;
  try {
    actualManifest = await readFile(manifestPath);
  } catch {
    throw new Error(`압축 샘플 manifest가 없습니다: ${path.relative(projectRoot, manifestPath)}`);
  }
  if (!actualManifest.equals(manifestBuffer)) {
    throw new Error(`압축 샘플 manifest가 생성 결과와 다릅니다: ${path.relative(projectRoot, manifestPath)}`);
  }
} else {
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, manifestBuffer);
}

const expectedFiles = assets.map((asset) => asset.file).sort();
const actualFiles = await listGeneratedImages(outputRoot);
if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
  const missing = expectedFiles.filter((file) => !actualFiles.includes(file));
  const orphaned = actualFiles.filter((file) => !expectedFiles.includes(file));
  throw new Error(`샘플 물리 파일 구성이 선언과 다릅니다. missing=${missing.join(",") || "-"} orphaned=${orphaned.join(",") || "-"}`);
}

const digestHash = createHash("sha256");
for (const asset of assets) {
  digestHash.update(asset.file);
  digestHash.update("\0");
  digestHash.update(validateAsset(asset));
  digestHash.update("\0");
}
digestHash.update(manifestBuffer);
const digest = digestHash.digest("hex").slice(0, 16);
const pngCount = sampleAssets.filter((asset) => asset.file.endsWith(".png")).length;
const svgCount = sampleAssets.length - pngCount;
process.stdout.write(`[samples] ${checkOnly ? "check" : "generate"} PASS — ${sampleAssets.length} samples (${pngCount} PNG, ${svgCount} SVG) + ${thumbnailAssets.length} PNG thumbnails, sha256:${digest}\n`);
