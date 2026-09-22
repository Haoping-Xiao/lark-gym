import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
test('task packages do not inject execution guides into solver or judge', async () => {
  const tasks = (await readdir('tasks')).filter(
    (n) => n.startsWith('automationbench-') || n === 'maintenance-notice',
  );
  assert.equal(tasks.length, 801);
  for (const name of tasks) {
    const root = join('tasks', name);
    const instruction = await readFile(join(root, 'instruction.md'), 'utf8');
    const seed = JSON.parse(
      await readFile(join(root, 'environment/seed.json'), 'utf8'),
    );
    assert.ok(instruction.includes(seed.now), name);
    assert.doesNotMatch(
      await readFile(join(root, 'environment/Dockerfile'), 'utf8'),
      /COPY AGENTS/,
    );
    await assert.rejects(access(join(root, 'environment/AGENTS.md')));
    if (name.startsWith('automationbench-'))
      assert.equal(
        await readFile(join(root, 'tests/task-instruction.md'), 'utf8'),
        instruction,
        name,
      );
  }
});
