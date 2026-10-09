import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = new URL('../', import.meta.url);
const targets = ['backend/src', 'backend/prisma/seed.ts', 'frontend/src', 'frontend/index.html', 'README.md', 'INTEGRATION.md', 'ai-architecture.md'];
const allowedExtensions = new Set(['.js', '.jsx', '.ts', '.html', '.md']);
const retiredTerms = /\b(kols?|kocs?|influencers?|marketplaces?|bookings?)\b|isLookingForKol/i;

async function filesAt(path) {
  const url = new URL(path, root);
  const entries = await readdir(url, { withFileTypes: true }).catch(() => null);
  if (!entries) return [url];
  const nested = await Promise.all(entries.map((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? filesAt(`${child}/`) : [new URL(child, root)];
  }));
  return nested.flat();
}

const files = (await Promise.all(targets.map(filesAt)))
  .flat()
  .filter((file) => allowedExtensions.has(extname(file.pathname)));
const failures = [];

for (const file of files) {
  const content = await readFile(file, 'utf8');
  content.split(/\r?\n/).forEach((line, index) => {
    if (retiredTerms.test(line)) failures.push(`${relative(root.pathname, file.pathname)}:${index + 1}: ${line.trim()}`);
  });
}

if (failures.length) {
  console.error('Retired-domain runtime references found:\n' + failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Domain-removal reference check passed (${files.length} files).`);
}
