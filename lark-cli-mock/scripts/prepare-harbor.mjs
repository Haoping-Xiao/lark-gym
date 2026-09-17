import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../..', import.meta.url));
const id = process.argv[2] || 'maintenance-notice';
if (!/^[a-z0-9-]+$/.test(id)) throw new Error('Invalid case id');
const target = join(root, 'cases', id, 'environment', 'mock-source');
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const p of [
  'package.json',
  'package-lock.json',
  'lark-cli-mock/cli',
  'lark-cli-mock/scripts/build-cli.sh',
  'lark-cli-mock/src/backends',
  'lark-cli-mock/src/harbor',
])
  await cp(join(root, p), join(target, p), { recursive: true });
console.log(`Harbor build context ready: cases/${id}/environment`);
