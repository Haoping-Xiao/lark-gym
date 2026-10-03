import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
const exec = promisify(execFile),
  repo = process.cwd();
test('outreach mail requires the first pending source row', async () => {
  const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-data-')),
    t = repo + '/tasks/automationbench-simple-3091',
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
  try {
    for (const mode of [
      'reference',
      'row_only',
      'split_reads',
      'html',
      'no_read',
      'read_after',
      'header_only',
      'email_only',
      'second_row',
      'draft_only',
      'no_send',
      'wrong_recipient',
      'wrong_subject',
      'missing_term',
      'wrong_name',
      'false_claim',
    ]) {
      let cs = structuredClone(original),
        c = cs.at(-1),
        bi = c.indexOf('--body') + 1;
      const read = structuredClone(cs[0]);
      if (mode === 'row_only') read[read.length - 1] = 'A2:D2';
      if (mode === 'header_only') read[read.length - 1] = 'A1:D1';
      if (mode === 'email_only') read[read.length - 1] = 'B2:B2';
      if (mode === 'second_row') read[read.length - 1] = 'A3:D3';
      cs[0] = read;
      if (mode === 'split_reads') {
        const a = structuredClone(read),
          b = structuredClone(read);
        a[a.length - 1] = 'A2:B2';
        b[b.length - 1] = 'D2:D2';
        cs = [a, b, c];
      }
      if (mode === 'no_read') cs = [c];
      if (mode === 'read_after') cs = [c, read];
      if (mode === 'draft_only') c.splice(c.indexOf('--confirm-send'), 1);
      if (mode === 'no_send') cs = [read];
      if (mode === 'wrong_recipient')
        c[c.indexOf('--to') + 1] = 'oscar.fuentes@bridgedata.example.com';
      if (mode === 'wrong_subject') c[c.indexOf('--subject') + 1] = 'Other';
      if (mode === 'missing_term')
        c[bi] = c[bi].replaceAll('BrightPath', '这款');
      if (mode === 'wrong_name') c[bi] = c[bi].replace('Nina', 'Oscar');
      if (mode === 'false_claim')
        c[bi] += ' 你已同意购买，我们已收取全年费用。';
      if (mode === 'html') c[bi] = '<p>' + c[bi] + '</p>';
      const b = await startMock(seed);
      try {
        for (const cmd of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', cmd, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        const f = a + '/states/' + mode + '.json';
        await fs.writeFile(
          f,
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec(process.execPath, [t + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: f,
            VERIFIER_OUTPUT: a + '/' + mode + '-program',
          },
          maxBuffer: 8e6,
        });
        assert.equal(
          JSON.parse(await fs.readFile(a + '/' + mode + '-program/result.json'))
            .business_success,
          [
            'reference',
            'row_only',
            'split_reads',
            'html',
            'wrong_name',
            'false_claim',
          ].includes(mode),
          mode,
        );
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
