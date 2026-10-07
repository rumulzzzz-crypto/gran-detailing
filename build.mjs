import { mkdir, copyFile, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const output = resolve(root, 'dist');
if (dirname(output) !== root) throw new Error('Build output must stay inside the project');
await rm(output, { recursive: true, force: true });
const files = [
  'index.html', 'styles.css', 'app.js',
  'assets/hero.webp', 'assets/polish.webp', 'assets/protect.webp',
  'assets/interior.webp', 'assets/before.webp', 'assets/favicon.svg',
  'assets/fonts/manrope-cyrillic-400-normal.woff2',
  'assets/fonts/manrope-latin-400-normal.woff2',
  'assets/fonts/manrope-LICENSE.txt',
];
for (const file of files) {
  const target = resolve(output, file);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(root, file), target);
}
console.log(`Prepared ${files.length} public files in dist`);
