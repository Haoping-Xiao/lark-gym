import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const id of [1465, 1473, 1475, 1476, 4093])
  test(`task ${id}: JSON whitespace is harmless; missing, malformed or changed content fails`, async () => {
    const root = `tasks/automationbench-${id === 4093 ? 'finance' : 'support'}-${id}`,
      field =
        id === 4093 ? 'payment_ids' : id === 1476 ? 'source_threads' : 'tags';
    const seed = JSON.parse(
      await readFile(`${root}/environment/seed.json`, 'utf8'),
    );
    const expected = JSON.parse(
      await readFile(`${root}/tests/expected.json`, 'utf8'),
    );
    const backend = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'json-fields-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: backend.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      const original = structuredClone(backend.world);
      let world = structuredClone(original);
      const selected = () =>
        id === 1476 || id === 4093
          ? world.base.records.filter((r) =>
              expected.creates.some(
                (e: any) =>
                  e[field] &&
                  e.source_id === r.fields.source_id &&
                  e.collection === r.fields.collection,
              ),
            )
          : world.base.records.filter((r) =>
              expected.updates.some(
                (e: any) => e.field === field && e.record_id === r.record_id,
              ),
            );
      assert.ok(selected().length);
      const verify = async (name: string) => {
        const file = join(dir, `${name}.json`),
          output = join(dir, name);
        await writeFile(
          file,
          JSON.stringify({ seed, world, calls: backend.calls }),
        );
        await exec(process.execPath, [`${root}/tests/verify.ts`], {
          env: { ...process.env, MOCK_STATE: file, VERIFIER_OUTPUT: output },
        });
        return JSON.parse(await readFile(join(output, 'result.json'), 'utf8'));
      };
      for (const row of selected())
        row.fields[field] = JSON.stringify(
          JSON.parse(String(row.fields[field])),
          null,
          2,
        );
      assert.equal((await verify('pretty')).business_success, true);
      if (id === 4093) {
        for (const row of selected())
          row.fields[field] = JSON.stringify(
            JSON.parse(String(row.fields[field])).reverse(),
          );
        assert.equal((await verify('reordered')).business_success, true);
      }
      for (const [name, value] of [
        ['missing', '[]'],
        ['malformed', '['],
        ['wrong-type', []],
        ['unrelated', '["unrelated"]'],
      ]) {
        world = structuredClone(original);
        selected()[0].fields[field] = value as any;
        assert.equal(
          (await verify(String(name))).business_success,
          false,
          String(name),
        );
      }
      world = structuredClone(original);
      const row = selected()[0],
        items = JSON.parse(String(row.fields[field]));
      if (id === 1476) items[0].body += ' fabricated';
      else items.push(items[0]);
      row.fields[field] = JSON.stringify(items);
      assert.equal(
        (await verify('altered-or-duplicate')).business_success,
        false,
      );
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
