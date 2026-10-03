import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);

test('mail contact discovery reads only the explicitly seeded mailbox with pagination and isolation', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-support-1489/environment/seed.json',
      'utf8',
    ),
  );
  const owner = 'agent@company.example.com';
  seed.mail.contacts = [
    {
      id: 'c1',
      mailbox_id: owner,
      name: 'Ana',
      mail_address: 'ana@example.com',
      company: 'A',
    },
    {
      id: 'c2',
      mailbox_id: owner,
      name: 'Ben',
      mail_address: 'ben@example.com',
    },
    { id: 'c3', mailbox_id: owner, name: 'Cary', remark: 'Call first' },
    { id: 'private', mailbox_id: 'other@example.com', name: 'Other owner' },
  ];
  const a = await startMock(seed);
  const empty = structuredClone(seed);
  empty.mail.contacts = [];
  const b = await startMock(empty);
  const disabled = structuredClone(seed);
  delete disabled.mail.contacts;
  const c = await startMock(disabled);
  const cli = async (base: string, mailbox: string, token?: string) =>
    JSON.parse(
      (
        await exec(
          resolve('gyms/lark-cli/bin/lark-cli'),
          [
            'mail',
            'user_mailbox.mail_contacts',
            'list',
            '--user-mailbox-id',
            mailbox,
            '--page-size',
            '2',
            ...(token ? ['--page-token', token] : []),
            '--as',
            'user',
          ],
          { env: { ...process.env, FEISHU_MOCK_URL: base } },
        )
      ).stdout,
    ).data;
  const get = (base: string, suffix: string, bot = false, method = 'GET') =>
    fetch(base + '/open-apis/mail/v1/user_mailboxes/' + suffix, {
      method,
      headers: {
        authorization: 'Bearer local-evaluation-only' + (bot ? '-bot' : ''),
      },
    });
  try {
    const first = await cli(a.url, 'me');
    assert.deepEqual(
      first.items,
      seed.mail.contacts
        .slice(0, 2)
        .map(({ mailbox_id, ...contact }: any) => contact),
    );
    assert.equal(first.has_more, true);
    const last = await cli(a.url, owner, first.page_token);
    assert.deepEqual(last.items, [
      { id: 'c3', name: 'Cary', remark: 'Call first' },
    ]);
    assert.equal(last.has_more, false);
    assert.equal(last.page_token, undefined);
    assert.deepEqual(await cli(b.url, 'me'), { items: [], has_more: false });
    assert.equal(
      (await get(c.url, 'me/mail_contacts?page_size=2')).status,
      501,
    );
    assert.equal(
      (await get(a.url, 'other@example.com/mail_contacts?page_size=2')).status,
      403,
    );
    assert.equal(
      (await get(a.url, 'me/mail_contacts?page_size=2', true)).status,
      403,
    );
    for (const query of [
      '',
      '?page_size=0',
      '?page_size=21',
      '?page_size=-1',
      '?page_size=1.5',
      '?page_size=no',
      '?page_size=2&page_token=bad',
    ]) {
      assert.equal(
        (await get(a.url, 'me/mail_contacts' + query)).status,
        400,
        query,
      );
    }
    assert.equal(
      (await get(a.url, 'me/mail_contacts?page_size=2&query=Ana')).status,
      501,
    );
    assert.equal(
      (await get(a.url, 'me/mail_contacts', false, 'POST')).status,
      501,
    );
    assert.deepEqual(a.world, seed);
    assert.deepEqual(b.world, empty);
    assert.ok(a.calls.every((call) => !call.mutations?.length));
  } finally {
    await Promise.all([a.close(), b.close(), c.close()]);
  }
});
