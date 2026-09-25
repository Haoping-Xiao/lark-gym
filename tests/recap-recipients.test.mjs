import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Monthly recap reaches all historical recipients', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'recap-recipients-')),
    task = repo + '/tasks/automationbench-sales-1204',
    seed = JSON.parse(
      await fs.readFile(task + '/environment/seed.json', 'utf8'),
    ),
    src = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
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
      'reverse_order',
      'natural_text',
      'missing_maria',
      'wrong_recipient',
      'duplicate_recipient',
      'wrong_amount',
      'missing_total',
      'excluded_pilot',
      'excluded_summary',
      'missing_entity',
      'wrong_month',
    ]) {
      let cs = structuredClone(original),
        ms = cs.filter((c) => c[1] === '+messages-send');
      const maria = ms.find((c) => c.includes('oc_email_27'));
      if (mode === 'reverse_order')
        cs = [...cs.filter((c) => c[1] !== '+messages-send'), ...ms.reverse()];
      if (mode === 'natural_text')
        for (const c of ms)
          c[c.length - 1] = c
            .at(-1)
            .replace('Won total:', '成交合计：')
            .replace('Lost total:', '丢单合计：')
            .replace('Win rate:', '胜率：');
      if (mode === 'missing_maria') cs = cs.filter((c) => c !== maria);
      if (mode === 'wrong_recipient')
        maria[maria.indexOf('--chat-id') + 1] = 'oc_email_24';
      if (mode === 'duplicate_recipient')
        maria[maria.indexOf('--chat-id') + 1] = 'oc_email_43';
      for (const c of ms) {
        if (mode === 'wrong_amount')
          c[c.length - 1] = c.at(-1).replace('$185,000', '$185,100');
        if (mode === 'missing_total')
          c[c.length - 1] = c.at(-1).replace('Won total: $267,000\n', '');
        if (mode === 'excluded_pilot')
          c[c.length - 1] += '\nSandbox Labs: $30,000';
        if (mode === 'excluded_summary')
          c[c.length - 1] += '\n其余不符合范围的商机已排除。';
        if (mode === 'missing_entity')
          c[c.length - 1] = c.at(-1).replace('Quorum Systems', '第二家公司');
        if (mode === 'wrong_month')
          c[c.length - 1] = c.at(-1).replace('February 2026', 'January 2026');
      }
      const b = await startMock(seed);
      try {
        for (const c of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        if (b.calls.some((c) => c.status >= 400)) throw Error(mode);
        await fs.writeFile(
          a + '/states/' + mode + '.json',
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: a + '/states/' + mode + '.json',
            VERIFIER_OUTPUT: a + '/' + mode,
          },
          maxBuffer: 8e6,
        });
        const d = JSON.parse(
          await fs.readFile(a + '/' + mode + '/result.json', 'utf8'),
        );
        assert.equal(
          d.business_success,
          !['missing_maria', 'wrong_recipient', 'duplicate_recipient'].includes(
            mode,
          ),
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
