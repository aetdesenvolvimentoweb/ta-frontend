import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const root = join(import.meta.dirname, '..')
const outDir = join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const BG = '#09090b'
const FG = '#34d399'

function buildSvg({
  size,
  padding,
  rounded,
}: {
  size: number
  padding: number
  rounded: boolean
}): Buffer {
  const inner = size - padding * 2
  const scale = inner / 32
  const off = (n: number) => padding + n * scale
  const sz = (n: number) => n * scale
  const rx = rounded ? (size * 7) / 32 : 0
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="${BG}"/>
  <g fill="${FG}">
    <rect x="${off(6)}"  y="${off(13)}" width="${sz(3)}" height="${sz(6)}"  rx="${sz(1.5)}"/>
    <rect x="${off(11)}" y="${off(8)}"  width="${sz(3)}" height="${sz(16)}" rx="${sz(1.5)}"/>
    <rect x="${off(16)}" y="${off(14)}" width="${sz(3)}" height="${sz(4)}"  rx="${sz(1.5)}"/>
    <rect x="${off(21)}" y="${off(10)}" width="${sz(3)}" height="${sz(12)}" rx="${sz(1.5)}"/>
  </g>
</svg>`,
  )
}

async function render(name: string, size: number, padding: number, rounded: boolean) {
  const svg = buildSvg({ size, padding, rounded })
  const png = await sharp(svg).png().toBuffer()
  writeFileSync(join(outDir, name), png)
  console.log(`✓ ${name} (${size}x${size}, padding=${padding}, rounded=${rounded})`)
}

await render('pwa-192.png', 192, 12, true)
await render('pwa-512.png', 512, 32, true)
await render('pwa-maskable-512.png', 512, 96, false)
await render('apple-touch-icon.png', 180, 12, true)

console.log('\nDone.')
