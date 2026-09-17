import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('..', import.meta.url));
const id = process.argv[2] || 'maintenance-notice';
if (!/^[a-z0-9-]+$/.test(id)) throw new Error('Invalid case id');
const target = join(root, 'tasks', id, 'environment', 'gym-source');
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const p of [
  'package.json',
  'package-lock.json',
  'gyms/lark-cli/cli',
  'scripts/build-cli.sh',
  'gyms/lark-cli/src',
])
  await cp(join(root, p), join(target, p), { recursive: true });
await cp(
  join(root, 'tasks', id, 'tools.md'),
  join(target, 'tool-instructions.md'),
);
console.log(`Harbor build context ready: tasks/${id}/environment`);
