import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const name of ['marketing-1609', 'marketing-1085'])
  test(`${name}: complete rows may move without losing ranking or qualification`, async () => {
    const root = `tasks/automationbench-${name}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      b = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'ranked-rows-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: b.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      for (const mode of name === 'marketing-1609'
        ? ['group-swap', 'wrong-rank', 'wrong-lift', 'duplicate', 'missing']
        : [
            'reordered',
            'wrong-contact',
            'wrong-niche',
            'wrong-status',
            'duplicate',
            'missing',
            'extra-b2b',
          ]) {
        const world = structuredClone(b.world),
          values =
            world.spreadsheets![
              name === 'marketing-1609' ? 'ss_schedule' : 'ss_outreach'
            ].sheets[name === 'marketing-1609' ? 'ws_optimal' : 'ws_queue']
              .values;
        if (mode === 'group-swap')
          values.splice(1, 4, ...values.slice(3, 5), ...values.slice(1, 3));
        if (mode === 'reordered')
          values.splice(1, 4, values[2], values[1], values[4], values[3]);
        if (mode === 'wrong-rank') values[1][1] = '2';
        if (mode === 'wrong-lift') values[1][5] = '+9.0 pp';
        if (mode === 'wrong-contact') values[1][1] = 'wrong@example.com';
        if (mode === 'wrong-niche') values[1][3] = 'WRONG';
        if (mode === 'wrong-status') values[1][2] = 'Contacted';
        if (mode === 'duplicate') values[4] = structuredClone(values[1]);
        if (mode === 'missing') values.pop();
        if (mode === 'extra-b2b')
          values.push([
            'B2B Growth Blog',
            'content@b2bgrowth.example.com',
            'Queued',
            'b2b marketing',
          ]);
        const state = join(dir, mode + '.json'),
          output = join(dir, mode);
        await writeFile(state, JSON.stringify({ seed, world, calls: b.calls }));
        await exec(process.execPath, [`${root}/tests/verify.ts`], {
          env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
        });
        assert.equal(
          JSON.parse(await readFile(join(output, 'result.json'), 'utf8'))
            .business_success,
          ['group-swap', 'reordered'].includes(mode),
          mode,
        );
      }
    } finally {
      await b.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
