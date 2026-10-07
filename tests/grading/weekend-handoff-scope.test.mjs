import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
test('weekend handoff preserves scoped reporting and business constraints', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'native-403-')),
    t = r + '/tasks/automationbench-support-1488',
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
    'split_engineering',
    'split_all',
    'missing_engineering',
    'missing_ticket',
    'brief_escalation',
    'vague_engineering',
    'duplicate',
    'wrong_count',
    'customer_mail',
    'skipped_disclosure',
    'reprocessed',
    'wrong_subject',
    'missing_urgent',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      group = cs.find((c) => c[0] === 'im' && c[1] === '+messages-send'),
      mails = cs.filter((c) => c[0] === 'mail'),
      eng = mails.find((c) => val(c, '--to').startsWith('engineering')),
      copy = (c, k, text) => {
        const d = structuredClone(c);
        set(d, k, text);
        return d;
      };
    if (['split_engineering', 'split_all'].includes(mode)) {
      const targets = mode === 'split_all' ? [group, ...mails] : [eng];
      for (const c of targets) {
        const k = c === group ? '--text' : '--body',
          lines = val(c, k).split('\n');
        cs.splice(
          cs.indexOf(c),
          1,
          copy(c, k, lines[0]),
          copy(c, k, lines.slice(1).join('\n')),
        );
      }
    }
    if (mode === 'missing_engineering') cs = cs.filter((c) => c !== eng);
    if (mode === 'missing_ticket')
      set(
        eng,
        '--body',
        val(eng, '--body')
          .split('\n')
          .filter((x) => !x.includes('tkt_w08'))
          .join('\n'),
      );
    if (mode === 'brief_escalation')
      set(
        eng,
        '--body',
        val(eng, '--body')
          .split('\n')
          .filter((x) => !x.startsWith('Engineering escalation:'))
          .join('\n'),
      );
    if (mode === 'vague_engineering')
      set(eng, '--body', 'Please monitor two tickets this weekend.');
    if (mode === 'duplicate') cs.push(structuredClone(eng));
    if (mode === 'wrong_count')
      set(
        group,
        '--text',
        val(group, '--text').replace('4 tickets', '5 tickets'),
      );
    if (mode === 'customer_mail')
      cs.push(copy(mails[0], '--to', 'w1@test.com'));
    if (mode === 'skipped_disclosure')
      set(
        group,
        '--text',
        val(group, '--text') +
          '\nSkipped tkt_w06 and tkt_w07 because they already have weekend-watch.',
      );
    if (mode === 'reprocessed')
      cs.push([
        'sheets',
        '+cells-set',
        '--spreadsheet-token',
        'ss_handoff',
        '--sheet-id',
        'ws_weekend',
        '--range',
        'A6:D6',
        '--cells',
        JSON.stringify([
          [
            { value: 'tkt_w06' },
            { value: 'SSO failures recurring' },
            { value: 'high' },
            { value: 'open' },
          ],
        ]),
      ]);
    if (mode === 'wrong_subject')
      set(
        mails.find((c) => val(c, '--to').startsWith('sarah')),
        '--subject',
        'Status update',
      );
    if (mode === 'missing_urgent')
      set(
        group,
        '--text',
        val(group, '--text').replaceAll('urgent', 'critical'),
      );
    const b = await startMock(seed);
    try {
      for (const c of cs)
        await exec(r + '/gyms/lark-cli/bin/lark-cli', c, {
          env: { ...process.env, FEISHU_MOCK_URL: b.url },
          maxBuffer: 8e6,
        });
      const p = a + '/states/' + mode + '.json';
      await fs.writeFile(
        p,
        JSON.stringify({ seed, world: b.world, calls: b.calls }),
      );
      const out = a + '/' + mode + '-program';
      await exec(process.execPath, [t + '/tests/verify.ts'], {
        env: { ...process.env, MOCK_STATE: p, VERIFIER_OUTPUT: out },
        maxBuffer: 8e6,
      });
      assert.equal(
        JSON.parse(await fs.readFile(out + '/result.json')).business_success,
        [
          'reference',
          'split_engineering',
          'split_all',
          'missing_ticket',
          'brief_escalation',
          'vague_engineering',
          'duplicate',
          'wrong_count',
          'skipped_disclosure',
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
