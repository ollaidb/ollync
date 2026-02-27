/**
 * Génère les icônes PWA 192x192 et 512x512 à partir de public/vite.svg.
 * À lancer avant le build : npm run generate:pwa-icons
 */
const path = require('path')
const fs = require('fs')

const publicDir = path.join(__dirname, '..', 'public')
const svgPath = path.join(publicDir, 'vite.svg')

async function main() {
  let sharp
  try {
    sharp = require('sharp')
  } catch (e) {
    console.error('Installe sharp : npm install -D sharp')
    process.exit(1)
  }

  if (!fs.existsSync(svgPath)) {
    console.error('Fichier source introuvable :', svgPath)
    process.exit(1)
  }

  const svgBuffer = fs.readFileSync(svgPath)

  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'))
  console.log('Créé : public/icon-192.png')

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'))
  console.log('Créé : public/icon-512.png')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
