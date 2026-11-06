import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
const seed = JSON.parse(
  await readFile('tasks/maintenance-notice/environment/seed.json', 'utf8'),
);
async function send(mock: Awaited<ReturnType<typeof startMock>>, text: string) {
  const response = await fetch(
    mock.url + '/open-apis/im/v1/messages?receive_id_type=chat_id',
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer local-evaluation-only',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        receive_id: 'oc_it_ops',
        msg_type: 'text',
        content: JSON.stringify({ text }),
      }),
    },
  );
  assert.equal(response.status, 200);
  return (await response.json()).data;
}
async function assertReadback(
  mock: Awaited<ReturnType<typeof startMock>>,
  id: string,
  text: string,
) {
  for (const path of [
    `/open-apis/im/v1/messages/${id}`,
    '/open-apis/im/v1/messages?container_id_type=chat&container_id=oc_it_ops',
  ]) {
    const response = await fetch(mock.url + path, {
      headers: { authorization: 'Bearer local-evaluation-only' },
    });
    assert.equal(response.status, 200);
    const matches = (await response.json()).data.items.filter(
      (m: any) => m.message_id === id,
    );
    assert.equal(matches.length, 1);
    assert.equal(JSON.parse(matches[0].body.content).text, text);
  }
}
test('sending after seeded messages allocates a unique ID and reads back the new content', async () => {
  const initial = structuredClone(seed);
  initial.messages = [
    {
      message_id: 'om_1',
      chat_id: 'oc_it_ops',
      msg_type: 'text',
      body: { content: JSON.stringify({ text: 'old' }) },
    },
  ];
  const mock = await startMock(initial);
  try {
    const sent = await send(mock, 'new');
    assert.notEqual(sent.message_id, 'om_1');
    await assertReadback(mock, sent.message_id, 'new');
    await assertReadback(mock, 'om_1', 'old');
  } finally {
    await mock.close();
  }
});
test('sending after serialized state reload preserves message identity and history', async () => {
  const first = await startMock(seed);
  let snapshot, previous;
  try {
    previous = await send(first, 'before reload');
    snapshot = JSON.parse(JSON.stringify(first.world));
  } finally {
    await first.close();
  }
  const second = await startMock(snapshot);
  try {
    const sent = await send(second, 'after reload');
    assert.notEqual(sent.message_id, previous.message_id);
    await assertReadback(second, sent.message_id, 'after reload');
    await assertReadback(second, previous.message_id, 'before reload');
  } finally {
    await second.close();
  }
});
