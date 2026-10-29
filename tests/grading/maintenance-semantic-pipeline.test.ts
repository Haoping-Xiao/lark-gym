import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  readFile,
  writeFile,
  mkdir,
  rm,
  access,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
import { oracle } from '../../tasks/maintenance-notice/solution/oracle.ts';
import { verify } from '../../tasks/maintenance-notice/tests/verify.ts';
import { maintenanceCases } from '../fixtures/maintenance-semantic-cases.ts';
const exec = promisify(execFile);
test('maintenance semantics cannot receive success from literal checks alone (stub tests composition, not judge quality)', async () => {
  const seed = JSON.parse(
    await readFile('tasks/maintenance-notice/environment/seed.json', 'utf8'),
  );
  const dir = await mkdtemp(join(tmpdir(), 'maintenance-semantic-'));
  const bin = join(dir, 'bin');
  await mkdir(bin);
  await writeFile(
    join(bin, 'rewardkit'),
    `#!/usr/bin/env node
const fs = require('node:fs'),path = require('node:path');
const out = process.argv[process.argv.indexOf('--output')+1];
fs.writeFileSync(out,process.env.STUB_MALFORMED ? 'not-json' : JSON.stringify({reward:Number(process.env.STUB_SCORE)}));
fs.writeFileSync(path.join(path.dirname(out),'reward-details.json'),JSON.stringify(process.env.STUB_ERROR ? {error:'unavailable'} : {score:Number(process.env.STUB_SCORE)}));
`,
    { mode: 0o755 },
  );
  try {
    for (const fixture of maintenanceCases) {
      const mock = await startMock(seed);
      try {
        if (!('noop' in fixture))
          await oracle(async (original) => {
            const args = [...original];
            if (
              'title' in fixture &&
              args[0] === 'calendar' &&
              args[2] === 'create'
            ) {
              const at = args.indexOf('--data') + 1;
              const event = JSON.parse(args[at]);
              event.summary = fixture.title;
              args[at] = JSON.stringify(event);
            }
            if (args.includes('--text'))
              args[args.indexOf('--text') + 1] = fixture.text;
            if (args.includes('--json'))
              args[args.indexOf('--json') + 1] = JSON.stringify({
                'Maintenance log': fixture.text,
              });
            return exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
              env: { ...process.env, FEISHU_MOCK_URL: mock.url },
            });
          });
        const snapshot = join(dir, fixture.id + '.json');
        await writeFile(
          snapshot,
          JSON.stringify({ seed, world: mock.world, calls: mock.calls }),
        );
        const rules = verify(seed, mock.world, mock.calls);
        assert.equal(
          rules.success,
          false,
          fixture.id + ' must not bypass semantics',
        );
        assert.equal(rules.business_success, !('noop' in fixture));
        const out = join(dir, fixture.id);
        const env = {
          ...process.env,
          PATH: bin + ':' + process.env.PATH,
          MOCK_STATE: snapshot,
          VERIFIER_OUTPUT: out,
          STUB_SCORE: String(fixture.expected),
        };
        await exec(
          process.execPath,
          ['tasks/maintenance-notice/tests/entry.ts'],
          { env },
        );
        const result = JSON.parse(
          await readFile(join(out, 'result.json'), 'utf8'),
        );
        assert.equal(result.success, fixture.expected === 1);
        if ('noop' in fixture)
          assert.equal(result.semantic_status, 'blocked_by_rules');
        else {
          const evidence = JSON.parse(
            await readFile(join(out, 'semantic/input.json'), 'utf8'),
          );
          assert.deepEqual(evidence.world, mock.world);
          assert.ok(
            evidence.deferred_checks.includes(
              'maintenance.record_and_notification_business_meaning',
            ),
          );
          assert.match(
            evidence.expected_facts.maintenance.requirement,
            /不能宣布取消/,
          );
          if (fixture.id === 'correct') {
            await assert.rejects(
              exec(
                process.execPath,
                ['tasks/maintenance-notice/tests/entry.ts'],
                { env: { ...env, STUB_ERROR: 'yes' } },
              ),
            );
            await assert.rejects(access(join(out, 'reward.txt')));
            await assert.rejects(
              exec(
                process.execPath,
                ['tasks/maintenance-notice/tests/entry.ts'],
                { env: { ...env, STUB_MALFORMED: 'yes' } },
              ),
            );
            await assert.rejects(access(join(out, 'reward.txt')));
          }
        }
      } finally {
        await mock.close();
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
