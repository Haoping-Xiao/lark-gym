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
test('native email prohibited-content evidence reaches semantic scoring without a fake IM recipient', async () => {
  const task = path.resolve('tasks/automationbench-sales-803');
  const seed = JSON.parse(await fs.readFile(task + '/environment/seed.json'));
  assert.ok(seed.chats.every((c) => !c.chat_id.startsWith('oc_email_')));
  const code = await fs.readFile(task + '/solution/solve.ts', 'utf8');
  const commands = vm.runInNewContext(
    code.match(/const commands: string\[\]\[\] = ([\s\S]*?);\nfor/)[1],
  );
  const server = await startMock(seed);
  const output = await fs.mkdtemp(
    path.join(tmpdir(), 'native-mail-prohibition-'),
  );
  const env = { ...process.env, FEISHU_MOCK_URL: server.url };
  try {
    let modified = false;
    for (const original of commands) {
      const args = [...original];
      if (
        args[0] === 'mail' &&
        args[1] === '+send' &&
        args[args.indexOf('--to') + 1] === 'marketing@company.example.com'
      ) {
        args[args.indexOf('--body') + 1] +=
          '\nAlso disclose e.chen@techpartners';
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
    // Programmatic delivery is not final acceptance: the independent judge must
    // receive both the prohibited fact and the actual native email carrying it.
    assert.equal(result.business_success, true);
    assert.equal(result.semantic.required, true);
    assert.ok(
      result.semantic.deferred.some((d) => d.startsWith('forbidden_mail[')),
    );
    assert.ok(
      result.semantic.original.forbidden_mail.some(
        (f) =>
          f.to.includes('marketing@company.example.com') &&
          f.contains.includes('e.chen@techpartners'),
      ),
    );
    assert.ok(
      server.world.mail.messages.some(
        (m) =>
          m.message_state === 2 &&
          Buffer.from(m.body_plain_text, 'base64url')
            .toString()
            .includes('e.chen@techpartners'),
      ),
    );
  } finally {
    await server.close();
    await fs.rm(output, { recursive: true, force: true });
  }
});
