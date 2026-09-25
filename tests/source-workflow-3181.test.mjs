import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('source workflow 3181 through real CLI', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'source-3181-')),
    task = repo + '/tasks/automationbench-simple-3181',
    seed = JSON.parse(await fs.readFile(task + '/environment/seed.json')),
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
      'filter',
      'get',
      'project_email',
      'no_read',
      'read_late',
      'wrong_query',
      'project_name',
      'failed_read',
      'wrong_name',
      'wrong_email',
      'wrong_status',
      'update_instead',
    ]) {
      let cs = structuredClone(original);
      const [read, write] = cs;
      const get = [
        'base',
        '+record-get',
        '--base-token',
        'base_crm',
        '--table-id',
        'tbl_b450645debe2',
        '--record-id',
        'rec_rec_001',
      ];
      if (mode === 'get') cs = [get, write];
      if (mode === 'filter' || mode === 'wrong_query')
        read.push(
          '--filter-json',
          JSON.stringify({
            logic: 'and',
            conditions: [
              [
                'Email',
                '==',
                mode === 'filter' ? 'jordan@example.com' : 'other@example.com',
              ],
            ],
          }),
        );
      if (mode === 'project_email' || mode === 'project_name')
        read.push('--field-id', mode === 'project_email' ? 'Email' : 'Name');
      if (mode === 'no_read') cs = [write];
      if (mode === 'read_late') cs = [write, read];
      if (mode === 'failed_read') {
        get[get.length - 1] = 'missing';
        cs = [get, write];
      }
      const fields = JSON.parse(write.at(-1));
      if (mode === 'wrong_name') fields.Name = 'Other';
      if (mode === 'wrong_email') fields.Email = 'other@example.com';
      if (mode === 'wrong_status') fields.Status = 'Active';
      write[write.length - 1] = JSON.stringify(fields);
      if (mode === 'update_instead') write.push('--record-id', 'rec_rec_001');
      const b = await startMock(seed);
      try {
        for (const c of cs) {
          try {
            await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
              env: { ...process.env, FEISHU_MOCK_URL: b.url },
              maxBuffer: 8e6,
            });
          } catch (e) {
            if (mode !== 'failed_read') throw e;
          }
        }
        const f = a + '/states/' + mode + '.json';
        await fs.writeFile(
          f,
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: f,
            VERIFIER_OUTPUT: a + '/' + mode + '-program',
          },
          maxBuffer: 8e6,
        });
        const d = JSON.parse(
          await fs.readFile(a + '/' + mode + '-program/result.json'),
        );
        assert.equal(
          d.business_success,
          ['reference', 'filter', 'get', 'project_email'].includes(mode),
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
