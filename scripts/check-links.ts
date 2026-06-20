import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const prefix = '/mobiles';
const htmlFiles = (directory: string): string[] => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? htmlFiles(target) : entry.name.endsWith('.html') ? [target] : [];
});
const targetExists = (url: string) => {
  const pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]);
  const relative = pathname.slice(`${prefix}/`.length);
  const candidate = path.join(dist, relative);
  return fs.existsSync(candidate) || fs.existsSync(`${candidate}.html`) || fs.existsSync(path.join(candidate, 'index.html'));
};
const failures: string[] = [];
for (const file of htmlFiles(dist)) {
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const url = match[1];
    if (!url.startsWith(prefix)) continue;
    if (!url.startsWith(`${prefix}/`)) failures.push(`${file}: malformed base-path URL ${url}`);
    else if (!targetExists(url)) failures.push(`${file}: missing internal target ${url}`);
  }
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Verified ${htmlFiles(dist).length} HTML files: all ${prefix}/ links resolve.`);
