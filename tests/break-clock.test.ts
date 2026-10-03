import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('break clock: equivalent UTC results pass without changing source protection', async () => {
  const task = 'tasks/automationbench-hr-5095';
  const seed = JSON.parse(
    await readFile(task + '/environment/seed.json', 'utf8'),
  );
  const backend = await startMock(seed),
    dir = await mkdtemp(join(tmpdir(), 'break-clock-'));
  const cli = resolve('gyms/lark-cli/bin/lark-cli');
  const env = { ...process.env, FEISHU_MOCK_URL: backend.url, LARK_CLI: cli };
  const set = async (range: string, value: string | number) =>
    exec(
      cli,
      [
        'sheets',
        '+cells-set',
        '--spreadsheet-token',
        'ss_breaks',
        '--sheet-id',
        'ws_shifts',
        '--range',
        range,
        '--cells',
        JSON.stringify([[{ value }]]),
      ],
      { env },
    );
  const grade = async (name: string, expected: boolean) => {
    const state = join(dir, name + '.json'),
      output = join(dir, name);
    await writeFile(
      state,
      JSON.stringify({ seed, world: backend.world, calls: backend.calls }),
    );
    await exec(process.execPath, [task + '/tests/verify.ts'], {
      env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
    });
    assert.equal(
      JSON.parse(await readFile(join(output, 'result.json'), 'utf8'))
        .business_success,
      expected,
      name,
    );
  };
  try {
    await exec(process.execPath, [task + '/solution/solve.ts'], { env });
    const cases: [string, string | number, boolean][] = [
      ['24h', '16:00', true],
      ['12h', '4 pm', true],
      ['utc_seconds', '16:00:00 UTC', true],
      ['morning', '04:00', false],
      ['late', '16:30', false],
      ['second', '16:00:01', false],
      ['invalid_hour', '24:00', false],
      ['invalid_minute', '15:60', false],
      ['invalid_12h', '16:00 PM', false],
      ['zone', '16:00+08:00', false],
      ['number', 16, false],
      ['ambiguous', '4', false],
    ];
    for (const [name, value, expected] of cases) {
      await set('F6', value);
      await grade(name, expected);
    }
    await set('F6', '16:00');
    await set('C6', '12:00');
    await grade('protected_source', false);
    assert.equal(backend.calls.filter((c) => c.status >= 400).length, 0);
  } finally {
    await backend.close();
    await rm(dir, { recursive: true, force: true });
  }
});
