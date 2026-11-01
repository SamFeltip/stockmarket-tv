// Render our code-native store artwork with Sharp (npm package `sharp`).
// STOCKMARKET_SHARP_PATH may point to an existing Sharp installation.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const sharp = require(process.env.STOCKMARKET_SHARP_PATH || 'sharp');
const output = new URL('../store/assets/', import.meta.url);
mkdirSync(output, { recursive: true });
const icon = readFileSync(new URL('../android/app/src/main/res/drawable/icon.png', import.meta.url));
const brand = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
<rect width="1280" height="720" fill="#204712"/>
<path d="M100 570H1180" stroke="#789564" stroke-width="2"/>
<text x="640" y="335" text-anchor="middle" font-family="DejaVu Serif,serif" font-size="112" fill="white">Stockmarket!</text>
<text x="640" y="425" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="48" letter-spacing="12" fill="#fff284">TV</text>
<text x="640" y="535" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="28" fill="white">Your market. Your friends. Your next move.</text></svg>\n`;
writeFileSync(new URL('tv-brand.svg', output), brand);
await sharp(Buffer.from(brand)).png().toFile(fileURLToPath(new URL('amazon-fire-tv-icon-1280x720.png', output)));
await sharp(Buffer.from(brand)).resize(1024, 500, { fit: 'contain', background: '#204712' }).png()
    .toFile(fileURLToPath(new URL('google-feature-1024x500.png', output)));
for (const size of [114, 512]) {
    await sharp(icon).resize(size, size).png().toFile(fileURLToPath(new URL(`icon-${size}.png`, output)));
}
const bannerDir = new URL('../android/app/src/main/res/drawable-xhdpi/', import.meta.url);
mkdirSync(bannerDir, { recursive: true });
await sharp(Buffer.from(brand)).resize(320, 180).png().toFile(fileURLToPath(new URL('banner.png', bannerDir)));
console.log('Rendered launcher banner, store icons and feature graphic. Screenshots must come from the app.');
