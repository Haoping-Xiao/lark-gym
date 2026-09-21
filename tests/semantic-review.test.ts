import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { prepareSemantic } from '../scripts/task-support/semantic.ts';

test('semantic review defers wording without dropping recipient, identity or numeric constraints', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'semantic-review-'));
  try {
    const config = join(dir, 'config.json');
    await writeFile(
      config,
      JSON.stringify({ enabled: true, text_fields: ['description'] }),
    );
    const expected = {
      creates: [
        {
          collection: 'tickets',
          priority: 'high',
          amount: 100,
          description: 'Reference wording',
        },
      ],
      messages: [{ chat_id: 'customer', contains: ['not renew'] }],
      forbidden_messages: [
        { chat_id: 'other', contains: [] },
        { chat_id: 'customer', contains: ['renew'] },
      ],
      updates: [],
    };
    const review = prepareSemantic(expected, {}, pathToFileURL(config));
    assert.equal(review.required, true);
    assert.deepEqual(expected.creates, [
      { collection: 'tickets', priority: 'high', amount: 100 },
    ]);
    assert.deepEqual(expected.messages, [
      { chat_id: 'customer', contains: [] },
    ]);
    assert.deepEqual(expected.forbidden_messages, [
      { chat_id: 'other', contains: [] },
    ]);
    assert.equal(review.original.creates[0].description, 'Reference wording');
    assert.ok(review.deferred.includes('forbidden_messages[1].meaning'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
