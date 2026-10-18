import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
test('task shared verifier copies match their canonical sources and hard gates remain connected', () => {
  execFileSync('python3', ['scripts/task-support/install.py', '--check']);
  for (const task of readdirSync('tasks').filter((t) =>
    t.startsWith('automationbench-'),
  )) {
    const rules = readFileSync(`tasks/${task}/tests/verify.ts`, 'utf8');
    for (const gate of [
      'literalMessageChecks',
      'recordGroupChecks',
      'literalCellChecks',
    ])
      assert.ok(rules.includes(`semantic.${gate}.every`), `${task}: ${gate}`);
  }
});

test('installer repairs shared drift without changing task-owned rules or configuration', () => {
  execFileSync('python3', [
    '-c',
    `
import tempfile, pathlib, shutil, importlib.util
spec=importlib.util.spec_from_file_location('installer','scripts/task-support/install.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as td:
 task=pathlib.Path(td)/'task'
 shutil.copytree('tasks/automationbench-finance-4001',task)
 owned=['tests/verify.ts','tests/expected.json','tests/semantic-config.json','instruction.md','environment/seed.json']
 before={p:(task/p).read_bytes() for p in owned}
 (task/'tests/semantic.ts').write_text('broken')
 assert len(m.check(task))==1
 m.install(task)
 assert not m.check(task)
 assert all((task/p).read_bytes()==data for p,data in before.items())
 m.install(task)
 assert not m.check(task)
`,
  ]);
});
