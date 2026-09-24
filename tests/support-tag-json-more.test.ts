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
  'support-1490',
  'support-1545',
  'support-1527',
  'support-1423',
  'support-1552',
  'support-1502',
  'support-1528',
  'support-1432',
])
  test(`${name}: created or updated tag JSON preserves business membership`, async () => {
    const root = `tasks/automationbench-${name}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      b = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'tag-json-more-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: b.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      const target = b.world.base.records.find(
        (r) =>
          typeof r.fields.tags === 'string' &&
          JSON.parse(r.fields.tags).length &&
          seed.base.records.find((old: any) => old.record_id === r.record_id)
            ?.fields.tags !== r.fields.tags,
      )!;
      assert.ok(target);
      for (const mode of [
        'equivalent',
        'missing-tag',
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
        if (name !== 'support-1432') tags.reverse();
        if (mode === 'missing-tag') tags.pop();
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
