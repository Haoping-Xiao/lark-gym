import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('native mail attachments retain real bytes through draft, send and readback with isolation', async () => {
  const base = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3151/environment/seed.json',
      'utf8',
    ),
  );
  const seed = {
    ...base,
    mail: {
      attachment_support: true,
      mailboxes: [{ email_address: 'agent@company.example.com' }],
      messages: [],
      drafts: [],
    },
  };
  const dir = await mkdtemp(join(tmpdir(), 'mail-attachment-')),
    binary = Buffer.from([
      37, 80, 68, 70, 45, 49, 46, 52, 10, 0, 255, 128, 1, 10,
    ]);
  await writeFile(join(dir, 'invoice.pdf'), binary);
  const a = await startMock(seed),
    b = await startMock(seed),
    bin = resolve('gyms/lark-cli/bin/lark-cli');
  const cli = async (...args: string[]) =>
    JSON.parse(
      (
        await exec(bin, ['mail', ...args, '--as', 'user'], {
          cwd: dir,
          env: { ...process.env, FEISHU_MOCK_URL: a.url },
        })
      ).stdout,
    );
  try {
    await cli(
      '+send',
      '--to',
      'receiver@example.com',
      '--subject',
      'invoice',
      '--body',
      'Please see attached.',
      '--attach',
      'invoice.pdf',
    );
    let message = a.world.mail!.messages[0];
    assert.equal(message.message_state, 3);
    assert.equal(message.attachments.length, 1);
    const attachment = message.attachments[0];
    assert.equal(attachment.filename, 'invoice.pdf');
    assert.equal(attachment.content_type, 'application/octet-stream');
    assert.deepEqual(Buffer.from(attachment.content_base64, 'base64'), binary);
    assert.equal(
      attachment.sha256,
      createHash('sha256').update(binary).digest('hex'),
    );
    assert.equal(attachment.size, binary.length);
    const draft = a.world.mail!.drafts[0];
    await cli(
      'user_mailbox.drafts',
      'send',
      '--user-mailbox-id',
      'me',
      '--draft-id',
      draft.id,
      '--yes',
    );
    message = a.world.mail!.messages[0];
    assert.equal(message.message_state, 2);
    assert.deepEqual(
      Buffer.from(message.attachments[0].content_base64, 'base64'),
      binary,
    );
    const read = await cli('+messages', '--message-ids', message.message_id);
    const output = JSON.stringify(read);
    assert.match(output, /invoice\.pdf/);
    assert(!output.includes('content_base64'));
    assert(!output.includes('sha256'));
    assert.equal(b.world.mail!.messages.length, 0);
    assert(
      a.calls.some((c) =>
        (c.mutations || []).some(
          (m: any) =>
            m.kind === 'mail_message' &&
            m.after?.message_state === 2 &&
            m.after?.attachments?.[0]?.sha256 === attachment.sha256,
        ),
      ),
    );
  } finally {
    await a.close();
    await b.close();
    await rm(dir, { recursive: true, force: true });
  }
});
test('unsupported inline and invalid attachment MIME fail atomically', async () => {
  const base = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3151/environment/seed.json',
      'utf8',
    ),
  );
  const a = await startMock({
    ...base,
    mail: {
      attachment_support: true,
      mailboxes: [{ email_address: 'agent@company.example.com' }],
      messages: [],
      drafts: [],
    },
  });
  const bin = resolve('gyms/lark-cli/bin/lark-cli');
  try {
    for (const [filename, extra, status] of [
      ['../escape.pdf', '', 400],
      ['valid.pdf', 'Content-ID: <inline>\r\n', 501],
    ] as const) {
      const before = structuredClone(a.world);
      const raw = Buffer.from(
        'From: agent@company.example.com\r\nTo: receiver@example.com\r\nSubject: bad\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=x\r\n\r\n--x\r\nContent-Type: text/plain\r\n\r\nbody\r\n--x\r\nContent-Type: application/pdf\r\nContent-Disposition: attachment; filename="' +
          filename +
          '"\r\n' +
          extra +
          'Content-Transfer-Encoding: base64\r\n\r\nJVBERg==\r\n--x--\r\n',
      ).toString('base64url');
      await assert.rejects(
        exec(
          bin,
          [
            'mail',
            'user_mailbox.drafts',
            'create',
            '--user-mailbox-id',
            'me',
            '--data',
            JSON.stringify({ raw }),
            '--as',
            'user',
          ],
          { env: { ...process.env, FEISHU_MOCK_URL: a.url } },
        ),
      );
      assert.equal(a.calls.at(-1)?.status, status);
      assert.deepEqual(a.world, before);
      assert.equal(a.calls.at(-1)?.mutations.length, 0);
    }
  } finally {
    await a.close();
  }
});
