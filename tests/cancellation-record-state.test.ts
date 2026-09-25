import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import vm from 'node:vm';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('cancellation requires every CRM field at the time the events notice is sent', async () => {
  const task = 'tasks/automationbench-marketing-1155',
    dir = await mkdtemp(join(tmpdir(), 'cancel-state-'));
  const seed = JSON.parse(
    await readFile(task + '/environment/seed.json', 'utf8'),
  );
  const src = await readFile(task + '/solution/solve.ts', 'utf8'),
    block = src
      .slice(src.indexOf('const commands'), src.indexOf('for (const args'))
      .replace('commands: string[][]', 'commands');
  const original: string[][] = JSON.parse(
    vm.runInNewContext(block + '\nJSON.stringify(commands)'),
  );
  const j = (cmd: string[], fields: Record<string, string>) => {
    const c = structuredClone(cmd);
    c[c.indexOf('--json') + 1] = JSON.stringify(fields);
    return c;
  };
  try {
    for (const mode of [
      'reference',
      'split',
      'date_first',
      'reverse',
      'restore_before',
      'late_dates',
      'one_late',
      'revert_before',
      'early_record',
      'missing_date',
      'wrong_date',
      'missing_registrant',
    ]) {
      let commands = structuredClone(original),
        start = commands.findIndex(
          (c) => c[1] === '+record-upsert' && c.includes('--record-id'),
        ),
        end = start + 8,
        updates = commands.slice(start, end),
        before = commands.slice(0, start),
        after = commands.slice(end),
        statuses = updates.map((c) => j(c, { webinar_status: 'cancelled' })),
        dates = updates.map((c) => j(c, { cancellation_date: '2026-01-27' }));
      if (mode === 'split')
        commands = [...before, ...statuses, ...dates, ...after];
      if (mode === 'date_first')
        commands = [...before, ...dates, ...statuses, ...after];
      if (mode === 'reverse')
        commands = [...before, ...updates.reverse(), ...after];
      if (mode === 'late_dates')
        commands = [
          ...before,
          ...statuses,
          after[0],
          ...dates,
          ...after.slice(1),
        ];
      if (mode === 'one_late')
        commands = [
          ...before,
          statuses[0],
          ...updates.slice(1),
          after[0],
          dates[0],
          ...after.slice(1),
        ];
      if (mode === 'revert_before')
        commands = [
          ...before,
          ...updates,
          j(updates[0], { cancellation_date: '' }),
          after[0],
          dates[0],
          ...after.slice(1),
        ];
      if (mode === 'restore_before')
        commands = [
          ...before,
          ...updates,
          j(updates[0], { cancellation_date: '' }),
          dates[0],
          ...after,
        ];
      if (mode === 'early_record')
        commands = [
          ...before.slice(0, -1),
          updates[0],
          before[before.length - 1],
          ...updates.slice(1),
          ...after,
        ];
      if (mode === 'missing_date')
        commands = [...before, statuses[0], ...updates.slice(1), ...after];
      if (mode === 'wrong_date')
        commands = [
          ...before,
          j(updates[0], {
            webinar_status: 'cancelled',
            cancellation_date: '2026-01-28',
          }),
          ...updates.slice(1),
          ...after,
        ];
      if (mode === 'missing_registrant')
        commands = [...before.slice(0, -1), ...updates, ...after];
      const backend = await startMock(seed);
      try {
        for (const args of commands)
          await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
            env: { ...process.env, FEISHU_MOCK_URL: backend.url },
          });
        assert.equal(backend.calls.filter((c) => c.status >= 400).length, 0);
        const state = join(dir, mode + '.json'),
          output = join(dir, mode);
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
          [
            'reference',
            'split',
            'date_first',
            'reverse',
            'restore_before',
          ].includes(mode),
          mode,
        );
      } finally {
        await backend.close();
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
