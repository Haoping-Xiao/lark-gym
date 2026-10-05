import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TaskFixture } from '../helpers/task-fixture.ts';

export async function checkNoOp(fixture: TaskFixture) {
  const { grade, dir } = fixture;
  const initialGrade = await grade();
  if (initialGrade === '1') {
    const initial = JSON.parse(
      await readFile(join(dir, 'result.json'), 'utf8'),
    );
    assert.equal(
      initial.semantic?.required,
      true,
      'An unchanged world may pass structural checks only if semantic judgment is still required',
    );
    assert.ok(initial.semantic.deferred.length > 0);
  } else assert.equal(initialGrade, '0');

  fixture.initialGrade = initialGrade;
}
