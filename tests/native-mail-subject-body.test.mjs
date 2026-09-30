import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);

test('native mail checks subject and delivery separately while retaining semantic body facts', async () => {
  const task = path.resolve('tasks/automationbench-sales-506');
  const seed = JSON.parse(await fs.readFile(task + '/environment/seed.json'));
  const solution = await fs.readFile(task + '/solution/solve.ts', 'utf8');
  const commands = vm.runInNewContext(
    solution.match(/const commands: string\[\]\[\] = ([\s\S]*?);\nfor/)[1],
  );
  const temporary = await fs.mkdtemp(
    path.join(tmpdir(), 'native-mail-content-'),
  );
  try {
    for (const mode of [
      'reference',
      'wrong-subject',
      'wrong-recipient',
      'missing-mail',
      'semantic-body',
    ]) {
      const server = await startMock(seed);
      const output = path.join(temporary, mode);
      await fs.mkdir(output);
      const env = { ...process.env, FEISHU_MOCK_URL: server.url };
      try {
        for (const original of commands) {
          const command = [...original];
          if (command[0] === 'mail' && command[1] === '+send') {
            if (mode === 'missing-mail') continue;
            if (mode === 'wrong-subject')
              command[command.indexOf('--subject') + 1] = 'Unrelated';
            if (mode === 'wrong-recipient')
              command[command.indexOf('--to') + 1] = 'wrong@example.com';
            if (mode === 'semantic-body')
              command[command.indexOf('--body') + 1] = 'Acknowledged.';
          }
          await exec(path.resolve('gyms/lark-cli/bin/lark-cli'), command, {
            env,
            maxBuffer: 16e6,
          });
        }
        assert.ok(server.calls.every((call) => call.status < 400));
        await fs.writeFile(
          output + '/state.json',
          JSON.stringify({ seed, world: server.world, calls: server.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: {
            ...env,
            MOCK_STATE: output + '/state.json',
            VERIFIER_OUTPUT: output,
          },
          maxBuffer: 8e6,
        });
        const result = JSON.parse(await fs.readFile(output + '/result.json'));
        assert.equal(
          result.business_success,
          ['reference', 'semantic-body'].includes(mode),
          mode,
        );
        assert.equal(result.semantic.required, true);
        assert.ok(
          result.semantic.original.mail[0].body_contains.includes(
            'Robert Anderson',
          ),
        );
        assert.ok(
          result.semantic.original.mail[0].subject_contains.includes(
            'Security',
          ),
        );
      } finally {
        await server.close();
      }
    }
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
});
