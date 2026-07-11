// Generates PNG app icons without any image deps.
// Rasterizes a flat fork & knife motif from rounded capsules/rects,
// encodes PNG via zlib. Run: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '../public')
mkdirSync(publicDir, { recursive: true })

const BG = [15, 23, 42] // #0f172a
const FG = [34, 211, 238] // #22d3ee

// --- shape helpers, all in 512x512 design space -> signed distance (<=0 inside) ---

// Rounded rectangle: distance from point to a rect with corner radius r.
function sdRoundRect(px, py, x0, y0, x1, y1, r) {
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const hx = (x1 - x0) / 2 - r
  const hy = (y1 - y0) / 2 - r
  const qx = Math.abs(px - cx) - hx
  const qy = Math.abs(py - cy) - hy
  const ax = Math.max(qx, 0)
  const ay = Math.max(qy, 0)
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r
}

// A capsule is just a rounded rect with r = half the shorter side.
function capsule(px, py, x0, y0, x1, y1) {
  const r = Math.min(x1 - x0, y1 - y0) / 2
  return sdRoundRect(px, py, x0, y0, x1, y1, r)
}

// Tapered capsule: segment a->b with radius interpolating ra->rb. Gives a
// rounded "cone" — used for the knife blade (rounded point widening to base).
function taperedCapsule(px, py, ax, ay, bx, by, ra, rb) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy || 1
  let t = ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.min(Math.max(t, 0), 1)
  const cx = ax + dx * t
  const cy = ay + dy * t
  const r = ra + (rb - ra) * t
  return Math.hypot(px - cx, py - cy) - r
}

// The fork & knife, each returning a signed distance for anti-aliased coverage.
function forkKnife(px, py) {
  let d = Infinity
  // --- Fork (left, centered x=200) ---
  d = Math.min(d, capsule(px, py, 187, 250, 213, 432)) // handle
  d = Math.min(d, sdRoundRect(px, py, 172, 205, 228, 250, 16)) // base joining tines
  d = Math.min(d, capsule(px, py, 172, 100, 188, 220)) // tine 1
  d = Math.min(d, capsule(px, py, 192, 100, 208, 220)) // tine 2 (center)
  d = Math.min(d, capsule(px, py, 212, 100, 228, 220)) // tine 3
  // --- Knife (right, centered x=315) ---
  d = Math.min(d, capsule(px, py, 302, 250, 328, 432)) // handle
  // Blade: rounded point at top (r=9) widening to a broad base (r=23) at the handle.
  d = Math.min(d, taperedCapsule(px, py, 315, 112, 315, 250, 9, 23))
  return d
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

// Mix background and foreground by coverage (0..1) for cheap anti-aliasing.
function mix(cov) {
  return [
    Math.round(BG[0] + (FG[0] - BG[0]) * cov),
    Math.round(BG[1] + (FG[1] - BG[1]) * cov),
    Math.round(BG[2] + (FG[2] - BG[2]) * cov),
  ]
}

function makePng(size) {
  const s = size / 512
  const aa = 1 / s // ~1 device pixel expressed in design units, for edge softening
  const raw = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / s
      const dy = (y + 0.5) / s
      const dist = forkKnife(dx, dy)
      // coverage: 1 inside, 0 outside, linear ramp across ~1px edge
      const cov = Math.min(Math.max(0.5 - dist / aa, 0), 1)
      const [r, g, b] = cov <= 0 ? BG : cov >= 1 ? FG : mix(cov)
      const i = (y * size + x) * 4
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
