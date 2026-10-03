import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('renewal hold preserves internal risk assessment and native check-in mail', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'churn-mail-')),
    t = r + '/tasks/automationbench-operations-1302',
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
    'english',
    'grouped',
    'reverse_writes',
    'mail_first',
    'skip_renewal',
    'wrong_renewal',
    'renewal_alert',
    'renewal_mail',
    'renewal_ticket',
    'migration_update',
    'lead_update',
    'vip_medium',
    'wrong_csm',
    'wrong_contact',
    'missing_ticket',
    'missing_alert',
    'duplicate_alert',
    'no_mail',
    'draft_only',
    'wrong_recipient',
    'no_resources',
    'bare_resources',
    'invented_link',
    'wrong_metrics',
    'noop',
  ]) {
    let cs = structuredClone(original),
      notice = cs.at(-1),
      bi = notice.indexOf('--body') + 1,
      renew = cs.find((c) => c.includes('rec_hubspot_cont_hs_206')),
      writes = cs.filter((c) => c[1] === '+record-upsert'),
      tickets = writes.filter((c) => !c.includes('--record-id')),
      alerts = cs.filter((c) => c[1] === '+messages-send');
    const addRecord = (id, value) => {
      const c = structuredClone(renew);
      c[c.indexOf('--record-id') + 1] = id;
      c[c.indexOf('--json') + 1] = JSON.stringify({ churn_risk: value });
      cs.push(c);
    };
    if (mode === 'english')
      notice[bi] =
        'James Whitfield, we noticed it has been 35 days since your last login. Are there any access issues we can help resolve? Here are some resources: check your account sign-in and use the product help menu for an introductory walkthrough. Please tell us where you get stuck.';
    if (mode === 'grouped') {
      alerts[0][alerts[0].length - 1] += '\n' + alerts[1].at(-1);
      cs = cs.filter((c) => c !== alerts[1]);
    }
    if (mode === 'reverse_writes')
      cs = [
        ...cs.filter(
          (c) => !writes.includes(c) && c !== notice && !alerts.includes(c),
        ),
        ...writes.reverse(),
        ...alerts,
        notice,
      ];
    if (mode === 'mail_first') {
      cs.pop();
      cs.splice(cs.indexOf(writes[0]), 0, notice);
    }
    if (mode === 'skip_renewal') cs = cs.filter((c) => c !== renew);
    if (mode === 'wrong_renewal')
      renew[renew.indexOf('--json') + 1] = '{"churn_risk":"low"}';
    if (mode === 'renewal_alert')
      cs.push([
        'im',
        '+messages-send',
        '--chat-id',
        'oc_CCHURN',
        '--text',
        'Marcus Tan | high | 50 days | NPS 4 | 6 tickets',
      ]);
    if (mode === 'renewal_mail') {
      let c = structuredClone(notice);
      c[c.indexOf('--to') + 1] = 'buyer@renewal.example.com';
      c[bi] = 'Marcus Tan, resources for returning to the product.';
      cs.push(c);
    }
    if (mode === 'renewal_ticket') {
      let c = structuredClone(tickets[0]),
        f = JSON.parse(c[c.indexOf('--json') + 1]);
      Object.assign(f, {
        subject: 'Churn risk: Marcus Tan',
        contact_id: 'cont_hs_206',
        assigned_to: 'csm2@company.example.com',
        description: '50 days | NPS 4 | 6 tickets | 3 signals',
      });
      c[c.indexOf('--json') + 1] = JSON.stringify(f);
      cs.push(c);
    }
    if (mode === 'migration_update')
      addRecord('rec_hubspot_cont_hs_204', 'high');
    if (mode === 'lead_update') addRecord('rec_hubspot_cont_hs_205', 'high');
    if (mode === 'vip_medium') addRecord('rec_hubspot_cont_hs_207', 'medium');
    if (['wrong_csm', 'wrong_contact', 'wrong_metrics'].includes(mode)) {
      const c = tickets[0],
        j = c.indexOf('--json') + 1,
        f = JSON.parse(c[j]);
      if (mode === 'wrong_csm') f.assigned_to = 'csm2@company.example.com';
      if (mode === 'wrong_contact') f.contact_id = 'cont_hs_202';
      if (mode === 'wrong_metrics')
        f.description =
          '10 days | NPS 10 | 0 tickets | high because of 3 signals';
      c[j] = JSON.stringify(f);
    }
    if (mode === 'missing_ticket') cs = cs.filter((c) => c !== tickets[0]);
    if (mode === 'missing_alert') cs = cs.filter((c) => c !== alerts[1]);
    if (mode === 'duplicate_alert') cs.push(structuredClone(alerts[0]));
    if (mode === 'no_mail') cs = cs.filter((c) => c !== notice);
    if (mode === 'draft_only')
      notice.splice(notice.indexOf('--confirm-send'), 1);
    if (mode === 'wrong_recipient')
      notice[notice.indexOf('--to') + 1] = 'happy@loyalclient.example.com';
    if (mode === 'no_resources')
      notice[bi] = 'James Whitfield, checking in. Hope things are well.';
    if (mode === 'bare_resources') notice[bi] = 'resources';
    if (mode === 'invented_link')
      notice[bi] =
        'James Whitfield, resources are available at https://official-support.midclient.example.com/verified-exclusive. This verified official portal has already unlocked your account.';
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
          'english',
          'grouped',
          'reverse_writes',
          'mail_first',
          'renewal_alert',
          'missing_alert',
          'duplicate_alert',
          'bare_resources',
          'invented_link',
          'wrong_metrics',
        ].includes(mode),
        mode + ' structural rules (deferred content is independently judged)',
      );
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
