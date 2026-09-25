import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Recording notes accept natural titles while retaining links and recipients', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'recording-title-')),
    task = repo + '/tasks/automationbench-sales-814',
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
      'chinese_title',
      'natural_title',
      'wrong_parent',
      'missing_link',
      'wrong_link',
      'wrong_title',
      'missing_cc',
      'external_discovery',
      'optout_training',
      'old_meeting',
      'wrong_count',
    ]) {
      const cs = structuredClone(original),
        note = cs.find((c) => c[1] === '+record-upsert'),
        msgs = cs.filter((c) => c[1] === '+messages-send'),
        change = (c, f) => {
          let o = JSON.parse(c.at(-1));
          f(o);
          c[c.length - 1] = JSON.stringify(o);
        };
      if (mode === 'chinese_title')
        change(note, (o) => (o.title = 'Discovery 会议录制'));
      if (mode === 'natural_title')
        change(
          note,
          (o) =>
            (o.title =
              'TechStart Solutions — Discovery Call recording, 2026-02-19'),
        );
      if (mode === 'wrong_parent')
        change(note, (o) => (o.parent_id = '006xx000004ACM1'));
      if (mode === 'missing_link')
        change(note, (o) => (o.body = 'Discovery Call - TechStart Solutions'));
      if (mode === 'wrong_link')
        change(
          note,
          (o) => (o.body = o.body.replace('mtg_disc_001', 'mtg_demo_001')),
        );
      if (mode === 'wrong_title')
        change(
          note,
          (o) => (o.title = 'TechStart Discovery 录制已删除，不可访问'),
        );
      if (mode === 'missing_cc') cs.splice(cs.indexOf(msgs[1]), 1);
      if (mode === 'external_discovery')
        msgs[5][msgs[5].indexOf('--chat-id') + 1] = 'oc_email_83';
      if (mode === 'optout_training')
        msgs[4][msgs[4].indexOf('--chat-id') + 1] = 'oc_email_32';
      if (mode === 'old_meeting') {
        const c = structuredClone(msgs[0]);
        c[c.indexOf('--chat-id') + 1] = 'oc_email_16';
        c[c.length - 1] =
          'Recording: Product Demo - BlueSky Corp\nhttps://zoom.us/rec/mtg_old_demo_002';
        cs.push(c);
      }
      if (mode === 'wrong_count')
        msgs[7][msgs[7].length - 1] = msgs[7]
          .at(-1)
          .replace('3份通知', '4份通知');
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
            'chinese_title',
            'natural_title',
            'wrong_count',
            'wrong_title',
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
