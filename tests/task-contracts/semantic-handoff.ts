import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TaskFixture } from '../helpers/task-fixture.ts';

export async function checkSemanticHandoff(fixture: TaskFixture) {
  const { grade, dir, backend, seed, expected } = fixture;
  const solved = structuredClone(backend.world);
  const forbidden = expected.forbidden_messages?.find(
    (check: { chat_id?: string; contains: string[] }) =>
      check.contains.length > 0 &&
      backend.world.messages.some(
        (m: { message_id: string; chat_id: string }) =>
          (!check.chat_id || m.chat_id === check.chat_id) &&
          !seed.messages.some(
            (old: { message_id: string }) => old.message_id === m.message_id,
          ),
      ),
  );
  if (forbidden) {
    const message = backend.world.messages.find(
      (m: { message_id: string; chat_id: string }) =>
        (!forbidden.chat_id || m.chat_id === forbidden.chat_id) &&
        !seed.messages.some(
          (old: { message_id: string }) => old.message_id === m.message_id,
        ),
    );
    assert.ok(message);
    const content = JSON.parse(message.body.content);
    message.body.content = JSON.stringify({
      ...content,
      text: content.text + ' ' + forbidden.contains.join(' '),
    });
    await grade();
    const review = JSON.parse(
      await readFile(join(dir, 'result.json'), 'utf8'),
    ).semantic;
    assert.ok(
      review.required &&
        review.deferred.some((item: string) =>
          item.startsWith('forbidden_messages['),
        ),
      'Content guard must reach the semantic judge, not a substring verdict',
    );
    Object.assign(backend.world, structuredClone(solved));
  }

  const recordBan = expected.forbidden_records?.find(
    (check: {
      equals: Record<string, unknown>;
      contains: Record<string, string>;
    }) =>
      Object.keys(check.contains).length > 0 &&
      backend.world.base.records.some(
        (record: { record_id: string; fields: Record<string, unknown> }) =>
          !seed.base.records.some(
            (old: { record_id: string }) => old.record_id === record.record_id,
          ) &&
          Object.entries(check.equals).every(
            ([field, value]) => record.fields[field] === value,
          ),
      ),
  );
  if (recordBan) {
    const record = backend.world.base.records.find(
      (record: { record_id: string; fields: Record<string, unknown> }) =>
        !seed.base.records.some(
          (old: { record_id: string }) => old.record_id === record.record_id,
        ) &&
        Object.entries(recordBan.equals).every(
          ([field, value]) => record.fields[field] === value,
        ),
    );
    assert.ok(record);
    for (const [field, text] of Object.entries(recordBan.contains)) {
      record.fields[field] = String(record.fields[field] ?? '') + ' ' + text;
    }
    await grade();
    const review = JSON.parse(
      await readFile(join(dir, 'result.json'), 'utf8'),
    ).semantic;
    assert.ok(
      review.required &&
        review.deferred.some((item: string) =>
          item.startsWith('forbidden_records['),
        ),
      'Publication meaning must reach the semantic judge',
    );
    Object.assign(backend.world, structuredClone(solved));
  }
}
