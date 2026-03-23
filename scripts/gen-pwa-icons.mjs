#!/usr/bin/env node
/**
 * Writes solid-brand PNGs for PWA manifest (192 / 512).
 * Run: pnpm run pwa:icons  (requires sharp; approve native build if pnpm prompts)
 */
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'client', 'public');
/** Slate-900-ish, matches theme-color */
const background = { r: 15, g: 23, b: 42, alpha: 1 };

for (const size of [192, 512]) {
  const buf = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .png()
    .toBuffer();
  const out = join(publicDir, `icon-${size}.png`);
  await writeFile(out, buf);
  console.log('wrote', out);
}
