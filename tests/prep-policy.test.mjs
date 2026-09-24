import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Meeting prep titles use the required marker and preserve escalation constraints', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'prep-policy-')),
    task = repo + '/tasks/automationbench-sales-811',
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
      'punctuation',
      'dated_titles',
      'missing_title_marker',
      'wrong_parent',
      'wrong_amount',
      'missing_pricing',
      'extra_vip',
      'merged_vip',
      'wrong_summary',
      'cancelled_note',
      'missing_linda',
    ]) {
      const cs = structuredClone(original),
        rs = cs.filter((c) => c[1] === '+record-upsert'),
        change = (c, f) => {
          let o = JSON.parse(c.at(-1));
          f(o);
          c[c.length - 1] = JSON.stringify(o);
        },
        hv = cs.at(-2),
        summary = cs.at(-1);
      if (mode === 'punctuation')
        rs.forEach((c) =>
          change(c, (o) => (o.title = o.title.replace(' - ', '：'))),
        );
      if (mode === 'dated_titles')
        rs.forEach((c) =>
          change(
            c,
            (o) =>
              (o.title =
                o.title.split(' - ')[1] + ' | Meeting Prep | 2026-02-21'),
          ),
        );
      if (mode === 'missing_title_marker')
        change(rs[0], (o) => (o.title = 'Carlos 会前准备'));
      if (mode === 'wrong_parent')
        change(rs[0], (o) => (o.parent_id = '003xx000004SML1'));
      if (mode === 'wrong_amount')
        change(rs[0], (o) => (o.body = o.body.replace('75000', '7500')));
      if (mode === 'missing_pricing')
        change(
          rs[0],
          (o) => (o.body = o.body.replace('pricing', 'general topics')),
        );
      if (mode === 'extra_vip') {
        const c = structuredClone(hv);
        c[c.length - 1] = 'Linda Wong SmallBiz $30,000 VIP 升级';
        cs.push(c);
      }
      if (mode === 'merged_vip')
        hv[hv.length - 1] += ' Linda Wong SmallBiz $30,000 也按 VIP 升级';
      if (mode === 'wrong_summary')
        summary[summary.indexOf('--chat-id') + 1] = 'oc_email_83';
      if (mode === 'cancelled_note') {
        const c = structuredClone(rs[0]);
        change(c, (o) => {
          o.parent_id = 'cancelled';
          o.title = 'Meeting Prep - CancelledPerson';
          o.body = 'CancelledPerson';
        });
        cs.push(c);
      }
      if (mode === 'missing_linda') cs.splice(cs.indexOf(rs[1]), 1);
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
            'punctuation',
            'dated_titles',
            'merged_vip',
            'missing_pricing',
            'wrong_amount',
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
