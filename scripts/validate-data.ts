import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { coreModelSchema } from '../src/data/schema.ts';

const directory = path.resolve('data/models');
const files = fs.readdirSync(directory).filter((file) => file.endsWith('.yaml'));
const ids = new Set<string>();
for (const file of files) {
  const result = coreModelSchema.safeParse(parse(fs.readFileSync(path.join(directory, file), 'utf8')));
  if (!result.success) throw new Error(`${file}: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  if (ids.has(result.data.id)) throw new Error(`${file}: duplicate id ${result.data.id}`);
  ids.add(result.data.id);
}
console.log(`Validated ${files.length} model records.`);
