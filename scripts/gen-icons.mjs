// Generates PNG app icons without any image deps.
// Rasterizes the fork & knife silhouette (traced from the reference art and
// kept in sync with public/favicon.svg) via a small path parser + scanline
// fill, then encodes PNG via zlib. Run: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '../public')
mkdirSync(publicDir, { recursive: true })

const BG = [15, 23, 42] // #0f172a
const FG = [56, 189, 248] // #38bdf8

// Fork & knife path in the 512x512 design space. Identical to the <path> in
// public/favicon.svg — keep the two in sync if you re-trace the artwork.
const PATH =
  'M202.9 437.4 C197.9 435.7 192.5 430.6 190.4 425.7 C187.8 419.7 187.8 414.1 190.3 390.6 C194.8 348.4 198.5 308.8 200.1 283.8 C201.8 257.7 200.7 225.6 197.7 215.7 C196.6 211.8 192.5 207.3 186.9 203.8 C177.8 198.0 171.0 188.5 168.2 177.6 C167.1 173.4 167.0 169.6 167.4 147.6 C167.8 121.0 169.2 83.6 169.8 79.6 C170.7 73.6 178.3 72.0 181.0 77.2 C182.0 79.0 182.1 85.9 182.1 121.4 C182.1 147.4 182.4 164.0 182.9 164.8 C184.0 167.0 187.9 168.1 190.3 166.9 C194.1 165.1 194.1 165.4 194.1 119.8 L194.1 77.4 195.9 75.8 C198.3 73.5 201.7 73.6 203.9 76.1 L205.8 78.0 206.1 121.2 C206.3 145.0 206.7 164.9 207.0 165.3 C207.3 165.8 208.6 166.6 209.8 167.1 C213.0 168.4 216.3 166.5 217.3 162.8 C217.8 161.0 218.1 145.0 218.1 118.7 L218.1 77.4 219.9 75.8 C222.2 73.6 225.7 73.6 227.7 75.9 L229.4 77.6 229.4 119.9 C229.4 165.6 229.4 165.1 233.4 167.0 C235.8 168.2 239.4 167.1 240.7 164.8 C241.1 164.0 241.4 146.9 241.4 121.4 C241.4 76.9 241.5 75.9 244.8 74.6 C249.0 73.0 253.0 75.1 253.7 79.5 C254.4 83.9 255.7 119.4 256.1 146.5 C256.5 169.5 256.4 173.4 255.3 177.6 C252.6 188.2 245.9 197.8 237.1 203.5 C224.9 211.4 223.4 216.2 222.8 248.5 C222.3 276.4 224.6 308.4 232.4 382.8 C234.5 402.0 235.4 413.8 235.1 417.3 C234.5 426.4 230.4 432.8 222.9 436.4 C218.1 438.7 208.2 439.2 202.9 437.4 Z M325.3 437.2 C318.8 433.7 315.6 427.0 313.8 413.8 C310.1 387.0 310.1 345.9 313.8 283.1 C315.2 259.1 315.4 259.9 306.8 255.4 C299.4 251.5 292.5 244.9 289.2 238.6 C286.0 232.6 283.1 222.5 281.8 213.8 C280.6 205.4 281.4 172.6 283.0 161.1 C287.6 127.8 299.3 100.4 316.2 83.2 C323.3 76.0 327.5 73.8 333.2 74.3 C338.4 74.7 341.6 77.0 343.9 82.0 L345.6 85.9 345.4 256.8 L345.2 427.8 343.7 430.7 C341.2 435.5 337.4 438.1 332.3 438.4 C329.1 438.6 327.3 438.3 325.3 437.2 Z'

// Parse an SVG path (only M/L/C/Z, as emitted by the tracer) into a list of
// closed rings, flattening cubic beziers into short line segments.
function parsePath(d) {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/g)
  const rings = []
  let ring = null
  let cx = 0, cy = 0, sx = 0, sy = 0, cmd = ''
  let i = 0
  const num = () => parseFloat(tokens[i++])
  const isNum = (t) => t != null && /[-\d.]/.test(t[0])
  while (i < tokens.length) {
    const t = tokens[i]
    if (/[MLCZ]/.test(t)) { cmd = t; i++ }
    if (cmd === 'M') {
      cx = num(); cy = num(); sx = cx; sy = cy
      ring = [[cx, cy]]; rings.push(ring)
      while (isNum(tokens[i])) { cx = num(); cy = num(); ring.push([cx, cy]) }
    } else if (cmd === 'L') {
      do { cx = num(); cy = num(); ring.push([cx, cy]) } while (isNum(tokens[i]))
    } else if (cmd === 'C') {
      do {
        const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num()
        const steps = 24
        for (let k = 1; k <= steps; k++) {
          const s = k / steps, m = 1 - s
          ring.push([
            m * m * m * cx + 3 * m * m * s * x1 + 3 * m * s * s * x2 + s * s * s * x,
            m * m * m * cy + 3 * m * m * s * y1 + 3 * m * s * s * y2 + s * s * s * y,
          ])
        }
        cx = x; cy = y
      } while (isNum(tokens[i]))
    } else if (cmd === 'Z') {
      cx = sx; cy = sy
    }
  }
  return rings
}

const RINGS = parsePath(PATH)

// Build edge list (x0,y0,x1,y1) from all ring segments, in design space.
const EDGES = []
for (const ring of RINGS) {
  for (let k = 0; k < ring.length; k++) {
    const [ax, ay] = ring[k]
    const [bx, by] = ring[(k + 1) % ring.length]
    if (ay !== by) EDGES.push([ax, ay, bx, by])
  }
}

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
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

// Supersampled coverage of the utensil path per device pixel (0..1), via
// even-odd scanline fill on a size*SS grid.
function coverage(size) {
  const SS = 4
  const W = size * SS
  const scale = W / 512
  const cov = new Uint16Array(size * size)
  const xs = []
  for (let yy = 0; yy < W; yy++) {
    const dy = (yy + 0.5) / scale // scanline in design space
    xs.length = 0
    for (const [ax, ay, bx, by] of EDGES) {
      if ((ay <= dy && by > dy) || (by <= dy && ay > dy)) {
        xs.push(ax + ((dy - ay) / (by - ay)) * (bx - ax))
      }
    }
    xs.sort((a, b) => a - b)
    const row = ((yy / SS) | 0) * size
    for (let s = 0; s + 1 < xs.length; s += 2) {
      let x0 = Math.round(xs[s] * scale)
      let x1 = Math.round(xs[s + 1] * scale)
      if (x0 < 0) x0 = 0
      if (x1 > W) x1 = W
      for (let xx = x0; xx < x1; xx++) cov[row + ((xx / SS) | 0)]++
    }
  }
  const max = SS * SS
  const out = new Float32Array(size * size)
  for (let i = 0; i < out.length; i++) out[i] = cov[i] / max
  return out
}

function mix(c) {
  return [
    Math.round(BG[0] + (FG[0] - BG[0]) * c),
    Math.round(BG[1] + (FG[1] - BG[1]) * c),
    Math.round(BG[2] + (FG[2] - BG[2]) * c),
  ]
}

function makePng(size) {
  // Full-bleed square background: the app manifest marks these icons "maskable"
  // and iOS applies its own rounding, so the PNGs stay square (unlike favicon.svg).
  const cov = coverage(size)
  const raw = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const c = cov[y * size + x]
      const [r, g, b] = c <= 0 ? BG : c >= 1 ? FG : mix(c)
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = 255
    }
  }
  const stride = size * 4
  const filtered = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    filtered[y * (stride + 1)] = 0
    raw.copy(filtered, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
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
