import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('reply drafts retain the source thread while using the approved alternative recipient', async () => {
  const task = path.resolve('tasks/automationbench-sales-109'),
    seed = JSON.parse(await fs.readFile(task + '/environment/seed.json')),
    source = await fs.readFile(task + '/solution/solve.ts', 'utf8');
  const commands = vm.runInNewContext(
    source.match(/const commands: string\[\]\[\] = ([\s\S]*?);\nfor/)[1],
  );
  assert.ok(
    !(seed.base.tables || []).some((t) => t.collection === 'mail_drafts'),
  );
  const dir = await fs.mkdtemp(path.join(tmpdir(), 'native-drafts-'));
  try {
    for (const mode of ['draft', 'no-thread', 'wrong-recipient']) {
      const server = await startMock(seed);
      try {
        const env = { ...process.env, FEISHU_MOCK_URL: server.url };
        for (const original of commands) {
          const args = [...original];
          if (
            args[0] === 'mail' &&
            args[1] === 'user_mailbox.drafts' &&
            args[2] === 'create'
          ) {
            const index = args.indexOf('--data') + 1,
              value = JSON.parse(args[index]);
            let mime = Buffer.from(value.raw, 'base64url').toString();
            if (mode === 'no-thread')
              mime = mime.replace(
                /^(In-Reply-To|References):[^\r\n]*\r?\n/gim,
                '',
              );
            if (mode === 'wrong-recipient')
              mime = mime.replace(
                'vp.alt@almostbig.example.com',
                'vp@almostbig.example.com',
              );
            value.raw = Buffer.from(mime).toString('base64url');
            args[index] = JSON.stringify(value);
          }
          await exec(path.resolve('gyms/lark-cli/bin/lark-cli'), args, {
            env,
            maxBuffer: 8e6,
          });
        }
        assert.ok(server.calls.every((c) => c.status < 400));
        const state = path.join(dir, mode + '.json'),
          out = path.join(dir, mode);
        await fs.writeFile(
          state,
          JSON.stringify({ seed, world: server.world, calls: server.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: { ...env, MOCK_STATE: state, VERIFIER_OUTPUT: out },
          maxBuffer: 8e6,
        });
        const v = JSON.parse(await fs.readFile(out + '/result.json'));
        assert.equal(v.business_success, mode === 'draft', mode);
        assert.ok(v.semantic.deferred.includes('mail_drafts.content'));
        if (mode === 'draft') {
          assert.equal(server.world.mail.drafts.length, 1);
          const reply = server.world.mail.messages.find(
            (m) => m.message_id === server.world.mail.drafts[0].message_id,
          );
          const source = seed.mail.messages.find(
            (m) => m.smtp_message_id === 'msg_client_004@fixture.invalid',
          );
          assert.equal(reply.thread_id, source.thread_id);
          assert.equal(reply.in_reply_to, source.smtp_message_id);
          assert.deepEqual(
            reply.to.map((a) => a.mail_address),
            ['vp.alt@almostbig.example.com'],
          );
          assert.equal(
            server.world.mail.messages.find(
              (m) => m.message_id === server.world.mail.drafts[0].message_id,
            ).message_state,
            3,
          );
          assert.ok(v.semantic.original.mail_drafts[0].business_context.body);
        }
      } finally {
        await server.close();
      }
    }
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
