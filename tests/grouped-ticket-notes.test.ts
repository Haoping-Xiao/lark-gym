import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('ticket note partition preserves identity, privacy, completeness handoff and duplicate protection', async () => {
  const root = 'tasks/automationbench-support-1597',
    seed = JSON.parse(await readFile(`${root}/environment/seed.json`, 'utf8')),
    backend = await startMock(seed),
    dir = await mkdtemp(join(tmpdir(), 'grouped-notes-'));
  try {
    await exec(process.execPath, [`${root}/solution/solve.ts`], {
      env: {
        ...process.env,
        FEISHU_MOCK_URL: backend.url,
        LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
      },
    });
    for (const mode of [
      'reference',
      'split',
      'missing-field',
      'duplicate',
      'wrong-privacy',
      'wrong-ticket',
      'unrelated',
      'text-format',
      'source-format',
      'wrong-formatted-value',
    ]) {
      const world = structuredClone(backend.world),
        seedIds = new Set(seed.base.records.map((r: any) => r.record_id));
      if (
        ![
          'reference',
          'text-format',
          'source-format',
          'wrong-formatted-value',
        ].includes(mode)
      ) {
        const note = world.base.records.find(
          (r: any) =>
            !seedIds.has(r.record_id) &&
            r.fields.collection === 'support_comments' &&
            r.fields.ticket_id === 'zt_07',
        )!;
        note.fields.body = 'discrepancy | zt_07 | ft_07 | status: open vs 4';
        if (mode !== 'missing-field')
          world.base.records.push({
            ...structuredClone(note),
            record_id: 'rec_partition',
            fields: {
              ...note.fields,
              body:
                mode === 'duplicate'
                  ? note.fields.body
                  : 'discrepancy | zt_07 | ft_07 | priority: high vs 4',
            },
          });
        if (mode === 'wrong-privacy') note.fields.public = 'true';
        if (mode === 'wrong-ticket') note.fields.ticket_id = 'zt_04';
        if (mode === 'unrelated')
          world.base.records.push({
            ...structuredClone(note),
            record_id: 'rec_unrelated',
            fields: { ...note.fields, collection: 'unrelated' },
          });
      }
      if (
        ['text-format', 'source-format', 'wrong-formatted-value'].includes(mode)
      ) {
        const sheet = world.spreadsheets!.ss_sync.sheets.ws_discrepancies;
        sheet.cell_styles = {};
        for (let row = 1; row < sheet.values.length; row++)
          for (let column = 0; column < sheet.values[row].length; column++)
            sheet.cell_styles[`${row}:${column}`] = { number_format: '@' };
        if (mode === 'source-format')
          sheet.cell_styles['0:0'] = { number_format: '@' };
        if (mode === 'wrong-formatted-value')
          sheet.values[1][1] = 'WRONG TICKET';
      }
      const state = join(dir, mode + '.json'),
        output = join(dir, mode);
      await writeFile(
        state,
        JSON.stringify({ seed, world, calls: backend.calls }),
      );
      await exec(process.execPath, [`${root}/tests/verify.ts`], {
        env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
      });
      const r = JSON.parse(await readFile(join(output, 'result.json'), 'utf8'));
      assert.equal(
        r.business_success,
        ['reference', 'split', 'missing-field', 'text-format'].includes(mode),
        mode,
      );
      assert.ok(
        r.semantic.deferred.includes(
          'creates.grouped_notes.completeness_and_no_redundancy',
        ),
      );
      assert.equal(r.semantic.original.record_count_groups.length, 4);
      // Missing field is intentionally deferred to the independent semantic judge.
    }
  } finally {
    await backend.close();
    await rm(dir, { recursive: true, force: true });
  }
});
