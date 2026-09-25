import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('Two spreadsheet tokens with identical sheet IDs remain isolated and record writes', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3086/environment/seed.json',
      'utf8',
    ),
  );
  seed.spreadsheets = {
    book_a: {
      title: 'A',
      sheets: { sheet1: { title: 'Data', values: [['Value'], ['Alpha']] } },
    },
    book_b: {
      title: 'B',
      sheets: { sheet1: { title: 'Data', values: [['Value'], ['Beta']] } },
    },
  };
  const backend = await startMock(seed);
  async function cli(args: string[]) {
    return (
      await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
        env: { ...process.env, FEISHU_MOCK_URL: backend.url },
      })
    ).stdout;
  }
  try {
    const read = (token: string) =>
      cli([
        'sheets',
        '+cells-get',
        '--spreadsheet-token',
        token,
        '--sheet-id',
        'sheet1',
        '--range',
        'A1:A2',
      ]);
    assert.match(await read('book_a'), /Alpha/);
    assert.match(await read('book_b'), /Beta/);
    const response = await fetch(
      backend.url +
        '/open-apis/sheets/v2/spreadsheets/book_b/values_batch_get?ranges=sheet1!A1:A1&ranges=sheet1!A2:A2',
      { headers: { authorization: 'Bearer local-evaluation-only' } },
    );
    assert.equal(response.status, 200);
    const batch = (await response.json()) as {
      data: { valueRanges: { values: string[][] }[] };
    };
    assert.deepEqual(
      batch.data.valueRanges.map((range) => range.values),
      [[['Value']], [['Beta']]],
    );

    await cli([
      'sheets',
      '+cells-set',
      '--spreadsheet-token',
      'book_a',
      '--sheet-id',
      'sheet1',
      '--range',
      'A2',
      '--cells',
      JSON.stringify([[{ value: 'Updated' }]]),
    ]);
    assert.match(await read('book_a'), /Updated/);
    assert.match(await read('book_b'), /Beta/);
    assert.equal(
      backend.world.spreadsheets!.book_b.sheets.sheet1.values[1][0],
      'Beta',
    );
    assert.ok(
      backend.calls.some((c) =>
        c.mutations.some(
          (m: { kind: string; id: string }) =>
            m.kind === 'spreadsheet' && m.id === 'book_a',
        ),
      ),
    );
    assert.equal(backend.calls.filter((c) => c.status !== 200).length, 0);
  } finally {
    await backend.close();
  }
});

test('CLI no-overwrite writes empty cells and rejects an occupied range atomically', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3086/environment/seed.json',
      'utf8',
    ),
  );
  seed.spreadsheets = {
    book: {
      title: 'Book',
      sheets: { s: { title: 'Data', values: [['', 'occupied']] } },
    },
  };
  const backend = await startMock(seed);
  const args = [
    'sheets',
    '+cells-set',
    '--spreadsheet-token',
    'book',
    '--sheet-id',
    's',
    '--allow-overwrite=false',
  ];
  const cli = (tail: string[]) =>
    exec(resolve('gyms/lark-cli/bin/lark-cli'), [...args, ...tail], {
      env: { ...process.env, FEISHU_MOCK_URL: backend.url },
    });
  try {
    await assert.rejects(
      cli([
        '--range',
        'A1:B1',
        '--cells',
        JSON.stringify([[{ value: 'first' }, { value: 'second' }]]),
      ]),
    );
    assert.deepEqual(backend.world.spreadsheets!.book.sheets.s.values, [
      ['', 'occupied'],
    ]);
    assert.equal(backend.calls.at(-1)?.changed, false);
    assert.equal(backend.calls.at(-1)?.status, 400);
    await cli([
      '--range',
      'A2:B2',
      '--cells',
      JSON.stringify([[{ value: 'first' }, { value: 'second' }]]),
    ]);
    assert.deepEqual(backend.world.spreadsheets!.book.sheets.s.values, [
      ['', 'occupied'],
      ['first', 'second'],
    ]);
  } finally {
    await backend.close();
  }
});
