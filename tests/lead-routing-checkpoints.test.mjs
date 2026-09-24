import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('Lead routing accepts coherent classification pairs and per-source completion', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'lead-routing-')),
    task = repo + '/tasks/automationbench-sales-1131',
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
    'per_person',
    'low_seven',
    'low_eight',
    'medium_seven',
    'high_nine',
    'early_notice',
    'wrong_status_at_read',
    'restored_before_read',
  ]) {
    const cs = structuredClone(original),
      reads = cs.slice(0, 4),
      creates = cs.slice(4, 7),
      notices = cs.slice(7, 9),
      marks = cs.slice(9, 12),
      summary = cs[12];
    let commands = cs;
    const o = JSON.parse(creates[1].at(-1));
    if (
      [
        'low_seven',
        'low_seven_per_person',
        'low_eight',
        'cold_route',
        'wrong_notice_score',
      ].includes(mode)
    ) {
      o.urgency = 'low';
      o.score = mode === 'low_eight' ? 8 : 7;
    }
    if (mode === 'medium_seven') o.score = 7;
    if (mode === 'high_nine') {
      o.urgency = 'high';
      o.score = 9;
    }
    if (mode === 'cold_route') o.status = 'Cold';
    creates[1][creates[1].length - 1] = JSON.stringify(o);
    if (mode.startsWith('low_seven') || mode === 'cold_route')
      notices[1][notices[1].length - 1] = notices[1]
        .at(-1)
        .replace('score=8', 'score=7');
    if (['per_person', 'reverse', 'low_seven_per_person'].includes(mode)) {
      let groups = [
        [creates[0], notices[0], marks[0]],
        [creates[1], notices[1], marks[1]],
        [creates[2], marks[2]],
      ];
      if (mode === 'reverse') groups.reverse();
      commands = [...reads, ...groups.flat(), summary];
    }
    if (mode === 'early_lead')
      commands = [
        ...reads,
        marks[0],
        ...creates,
        ...notices,
        ...marks.slice(1),
        summary,
      ];
    if (mode === 'early_notice')
      commands = [
        ...reads,
        ...creates,
        marks[0],
        ...notices,
        ...marks.slice(1),
        summary,
      ];
    if (mode === 'wrong_recipient_order')
      commands = [
        ...reads,
        ...creates,
        notices[1],
        marks[0],
        notices[0],
        ...marks.slice(1),
        summary,
      ];
    if (mode === 'missing_cold')
      commands = [
        ...reads,
        ...creates.slice(0, 2),
        ...notices,
        ...marks,
        summary,
      ];
    if (mode === 'wrong_summary')
      summary[summary.length - 1] =
        '2 leads processed | hot=1 | warm=1 | cold=0';
    if (mode === 'cold_notice') {
      let m = structuredClone(notices[0]);
      m[m.length - 1] = 'Sam Lee | Cold | score=2';
      commands = [...cs, m];
    }
    const b = await startMock(seed);
    try {
      if (['wrong_status_at_read', 'restored_before_read'].includes(mode)) {
        const run = (c) =>
          exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        for (const c of [...reads, ...creates, ...notices]) await run(c);
        const id = b.calls.find(
          (c) => c.method === 'POST' && c.path.includes('/records'),
        )?.response?.data?.record_id;
        if (!id) throw Error('id');
        const patch = (status) =>
          run([
            ...creates[0].slice(0, creates[0].indexOf('--json')),
            '--record-id',
            id,
            '--json',
            JSON.stringify({ status }),
          ]);
        await patch('New');
        if (mode === 'restored_before_read') await patch('Hot');
        for (const c of marks) await run(c);
        if (mode === 'wrong_status_at_read') await patch('Hot');
        await run(summary);
      } else
        for (const c of commands)
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
          'per_person',
          'low_seven',
          'restored_before_read',
        ].includes(mode),
        mode,
      );
    } finally {
      await b.close();
    }
  }
  await fs.rm(a, { recursive: true, force: true });
});
