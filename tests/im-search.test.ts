import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('Real CLI search paginates live messages, enriches details and filters time/chat', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-finance-4001/environment/seed.json',
      'utf8',
    ),
  );
  const backend = await startMock(seed);
  const cli = async (args: string[]) =>
    JSON.parse(
      (
        await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
          env: { ...process.env, FEISHU_MOCK_URL: backend.url },
        })
      ).stdout,
    );
  try {
    await cli([
      'im',
      '+messages-send',
      '--chat-id',
      'oc_mail',
      '--text',
      'search-needle first',
    ]);
    await cli([
      'im',
      '+messages-send',
      '--chat-id',
      'oc_mail',
      '--text',
      'search-needle second',
    ]);
    await cli([
      'im',
      '+messages-send',
      '--chat-id',
      'oc_email_0',
      '--text',
      'search-needle unrelated',
    ]);
    const result = await cli([
      'im',
      '+messages-search',
      '--query',
      'search-needle',
      '--chat-id',
      'oc_mail',
      '--page-size',
      '1',
      '--page-all',
    ]);
    const text = JSON.stringify(result);
    assert.match(text, /search-needle first/);
    assert.match(text, /search-needle second/);
    assert.doesNotMatch(text, /search-needle unrelated/);
    assert.ok(backend.calls.some((c) => c.path.includes('page_token=1')));
    assert.ok(backend.calls.some((c) => c.path.includes('/messages/mget')));
    assert.ok(backend.calls.some((c) => c.path.includes('/chats/batch_query')));
    assert.equal(
      backend.calls.some((c) => c.status === 501),
      false,
    );
    const earlier = await cli([
      'im',
      '+messages-search',
      '--query',
      'search-needle',
      '--end',
      '2026-02-03T08:00:00Z',
    ]);
    assert.doesNotMatch(JSON.stringify(earlier), /search-needle first/);
    await assert.rejects(
      cli([
        'im',
        '+messages-search',
        '--query',
        'search-needle',
        '--sender',
        'ou_unknown',
      ]),
    );
    assert.equal(backend.calls.at(-1)?.status, 501);
    assert.equal(backend.calls.at(-1)?.changed, false);
  } finally {
    await backend.close();
  }
});
