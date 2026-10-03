import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);

test('real CLI comment reads share scoped state, pagination and trial isolation', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-finance-4008/environment/seed.json',
      'utf8',
    ),
  );
  const token = Object.keys(seed.spreadsheets)[0];
  seed.drive_comments = [
    {
      file_token: token,
      file_type: 'sheet',
      comment_id: 'c1',
      is_solved: false,
      is_whole: true,
      reply_list: {
        replies: [
          {
            reply_id: 'r1',
            content: {
              elements: [
                { type: 'text_run', text_run: { text: 'Check invoice' } },
              ],
            },
          },
          {
            reply_id: 'r2',
            content: {
              elements: [{ type: 'text_run', text_run: { text: 'Reviewed' } }],
            },
          },
        ],
      },
    },
    {
      file_token: token,
      file_type: 'sheet',
      comment_id: 'c2',
      is_solved: false,
      is_whole: false,
    },
    {
      file_token: 'base_crm',
      file_type: 'bitable',
      comment_id: 'other',
      is_solved: false,
      is_whole: true,
    },
  ];
  const first = await startMock(seed),
    second = await startMock(seed);
  const cli = async (backend: typeof first, ...args: string[]) =>
    JSON.parse(
      (
        await exec(
          resolve('gyms/lark-cli/bin/lark-cli'),
          ['drive', ...args, '--format', 'json'],
          { env: { ...process.env, FEISHU_MOCK_URL: backend.url } },
        )
      ).stdout,
    ).data;
  const target = ['--token', token, '--type', 'sheet'];
  try {
    const one = await cli(
      first,
      '+list-comments',
      ...target,
      '--page-size',
      '1',
    );
    assert.deepEqual(
      one.items.map((x: any) => x.comment_id),
      ['c1'],
    );
    assert.equal(one.has_more, true);
    const two = await cli(
      first,
      '+list-comments',
      ...target,
      '--page-size',
      '1',
      '--page-token',
      one.page_token,
    );
    assert.deepEqual(
      two.items.map((x: any) => x.comment_id),
      ['c2'],
    );
    const whole = await cli(
      first,
      '+list-comments',
      ...target,
      '--comment-scope',
      'whole',
    );
    assert.deepEqual(
      whole.items.map((x: any) => x.comment_id),
      ['c1'],
    );
    first.world.drive_comments![0].is_solved = true;
    const batch = await cli(
      first,
      '+batch-query-comments',
      ...target,
      '--comment-ids',
      'c1',
    );
    assert.equal(batch.items[0].is_solved, true);
    const solved = await cli(
      first,
      '+list-comments',
      ...target,
      '--solved-status',
      'true',
    );
    assert.deepEqual(
      solved.items.map((x: any) => x.comment_id),
      ['c1'],
    );
    const isolated = await cli(second, '+list-comments', ...target);
    assert.equal(isolated.count, 2);
    const replies = await cli(
      first,
      '+list-replies',
      ...target,
      '--comment-id',
      'c1',
      '--page-size',
      '1',
    );
    assert.equal(replies.items[0].reply_id, 'r1');
    assert.equal(replies.has_more, true);
    await assert.rejects(
      cli(first, '+batch-query-comments', ...target, '--comment-ids', 'other'),
      /Comment not found/,
    );
    await assert.rejects(
      cli(first, '+list-comments', '--token', 'missing', '--type', 'sheet'),
      /File not found/,
    );
    await assert.rejects(
      cli(first, '+list-comments', ...target, '--need-reaction'),
      /ENV_UNSUPPORTED/,
    );
    const fresh = await startMock({ ...seed, drive_comments: undefined });
    try {
      assert.equal(
        (
          await cli(
            fresh,
            '+list-comments',
            ...target,
            '--solved-status',
            'all',
          )
        ).count,
        0,
      );
    } finally {
      await fresh.close();
    }
  } finally {
    await first.close();
    await second.close();
  }
});
