// Generates PNG app icons without any image deps.
// Rasterizes a simple dumbbell motif from filled rectangles, encodes PNG via zlib.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '../public')
mkdirSync(publicDir, { recursive: true })

const BG = [15, 23, 42]      // #0f172a
const FG = [34, 211, 238]    // #22d3ee

// Dumbbell rectangles defined in a 512x512 design space: [x0, y0, x1, y1]
const RECTS = [
  [150, 239, 362, 273], // bar
  [133, 196, 167, 316], // left inner plate
  [87, 216, 121, 296],  // left outer plate
  [345, 196, 379, 316], // right inner plate
  [391, 216, 425, 296], // right outer plate
]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function makePng(size) {
  const s = size / 512
  // Build RGBA pixels
  const raw = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = BG
      // Map pixel to design space
      const dx = x / s
      const dy = y / s
      for (const [x0, y0, x1, y1] of RECTS) {
        if (dx >= x0 && dx < x1 && dy >= y0 && dy < y1) { color = FG; break }
      }
      const i = (y * size + x) * 4
      raw[i] = color[0]; raw[i + 1] = color[1]; raw[i + 2] = color[2]; raw[i + 3] = 255
    }
  }
  // Add filter byte (0) at the start of each scanline
  const stride = size * 4
  const filtered = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    filtered[y * (stride + 1)] = 0
    raw.copy(filtered, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // color type RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(filtered, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  writeFileSync(resolve(publicDir, name), makePng(size))
  console.log('wrote', name)
}
