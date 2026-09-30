import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
export const isMail = (c: string[]) => c[0] === 'mail' && c[1] === '+send';
export const recipient = (c: string[]) => c[c.indexOf('--to') + 1];
export function notice(c: string[], body: string, to = recipient(c)) {
  const changed = [...c];
  changed[changed.indexOf('--body') + 1] = body;
  changed[changed.indexOf('--to') + 1] = to;
  return changed;
}
export async function verifyMailVariant(
  taskName: string,
  transform: (commands: string[][]) => string[][],
) {
  const root = process.cwd(),
    task = path.join(root, 'tasks', taskName),
    seed = JSON.parse(
      await fs.readFile(task + '/environment/seed.json', 'utf8'),
    ),
    source = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
    commands = vm.runInNewContext(
      source.match(/const commands: string\[\]\[\] = ([\s\S]*?);\nfor/)![1],
    ) as string[][],
    server = await startMock(seed),
    out = await fs.mkdtemp(path.join(os.tmpdir(), 'mail-variants-'));
  try {
    for (const c of transform(commands))
      await exec(root + '/gyms/lark-cli/bin/lark-cli', c, {
        env: { ...process.env, FEISHU_MOCK_URL: server.url },
        maxBuffer: 16e6,
      });
    assert.ok(server.calls.every((c) => c.status < 400));
    await fs.writeFile(
      out + '/state.json',
      JSON.stringify({ seed, world: server.world, calls: server.calls }),
    );
    await exec(process.execPath, [task + '/tests/verify.ts'], {
      env: {
        ...process.env,
        MOCK_STATE: out + '/state.json',
        VERIFIER_OUTPUT: out,
      },
      maxBuffer: 8e6,
    });
    return JSON.parse(await fs.readFile(out + '/result.json', 'utf8'));
  } finally {
    await server.close();
    await fs.rm(out, { recursive: true, force: true });
  }
}
