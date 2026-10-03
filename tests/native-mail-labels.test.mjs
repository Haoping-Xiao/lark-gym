import test from 'node:test';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('native mail custom labels preserve lifecycle, unread counts and isolation through real CLI', async () => {
  const repo = process.cwd(),
    out = await fs.mkdtemp(path.join(os.tmpdir(), 'mail-labels-')),
    seed = JSON.parse(
      await fs.readFile(
        repo + '/tasks/automationbench-sales-506/environment/seed.json',
      ),
    );
  seed.mail.labels = [];
  seed.mail.mailboxes.push({
    email_address: 'other@company.example.com',
    email_type: 'PUBLIC_MAILBOX',
  });
  const server = await startMock(seed),
    independent = await startMock(seed),
    cli = repo + '/gyms/lark-cli/bin/lark-cli';
  async function call(
    resource,
    method,
    flags = [],
    data,
    mailbox = 'agent@company.example.com',
    url = server.url,
  ) {
    const args = [
      'mail',
      resource,
      method,
      '--user-mailbox-id',
      mailbox,
      '--as',
      'user',
      ...flags,
    ];
    if (data !== undefined) args.push('--data', JSON.stringify(data));
    const x = await exec(cli, args, {
      env: { ...process.env, FEISHU_MOCK_URL: url },
      maxBuffer: 8e6,
    });
    const json = JSON.parse(x.stdout);
    return json.data || json;
  }
  try {
    const created = await call('user_mailbox.labels', 'create', [], {
        label: { name: 'Needs Followup', background_color: 'blue' },
      }),
      id = created.label.id;
    assert(id);
    assert.equal((await call('user_mailbox.labels', 'list')).items.length, 1);
    assert.equal(
      (
        await call(
          'user_mailbox.labels',
          'list',
          [],
          undefined,
          'other@company.example.com',
        )
      ).items.length,
      0,
    );
    assert.equal(
      (
        await call(
          'user_mailbox.labels',
          'list',
          [],
          undefined,
          'agent@company.example.com',
          independent.url,
        )
      ).items.length,
      0,
    );
    const msg = seed.mail.messages.find((m) => m.label_ids.includes('UNREAD'));
    assert(msg);
    await call(
      'user_mailbox.messages',
      'modify',
      ['--message-id', msg.message_id],
      { add_label_ids: [id] },
    );
    assert.equal(
      (await call('user_mailbox.labels', 'get', ['--label-id', id])).label
        .messages_unread,
      1,
    );
    const search = await call('user_mailboxes', 'search', [], {
      filter: { label: ['Needs Followup'] },
    });
    assert(JSON.stringify(search).includes(msg.message_id));
    await call('user_mailbox.labels', 'patch', ['--label-id', id], {
      label: { name: 'Reviewed' },
    });
    assert.equal(
      (await call('user_mailbox.labels', 'get', ['--label-id', id])).label.name,
      'Reviewed',
    );
    const before = JSON.stringify(server.world);
    await assert.rejects(() =>
      call('user_mailbox.labels', 'patch', ['--label-id', id], {
        label: { background_color: 'invalid' },
      }),
    );
    assert.equal(JSON.stringify(server.world), before);
    await call(
      'user_mailbox.messages',
      'modify',
      ['--message-id', msg.message_id],
      { remove_label_ids: ['UNREAD'] },
    );
    assert.equal(
      (await call('user_mailbox.labels', 'get', ['--label-id', id])).label
        .messages_unread,
      0,
    );
    await call('user_mailbox.labels', 'delete', ['--label-id', id, '--yes']);
    assert.equal((await call('user_mailbox.labels', 'list')).items.length, 0);
    assert(
      !server.world.mail.messages
        .find((m) => m.message_id === msg.message_id)
        .label_ids.includes(id),
    );
    assert(
      server.calls.some((c) =>
        c.mutations?.some((m) => m.kind === 'mail_label'),
      ),
    );
    await fs.writeFile(
      out + '/cli-evidence.json',
      JSON.stringify(
        { seed, world: server.world, calls: server.calls },
        null,
        2,
      ),
    );
    console.log(
      'PASS real CLI label lifecycle, unread counts, denied-write rollback, mailbox/run isolation and mutation evidence',
    );
  } finally {
    await server.close();
    await independent.close();
    await fs.rm(out, { recursive: true, force: true });
  }
});
