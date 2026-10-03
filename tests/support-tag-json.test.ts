import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const name of [
  'support-1574',
  'support-1573',
  'support-1562',
  'support-1531',
  'support-1492',
  'support-1503',
  'support-1594',
])
  test(`${name}: JSON tag representation preserves existing and added tags`, async () => {
    const root = `tasks/automationbench-${name}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      expected = JSON.parse(
        await readFile(`${root}/tests/expected.json`, 'utf8'),
      ),
      target =
        expected.updates.find(
          (u: any) => u.field === 'tags' && JSON.parse(u.value).length > 1,
        ) || expected.updates.find((u: any) => u.field === 'tags'),
      existing =
        JSON.parse(
          seed.base.records.find((r: any) => r.record_id === target.record_id)
            .fields.tags,
        )[0] || JSON.parse(target.value)[0],
      b = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'tag-json-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: b.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      for (const mode of [
        'equivalent',
        'missing-existing',
        'duplicate',
        'wrong-tag',
        'array-not-text',
        'malformed',
      ]) {
        const world = structuredClone(b.world),
          record = world.base.records.find(
            (r) => r.record_id === target.record_id,
          )!,
          tags = JSON.parse(String(record.fields.tags));
        if (name !== 'support-1594') tags.reverse();
        if (mode === 'missing-existing') tags.splice(tags.indexOf(existing), 1);
        if (mode === 'duplicate') tags.push(tags[0]);
        if (mode === 'wrong-tag') tags[0] = 'WRONG';
        record.fields.tags =
          mode === 'array-not-text'
            ? tags
            : mode === 'malformed'
              ? '[broken'
              : JSON.stringify(tags, null, 2);
        const state = join(dir, mode + '.json'),
          output = join(dir, mode);
        await writeFile(state, JSON.stringify({ seed, world, calls: b.calls }));
        await exec(process.execPath, [`${root}/tests/verify.ts`], {
          env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
        });
        assert.equal(
          JSON.parse(await readFile(join(output, 'result.json'), 'utf8'))
            .business_success,
          mode === 'equivalent',
          mode,
        );
      }
    } finally {
      await b.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
