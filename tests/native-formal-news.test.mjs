import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('native news routing groups recipients after complete unread listing', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'news-mail-')),
    t = r + '/tasks/automationbench-marketing-1052',
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
    'shared_to',
    'shared_cc',
    'wrong_shared_content',
    'extra_recipient',
    'reference',
    'grouped',
    'mixed',
    'reverse',
    'paged',
    'search',
    'no_list',
    'partial_list',
    'list_after',
    'unfiltered',
    'missing_legal_ai',
    'missing_product_ai',
    'missing_sender',
    'missing_code_one',
    'changed_amount',
    'wrong_recipient',
    'duplicate_article',
    'missing_entity',
    'draft_only',
    'no_mail',
    'forbidden_offsite',
    'forbidden_promo',
    'forbidden_acquisition',
    'forbidden_embargo',
  ]) {
    let cs = structuredClone(original),
      notices = cs.filter((c) => c[1] === '+send'),
      list = cs[0],
      body = (c) => c[c.indexOf('--body') + 1];
    if (['grouped', 'mixed'].includes(mode)) {
      const grouped = [];
      for (const c of notices) {
        const dest = c[c.indexOf('--to') + 1];
        let g = grouped.find((x) => x[x.indexOf('--to') + 1] === dest);
        if (g && !(mode === 'mixed' && dest.startsWith('product')))
          g[g.indexOf('--body') + 1] += '\n\n' + body(c);
        else grouped.push(structuredClone(c));
      }
      cs = [...cs.filter((c) => !notices.includes(c)), ...grouped];
      notices = grouped;
    }
    if (mode === 'reverse')
      cs = [...cs.filter((c) => !notices.includes(c)), ...notices.reverse()];
    if (mode === 'paged') list[list.indexOf('--max') + 1] = '4';
    if (mode === 'search') list.push('--query', '');
    if (mode === 'search') {
      list.splice(list.indexOf('--is-unread'), 1);
      list.push('--filter', '{"is_unread":true}');
    }
    if (mode === 'no_list') cs.shift();
    if (mode === 'partial_list') list[list.indexOf('--max') + 1] = '2';
    if (mode === 'list_after') {
      cs.shift();
      cs.push(list);
    }
    if (mode === 'unfiltered') list.splice(list.indexOf('--is-unread'), 1);
    if (mode === 'missing_legal_ai') cs = cs.filter((c) => c !== notices[3]);
    if (mode === 'missing_product_ai') cs = cs.filter((c) => c !== notices[4]);
    if (mode === 'missing_sender')
      notices[4][notices[4].indexOf('--body') + 1] = body(notices[4]).replace(
        'briefing@lawtech.example.com',
        '',
      );
    if (mode === 'missing_code_one')
      notices[4][notices[4].indexOf('--body') + 1] = body(notices[4]).replace(
        'NEWS-ROUTE-2026-0127',
        '',
      );
    if (mode === 'changed_amount')
      notices[0][notices[0].indexOf('--body') + 1] = body(
        notices[0],
      ).replaceAll('$50M', '$50 million');
    if (mode === 'wrong_recipient')
      notices[4][notices[4].indexOf('--to') + 1] =
        'executives@company.example.com';
    if (mode === 'duplicate_article') cs.push(structuredClone(notices[0]));
    if (mode === 'missing_entity')
      notices[0][notices[0].indexOf('--body') + 1] = body(notices[0])
        .replaceAll('TechStartup Inc', 'A company')
        .replaceAll('Top VC', 'an investor');
    if (mode === 'draft_only')
      for (const c of notices) c.splice(c.indexOf('--confirm-send'), 1);
    if (mode === 'no_mail') cs = cs.filter((c) => !notices.includes(c));
    if (mode.startsWith('forbidden_'))
      notices[0][notices[0].indexOf('--body') + 1] +=
        '\n' +
        {
          forbidden_offsite: 'Team offsite',
          forbidden_promo: 'SAVE50 50% off',
          forbidden_acquisition: 'DataCo $200M',
          forbidden_embargo: 'EMBARGOED CRM Industry Report',
        }[mode];
    if (['shared_to', 'shared_cc'].includes(mode)) {
      cs = cs.filter((c) => c !== notices[4]);
      if (mode === 'shared_to')
        notices[3][notices[3].indexOf('--to') + 1] =
          'legal@company.example.com,product@company.example.com';
      else notices[3].push('--cc', 'product@company.example.com');
    }
    if (mode === 'wrong_shared_content') {
      const c = structuredClone(notices[0]);
      c[c.indexOf('--to') + 1] =
        'executives@company.example.com,legal@company.example.com,product@company.example.com';
      c[c.indexOf('--body') + 1] = notices.map(body).join('\n\n');
      cs = [...cs.filter((c) => !notices.includes(c)), c];
    }
    if (mode === 'extra_recipient')
      notices[0].push('--cc', 'outsider@example.com');
    const b = await startMock(seed);
    try {
      for (const c of cs) {
        let result = await exec(r + '/gyms/lark-cli/bin/lark-cli', c, {
          env: { ...process.env, FEISHU_MOCK_URL: b.url },
          maxBuffer: 8e6,
        });
        if (mode === 'paged' && c === list) {
          let page = JSON.parse(result.stdout);
          while (page.has_more) {
            if (!page.page_token) throw Error('missing pagination token');
            result = await exec(
              r + '/gyms/lark-cli/bin/lark-cli',
              [...list, '--page-token', page.page_token],
              {
                env: { ...process.env, FEISHU_MOCK_URL: b.url },
                maxBuffer: 8e6,
              },
            );
            page = JSON.parse(result.stdout);
          }
        }
      }
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
      const evidence = JSON.parse(await fs.readFile(out + '/result.json'));
      assert.ok(
        evidence.semantic.deferred.includes(
          'mail.unconstrained_delivery_count',
        ),
      );
      assert.equal(
        evidence.semantic.original.mail_delivery_count,
        'unconstrained',
      );
      assert.equal(
        JSON.parse(await fs.readFile(out + '/result.json')).business_success,
        [
          'shared_to',
          'shared_cc',
          'wrong_shared_content',
          'reference',
          'grouped',
          'mixed',
          'reverse',
          'paged',
          'search',
          'missing_sender',
          'duplicate_article',
          'missing_entity',
        ].includes(mode),
        mode,
      );
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
