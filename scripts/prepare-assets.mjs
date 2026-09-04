import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const source = path.resolve(root, 'public', 'brand', 'mascot', 'okfks-rhino.png')
const mascotDir = path.resolve(root, 'public', 'brand', 'mascot')

await sharp(source).resize({ width: 560, height: 560, fit: 'contain' }).png({ compressionLevel: 9 }).toFile(path.join(mascotDir, 'okfks-rhino-catalog.png'))
await sharp(source).resize({ width: 900, height: 900, fit: 'contain' }).png({ compressionLevel: 9 }).toFile(path.join(mascotDir, 'okfks-rhino-pdf.png'))
await sharp(source).webp({ quality: 92, alphaQuality: 100 }).toFile(path.join(mascotDir, 'okfks-rhino.webp'))

console.log('Brand assets prepared')
