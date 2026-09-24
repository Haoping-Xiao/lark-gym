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
  'sales-105',
  'sales-104',
  'marketing-1166',
  'operations-1315',
  'operations-1308',
  'operations-1282',
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
      const field =
        name.startsWith('sales-') || name === 'marketing-1166'
          ? 'label_ids'
          : 'tags';
      const target = b.world.base.records.find(
        (r) =>
          typeof r.fields[field] === 'string' &&
          JSON.parse(r.fields[field]).length &&
          seed.base.records.find((old: any) => old.record_id === r.record_id)
            ?.fields[field] !== r.fields[field],
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
          tags = JSON.parse(String(record.fields[field]));
        tags.reverse();
        if (mode === 'missing-tag') tags.pop();
        if (mode === 'duplicate') tags.push(tags[0]);
        if (mode === 'wrong-tag') tags[0] = 'WRONG';
        record.fields[field] =
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

test('marketing-1033: JSON object formatting preserves every original name and empty tags', async () => {
  const root = 'tasks/automationbench-marketing-1033',
    seed = JSON.parse(await readFile(`${root}/environment/seed.json`, 'utf8')),
    b = await startMock(seed),
    dir = await mkdtemp(join(tmpdir(), 'merge-json-'));
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
        typeof r.fields.merge_fields === 'string' &&
        !seed.base.records.some((old: any) => old.record_id === r.record_id),
    )!;
    assert.ok(target);
    for (const mode of [
      'equivalent',
      'missing-key',
      'wrong-name',
      'wrong-tag',
      'object-not-text',
      'malformed',
    ]) {
      const world = structuredClone(b.world),
        record = world.base.records.find(
          (r) => r.record_id === target.record_id,
        )!,
        fields = Object.fromEntries(
          Object.entries(
            JSON.parse(String(record.fields.merge_fields)),
          ).reverse(),
        );
      if (mode === 'missing-key') delete fields.FNAME;
      if (mode === 'wrong-name') fields.FNAME = 'WRONG';
      record.fields.merge_fields =
        mode === 'object-not-text'
          ? (fields as unknown as string)
          : mode === 'malformed'
            ? '{broken'
            : JSON.stringify(fields, null, 2);
      record.fields.tags = mode === 'wrong-tag' ? '["WRONG"]' : '[ ]';
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
