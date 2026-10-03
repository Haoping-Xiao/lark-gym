import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('typed text cells preserve values and formatting across reads and isolate rejected writes', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3086/environment/seed.json',
      'utf8',
    ),
  );
  seed.spreadsheets = {
    a: { title: 'A', sheets: { s: { title: 'Data', values: [['original']] } } },
    b: { title: 'B', sheets: { s: { title: 'Data', values: [['other']] } } },
  };
  const backend = await startMock(seed),
    other = await startMock(seed);
  const cli = async (args: string[]) =>
    JSON.parse(
      (
        await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
          env: { ...process.env, FEISHU_MOCK_URL: backend.url },
        })
      ).stdout,
    );
  const set = (range: string, cells: unknown, extra: string[] = []) =>
    cli([
      'sheets',
      '+cells-set',
      '--spreadsheet-token',
      'a',
      '--sheet-id',
      's',
      '--range',
      range,
      '--cells',
      JSON.stringify(cells),
      ...extra,
    ]);
  try {
    await cli([
      'sheets',
      '+table-put',
      '--spreadsheet-token',
      'a',
      '--sheets',
      JSON.stringify({
        sheets: [
          {
            name: 'Data',
            start_cell: 'C3',
            header: false,
            columns: ['id', 'rate'],
            data: [
              ['000123', '66%'],
              ['9007199254740993', '0'],
            ],
          },
        ],
      }),
    ]);
    assert.deepEqual(
      backend.world.spreadsheets!.a.sheets.s.values[2].slice(2),
      ['000123', '66%'],
    );
    const cells = await cli([
      'sheets',
      '+cells-get',
      '--spreadsheet-token',
      'a',
      '--sheet-id',
      's',
      '--range',
      'C3:D4',
    ]);
    assert.match(JSON.stringify(cells), /000123/);
    assert.match(JSON.stringify(cells), /number_format/);
    assert.match(JSON.stringify(cells), /9007199254740993/);
    const table = await cli([
      'sheets',
      '+table-get',
      '--spreadsheet-token',
      'a',
      '--sheet-id',
      's',
      '--range',
      'C3:D4',
      '--no-header',
    ]);
    assert.match(JSON.stringify(table), /000123/);
    assert.match(JSON.stringify(table), /object/);
    assert.match(JSON.stringify(table), /9007199254740993/);
    await set('C3', [[{ value: '000456' }]]);
    assert.deepEqual(
      backend.world.spreadsheets!.a.sheets.s.cell_styles!['2:2'],
      { number_format: '@' },
    );
    assert.deepEqual(backend.world.spreadsheets!.b, seed.spreadsheets.b);
    assert.deepEqual(other.world.spreadsheets, seed.spreadsheets);
    await cli([
      'sheets',
      '+batch-update',
      '--spreadsheet-token',
      'a',
      '--operations',
      JSON.stringify([
        {
          shortcut: '+cells-set',
          input: {
            sheet_id: 's',
            range: 'C5',
            cells: [[{ value: '0007', cell_styles: { number_format: '@' } }]],
          },
        },
      ]),
      '--yes',
    ]);
    assert.equal(backend.world.spreadsheets!.a.sheets.s.values[4][2], '0007');
    assert.deepEqual(
      backend.world.spreadsheets!.a.sheets.s.cell_styles!['4:2'],
      { number_format: '@' },
    );
    const before = structuredClone(backend.world);
    for (const style of [
      { bold: true },
      { number_format: '0.00' },
      { number_format: '@', bold: true },
    ]) {
      await assert.rejects(
        set('A6:B6', [
          [{ value: 'must not leak' }, { value: '001', cell_styles: style }],
        ]),
      );
      assert.equal(backend.calls.at(-1)!.status, 501);
      assert.deepEqual(backend.world, before);
    }
    await assert.rejects(
      set(
        'C3',
        [[{ value: 'bad', cell_styles: { number_format: '@' } }]],
        ['--allow-overwrite=false'],
      ),
    );
    assert.deepEqual(backend.world, before);
    assert.ok(
      backend.calls.some((c) =>
        c.mutations.some(
          (m) =>
            m.kind === 'spreadsheet' &&
            JSON.stringify(m.after).includes('number_format'),
        ),
      ),
    );
  } finally {
    await backend.close();
    await other.close();
  }
});
