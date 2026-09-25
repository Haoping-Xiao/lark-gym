import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
const exec = promisify(execFile),
  repo = process.cwd();
test('invoice requires the provided attachment bytes', async () => {
  const a = await fs.mkdtemp(path.join(tmpdir(), 'mail-flow-')),
    task = repo + '/tasks/automationbench-simple-3067',
    seed = JSON.parse(await fs.readFile(task + '/environment/seed.json')),
    src = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
    original = JSON.parse(
      vm.runInNewContext(
        src
          .slice(src.indexOf('const commands'), src.indexOf('for (const args'))
          .replace('commands: string[][]', 'commands') +
          '\nJSON.stringify(commands)',
      ),
    ),
    filename = 'invoice_INV-2026-0342.pdf',
    pdf = await fs.readFile(task + '/environment/input-files/' + filename);
  await fs.mkdir(a + '/states', { recursive: true });
  try {
    for (const mode of [
      'reference',
      'natural',
      'html',
      'draft_only',
      'no_send',
      'filename_only',
      'wrong_bytes',
      'wrong_filename',
      'empty_file',
      'extra_attachment',
      'wrong_recipient',
      'wrong_subject',
      'wrong_amount',
      'wrong_terms',
    ]) {
      const dir = await fs.mkdtemp(path.join(tmpdir(), 'invoice-capture-'));
      await fs.writeFile(
        path.join(dir, filename),
        mode === 'wrong_bytes'
          ? Buffer.from('%PDF-1.4\nwrong invoice')
          : mode === 'empty_file'
            ? Buffer.alloc(0)
            : pdf,
      );
      await fs.writeFile(path.join(dir, 'other.pdf'), pdf);
      let cs = structuredClone(original),
        c = cs[0],
        body = c.indexOf('--body') + 1;
      if (mode === 'no_send') cs = [];
      if (mode === 'draft_only') c.splice(c.indexOf('--confirm-send'), 1);
      if (mode === 'filename_only') c.splice(c.indexOf('--attach'), 2);
      if (mode === 'wrong_filename') c[c.indexOf('--attach') + 1] = 'other.pdf';
      if (mode === 'extra_attachment') c.push('--attach', 'other.pdf');
      if (mode === 'wrong_recipient')
        c[c.indexOf('--to') + 1] = 'other@example.com';
      if (mode === 'wrong_subject') c[c.indexOf('--subject') + 1] = 'Other';
      if (mode === 'wrong_amount')
        c[body] = c[body].replace('$12,500', '$12,000');
      if (mode === 'wrong_terms') c[body] = c[body].replace('Net 30', 'Net 60');
      if (mode === 'natural')
        c[body] =
          'Rachel，附上 2 月咨询服务账单 INV-2026-0342，金额 $12,500，付款期限为 Net 30。附件名称：invoice_INV-2026-0342.pdf。';
      if (mode === 'html') c[body] = '<p>' + c[body] + '</p>';
      const b = await startMock(seed);
      try {
        for (const cmd of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', cmd, {
            cwd: dir,
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        const f = a + '/states/' + mode + '.json';
        await fs.writeFile(
          f,
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
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
          ['reference', 'natural', 'html', 'wrong_terms'].includes(mode),
          mode,
        );
      } finally {
        await b.close();
        await fs.rm(dir, { recursive: true, force: true });
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
