import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('calendar description fields preserve required facts across typed and shortcut calls', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'event-description-')),
    task = repo + '/tasks/automationbench-operations-1347',
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
  for (const mode of [
    'shortcut',
    'rich',
    'both',
    'wrong_rich',
    'conflict',
    'empty_rich',
  ]) {
    let cs = structuredClone(original);
    cs = cs.map((c) => {
      if (c[0] !== 'calendar') return c;
      const i = c.indexOf('--data') + 1,
        d = JSON.parse(c[i]);
      if (mode === 'shortcut')
        return [
          'calendar',
          '+create',
          '--calendar-id',
          'cal_fire',
          '--summary',
          d.summary,
          '--start',
          '2026-02-12T09:00:00Z',
          '--end',
          '2026-02-12T09:30:00Z',
          '--description',
          d.description,
        ];
      d.description_rich =
        mode === 'wrong_rich' || mode === 'conflict'
          ? 'Wrong building'
          : mode === 'empty_rich'
            ? ''
            : d.description;
      if (!['both', 'conflict'].includes(mode)) delete d.description;
      c[i] = JSON.stringify(d);
      return c;
    });
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
      await exec('node', [task + '/tests/verify.ts'], {
        env: {
          ...process.env,
          MOCK_STATE: a + '/states/' + mode + '.json',
          VERIFIER_OUTPUT: a + '/' + mode,
        },
      });
      const result = JSON.parse(
        await fs.readFile(a + '/' + mode + '/result.json', 'utf8'),
      );
      assert.equal(
        result.business_success,
        ['shortcut', 'rich', 'both'].includes(mode),
        mode,
      );
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
