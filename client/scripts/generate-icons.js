import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createPNG(width, height, drawFn) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // PNG IDAT format: for each scanline, 1 filter byte (0) + width*4 RGBA bytes
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[offset++] = 0; // Filter None
    buffer.copy(scanlines, offset, y * width * 4, (y + 1) * width * 4);
    offset += width * 4;
  }

  const compressed = zlib.deflateSync(scanlines);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // CRC32 table
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const chunk = Buffer.alloc(8 + len + 4);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);
    const typeAndData = chunk.subarray(4, 8 + len);
    chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
    return chunk;
  }

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // Bit depth: 8
  ihdrData.writeUInt8(6, 9); // ColorType: 6 (RGBA)
  ihdrData.writeUInt8(0, 10); // Compression: 0
  ihdrData.writeUInt8(0, 11); // Filter: 0
  ihdrData.writeUInt8(0, 12); // Interlace: 0
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idat = makeChunk('IDAT', compressed);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Drawing icon with cyberpunk arcade soundwave design
function drawArcadeIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radius = w * 0.46;

  // Background circle
  if (dist > radius) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  // Border ring (Neon Cyan)
  if (dist >= radius - (w * 0.08)) {
    return [0, 229, 255, 255]; // Neon Cyan
  }

  // Inner Dark Background with slight gradient
  const bgNorm = y / h;
  const bgR = Math.round(18 + bgNorm * 10);
  const bgG = Math.round(24 + bgNorm * 15);
  const bgB = Math.round(38 + bgNorm * 20);

  // Play Button Triangle centered: vertices at (~0.40w, 0.30h), (~0.72w, 0.50h), (~0.40w, 0.70h)
  const px1 = w * 0.38, py1 = h * 0.28;
  const px2 = w * 0.72, py2 = h * 0.50;
  const px3 = w * 0.38, py3 = h * 0.72;

  // Point in triangle test
  const area = 0.5 * (-py2 * px3 + py1 * (-px2 + px3) + px1 * (py2 - py3) + px2 * py3);
  const s = 1 / (2 * area) * (py1 * px3 - px1 * py3 + (py3 - py1) * x + (px1 - px3) * y);
  const t = 1 / (2 * area) * (px1 * py2 - py1 * px2 + (py1 - py2) * x + (px2 - px1) * y);
  const insideTriangle = (s > 0 && t > 0 && 1 - s - t > 0);

  if (insideTriangle) {
    // Gradient from Neon Pink/Purple to Neon Cyan
    const triGrad = (x - px1) / (px2 - px1);
    const r = Math.round(255 * (1 - triGrad) + 0 * triGrad);
    const g = Math.round(40 * (1 - triGrad) + 229 * triGrad);
    const b = Math.round(200 * (1 - triGrad) + 255 * triGrad);
    return [r, g, b, 255];
  }

  // Soundwave bars on left/underneath
  const barY = h * 0.78;
  if (y >= barY && y <= barY + (w * 0.06) && x >= w * 0.25 && x <= w * 0.75) {
    return [255, 0, 127, 240]; // Neon Pink
  }

  return [bgR, bgG, bgB, 255];
}

const outDir = path.join(__dirname, '../public/icons');
fs.mkdirSync(outDir, { recursive: true });

const sizes = [16, 32, 48, 128, 512];
for (const size of sizes) {
  const png = createPNG(size, size, drawArcadeIcon);
  const outPath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Generated ${outPath} (${size}x${size})`);
}
