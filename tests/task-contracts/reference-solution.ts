import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TaskFixture } from '../helpers/task-fixture.ts';

export async function checkReferenceSolution(fixture: TaskFixture) {
  const { grade, dir, backend } = fixture;
  await fixture.solve();
  assert.equal(
    await grade(),
    '1',
    (await readFile(join(dir, 'result.json'), 'utf8')) +
      JSON.stringify(backend.calls.filter((c) => c.status !== 200)),
  );
}
