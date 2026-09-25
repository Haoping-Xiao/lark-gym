import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('Calendar video settings accept CLI vchat and reject contradictory representations', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'video-fields-')),
    task = repo + '/tasks/automationbench-sales-1004',
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
    'both_video',
    'wrong_video',
    'conflicting_video',
    'missing_video',
    'empty_video',
  ]) {
    let cs = structuredClone(original),
      e = cs.find((c) => c[0] === 'calendar'),
      o = JSON.parse(e[e.indexOf('--data') + 1]);
    if (mode === 'shortcut') {
      cs[cs.indexOf(e)] = [
        'calendar',
        '+create',
        '--calendar-id',
        'primary',
        '--summary',
        o.summary,
        '--description',
        o.description,
        '--start',
        '2026-02-24T10:00:00Z',
        '--end',
        '2026-02-24T11:00:00Z',
      ];
    } else {
      if (mode === 'both_video') o.vchat = { vc_type: 'vc' };
      if (mode === 'wrong_video') {
        delete o.vc_data;
        o.vchat = { vc_type: 'third_party' };
      }
      if (mode === 'conflicting_video') o.vchat = { vc_type: 'third_party' };
      if (mode === 'missing_video') delete o.vc_data;
      if (mode === 'empty_video') o.vchat = {};
      e[e.indexOf('--data') + 1] = JSON.stringify(o);
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
      });
      const result = JSON.parse(
        await fs.readFile(a + '/' + mode + '/result.json', 'utf8'),
      );
      assert.equal(
        result.business_success,
        ['shortcut', 'both_video'].includes(mode),
        mode,
      );
    } finally {
      await b.close();
    }
  }
  await fs.rm(a, { recursive: true, force: true });
});
