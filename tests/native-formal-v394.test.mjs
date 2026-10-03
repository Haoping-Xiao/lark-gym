import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('loyalty reward identity accepts catalog spelling while keeping cost and balances exact', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'loyalty-reward-')),
    t = r + '/tasks/automationbench-support-1580',
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
    'lowercase',
    'reversed',
    'wrong_reward',
    'wrong_duration',
    'wrong_cost',
    'wrong_balance',
    'wrong_batch',
    'wrong_tier',
    'no_mail',
    'mail_no_batch',
    'wrong_reply',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      records = cs.filter((c) => c.includes('--json')),
      redemption = records.find((c) => {
        const d = JSON.parse(val(c, '--json'));
        return d.ticket_id === 'g_610' && d.reward;
      }),
      balance = records.find((c) => {
        const d = JSON.parse(val(c, '--json'));
        return (
          d.customer_email === 'cole.brennan@outlook.com' &&
          'earned_points' in d
        );
      }),
      reply = records.find((c) => {
        const d = JSON.parse(val(c, '--json'));
        return d.ticket_id === 'g_610' && d.body_text;
      }),
      mail = cs.find((c) => c[0] === 'mail'),
      modify = (c, values) =>
        set(
          c,
          '--json',
          JSON.stringify({ ...JSON.parse(val(c, '--json')), ...values }),
        );
    if (mode === 'lowercase')
      modify(redemption, { reward: 'free shipping for a year' });
    if (mode === 'reversed')
      for (const c of cs.filter((c) => c[1] === '+cells-set')) {
        const x = val(c, '--range');
        set(c, '--range', x[0] + String(13 - Number(x.slice(1))));
      }
    if (mode === 'wrong_reward')
      modify(redemption, { reward: 'VIP event access' });
    if (mode === 'wrong_duration')
      modify(redemption, { reward: 'Free shipping for one order' });
    if (mode === 'wrong_cost') modify(redemption, { points_cost: 250 });
    if (mode === 'wrong_balance') modify(balance, { available_points: 1850 });
    if (mode === 'wrong_batch')
      modify(redemption, { batch_reference: 'OTHER-BATCH' });
    if (mode === 'wrong_tier') modify(balance, { tier: 'Gold' });
    if (mode === 'no_mail') cs = cs.filter((c) => c !== mail);
    if (mode === 'mail_no_batch')
      set(
        mail,
        '--body',
        val(mail, '--body').replaceAll('LOYAL-OPS-20260214', ''),
      );
    if (mode === 'wrong_reply')
      modify(reply, {
        body_text:
          'Cole Brennan: VIP event access approved for 500 points. Your remaining balance is 1350.',
      });
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
          'lowercase',
          'reversed',
          'wrong_reward',
          'wrong_duration',
          'wrong_reply',
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
