import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('native aggregate mail cannot disclose a recipient notice through CC to another allowed recipient', async () => {
  const task = path.resolve('tasks/automationbench-hr-5121');
  const seed = JSON.parse(await fs.readFile(task + '/environment/seed.json'));
  assert.ok(seed.chats.every((c) => !c.chat_id.startsWith('oc_email_')));
  const code = await fs.readFile(task + '/solution/solve.ts', 'utf8');
  const commands = vm.runInNewContext(
    code.match(/const commands: string\[\]\[\] = ([\s\S]*?);\nfor/)[1],
  );
  const server = await startMock(seed);
  const output = await fs.mkdtemp(
    path.join(tmpdir(), 'native-mail-recipient-scope-'),
  );
  const env = { ...process.env, FEISHU_MOCK_URL: server.url };
  try {
    const mails = commands.filter((c) => c[0] === 'mail' && c[1] === '+send');
    const first = mails[0];
    const recipient = (c) => c[c.indexOf('--to') + 1];
    const other = mails.find((c) => recipient(c) !== recipient(first));
    assert.ok(other);
    let modified = false;
    for (const original of commands) {
      const args = [...original];
      if (original === first) {
        args.push('--cc', recipient(other));
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
    assert.ok(
      result.semantic.original.mail.every(
        (m) => m.aggregate_recipient_scope === 'exact',
      ),
    );
    assert.ok(
      server.world.mail.messages.some(
        (m) =>
          m.message_state === 2 &&
          m.cc.some((a) => a.mail_address === recipient(other)),
      ),
    );
  } finally {
    await server.close();
    await fs.rm(output, { recursive: true, force: true });
  }
});
