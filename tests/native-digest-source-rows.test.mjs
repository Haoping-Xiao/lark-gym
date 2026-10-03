import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('digest reads corresponding recipients before real mail', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'digest-')),
    t = r + '/tasks/automationbench-simple-3191',
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
    'per_person',
    'split_columns',
    'no_read',
    'header_only',
    'first_row_only',
    'read_after',
    'omit_fifth',
    'wrong_subject_fifth',
    'missing_keyword',
    'false_highlights',
    'duplicate',
    'draft_only',
    'wrong_recipient',
    'chinese_later',
  ]) {
    let cs = structuredClone(original);
    const get = (range) => [
      'sheets',
      '+cells-get',
      '--spreadsheet-token',
      'ss_digest',
      '--sheet-id',
      'sheet1',
      '--range',
      range,
    ];
    if (mode === 'per_person')
      cs = cs.slice(1).flatMap((c, i) => [get(`A${i + 2}:B${i + 2}`), c]);
    if (mode === 'split_columns')
      cs = [get('A1:A6'), get('B1:B6'), ...cs.slice(1)];
    if (mode === 'no_read') cs.shift();
    if (mode === 'header_only') cs[0] = get('A1:B1');
    if (mode === 'first_row_only') cs[0] = get('A2:B2');
    if (mode === 'read_after') cs.push(cs.shift());
    if (mode === 'omit_fifth') cs.pop();
    if (mode === 'wrong_subject_fifth')
      cs[5][cs[5].indexOf('--subject') + 1] = 'Weekly Digest - Feb 24';
    if (mode === 'missing_keyword')
      cs[1][cs[1].indexOf('--body') + 1] = '暂无可核实的业务进展。';
    if (mode === 'false_highlights')
      cs[1][cs[1].indexOf('--body') + 1] =
        'This week highlights: Revenue doubled and Project Phoenix launched successfully.';
    if (mode === 'duplicate') cs.push(structuredClone(cs[1]));
    if (mode === 'draft_only')
      for (const c of cs.slice(1)) c.splice(c.indexOf('--confirm-send'), 1);
    if (mode === 'wrong_recipient')
      cs[5][cs[5].indexOf('--to') + 1] = 'other@example.com';
    if (mode === 'chinese_later')
      for (const c of cs.slice(3))
        c[c.indexOf('--body') + 1] = '本周暂无可核实的业务亮点。';
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
        [
          'reference',
          'per_person',
          'split_columns',
          'chinese_later',
          'false_highlights',
        ].includes(mode),
        mode,
      );
    } finally {
      await b.close();
    }
  }
  await fs.rm(a, { recursive: true, force: true });
});
