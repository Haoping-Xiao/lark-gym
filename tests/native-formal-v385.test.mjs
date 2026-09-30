import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('native formal support-1438 preserves scoped business requirements', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'native-v385-')),
    t = r + '/tasks/automationbench-support-1438',
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
    'numeric',
    'decimal_string',
    'reverse_rows',
    'wrong_count',
    'fractional',
    'count_text',
    'boolean',
    'empty_count',
    'early_yes',
    'missing_mail',
    'wrong_csm',
    'gamma_notified',
    'wrong_priority',
    'wrong_action',
    'wrong_tier',
    'wrong_amount',
    'missing_ticket',
    'skipped_summary',
    'noop',
  ]) {
    let cs = structuredClone(original);
    const val = (c, key) => c[c.indexOf(key) + 1],
      set = (c, key, value) => (c[c.indexOf(key) + 1] = value),
      mails = cs.filter((c) => c[0] === 'mail'),
      writes = cs.filter((c) => c[1] === '+record-upsert'),
      cells = cs.filter((c) => c[1] === '+cells-set'),
      counts = cells.filter((c) => /^B[2-5]$/.test(val(c, '--range'))),
      yes = cells.find((c) => val(c, '--range') === 'E2');
    if (['numeric', 'decimal_string'].includes(mode))
      for (const c of counts) {
        const n = JSON.parse(val(c, '--cells'))[0][0].value;
        set(
          c,
          '--cells',
          JSON.stringify([
            [{ value: mode === 'numeric' ? Number(n) : n + '.00' }],
          ]),
        );
      }
    if (mode === 'reverse_rows')
      for (const c of cells) {
        const x = val(c, '--range');
        set(c, '--range', x[0] + String(7 - Number(x.slice(1))));
      }
    if (
      [
        'wrong_count',
        'fractional',
        'count_text',
        'boolean',
        'empty_count',
      ].includes(mode)
    )
      set(
        counts[0],
        '--cells',
        JSON.stringify([
          [
            {
              value: {
                wrong_count: 4,
                fractional: 3.5,
                count_text: '3 tickets',
                boolean: true,
                empty_count: '',
              }[mode],
            },
          ],
        ]),
      );
    if (mode === 'early_yes') {
      const first = cells.slice(0, 5);
      cs = cs.filter((c) => !first.includes(c));
      cs.splice(cs.indexOf(mails[0]), 0, ...first);
    }
    if (mode === 'missing_mail') cs = cs.filter((c) => c !== mails[0]);
    if (mode === 'wrong_csm') set(mails[0], '--to', 'frank@gammainc.com');
    if (mode === 'gamma_notified')
      set(
        cells.find((c) => val(c, '--range') === 'E3'),
        '--cells',
        '[[{"value":"Yes"}]]',
      );
    if (['wrong_priority', 'wrong_amount'].includes(mode)) {
      const v = JSON.parse(val(writes[0], '--json'));
      v[mode === 'wrong_priority' ? 'priority' : 'contract_value'] =
        mode === 'wrong_priority' ? 'High' : '$95,000';
      set(writes[0], '--json', JSON.stringify(v));
    }
    if (mode === 'wrong_action')
      set(
        cells.find((c) => val(c, '--range') === 'D4'),
        '--cells',
        '[[{"value":"HubSpot Ticket"}]]',
      );
    if (mode === 'wrong_tier')
      set(
        cells.find((c) => val(c, '--range') === 'C2'),
        '--cells',
        '[[{"value":"Silver"}]]',
      );
    if (mode === 'missing_ticket') cs = cs.filter((c) => c !== writes[0]);
    if (mode === 'skipped_summary') {
      const c = cs.at(-1);
      set(c, '--text', val(c, '--text') + ' Skipped DeltaForce.');
    }
    if (mode === 'noop') cs = [];
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
          'numeric',
          'decimal_string',
          'reverse_rows',
          'skipped_summary',
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
