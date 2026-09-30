import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('VP thanks require actual sender identity and preserve CSAT exclusions', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'native-409-')),
    t = r + '/tasks/automationbench-support-1566',
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
    'vp_first',
    'english_thanks',
    'wrong_sender',
    'wrong_subject',
    'testimonial',
    'missing_vp',
    'wrong_recipient',
    'vip_mail',
    'cooldown_mail',
    'skipped_summary',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      mail = cs.filter((c) => c[0] === 'mail' && c[1] === '+send'),
      vp = mail.find((c) => val(c, '--to') === 'nina@cloudpeak.io'),
      group = cs.find((c) => c[0] === 'im' && c[1] === '+messages-send');
    if (mode === 'vp_first') {
      cs.splice(cs.indexOf(vp), 1);
      cs.splice(cs.indexOf(mail[0]), 0, vp);
    }
    if (mode === 'english_thanks')
      set(
        vp,
        '--body',
        'Dear Nina, thank you personally for your wonderful feedback and continued support. I appreciate your trust in our support team. VP of Customer Success',
      );
    if (mode === 'wrong_sender')
      set(vp, '--mailbox', 'agent@company.example.com');
    if (mode === 'wrong_subject') set(vp, '--subject', 'Thanks from support');
    if (mode === 'testimonial')
      set(vp, '--body', val(vp, '--body') + ' Please provide a testimonial.');
    if (mode === 'missing_vp') cs = cs.filter((c) => c !== vp);
    if (mode === 'wrong_recipient') set(vp, '--to', 'leo@codecraft.dev');
    if (mode === 'vip_mail' || mode === 'cooldown_mail') {
      let c = structuredClone(mail[4]);
      set(
        c,
        '--to',
        mode === 'vip_mail'
          ? 'elena.rodriguez@megacorp.com'
          : 'logan@skybridge.io',
      );
      cs.splice(cs.indexOf(group), 0, c);
    }
    if (mode === 'skipped_summary')
      set(group, '--text', val(group, '--text') + ' | Skipped: Logan Pierce');
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
        ['reference', 'vp_first', 'english_thanks', 'skipped_summary'].includes(
          mode,
        ),
        mode,
      );
      assert.ok(b.calls.every((c) => c.status < 400));
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
