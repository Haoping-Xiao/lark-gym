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
test('derived ranking memberships support combined or split rows without duplicates', async () => {
  const repo = process.cwd(),
    task = path.resolve('tasks/automationbench-operations-1320'),
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
      'split',
      'split_reverse',
      'partial_split',
      'duplicate_member',
      'missing_member',
      'split_wrong_rate',
    ]) {
      let commands = structuredClone(original),
        first = commands.find((c) => c[1] === '+cells-set'),
        rows = [
          ['Tuesday', 9, '9%', 'Top'],
          ['Tuesday', 17, '7%', 'Top'],
          ['Wednesday', 12, '2%', 'Top'],
          ['Friday', 10, '1%', 'Low'],
          ['Wednesday', 12, '2%', 'Low'],
          ['Tuesday', 17, '7%', 'Low'],
        ];
      if (mode === 'split_reverse') rows.reverse();
      if (mode === 'partial_split') {
        rows[1][3] = 'Low,Top';
        rows.pop();
      }
      if (mode === 'duplicate_member') rows.push([...rows[1]]);
      if (mode === 'missing_member') rows.pop();
      if (mode === 'split_wrong_rate') rows[4][2] = '3%';
      first[first.indexOf('--cells') + 1] = JSON.stringify(
        rows.map((row) => row.map((value) => ({ value }))),
      );
      commands = commands.filter((c) => c[1] !== '+cells-set' || c === first);
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
          ['split', 'split_reverse', 'partial_split'].includes(mode),
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
