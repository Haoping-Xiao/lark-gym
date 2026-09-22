import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);

for (const id of [4027, 4094])
  test(`finance ${id}: required business state and reviewed notification scope`, async () => {
    const root = `tasks/automationbench-finance-${id}`;
    const seed = JSON.parse(
      await readFile(`${root}/environment/seed.json`, 'utf8'),
    );
    const backend = await startMock(seed);
    const dir = await mkdtemp(join(tmpdir(), 'report-scope-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: backend.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      const world = structuredClone(backend.world);
      const old = new Set(seed.messages.map((m: any) => m.message_id));
      const messages = world.messages.filter((m) => !old.has(m.message_id));
      assert.equal(messages.length, 1);
      assert.equal(
        messages[0].chat_id,
        id === 4027 ? 'oc_email_2' : 'oc_email_0',
      );
      const verify = async (state: any, name: string) => {
        const file = join(dir, `${name}.json`),
          output = join(dir, name);
        await writeFile(
          file,
          JSON.stringify({ seed, world: state, calls: backend.calls }),
        );
        await exec(process.execPath, [`${root}/tests/verify.ts`], {
          env: { ...process.env, MOCK_STATE: file, VERIFIER_OUTPUT: output },
        });
        return JSON.parse(await readFile(join(output, 'result.json'), 'utf8'));
      };
      assert.equal(
        (await verify(world, 'controller-only')).business_success,
        true,
      );
      const broadcast = structuredClone(world);
      broadcast.messages.push({
        ...structuredClone(messages[0]),
        message_id: 'unrequested-group',
        chat_id: 'oc_C_FIN_ALERTS',
      });
      assert.equal(
        (await verify(broadcast, 'unrequested-group')).business_success,
        false,
      );
      const missing = structuredClone(world);
      missing.messages = missing.messages.filter((m) => old.has(m.message_id));
      assert.equal(
        (await verify(missing, 'no-notice')).business_success,
        id === 4094,
      );
      const partial = structuredClone(world);
      if (id === 4027)
        partial.spreadsheets!['ss_vendor_pmts'].sheets[
          'ws_jan_pmts'
        ].values[6][5] = '';
      else {
        partial.base.records = partial.base.records.filter(
          (r) => r.fields.ratio !== 'DSCR',
        );
        const repeated = structuredClone(world);
        repeated.messages.push({
          ...structuredClone(messages[0]),
          message_id: 'duplicate-notice',
        });
        assert.equal(
          (await verify(repeated, 'duplicate-notice')).business_success,
          false,
        );
      }
      assert.equal(
        (await verify(partial, 'missing-required-state')).business_success,
        false,
      );
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
