import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
test('Engagement reporting permits scoped splits and retains source guards', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'native-410-')),
    t = r + '/tasks/automationbench-support-1479',
    seed = JSON.parse(await fs.readFile(t + '/environment/seed.json')),
    src = await fs.readFile(t + '/solution/solve.ts', 'utf8'),
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
    'split',
    'reverse_split',
    'mail_split',
    'future_score_two',
    'missing_customer',
    'duplicate',
    'wrong_batch',
    'wrong_recipient',
    'engaged_in_alert',
    'modified_history',
    'excluded_event_disclosure',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      mail = cs.find((c) => c[0] === 'mail' && c[1] === '+send'),
      group = cs.find((c) => c[0] === 'im' && c[1] === '+messages-send');
    if (['split', 'reverse_split', 'mail_split'].includes(mode)) {
      const c = mode === 'mail_split' ? mail : group,
        key = mode === 'mail_split' ? '--body' : '--text',
        lines = val(c, key).split('\n'),
        parts = [lines.slice(0, 4).join('\n'), lines.slice(4).join('\n')],
        a = structuredClone(c),
        b = structuredClone(c);
      set(a, key, parts[0]);
      set(b, key, parts[1]);
      cs.splice(
        cs.indexOf(c),
        1,
        ...(mode === 'reverse_split' ? [b, a] : [a, b]),
      );
    }
    if (mode === 'future_score_two')
      for (const [c, key] of [
        [mail, '--body'],
        [group, '--text'],
      ])
        set(c, key, val(c, key).replaceAll('score=0', 'score=2'));
    if (mode === 'missing_customer')
      for (const [c, key] of [
        [mail, '--body'],
        [group, '--text'],
      ])
        set(
          c,
          key,
          val(c, key)
            .split('\n')
            .filter((s) => !s.includes('Quinn'))
            .join('\n'),
        );
    if (mode === 'duplicate') cs.push(structuredClone(group));
    if (mode === 'wrong_batch')
      set(
        group,
        '--text',
        val(group, '--text').replace('ENG-SCORE-W06', 'ENG-SCORE-W07'),
      );
    if (mode === 'wrong_recipient')
      set(mail, '--to', 'sales@company.example.com');
    if (mode === 'engaged_in_alert')
      set(
        mail,
        '--body',
        val(mail, '--body') +
          '\nAva Powers | ava@poweruser.com | 68 | highly-engaged',
      );
    if (mode === 'modified_history') {
      let u = cs.find((c) =>
          c.includes('rec_helpcrunch_customers_hc_noise_001'),
        ),
        data = JSON.parse(val(u, '--json'));
      data.events = '[]';
      set(u, '--json', JSON.stringify(data));
    }
    if (mode === 'excluded_event_disclosure')
      set(
        group,
        '--text',
        val(group, '--text') +
          '\nThree future events were excluded from scoring.',
      );
    const b = await startMock(seed);
    try {
      for (const c of cs)
        await exec(r + '/gyms/lark-cli/bin/lark-cli', c, {
          env: { ...process.env, FEISHU_MOCK_URL: b.url },
          maxBuffer: 8e6,
        });
      const state = a + '/states/' + mode + '.json';
      await fs.writeFile(
        state,
        JSON.stringify({ seed, world: b.world, calls: b.calls }),
      );
      const out = a + '/' + mode + '-program';
      await exec(process.execPath, [t + '/tests/verify.ts'], {
        env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: out },
        maxBuffer: 8e6,
      });
      assert.equal(
        JSON.parse(await fs.readFile(out + '/result.json')).business_success,
        ![
          'wrong_batch',
          'wrong_recipient',
          'engaged_in_alert',
          'modified_history',
        ].includes(mode),
        mode,
      );
      assert.ok(b.calls.every((c) => c.status < 400));
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
