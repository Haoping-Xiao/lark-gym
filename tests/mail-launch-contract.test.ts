import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('launch contract requires a sent email, its own subject/body and the announcement', async () => {
  const root = resolve('tasks/automationbench-simple-3175');
  const seed = JSON.parse(
    await readFile(root + '/environment/seed.json', 'utf8'),
  );
  for (const mode of [
    'complete',
    'html',
    'draft',
    'im_only',
    'subject_only',
    'wrong_to',
    'extra',
    'noop',
  ]) {
    const b = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'mail-contract-'));
    const cli = (args: string[]) =>
      exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
        env: { ...process.env, FEISHU_MOCK_URL: b.url },
      });
    try {
      if (mode !== 'noop')
        await cli([
          'im',
          '+messages-send',
          '--chat-id',
          'oc_CGEN01',
          '--text',
          'CloudSync Pro launch 今天正式发布！',
        ]);
      if (!['noop', 'im_only'].includes(mode)) {
        const args = [
          'mail',
          '+send',
          '--to',
          mode === 'wrong_to'
            ? 'other@example.com'
            : 'team@company.example.com',
          '--subject',
          'CloudSync Pro Launch',
          '--body',
          mode === 'html'
            ? '<p>CloudSync Pro launch 今天发布。</p>'
            : mode === 'subject_only'
              ? '今天发布 CloudSync Pro。'
              : 'CloudSync Pro launch 今天正式发布。',
          '--as',
          'user',
        ];
        if (mode !== 'draft') args.push('--confirm-send');
        await cli(args);
        if (mode === 'extra') await cli(args);
      }
      const state = join(dir, 'state.json');
      await writeFile(
        state,
        JSON.stringify({ seed, world: b.world, calls: b.calls }),
      );
      await exec(process.execPath, [root + '/tests/verify.ts'], {
        env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: dir },
      });
      const result = JSON.parse(
        await readFile(join(dir, 'result.json'), 'utf8'),
      );
      assert.equal(
        result.business_success,
        ['complete', 'html'].includes(mode),
        mode,
      );
      assert.ok(
        result.semantic.deferred.includes('mail.content'),
        'email meaning must receive independent review',
      );
      if (mode === 'subject_only')
        assert.equal(
          result.mailChecks[0].passed,
          false,
          'subject must not satisfy a body requirement',
        );
    } finally {
      await b.close();
      await rm(dir, { recursive: true, force: true });
    }
  }
});
