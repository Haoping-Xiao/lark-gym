import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('real CLI directory aliases round-trip through profiles and membership state', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-hr-5029/environment/seed.json',
      'utf8',
    ),
  );
  seed.chats.push({
    chat_id: 'oc_email_test',
    name: 'payables@meridian.example.com',
    chat_mode: 'p2p',
  });
  const backend = await startMock(seed),
    other = await startMock(seed);
  const cli = async (server: typeof backend, ...args: string[]) =>
    JSON.parse(
      (
        await exec(
          resolve('gyms/lark-cli/bin/lark-cli'),
          [...args, '--format', 'json'],
          { env: { ...process.env, FEISHU_MOCK_URL: server.url } },
        )
      ).stdout,
    ).data;
  try {
    const found = await cli(
      backend,
      'contact',
      '+search-user',
      '--query',
      'Sarah',
    );
    assert.equal(found.users.length, 1);
    const user = found.users[0];
    assert.equal(user.localized_name, 'Sarah Nakamura');
    assert.equal(user.p2p_chat_id, 'oc_user_U_SARAH');
    assert.match(user.open_id, /^ou_mock_/);
    const profile = await cli(
      backend,
      'contact',
      '+get-user',
      '--user-id',
      user.open_id,
    );
    assert.equal(profile.user.user_id, 'U_SARAH');
    assert.equal(profile.user.name, user.localized_name);
    const canonical = await cli(
      backend,
      'contact',
      '+get-user',
      '--user-id',
      'U_SARAH',
      '--user-id-type',
      'user_id',
    );
    assert.equal(canonical.user.open_id, user.open_id);
    await cli(
      backend,
      'im',
      'chat.members',
      'create',
      '--chat-id',
      'oc_C_ENG',
      '--member-id-type',
      'open_id',
      '--data',
      JSON.stringify({ id_list: [user.open_id] }),
    );
    const members = await cli(
      backend,
      'im',
      '+chat-members-list',
      '--chat-id',
      'oc_C_ENG',
    );
    assert.equal(members.users[0].member_id, user.open_id);
    assert.match(
      JSON.stringify(
        await cli(backend, 'im', '+chat-search', '--member-ids', user.open_id),
      ),
      /oc_C_ENG/,
    );
    const recipient = (
      await cli(
        backend,
        'contact',
        '+search-user',
        '--query',
        'payables@meridian.example.com',
      )
    ).users[0];
    assert.equal(recipient.localized_name, 'payables@meridian.example.com');
    assert.equal(recipient.p2p_chat_id, 'oc_email_test');
    assert.equal(
      (
        await cli(
          backend,
          'contact',
          '+get-user',
          '--user-id',
          recipient.open_id,
        )
      ).user.email,
      'payables@meridian.example.com',
    );
    const canonicalMembers = await cli(
      backend,
      'im',
      '+chat-members-list',
      '--chat-id',
      'oc_C_ENG',
      '--member-id-type',
      'user_id',
    );
    assert.equal(canonicalMembers.users[0].member_id, 'U_SARAH');
    assert.equal(
      (await cli(other, 'im', '+chat-members-list', '--chat-id', 'oc_C_ENG'))
        .users.length,
      0,
    );
    assert.equal(
      (await cli(other, 'contact', '+search-user', '--query', 'Sarah')).users[0]
        .open_id,
      user.open_id,
    );
    await assert.rejects(
      cli(
        backend,
        'im',
        'chat.members',
        'create',
        '--chat-id',
        'oc_C_ENG',
        '--member-id-type',
        'open_id',
        '--data',
        JSON.stringify({ id_list: [user.open_id, 'ou_unknown'] }),
      ),
      /Unknown user ID/,
    );
    assert.deepEqual(
      backend.world.chats.find((x: any) => x.chat_id === 'oc_C_ENG')!
        .member_ids,
      ['U_SARAH'],
    );
    await cli(
      backend,
      'im',
      'chat.members',
      'delete',
      '--yes',
      '--chat-id',
      'oc_C_ENG',
      '--member-id-type',
      'open_id',
      '--data',
      JSON.stringify({ id_list: [user.open_id] }),
    );
    assert.equal(
      (await cli(backend, 'im', '+chat-members-list', '--chat-id', 'oc_C_ENG'))
        .users.length,
      0,
    );
    await assert.rejects(
      cli(
        backend,
        'contact',
        '+search-user',
        '--query',
        'Sarah',
        '--left-organization',
      ),
      /ENV_UNSUPPORTED/,
    );
  } finally {
    await backend.close();
    await other.close();
  }
});
