import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startMock } from '../../gyms/lark-cli/src/server.ts';

test('unsupported requests are recorded without changes and do not prevent later writes', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3151/environment/seed.json',
      'utf8',
    ),
  );
  seed.chats = [{ chat_id: 'oc_continue', name: 'Group', chat_mode: 'group' }];
  const backend = await startMock(seed);
  try {
    const headers = {
      authorization: 'Bearer local-evaluation-only',
      'content-type': 'application/json',
    };
    const missing = await fetch(backend.url + '/open-apis/missing/v1/objects', {
      headers,
    });
    assert.equal(missing.status, 501);
    assert.match((await missing.json()).msg, /ENV_UNSUPPORTED/);
    assert.deepEqual(backend.world, seed);
    const response = await fetch(
      backend.url + '/open-apis/im/v1/messages?receive_id_type=chat_id',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          receive_id: 'oc_continue',
          msg_type: 'text',
          content: JSON.stringify({ text: 'valid write' }),
        }),
      },
    );
    assert.equal(response.status, 200);
    assert.equal(backend.calls.length, 2);
    assert.equal(backend.calls[0].changed, false);
    assert.deepEqual(backend.calls[0].mutations, []);
    assert.equal(backend.calls[1].changed, true);
  } finally {
    await backend.close();
  }
});
