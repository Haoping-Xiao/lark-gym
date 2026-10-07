import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const exec = promisify(execFile);
test('built CLI embeds pinned skills and references without a source working directory', async () => {
  const binary = resolve('gyms/lark-cli/bin/lark-cli');
  const source = resolve('.deps/lark-cli/skills');
  const cwd = await mkdtemp(join(tmpdir(), 'lark-skills-'));
  const run = async (...args) => {
    const { stdout } = await exec(binary, args, {
      cwd,
      env: { ...process.env, FEISHU_MOCK_URL: 'http://127.0.0.1:1' },
      maxBuffer: 4 * 1024 * 1024,
    });
    return JSON.parse(stdout);
  };
  try {
    const listed = await run('skills', 'list');
    assert.equal(listed.ok, true);
    const expected = [];
    for (const entry of await readdir(source, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      try {
        await readFile(join(source, entry.name, 'SKILL.md'));
        expected.push(entry.name);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    assert.ok(expected.length > 0);
    assert.deepEqual(listed.skills.map((s) => s.name).sort(), expected.sort());
    for (const name of expected) {
      const result = await run('skills', 'read', name, '--json');
      assert.equal(
        result.content,
        await readFile(join(source, name, 'SKILL.md'), 'utf8'),
      );
    }
    const reference = 'references/lark-base-record-query-and-analysis-sop.md';
    const result = await run(
      'skills',
      'read',
      'lark-base',
      reference,
      '--json',
    );
    assert.equal(
      result.content,
      await readFile(join(source, 'lark-base', reference), 'utf8'),
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
