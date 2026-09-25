import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('Jira task summaries retain source contains semantics without fixing full title', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'jira-title-')),
    task = repo + '/tasks/automationbench-simple-3111',
    seed = JSON.parse(
      await fs.readFile(task + '/environment/seed.json', 'utf8'),
    ),
    src = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
    original = JSON.parse(
      vm.runInNewContext(
        src
          .slice(src.indexOf('const commands'), src.indexOf('for (const args'))
          .replace('commands: string[][]', 'commands') +
          '\nJSON.stringify(commands)',
      ),
    );
  await fs.mkdir(a + '/states', { recursive: true });
  try {
    for (const mode of [
      'reference',
      'natural',
      'upper',
      'chinese',
      'missing_term',
      'wrong_topic',
      'wrong_project',
      'wrong_type',
      'false_topic_with_term',
    ]) {
      const cs = structuredClone(original),
        write = cs.at(-1),
        o = JSON.parse(write.at(-1));
      if (mode === 'natural')
        o.summary = 'Implement authentication improvements for users';
      if (mode === 'upper')
        o.summary = 'Implement User Authentication Improvements';
      if (mode === 'chinese')
        o.summary = '实施用户认证改进（authentication improvements）';
      if (mode === 'missing_term')
        o.summary = 'Strengthen user sign-in security';
      if (mode === 'wrong_topic') o.summary = 'Implement billing improvements';
      if (mode === 'wrong_project') o.project = 'OTHER';
      if (mode === 'wrong_type') o.issuetype = 'Bug';
      if (mode === 'false_topic_with_term')
        o.summary = 'Cancel all user authentication improvements';
      write[write.length - 1] = JSON.stringify(o);
      const b = await startMock(seed);
      try {
        for (const c of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        await fs.writeFile(
          a + '/states/' + mode + '.json',
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: a + '/states/' + mode + '.json',
            VERIFIER_OUTPUT: a + '/' + mode,
          },
          maxBuffer: 8e6,
        });
        const d = JSON.parse(
          await fs.readFile(a + '/' + mode + '/result.json', 'utf8'),
        );
        assert.equal(
          d.business_success,
          [
            'reference',
            'natural',
            'upper',
            'chinese',
            'false_topic_with_term',
          ].includes(mode),
          mode,
        );
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
