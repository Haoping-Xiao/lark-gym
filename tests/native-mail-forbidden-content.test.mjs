import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const mode of ['body', 'subject'])
  test(`native mail rejects forbidden disclosure in ${mode}`, async () => {
    const task = path.resolve('tasks/automationbench-marketing-1055');
    const seed = JSON.parse(await fs.readFile(task + '/environment/seed.json'));
    assert.ok(seed.chats.every((c) => !c.chat_id.startsWith('oc_email_')));
    const code = await fs.readFile(task + '/solution/solve.ts', 'utf8');
    const commands = vm.runInNewContext(
      code.match(/const commands: string\[\]\[\] = ([\s\S]*?);\nfor/)[1],
    );
    const server = await startMock(seed);
    const output = await fs.mkdtemp(
      path.join(tmpdir(), 'native-mail-literal-'),
    );
    const env = { ...process.env, FEISHU_MOCK_URL: server.url };
    try {
      const expected = JSON.parse(
        await fs.readFile(task + '/tests/expected.json'),
      );
      const rule = expected.forbidden_mail.find((m) => m.literal);
      assert.ok(rule);
      let modified = false;
      for (const original of commands) {
        const args = [...original];
        if (
          !modified &&
          args[0] === 'mail' &&
          args[1] === '+send' &&
          rule.to.includes(args[args.indexOf('--to') + 1])
        ) {
          args[args.indexOf(mode === 'body' ? '--body' : '--subject') + 1] +=
            ' ' + rule.contains.join(' ');
          modified = true;
        }
        await exec(path.resolve('gyms/lark-cli/bin/lark-cli'), args, {
          env,
          maxBuffer: 16e6,
        });
      }
      assert.equal(modified, true);
      assert.ok(server.calls.every((c) => c.status < 400));
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
      assert.equal(result.business_success, false);
      assert.ok(result.forbiddenMailChecks.some((c) => !c.passed));
      assert.equal(result.semantic.required, true);
      assert.ok(
        result.semantic.original.mail.some((m) => m.body_contains.length > 0),
      );
    } finally {
      await server.close();
      await fs.rm(output, { recursive: true, force: true });
    }
  });
