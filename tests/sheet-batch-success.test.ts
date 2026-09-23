import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('real CLI successful cell batches share state; uncertain failures are excluded without writes', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3086/environment/seed.json',
      'utf8',
    ),
  );
  seed.spreadsheets = {
    a: {
      title: 'A',
      sheets: {
        s: { title: 'Data', values: [['header']] },
        t: { title: 'Second', values: [['second header']] },
      },
    },
    b: {
      title: 'B',
      sheets: { s: { title: 'Data', values: [['other book']] } },
    },
  };
  const backend = await startMock(seed),
    other = await startMock(seed);
  const cli = async (args: string[], url = backend.url) =>
    JSON.parse(
      (
        await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
          env: { ...process.env, FEISHU_MOCK_URL: url },
        })
      ).stdout,
    );
  const op = (range: string, value: string, extra = {}) => ({
    shortcut: '+cells-set',
    input: { sheet_id: 's', range, cells: [[{ value }]], ...extra },
  });
  const batch = (ops: unknown[], cont = false) =>
    cli([
      'sheets',
      '+batch-update',
      '--spreadsheet-token',
      'a',
      '--operations',
      JSON.stringify(ops),
      '--yes',
      ...(cont ? ['--continue-on-error'] : []),
    ]);
  try {
    const result = await batch([
      op('A2', 'first'),
      op('A2', 'last'),
      op('B2', '0042'),
      op('A2', 'another sheet', { sheet_id: 't' }),
    ]);
    assert.equal(result.data?.succeeded ?? result.succeeded, 4);
    assert.deepEqual(backend.world.spreadsheets!.a.sheets.s.values[1], [
      'last',
      '0042',
    ]);
    assert.equal(
      backend.world.spreadsheets!.a.sheets.t.values[1][0],
      'another sheet',
    );
    assert.deepEqual(backend.world.spreadsheets!.b, seed.spreadsheets.b);
    const read = await cli([
      'sheets',
      '+cells-get',
      '--spreadsheet-token',
      'a',
      '--sheet-id',
      's',
      '--range',
      'A2:B2',
    ]);
    assert.match(JSON.stringify(read), /0042/);
    assert.deepEqual(other.world.spreadsheets, seed.spreadsheets);
    await batch([op('A3', 'continued')], true);
    const before = structuredClone(backend.world);
    for (const cont of [false, true]) {
      await assert.rejects(
        batch(
          [
            op('A4', 'must not leak'),
            op('A2', 'blocked', { allow_overwrite: false }),
          ],
          cont,
        ),
      );
      assert.equal(backend.calls.at(-1)!.status, 501);
      assert.deepEqual(backend.world, before);
    }
    await assert.rejects(
      batch([
        op('A4', 'must not leak'),
        op('A5', 'x', { sheet_id: 'missing' }),
      ]),
    );
    assert.equal(backend.calls.at(-1)!.status, 501);
    assert.deepEqual(backend.world, before);
    const callsBeforeMixed = backend.calls.length;
    await assert.rejects(
      batch([
        op('A4', 'must not leak'),
        { shortcut: '+sheet-create', input: { title: 'unsupported' } },
      ]),
    );
    assert.equal(
      backend.calls
        .slice(callsBeforeMixed)
        .filter((call) => call.method === 'POST').length,
      1,
    );
    assert.equal(backend.calls.at(-1)!.status, 501);
    assert.deepEqual(backend.world, before);
  } finally {
    await backend.close();
    await other.close();
  }
});
