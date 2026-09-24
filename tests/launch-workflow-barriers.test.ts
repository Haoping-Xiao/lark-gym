import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import vm from 'node:vm';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('launch coordination precedes execution and summary follows all required actions', async () => {
  const task = 'tasks/automationbench-marketing-1610',
    dir = await mkdtemp(join(tmpdir(), 'launch-order-'));
  const seed = JSON.parse(
    await readFile(task + '/environment/seed.json', 'utf8'),
  );
  const src = await readFile(task + '/solution/solve.ts', 'utf8'),
    block = src
      .slice(src.indexOf('const commands'), src.indexOf('for (const args'))
      .replace('commands: string[][]', 'commands');
  const original: string[][] = JSON.parse(
    vm.runInNewContext(block + '\nJSON.stringify(commands)'),
  );
  const e = JSON.parse(await readFile(task + '/tests/expected.json', 'utf8')),
    summaryChat = e.messages.at(-1).chat_id;
  const chat = (c: string[]) =>
    c[1] === '+messages-send' ? c[c.indexOf('--chat-id') + 1] : '';
  const text = (cmd: string[], t: string) => {
    const c = structuredClone(cmd);
    c[c.indexOf('--text') + 1] = t;
    return c;
  };
  try {
    for (const mode of [
      'reference',
      'split_coord',
      'split_both',
      'reapproval_first',
      'email_first',
      'late_coord',
      'partial_coord_late',
      'summary_before_updates',
      'summary_before_reapproval',
      'summary_before_queue',
      'alter_title',
    ]) {
      let commands = structuredClone(original),
        coord = commands.find((c) => chat(c) === 'oc_C_lnch')!,
        review = commands.find((c) => chat(c) === 'oc_email_4')!,
        summary = commands.find((c) => chat(c) === summaryChat)!,
        email = commands.find(
          (c) => chat(c) && c !== coord && c !== review && c !== summary,
        )!,
        split = [
          text(
            coord,
            'Prism 2.0：先协调 Social 和 Blog 的本轮发布队列时机，按本轮计划执行。',
          ),
          text(coord, 'Email 本轮发送通知；过期内容先重审，不发布。'),
        ];
      if (['split_coord', 'split_both', 'partial_coord_late'].includes(mode))
        commands.splice(commands.indexOf(coord), 1, ...split);
      if (mode === 'split_both') {
        const lines = review.at(-1)!.split('\n').slice(1);
        commands.splice(
          commands.indexOf(review),
          1,
          ...lines.map((l) => text(review, '请重审以下过期内容：\n' + l)),
        );
      }
      if (mode === 'reapproval_first') {
        commands = commands.filter((c) => c !== review);
        commands.splice(commands.indexOf(coord), 0, review);
      }
      if (mode === 'email_first') {
        commands = commands.filter((c) => c !== email);
        commands.splice(commands.indexOf(coord) + 1, 0, email);
      }
      if (mode === 'late_coord') {
        commands = commands.filter((c) => c !== coord);
        commands.splice(commands.indexOf(summary), 0, coord);
      }
      if (mode === 'partial_coord_late') {
        commands = commands.filter((c) => c !== split[1]);
        commands.splice(commands.indexOf(summary), 0, split[1]);
      }
      if (mode.startsWith('summary_before_')) {
        commands = commands.filter((c) => c !== summary);
        const idx =
          mode === 'summary_before_updates'
            ? commands.findIndex((c) => c[1] === '+cells-set')
            : mode === 'summary_before_reapproval'
              ? commands.indexOf(review)
              : commands.findIndex((c) => c[1] === '+record-upsert');
        commands.splice(idx, 0, summary);
      }
      if (mode === 'missing_reapproval')
        review[review.indexOf('--text') + 1] = review
          .at(-1)!
          .split('\n')
          .filter((l) => !l.includes('LC-005'))
          .join('\n');
      if (mode === 'duplicate_coord')
        commands.splice(commands.indexOf(coord) + 1, 0, structuredClone(coord));
      if (mode === 'alter_title')
        email[email.indexOf('--text') + 1] = 'A First Look at Prism 2.0';
      const backend = await startMock(seed);
      try {
        for (const args of commands)
          await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
            env: { ...process.env, FEISHU_MOCK_URL: backend.url },
          });
        assert.equal(backend.calls.filter((c) => c.status >= 400).length, 0);
        const state = join(dir, mode + '.json'),
          output = join(dir, mode);
        await writeFile(
          state,
          JSON.stringify({ seed, world: backend.world, calls: backend.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
        });
        assert.equal(
          JSON.parse(await readFile(join(output, 'result.json'), 'utf8'))
            .business_success,
          [
            'reference',
            'split_coord',
            'split_both',
            'reapproval_first',
            'email_first',
          ].includes(mode),
          mode,
        );
      } finally {
        await backend.close();
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
