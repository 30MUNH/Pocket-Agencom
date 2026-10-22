const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const backendRoot = path.resolve(__dirname, '..');
function listJavaScript(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? listJavaScript(filename) : filename.endsWith('.js') ? [filename] : [];
  });
}
const files = [path.join(backendRoot, 'index.js'), ...listJavaScript(path.join(backendRoot, 'src'))].sort();
for (const filename of files) {
  const result = spawnSync(process.execPath, ['--check', filename], { stdio: 'inherit' });
  if (result.error) {
    console.error(`Cannot check ${path.relative(backendRoot, filename)}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Backend syntax checked: ${files.length} files.`);
