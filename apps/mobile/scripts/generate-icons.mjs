// Genera los iconos de la app (icono principal, icono adaptativo Android y
// splash) desde SVG, con la identidad visual "aurora": gradiente menta->cian
// y una mancuerna blanca. Reproducible: `node scripts/generate-icons.mjs`.
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets");
mkdirSync(outDir, { recursive: true });

// Mancuerna centrada en 512,512, ligeramente inclinada para dar energia.
// `scale` agranda alrededor del centro para llenar mejor el lienzo.
const dumbbell = (fill, opacity = 1, dx = 0, dy = 0, scale = 1.32) => `
  <g transform="translate(${dx} ${dy}) rotate(-18 512 512) translate(512 512) scale(${scale}) translate(-512 -512)" fill="${fill}" fill-opacity="${opacity}">
    <rect x="300" y="452" width="46" height="120" rx="23"/>
    <rect x="336" y="430" width="80" height="164" rx="34"/>
    <rect x="404" y="484" width="216" height="56" rx="28"/>
    <rect x="608" y="430" width="80" height="164" rx="34"/>
    <rect x="678" y="452" width="46" height="120" rx="23"/>
  </g>`;

const gradientDefs = `
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#34d399"/>
    <stop offset="1" stop-color="#22d3ee"/>
  </linearGradient>
  <radialGradient id="hi" cx="0.3" cy="0.24" r="0.9">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.34"/>
    <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
  </radialGradient>`;

// Icono principal (iOS + fallback Android): gradiente a sangre + mancuerna.
const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>${gradientDefs}</defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <rect width="1024" height="1024" fill="url(#hi)"/>
  ${dumbbell("#04231d", 0.14, 0, 16)}
  ${dumbbell("#ffffff")}
</svg>`;

// Fondo del icono adaptativo Android: solo el gradiente.
const adaptiveBgSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>${gradientDefs}</defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <rect width="1024" height="1024" fill="url(#hi)"/>
</svg>`;

// Primer plano del icono adaptativo: mancuerna blanca sobre transparente,
// dentro de la zona segura central (Android la enmascara en circulo/squircle).
const adaptiveFgSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  ${dumbbell("#ffffff")}
</svg>`;

// Splash: mancuerna blanca sobre transparente (el fondo lo pone app.json).
const splashSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>${gradientDefs}</defs>
  <g transform="scale(0.92) translate(41 41)">
    ${dumbbell("url(#g)")}
  </g>
</svg>`;

const targets = [
  { name: "icon.png", svg: iconSvg },
  { name: "adaptive-icon.png", svg: adaptiveFgSvg },
  { name: "adaptive-icon-bg.png", svg: adaptiveBgSvg },
  { name: "splash-icon.png", svg: splashSvg },
];

for (const target of targets) {
  const outPath = path.join(outDir, target.name);
  await sharp(Buffer.from(target.svg)).resize(1024, 1024).png().toFile(outPath);
  console.log(`✓ ${target.name}`);
}
console.log("Iconos generados en apps/mobile/assets");
