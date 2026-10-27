import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createTaskFixture } from '../helpers/task-fixture.ts';
const exec = promisify(execFile);

test('task rules reject failed shared literal-cell and record-group checks', async () => {
  const fixture = await createTaskFixture('automationbench-finance-4007');
  try {
    await fixture.solve();
    assert.equal(await fixture.grade(), '1');
    const tests = join(fixture.dir, 'copied-tests');
    await cp('tasks/automationbench-finance-4007/tests', tests, {
      recursive: true,
    });
    const config = JSON.parse(
      await readFile(join(tests, 'semantic-config.json'), 'utf8'),
    );
    const cell = fixture.expected.cells[0];
    for (const mode of ['literal', 'group']) {
      const world = structuredClone(fixture.backend.world);
      const next = structuredClone(config);
      if (mode === 'literal')
        next.literal_cell_terms = { '0': ['REQUIRED_LITERAL_ABSENT'] };
      else {
        const sheet =
          world.spreadsheets![cell.spreadsheet_token].sheets[cell.sheet_id];
        next.optional_cell_edits = [
          {
            spreadsheet_token: cell.spreadsheet_token,
            sheet_id: cell.sheet_id,
            row: 0,
            column: 0,
            literal_terms: ['REQUIRED_LITERAL_ABSENT'],
          },
        ];
        sheet.values[0][0] = 'optional correction missing required source';
      }
      await writeFile(
        join(tests, 'semantic-config.json'),
        JSON.stringify(next),
      );
      const state = join(fixture.dir, mode + '.json');
      const output = join(fixture.dir, mode);
      await mkdir(output);
      await writeFile(
        state,
        JSON.stringify({
          seed: fixture.seed,
          world,
          calls: fixture.backend.calls,
        }),
      );
      await exec(process.execPath, [join(tests, 'verify.ts')], {
        env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
      });
      const result = JSON.parse(
        await readFile(join(output, 'result.json'), 'utf8'),
      );
      const checks =
        result.semantic[
          mode === 'literal' ? 'literalCellChecks' : 'recordGroupChecks'
        ];
      assert.ok(
        checks.some((c: { passed: boolean }) => !c.passed),
        mode,
      );
      assert.equal(
        (await readFile(join(output, 'reward.txt'), 'utf8')).trim(),
        '0',
        mode,
      );
    }
  } finally {
    await fixture.close();
  }
});
