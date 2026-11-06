import { readFile, writeFile } from 'node:fs/promises'
import { deflateSync } from 'node:zlib'

const svg = await readFile(new URL('../public/icons/simba-mark.svg', import.meta.url), 'utf8')
const pathData = svg.match(/<path d="([^"]+)"/)?.[1]
if (!pathData) throw new Error('The Simba SVG mark has no supported path.')

const tokens = pathData.match(/[MLZ]|-?(?:\d+\.?\d*|\.\d+)/g) || []
const polygons = []
let active = []
let command = ''
for (let i = 0; i < tokens.length;) {
  if (/^[MLZ]$/.test(tokens[i])) {
    command = tokens[i++]
    if (command === 'Z') {
      if (active.length > 2) polygons.push(active)
      active = []
      command = ''
      continue
    }
  }
  const point = [Number(tokens[i++]), Number(tokens[i++])]
  active.push(point)
  if (command === 'M') command = 'L'
}
if (active.length > 2) polygons.push(active)

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const name = Buffer.from(type), length = Buffer.alloc(4), checksum = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([length, name, data, checksum])
}

function render(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  const background = [11, 93, 51, 255]
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x++) raw.set(background, row + 1 + x * 4)
    const scanY = 150 + (y + 0.5) * 780 / size
    const crossings = []
    for (const polygon of polygons) {
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [x1, y1] = polygon[j], [x2, y2] = polygon[i]
        if ((y1 <= scanY && y2 > scanY) || (y2 <= scanY && y1 > scanY)) {
          const x = x1 + (scanY - y1) * (x2 - x1) / (y2 - y1)
          crossings.push((x - 150) * size / 780)
        }
      }
    }
    crossings.sort((a, b) => a - b)
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const start = Math.max(0, Math.ceil(crossings[i] - 0.5))
      const end = Math.min(size, Math.ceil(crossings[i + 1] - 0.5))
      for (let x = start; x < end; x++) raw.set([255, 255, 255, 255], row + 1 + x * 4)
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4)
  header[8] = 8; header[9] = 6
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
  return png
}

for (const size of [180, 192, 512]) {
  await writeFile(new URL(`../public/icons/simba-mark-${size}.png`, import.meta.url), render(size))
}
