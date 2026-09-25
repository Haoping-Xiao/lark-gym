import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('insurance request state must exist before messages even with staged writes', async () => {
  const repo = process.cwd(),
    task = path.resolve('tasks/automationbench-operations-1321'),
    dir = await fs.mkdtemp(path.join(tmpdir(), 'outreach-order-'));
  const seed = JSON.parse(
      await fs.readFile(task + '/environment/seed.json', 'utf8'),
    ),
    src = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
    block = src
      .slice(src.indexOf('const commands'), src.indexOf('for (const args'))
      .replace('commands: string[][]', 'commands'),
    original = JSON.parse(
      vm.runInNewContext(block + '\nJSON.stringify(commands)'),
    );
  try {
    for (const mode of [
      'reference',
      'interleaved',
      'reverse_vendors',
      'draft_then_sent',
      'early_notice',
      'late_record',
      'after_request',
      'withdraw_restore',
      'wrong_vendor',
      'wrong_template',
      'missing_request',
      'wrong_amount',
    ]) {
      let all = structuredClone(original),
        reads = all.filter(
          (c) => !['+record-upsert', '+messages-send'].includes(c[1]),
        ),
        records = all.filter((c) => c[1] === '+record-upsert'),
        messages = all.filter((c) => c[1] === '+messages-send'),
        requests = messages.slice(0, 3),
        notices = messages.slice(3),
        commands = [...reads, ...records, ...requests, ...notices],
        set = (c, f) => {
          c[c.indexOf('--json') + 1] = JSON.stringify({
            ...JSON.parse(c[c.indexOf('--json') + 1]),
            ...f,
          });
        },
        update = (status) => {
          const c = structuredClone(records[0]);
          c.push('--record-id', 'rec_created_1');
          c[c.indexOf('--json') + 1] = JSON.stringify({ status });
          return c;
        };
      if (['interleaved', 'reverse_vendors'].includes(mode))
        commands = [
          ...reads,
          ...(mode === 'interleaved' ? [0, 1, 2] : [2, 1, 0]).flatMap((i) => [
            records[i],
            requests[i],
            notices[i],
          ]),
        ];
      if (mode === 'draft_then_sent') {
        set(records[0], { status: 'Draft' });
        commands = [...reads, ...records, update('Sent'), ...messages];
      }
      if (mode === 'early_notice')
        commands = [
          ...reads,
          ...records,
          notices[0],
          ...requests,
          ...notices.slice(1),
        ];
      if (mode === 'late_record')
        commands = [...reads, ...messages, ...records];
      if (mode === 'after_request')
        commands = [
          ...reads,
          requests[0],
          ...records,
          ...requests.slice(1),
          ...notices,
        ];
      if (mode === 'withdraw_restore')
        commands = [
          ...reads,
          ...records,
          update('Draft'),
          requests[0],
          update('Sent'),
          ...requests.slice(1),
          ...notices,
        ];
      if (mode === 'wrong_vendor')
        set(records[0], { vendor: 'Pinnacle Safety Solutions' });
      if (mode === 'wrong_template')
        set(records[0], { template_id: 'tpl_auto_pol' });
      if (mode === 'missing_request')
        commands = commands.filter((c) => c !== requests[0]);
      if (mode === 'wrong_amount')
        notices[0][notices[0].indexOf('--text') + 1] = notices[0]
          .at(-1)
          .replace('1,500,000', '1,500,001');
      const b = await startMock(seed);
      try {
        for (const x of commands)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', x, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        assert.equal(
          b.calls.some((c) => c.status >= 400),
          false,
          mode,
        );
        const state = path.join(dir, mode + '.json'),
          dest = path.join(dir, mode);
        await fs.writeFile(
          state,
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec('node', [task + '/tests/verify.ts'], {
          env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: dest },
        });
        const result = JSON.parse(
          await fs.readFile(dest + '/result.json', 'utf8'),
        );
        assert.equal(
          result.business_success,
          [
            'reference',
            'interleaved',
            'reverse_vendors',
            'draft_then_sent',
          ].includes(mode),
          mode,
        );
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
