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
test('retry counters change only after each contact receives every required notice', async () => {
  const repo = process.cwd(),
    task = path.resolve('tasks/automationbench-operations-1307'),
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
      'regular_first',
      'reverse_stages',
      'vip_between',
      'all_early',
      'aisha_early',
      'missing_vip',
      'wrong_retry',
      'wrong_email',
      'missing_log',
      'excluded_update',
    ]) {
      let commands = structuredClone(original),
        reads = commands.filter(
          (c) =>
            !['+record-upsert', '+messages-send', '+cells-set'].includes(c[1]),
        ),
        messages = commands.filter((c) => c[1] === '+messages-send'),
        updates = commands.filter((c) => c[1] === '+record-upsert'),
        cells = commands.filter((c) => c[1] === '+cells-set'),
        groups = [
          [messages[0], messages[1], updates[0], ...cells.slice(0, 5)],
          [messages[2], updates[1], ...cells.slice(5, 10)],
          [messages[3], updates[2], ...cells.slice(10)],
        ];
      if (mode === 'interleaved') commands = [...reads, ...groups.flat()];
      if (mode === 'regular_first')
        commands = [...reads, ...groups[2], ...groups[1], ...groups[0]];
      if (mode === 'reverse_stages')
        commands = [
          ...reads,
          ...messages.slice().reverse(),
          ...updates.slice().reverse(),
          ...cells.slice().reverse(),
        ];
      if (mode === 'vip_between')
        commands = [
          ...reads,
          messages[0],
          updates[0],
          ...messages.slice(1),
          ...updates.slice(1),
          ...cells,
        ];
      if (mode === 'all_early')
        commands = [...reads, ...updates, ...messages, ...cells];
      if (mode === 'aisha_early')
        commands = [
          ...reads,
          updates[1],
          ...messages,
          updates[0],
          updates[2],
          ...cells,
        ];
      if (mode === 'missing_vip')
        commands = commands.filter((c) => c !== messages[1]);
      if (mode === 'wrong_retry')
        updates[0][updates[0].indexOf('--json') + 1] =
          '{"payment_retry_count":3}';
      if (mode === 'wrong_email')
        messages[2][messages[2].indexOf('--text') + 1] = messages[2]
          .at(-1)
          .replace('user@smallbiz.example.com', 'other@example.com');
      if (mode === 'missing_log')
        commands = commands.filter((c) => !cells.slice(10).includes(c));
      if (mode === 'excluded_update') {
        let extra = structuredClone(updates[0]);
        extra[extra.indexOf('--record-id') + 1] = 'rec_hubspot_cont_hs_305';
        commands.push(extra);
      }

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
            'regular_first',
            'reverse_stages',
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
