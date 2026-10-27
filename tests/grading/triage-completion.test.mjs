import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('Email read completion requires its own escalation and applied labels', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'routing-')),
    task = repo + '/tasks' + '/automationbench-sales-1141',
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
  for (const mode of [
    'reference',
    'spaced',
    'positive_first',
    'per_email',
    'labels_before_read',
    'early_second',
    'early_label',
    'missing_original',
    'failed_escalation',
  ]) {
    const cs = structuredClone(original),
      notices = cs.filter((c) => c[0] === 'mail' && c[1] === '+send'),
      updates = cs.filter(
        (c) => c[1] === 'user_mailbox.messages' && c[2] === 'modify',
      ),
      summary = cs.find((c) => c[1] === '+messages-send'),
      reads = cs.filter(
        (c) => !notices.includes(c) && !updates.includes(c) && c !== summary,
      ),
      get = (c) => JSON.parse(c[c.indexOf('--data') + 1]),
      put = (c, v) => (c[c.indexOf('--data') + 1] = JSON.stringify(v));
    let commands = cs;
    if (mode === 'spaced') {
      const o = get(updates[1]);
      updates[1][updates[1].indexOf('--data') + 1] = JSON.stringify(o, null, 2);
    }
    if (mode === 'positive_first')
      commands = [
        ...reads,
        updates[1],
        updates[2],
        updates[4],
        ...notices,
        updates[0],
        updates[3],
        summary,
      ];
    if (mode === 'per_email')
      commands = [
        ...reads,
        notices[0],
        updates[0],
        updates[1],
        notices[1],
        updates[3],
        updates[2],
        updates[4],
        summary,
      ];
    if (mode === 'early_second')
      commands = [
        ...reads,
        notices[0],
        updates[3],
        notices[1],
        updates[0],
        updates[1],
        updates[2],
        updates[4],
        summary,
      ];
    if (['labels_before_read', 'early_label'].includes(mode)) {
      const split = updates.map((c) => {
        const o = get(c),
          label = structuredClone(c),
          read = structuredClone(c);
        put(label, {
          add_label_ids: o.add_label_ids,
          remove_label_ids: o.remove_label_ids.filter((x) => x !== 'UNREAD'),
        });
        put(read, { remove_label_ids: ['UNREAD'] });
        return mode === 'early_label' ? [read, label] : [label, read];
      });
      commands = [...reads, ...notices, ...split.flat(), summary];
    }
    if (mode === 'missing_original')
      notices[1][notices[1].indexOf('--body') + 1] =
        '[ESCALATION] Wonderful experience with your support team\nFrom: frustrated@customer.example.com\nCustomer was unhappy.';
    if (mode === 'wrong_summary')
      summary[summary.length - 1] =
        '5 processed | 1 escalation | happy-customer=3 | standard-inquiry=1';
    if (mode === 'failed_escalation') {
      const bad = structuredClone(notices[1]);
      bad[bad.indexOf('--mailbox') + 1] = 'missing@invalid.example';
      commands = [
        ...reads,
        notices[0],
        bad,
        updates[3],
        notices[1],
        updates[0],
        updates[1],
        updates[2],
        updates[4],
        summary,
      ];
    }
    const b = await startMock(seed);
    try {
      for (const c of commands) {
        try {
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        } catch (e) {
          if (
            mode !== 'failed_escalation' ||
            !c.includes('missing@invalid.example')
          )
            throw e;
        }
      }
      const errors = b.calls.filter((c) => c.status >= 400);
      if (errors.length && mode !== 'failed_escalation') throw Error(mode);
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
          'spaced',
          'positive_first',
          'per_email',
          'labels_before_read',
        ].includes(mode),
        mode,
      );
    } finally {
      await b.close();
    }
  }
  await fs.rm(a, { recursive: true, force: true });
});
