import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Webinar outreach permits per-contact order and requires completed outreach before marking', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'outreach-order-')),
    task = repo + '/tasks/automationbench-sales-816',
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
      'per_contact',
      'marcus_first',
      'marker_context',
      'marcus_early',
      'rachel_early',
      'summary_early',
      'missing_marker',
      'missing_invite',
      'wrong_profile',
      'wrong_status',
      'wrong_date',
      'wrong_audience',
    ]) {
      let cs = structuredClone(original);
      const inv = cs.find(
          (c) => c[1] === '+record-upsert' && !c.includes('--record-id'),
        ),
        updates = cs.filter((c) => c.includes('--record-id')),
        msgs = cs.filter((c) => c[1] === '+messages-send'),
        reads = cs.filter(
          (c) => c[1] === '+record-list' || c[1] === '+chat-messages-list',
        ),
        change = (c, f) => {
          let o = JSON.parse(c.at(-1));
          f(o);
          c[c.length - 1] = JSON.stringify(o);
        };
      if (mode === 'per_contact')
        cs = [...reads, msgs[0], updates[0], msgs[1], inv, updates[1], msgs[2]];
      if (mode === 'marcus_first')
        cs = [...reads, inv, updates[1], msgs[0], updates[0], msgs[1], msgs[2]];
      if (mode === 'marker_context')
        updates.forEach((c) =>
          change(
            c,
            (o) =>
              (o.description =
                '2026-02-24: Webinar invite sent — AI Transformation in Enterprise'),
          ),
        );
      if (mode === 'marcus_early')
        cs = [...reads, msgs[0], msgs[1], ...updates, inv, msgs[2]];
      if (mode === 'rachel_early')
        cs = [...reads, inv, updates[0], msgs[0], msgs[1], updates[1], msgs[2]];
      if (mode === 'summary_early')
        cs = [...reads, inv, msgs[0], msgs[1], msgs[2], ...updates];
      if (mode === 'missing_marker')
        change(updates[0], (o) => (o.description = '已发送研讨会邀请'));
      if (mode === 'missing_invite') cs.splice(cs.indexOf(inv), 1);
      if (mode === 'wrong_profile')
        change(inv, (o) => (o.profile_id = 'li_rachel'));
      if (mode === 'wrong_status') change(inv, (o) => (o.status = 'Accepted'));
      if (mode === 'wrong_date')
        msgs[0][msgs[0].length - 1] = msgs[0]
          .at(-1)
          .replace('March 5', 'March 6');
      if (mode === 'wrong_audience')
        msgs[0][msgs[0].indexOf('--chat-id') + 1] = 'oc_email_123';
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
            'per_contact',
            'marcus_first',
            'marker_context',
            'wrong_date',
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
