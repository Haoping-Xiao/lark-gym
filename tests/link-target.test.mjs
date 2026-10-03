import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Source profile links preserve the actual URL target', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'link-target-')),
    task = repo + '/tasks/automationbench-simple-3006',
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
      'explanation',
      'markdown',
      'autolink',
      'punctuation',
      'fake_host',
      'extended_path',
      'display_disguise',
      'wrong_protocol',
      'no_protocol',
      'path_host_suffix',
    ]) {
      const cs = structuredClone(original),
        note = cs.find((c) => c[1] === '+record-upsert'),
        url = 'https://linkedin.example.com/in/sarahjohnson',
        values = {
          explanation: 'Sarah Johnson 的 LinkedIn 个人主页：' + url,
          markdown: '[Sarah Johnson](' + url + ')',
          autolink: '<' + url + '>',
          punctuation: 'LinkedIn: ' + url + '。',
          fake_host: 'https://not-linkedin.example.com/in/sarahjohnson',
          extended_path: url + '-other',
          display_disguise:
            '[' + url + '](https://not-linkedin.example.com/in/sarahjohnson)',
          wrong_protocol: url.replace('https:', 'http:'),
          no_protocol: url.replace('https://', ''),
          path_host_suffix:
            'https://linkedin.example.com/in/sarahjohnson@evil.example.com',
        };
      if (mode !== 'reference') {
        const o = JSON.parse(note.at(-1));
        o.description = values[mode];
        note[note.length - 1] = JSON.stringify(o);
      }
      const b = await startMock(seed);
      try {
        for (const c of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        if (b.calls.some((c) => c.status >= 400)) throw Error(mode);
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
            'explanation',
            'markdown',
            'autolink',
            'punctuation',
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
