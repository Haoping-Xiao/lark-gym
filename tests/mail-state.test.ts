import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
const seed = async () => ({
  ...JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3151/environment/seed.json',
      'utf8',
    ),
  ),
  mail: {
    mailboxes: [{ email_address: 'agent@company.example.com' }],
    messages: [],
    drafts: [],
  },
});
const cli = async (url: string, ...args: string[]) =>
  JSON.parse(
    (
      await exec(
        resolve('gyms/lark-cli/bin/lark-cli'),
        ['mail', ...args, '--as', 'user', '--format', 'json'],
        { env: { ...process.env, FEISHU_MOCK_URL: url } },
      )
    ).stdout,
  );
test('native CLI draft/send/read/search share mail state, preserve MIME and isolate runs', async () => {
  const initial = await seed(),
    a = await startMock(initial),
    b = await startMock(initial);
  try {
    const output = await cli(
      a.url,
      '+send',
      '--to',
      'team@example.com',
      '--subject',
      '发布 CloudSync Pro',
      '--body',
      'launch 新产品',
    );
    assert.equal(a.world.mail!.drafts.length, 1, JSON.stringify(output));
    const draft = a.world.mail!.drafts[0];
    let msg = a.world.mail!.messages[0];
    assert.equal(msg.message_state, 3);
    assert.equal(msg.subject, '发布 CloudSync Pro');
    assert.equal(msg.to[0].mail_address, 'team@example.com');
    assert.match(
      Buffer.from(msg.body_plain_text, 'base64url').toString(),
      /launch 新产品/,
    );
    const d = await cli(
      a.url,
      'user_mailbox.drafts',
      'get',
      '--user-mailbox-id',
      'me',
      '--draft-id',
      draft.id,
      '--params',
      '{"format":"raw"}',
    );
    assert.equal(d.data.draft.message.raw, msg.raw);
    await cli(
      a.url,
      'user_mailbox.drafts',
      'send',
      '--user-mailbox-id',
      'me',
      '--draft-id',
      draft.id,
      '--yes',
    );
    msg = a.world.mail!.messages[0];
    assert.equal(msg.message_state, 2);
    assert.equal(msg.folder_id, 'SENT');
    assert.equal(a.world.mail!.drafts.length, 0);
    const read = await cli(a.url, '+messages', '--message-ids', msg.message_id);
    assert.match(JSON.stringify(read), /launch 新产品/);
    const list = await cli(a.url, '+triage', '--folder', 'SENT', '--max', '10');
    assert.match(JSON.stringify(list), /CloudSync Pro/);
    const search = await cli(a.url, '+triage', '--query', 'CloudSync');
    assert.match(JSON.stringify(search), /CloudSync Pro/);
    assert.equal(b.world.mail!.messages.length, 0);
    assert.equal(initial.mail.messages.length, 0);
    assert.ok(
      a.calls.some((c) =>
        c.mutations.some(
          (m) =>
            m.kind === 'mail_message' && (m.after as any)?.message_state === 2,
        ),
      ),
    );
    assert.ok(
      a.calls.every((c) => c.status === 200),
      JSON.stringify(a.calls.filter((c) => c.status !== 200)),
    );
  } finally {
    await a.close();
    await b.close();
  }
});
test('mail rejects wrong identity, unsupported options and repeat sends without mutations', async () => {
  const a = await startMock(await seed());
  const request = async (
    path: string,
    method = 'GET',
    body?: object,
    bot = false,
  ) =>
    fetch(a.url + '/open-apis/mail/v1/user_mailboxes/' + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: bot
          ? 'Bearer local-evaluation-only-bot'
          : 'Bearer local-evaluation-only',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  try {
    // Failures must roll back, including unsupported MIME, future sends and access.
    const raw = Buffer.from(
      'From: agent@company.example.com\r\nTo: client@example.com\r\nSubject: test\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nhello',
    ).toString('base64url');
    const created = await request('me/drafts', 'POST', { raw });
    assert.equal(created.status, 200);
    const data = (await created.json()) as any;
    const id = data.data.draft.id;
    const before = structuredClone(a.world);
    assert.equal(
      (
        await request(`me/drafts/${id}/send`, 'POST', {
          send_time: '1999999999',
        })
      ).status,
      501,
    );
    assert.deepEqual(a.world, before);
    assert.equal((await request('other@example.com/messages')).status, 403);
    assert.equal((await request('me/messages?unexpected=1')).status, 501);
    assert.deepEqual(a.world, before);
    assert.equal(
      (await request(`me/drafts/${id}/send`, 'POST', {})).status,
      200,
    );
    const sent = structuredClone(a.world);
    assert.equal(
      (await request(`me/drafts/${id}/send`, 'POST', {})).status,
      404,
    );
    assert.deepEqual(a.world, sent);
  } finally {
    await a.close();
  }
});

test('native CLI reads an incoming email and replies in its thread with a separate subject and body', async () => {
  const initial = await seed();
  (initial.mail.messages as any[]).push({
    message_id: 'incoming1',
    mailbox_id: 'agent@company.example.com',
    thread_id: 'thread1',
    smtp_message_id: 'original@client.example.com',
    message_state: 1,
    subject: 'URGENT: Service down',
    head_from: { mail_address: 'cto@client.example.com', name: '客户' },
    to: [{ mail_address: 'agent@company.example.com' }],
    cc: [],
    bcc: [],
    body_plain_text: Buffer.from('Team cannot access the platform.').toString(
      'base64url',
    ),
    body_html: '',
    body_preview: Buffer.from('Team cannot access the platform.').toString(
      'base64url',
    ),
    internal_date: String(Date.parse(initial.now)),
    folder_id: 'INBOX',
    label_ids: ['UNREAD'],
    attachments: [],
  });
  const a = await startMock(initial);
  try {
    const list = await cli(
      a.url,
      '+triage',
      '--filter',
      '{"from":["cto@client.example.com"],"is_unread":true}',
    );
    assert.match(JSON.stringify(list), /incoming1/);
    await cli(
      a.url,
      '+reply',
      '--message-id',
      'incoming1',
      '--body',
      '已收到问题，正在处理。',
      '--confirm-send',
    );
    const reply = a.world.mail!.messages.find((m) => m.message_state === 2)!;
    assert.ok(reply);
    assert.equal(reply.thread_id, 'thread1');
    assert.equal(reply.in_reply_to, 'original@client.example.com');
    assert.equal(reply.to[0].mail_address, 'cto@client.example.com');
    assert.match(reply.subject, /^Re:.*URGENT/);
    assert.match(
      Buffer.from(reply.body_plain_text, 'base64url').toString(),
      /已收到问题/,
    );
    assert.equal(
      a.world.messages.length,
      initial.messages.length,
      'mail sends must not fabricate IM',
    );
    assert.ok(
      a.calls.every((c) => c.status === 200),
      JSON.stringify(a.calls.filter((c) => c.status !== 200)),
    );
  } finally {
    await a.close();
  }
});

test('mail paging, body projections, labels and rejected MIME remain consistent', async () => {
  const a = await startMock(await seed());
  const call = async (
    tail: string,
    method = 'GET',
    body?: object,
    bot = false,
  ) => {
    const r = await fetch(
      a.url + '/open-apis/mail/v1/user_mailboxes/me/' + tail,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: bot
            ? 'Bearer local-evaluation-only-bot'
            : 'Bearer local-evaluation-only',
        },
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    return { status: r.status, data: ((await r.json()) as any).data };
  };
  try {
    for (const subject of ['One', 'Two', 'Three'])
      await cli(
        a.url,
        '+send',
        '--to',
        'client@example.com',
        '--subject',
        subject,
        '--body',
        '正文',
        '--confirm-send',
      );
    const first = await call('messages?page_size=2&folder_id=SENT');
    assert.equal(first.data.items.length, 2);
    assert.equal(first.data.has_more, true);
    const second = await call(
      'messages?page_size=2&folder_id=SENT&page_token=' + first.data.page_token,
    );
    assert.equal(second.data.items.length, 1);
    assert.equal(second.data.has_more, false);
    assert.equal(new Set([...first.data.items, ...second.data.items]).size, 3);
    const id = first.data.items[0];
    const meta = await call('messages/' + id + '?format=metadata');
    assert.equal(meta.data.message.body_plain_text, undefined);
    assert.equal(
      (
        await call('messages/' + id + '/modify', 'PUT', {
          add_label_ids: ['UNREAD'],
          add_folder: 'ARCHIVED',
        })
      ).status,
      200,
    );
    const filtered = await call('search', 'POST', {
      filter: { folder: ['archive'], is_unread: true },
    });
    assert.equal(filtered.data.items.length, 1);
    assert.equal(filtered.data.items[0].meta_data.message_biz_id, id);
    const before = structuredClone(a.world);
    assert.equal((await call('messages', 'GET', undefined, true)).status, 403);
    assert.equal((await call('messages?page_size=-1')).status, 400);
    assert.equal((await call('drafts', 'POST', { raw: 'bad' })).status, 400);
    const wrongFrom = Buffer.from(
      'From: stranger@example.com\r\nTo: client@example.com\r\n\r\nhello',
    ).toString('base64url');
    assert.equal(
      (await call('drafts', 'POST', { raw: wrongFrom })).status,
      400,
    );
    const attached = Buffer.from(
      'From: agent@company.example.com\r\nTo: client@example.com\r\nContent-Type: application/octet-stream\r\nContent-Disposition: attachment; filename=a.bin\r\n\r\ndata',
    ).toString('base64url');
    assert.equal((await call('drafts', 'POST', { raw: attached })).status, 501);
    assert.deepEqual(a.world, before);
    assert.ok(
      a.calls
        .filter((c) => c.status >= 400)
        .every((c) => !c.changed && c.mutations.length === 0),
    );
  } finally {
    await a.close();
  }
});

test('HTML-only mail exposes visible plain text, not attributes or scripts', async () => {
  const a = await startMock(await seed());
  try {
    await cli(
      a.url,
      '+send',
      '--to',
      'team@example.com',
      '--subject',
      'HTML test',
      '--body',
      '<p>CloudSync &amp; Pro <b>launch</b></p>',
      '--confirm-send',
    );
    const m = a.world.mail!.messages[0];
    assert.equal(
      Buffer.from(m.body_plain_text, 'base64url').toString(),
      'CloudSync & Pro launch',
    );
    const result = await cli(
      a.url,
      '+messages',
      '--message-ids',
      m.message_id,
      '--html=false',
    );
    assert.match(JSON.stringify(result), /CloudSync & Pro launch/);
  } finally {
    await a.close();
  }
});

test('seeded shared mailbox access is discoverable and does not imply access to other addresses', async () => {
  const initial = await seed();
  initial.mail.mailboxes.push({ email_address: 'support@company.example.com' });
  const a = await startMock(initial);
  try {
    const result = await cli(
      a.url,
      'user_mailboxes',
      'accessible_mailboxes',
      '--user-mailbox-id',
      'me',
    );
    assert.ok(
      result.data.accessible_mailboxes.some(
        (m: any) =>
          m.email_address === 'support@company.example.com' &&
          m.email_type === 'PUBLIC_MAILBOX',
      ),
    );
    await cli(
      a.url,
      '+send',
      '--mailbox',
      'support@company.example.com',
      '--to',
      'client@example.com',
      '--subject',
      'Support reply',
      '--body',
      'Received',
      '--confirm-send',
    );
    assert.equal(
      a.world.mail!.messages[0].head_from.mail_address,
      'support@company.example.com',
    );
    assert.equal(
      a.world.mail!.messages[0].mailbox_id,
      'support@company.example.com',
    );
    const own = await cli(a.url, '+triage', '--folder', 'SENT');
    assert.equal(own.messages.length, 0);
    const shared = await cli(
      a.url,
      '+triage',
      '--mailbox',
      'support@company.example.com',
      '--folder',
      'SENT',
    );
    assert.equal(shared.messages.length, 1);
    await assert.rejects(
      cli(a.url, '+triage', '--mailbox', 'finance@company.example.com'),
    );
  } finally {
    await a.close();
  }
});
