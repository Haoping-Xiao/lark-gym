import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { parseCsv } from '../gyms/lark-cli/src/mock/csv.ts';
const exec = promisify(execFile);
test('CSV CLI roundtrip preserves quoted text, isolates books and rejects invalid/overwriting writes atomically', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3086/environment/seed.json',
      'utf8',
    ),
  );
  seed.spreadsheets = {
    a: {
      title: 'A',
      sheets: { s: { title: 'Data', values: [['', 'occupied']] } },
    },
    b: {
      title: 'B',
      sheets: { s: { title: 'Data', values: [['untouched']] } },
    },
  };
  const backend = await startMock(seed);
  const cli = async (args: string[]) =>
    JSON.parse(
      (
        await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
          env: { ...process.env, FEISHU_MOCK_URL: backend.url },
        })
      ).stdout,
    );
  const put = (csv: string, start = 'B3', overwrite = false) =>
    cli([
      'sheets',
      '+csv-put',
      '--spreadsheet-token',
      'a',
      '--sheet-id',
      's',
      '--start-cell',
      start,
      `--allow-overwrite=${overwrite}`,
      '--csv',
      csv,
    ]);
  try {
    const csv = '"a,b","say ""hi""",001\r\n"multi\nline",,中文\r\n';
    await put(csv);
    const expected = [
      ['a,b', 'say "hi"', '001'],
      ['multi\nline', '', '中文'],
    ];
    assert.deepEqual(
      backend.world
        .spreadsheets!.a.sheets.s.values.slice(2)
        .map((row) => row.slice(1)),
      expected,
    );
    const read = await cli([
      'sheets',
      '+csv-get',
      '--spreadsheet-token',
      'a',
      '--sheet-id',
      's',
      '--range',
      'B3:D4',
      '--include-row-prefix=false',
    ]);
    assert.deepEqual(parseCsv(read.data?.csv ?? read.csv), expected);
    const before = structuredClone(backend.world);
    for (const [text, start] of [
      ['x,y', 'A1'],
      ['"unclosed', 'A8'],
      ['a,b\nc', 'A8'],
      ['"a"x', 'A8'],
      ['a"b', 'A8'],
      ['x', '=A1'],
      ['x,y', 'ALL100000'],
      ['ok,=SUM(A1:A2)', 'A8'],
    ]) {
      await assert.rejects(put(text, start));
      assert.deepEqual(backend.world, before);
    }
    await put('updated', 'B3', true);
    assert.equal(
      backend.world.spreadsheets!.a.sheets.s.values[2][1],
      'updated',
    );
    assert.deepEqual(backend.world.spreadsheets!.b, seed.spreadsheets.b);
    assert.ok(
      backend.calls.some((c) =>
        c.mutations.some((m) => m.kind === 'spreadsheet' && m.id === 'a'),
      ),
    );
  } finally {
    await backend.close();
  }
});
