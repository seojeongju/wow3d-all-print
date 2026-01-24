/**
 * Removes duplicate exports from .open-next/cloudflare/next-env.mjs
 * (workaround for @opennextjs/cloudflare build generating duplicates on Windows)
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', '.open-next', 'cloudflare', 'next-env.mjs');
if (!fs.existsSync(file)) {
  console.warn('fix-next-env: next-env.mjs not found, skipping');
  process.exit(0);
}

const content = `export const production = {};
export const development = {};
export const test = {};
`;

fs.writeFileSync(file, content, 'utf8');
console.log('fix-next-env: next-env.mjs deduplicated');
