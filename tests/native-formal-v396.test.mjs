import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('enrichment compares whole labeled source revenue rather than a numeric substring', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'enrichment-')),
    t = r + '/tasks/automationbench-support-1473',
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
    'prose',
    'alpha_x10',
    'delta_x10',
    'embedded',
    'comma_number',
    'conflict',
    'swapped',
    'wrong_industry',
    'missing_mail',
    'wrong_discrepancy',
    'wrong_stats',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      alpha = cs.find((c) => c.includes('rec_zendesk_c360_org1')),
      delta = cs.find((c) => c.includes('rec_zendesk_c360_org4')),
      mail = cs.find((c) => c[0] === 'mail'),
      group = cs.find((c) => c[0] === 'im' && c[1] === '+messages-send'),
      modify = (c, values) =>
        set(
          c,
          '--json',
          JSON.stringify({ ...JSON.parse(val(c, '--json')), ...values }),
        );
    if (mode === 'prose') {
      modify(alpha, {
        details: '来源 HubSpot；annual_revenue: 5000000；已补齐收入字段。',
      });
      modify(delta, {
        details: '从 HubSpot 同步 annual_revenue: 500000；其他资料保持不变。',
      });
    }
    if (mode === 'alpha_x10')
      modify(alpha, { details: 'annual_revenue: 50000000' });
    if (mode === 'delta_x10')
      modify(delta, { details: 'annual_revenue: 5000000' });
    if (mode === 'embedded')
      modify(alpha, { details: 'annual_revenue: 15000000; 原值为 5000000' });
    if (mode === 'comma_number')
      modify(alpha, { details: 'annual_revenue: 5000000,000' });
    if (mode === 'conflict')
      modify(alpha, {
        details: 'annual_revenue: 5000000; annual_revenue: 50000000',
      });
    if (mode === 'swapped') {
      modify(alpha, { details: 'annual_revenue: 500000' });
      modify(delta, { details: 'annual_revenue: 5000000' });
    }
    if (mode === 'wrong_industry')
      modify(alpha, { notes: 'industry: Finance' });
    if (mode === 'missing_mail') cs = cs.filter((c) => c !== mail);
    if (mode === 'wrong_discrepancy')
      set(
        mail,
        '--body',
        'BetaCorp and Beta Corporation have matching names; no discrepancy was detected. betacorp.io is unchanged.',
      );
    if (mode === 'wrong_stats')
      set(
        group,
        '--text',
        val(group, '--text').replace('2 enriched', '3 enriched'),
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
          'prose',
          'wrong_industry',
          'wrong_discrepancy',
          'wrong_stats',
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
