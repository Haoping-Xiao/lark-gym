import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('Lead classification pairs must be valid when mail is marked read', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'routing-')),
    task = repo + '/tasks' + '/automationbench-sales-1131',
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
    'cold_exploring',
    'both_variants',
    'unknown_three',
    'exploring_two',
    'wrong_score_at_read',
    'score_restored_before',
  ]) {
    const cs = structuredClone(original),
      get = (c) => JSON.parse(c.at(-1)),
      put = (c, o) => (c[c.length - 1] = JSON.stringify(o)),
      cold = get(cs[6]);
    if (['cold_exploring', 'both_variants', 'exploring_two'].includes(mode)) {
      cold.budget_signal = 'exploring';
      cold.score = mode === 'exploring_two' ? 2 : 3;
    }
    if (mode === 'unknown_three') cold.score = 3;
    put(cs[6], cold);
    if (mode === 'both_variants') {
      const o = get(cs[5]);
      o.urgency = 'low';
      o.score = 7;
      put(cs[5], o);
      cs[8][cs[8].length - 1] = cs[8].at(-1).replace('score=8', 'score=7');
    }
    const b = await startMock(seed);
    try {
      const run = (c) =>
        exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
          env: { ...process.env, FEISHU_MOCK_URL: b.url },
          maxBuffer: 8e6,
        });
      if (['wrong_score_at_read', 'score_restored_before'].includes(mode)) {
        for (const c of cs.slice(0, 9)) await run(c);
        const mutation = b.calls
          .flatMap((c) => c.mutations || [])
          .find(
            (m) =>
              m.kind === 'record' &&
              !m.before &&
              m.after?.fields?.email === 'tom.richards@mediumco.example.com',
          );
        if (!mutation) throw Error('Tom id');
        const patch = (score) =>
          run([
            ...cs[5].slice(0, cs[5].indexOf('--json')),
            '--record-id',
            mutation.id,
            '--json',
            JSON.stringify({ score }),
          ]);
        await patch(7);
        if (mode === 'score_restored_before') await patch(8);
        for (const c of cs.slice(9, 12)) await run(c);
        if (mode === 'wrong_score_at_read') await patch(8);
        await run(cs[12]);
      } else for (const c of cs) await run(c);
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
        ['cold_exploring', 'both_variants', 'score_restored_before'].includes(
          mode,
        ),
        mode,
      );
    } finally {
      await b.close();
    }
  }
  await fs.rm(a, { recursive: true, force: true });
});
