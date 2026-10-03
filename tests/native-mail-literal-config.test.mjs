import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test } from 'node:test';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile),
  root = process.cwd();
for (const [name, mode] of [
  ['marketing-1042', 'every-body'],
  ['finance-4057', 'witness'],
  ['marketing-1072', 'group'],
  ['operations-1340', 'subject'],
  ['operations-1340', 'body'],
  ['hr-5018', 'optional'],
]) {
  test(`native mail literal ${name} ${mode}`, async () => {
    const task = path.join(root, 'tasks', 'automationbench-' + name),
      seed = JSON.parse(await fs.readFile(task + '/environment/seed.json')),
      cfg = JSON.parse(await fs.readFile(task + '/tests/semantic-config.json')),
      code = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
      commands = vm.runInNewContext(
        code.match(/const commands: string\[\]\[\] = ([\s\S]*?);\nfor/)[1],
      );
    for (const changed of [false, true]) {
      const server = await startMock(seed),
        out = await fs.mkdtemp(path.join(os.tmpdir(), 'mail-literal-config-'));
      try {
        for (const original of commands) {
          const c = [...original];
          if (changed && c[0] === 'mail' && c[1] === '+send') {
            const to = c[c.indexOf('--to') + 1],
              scopes = {
                'every-body': cfg.literal_terms_per_mail_recipient,
                witness: cfg.literal_terms_in_one_mail_recipient,
                group: cfg.literal_mail_groups_recipient,
                subject: cfg.literal_mail_parts_recipient,
                body: cfg.literal_mail_parts_recipient,
              };
            if (
              mode === 'optional' &&
              cfg.optional_mail_recipients.includes(to)
            )
              continue;
            if (scopes[mode]?.[to])
              c[c.indexOf(mode === 'subject' ? '--subject' : '--body') + 1] =
                'Unrelated text';
          }
          await exec(root + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: server.url },
            maxBuffer: 16e6,
          });
        }
        assert.ok(server.calls.every((c) => c.status < 400));
        await fs.writeFile(
          out + '/state.json',
          JSON.stringify({ seed, world: server.world, calls: server.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: out + '/state.json',
            VERIFIER_OUTPUT: out,
          },
          maxBuffer: 8e6,
        });
        const result = JSON.parse(await fs.readFile(out + '/result.json'));
        assert.equal(result.business_success, !changed || mode === 'optional');
        assert.equal(result.semantic.required, true);
      } finally {
        await server.close();
        await fs.rm(out, { recursive: true, force: true });
      }
    }
  });
}
