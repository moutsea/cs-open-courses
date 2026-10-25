#!/usr/bin/env node
/**
 * Regenerates the brand raster assets from public/brand/mark.svg.
 * Run with: node scripts/generate-brand-assets.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const source = path.join(root, 'public/brand/mark.svg')
const svg = await readFile(source)

// Full-bleed variant for platform icons (iOS/Android mask the corners themselves).
const iconSvg = await readFile(source, 'utf8')
  .then(markup => markup
    .replace('viewBox="0 0 64 64"', 'viewBox="0 0 64 64"')
    .replace('<rect x="1" y="1" width="62" height="62" rx="18"', '<rect x="0" y="0" width="64" height="64" rx="14"'))

const targets = [
  ['logo.png', 512, svg],
  ['icon-512.png', 512, iconSvg],
  ['icon-192.png', 192, iconSvg],
  ['apple-touch-icon.png', 180, iconSvg]
]

for (const [file, size, input] of targets) {
  await sharp(Buffer.from(input)).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(root, 'public', file))
  console.log('wrote', file, `${size}x${size}`)
}

// Social preview (1200x630) built from the same token set.
const ogSvg = await readFile(path.join(root, 'public/brand/og.svg'))
await sharp(ogSvg).jpeg({ quality: 90 }).toFile(path.join(root, 'public/og.jpg'))
console.log('wrote og.jpg 1200x630')

// favicon.svg: same mark, minified so the browser parses it instantly.
const favicon = await readFile(source, 'utf8')
await writeFile(path.join(root, 'public/favicon.svg'), favicon.replace(/\n\s*/g, ' ').trim())
console.log('wrote favicon.svg')

// favicon.ico: sharp has no ICO writer, but ICO is just a small directory + PNG payloads.
const icoSizes = [16, 32, 48]
const icoPngs = await Promise.all(icoSizes.map(size => sharp(svg).resize(size, size).png().toBuffer()))
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(icoPngs.length, 4)
const entries = []
let offset = 6 + 16 * icoPngs.length
for (let i = 0; i < icoPngs.length; i += 1) {
  const entry = Buffer.alloc(16)
  entry.writeUInt8(icoSizes[i] >= 256 ? 0 : icoSizes[i], 0) // width
  entry.writeUInt8(icoSizes[i] >= 256 ? 0 : icoSizes[i], 1) // height
  entry.writeUInt8(0, 2) // palette
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // planes
  entry.writeUInt16LE(32, 6) // bpp
  entry.writeUInt32LE(icoPngs[i].length, 8) // bytes
  entry.writeUInt32LE(offset, 12) // offset
  offset += icoPngs[i].length
  entries.push(entry)
}
await writeFile(path.join(root, 'public/favicon.ico'), Buffer.concat([header, ...entries, ...icoPngs]))
console.log('wrote favicon.ico', icoSizes.join('/'))
