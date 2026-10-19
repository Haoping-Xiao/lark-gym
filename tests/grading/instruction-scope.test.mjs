import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const [name, extraRecipient] of [
  ['operations-1378', 'sarah.young@temp.example.com'],
  ['sales-816', 'j.walsh@startup.example.com'],
]) {
  test(`${name} rejects outreach outside the original user scope`, async () => {
    const task = path.resolve('tasks/automationbench-' + name);
    const seed = JSON.parse(await fs.readFile(task + '/environment/seed.json'));
    const source = await fs.readFile(task + '/solution/solve.ts', 'utf8');
    const commands = vm.runInNewContext(
      source.match(/const commands: string\[\]\[\] = ([\s\S]*?);\nfor/)[1],
    );
    const server = await startMock(seed);
    const out = await fs.mkdtemp(path.join(os.tmpdir(), 'instruction-scope-'));
    try {
      for (const command of commands)
        await exec(path.resolve('gyms/lark-cli/bin/lark-cli'), command, {
          env: { ...process.env, FEISHU_MOCK_URL: server.url },
          maxBuffer: 16e6,
        });
      for (const extra of [false, true]) {
        if (extra)
          await exec(
            path.resolve('gyms/lark-cli/bin/lark-cli'),
            [
              'mail',
              '+send',
              '--mailbox',
              'agent@company.example.com',
              '--to',
              extraRecipient,
              '--subject',
              'Additional outreach',
              '--body',
              'Assignment or invitation outside requested scope',
              '--confirm-send',
              '--as',
              'user',
            ],
            { env: { ...process.env, FEISHU_MOCK_URL: server.url } },
          );
        assert(server.calls.every((c) => c.status < 400));
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
        const result = JSON.parse(await fs.readFile(out + '/result.json'));
        assert.equal(result.business_success, !extra);
        assert.equal(result.semantic.required, true);
      }
    } finally {
      await server.close();
      await fs.rm(out, { recursive: true, force: true });
    }
  });
}
