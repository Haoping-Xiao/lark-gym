import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('source workflow 3183 through real CLI', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'source-3183-')),
    task = repo + '/tasks/automationbench-simple-3183',
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
      'natural',
      'uppercase',
      'no_read',
      'read_late',
      'no_mail',
      'draft',
      'wrong_recipient',
      'missing_subject',
      'missing_company',
      'wrong_company',
      'wrong_name',
      'cancellation',
    ]) {
      let cs = structuredClone(original);
      const read = cs[0],
        write = cs.at(-2),
        mail = cs.at(-1);
      let body = mail[mail.indexOf('--body') + 1];
      if (mode === 'natural')
        body = 'Lucas，欢迎加入！很高兴为 Pinnacle Dynamics 团队提供服务。';
      if (mode === 'uppercase')
        mail[mail.indexOf('--subject') + 1] = 'WELCOME — 欢迎加入';
      if (mode === 'missing_company') body = '欢迎 Lucas！';
      if (mode === 'cancellation')
        body = 'Pinnacle Dynamics 的入驻已取消，我们不接受你们成为客户。';
      mail[mail.indexOf('--body') + 1] = body;
      if (mode === 'no_mail') cs.pop();
      if (mode === 'draft') mail.splice(mail.indexOf('--confirm-send'), 1);
      if (mode === 'wrong_recipient')
        mail[mail.indexOf('--to') + 1] = 'onboarding@company.example.com';
      if (mode === 'missing_subject')
        mail[mail.indexOf('--subject') + 1] = '入驻通知';
      if (mode === 'no_read') cs.shift();
      if (mode === 'read_late') {
        cs.shift();
        cs.push(read);
      }
      const o = JSON.parse(write.at(-1));
      if (mode === 'wrong_company') o.Company = 'Another Ltd';
      if (mode === 'wrong_name') o.Name = 'Another Person';
      write[write.length - 1] = JSON.stringify(o);
      const b = await startMock(seed);
      try {
        for (const c of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
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
          ['reference', 'natural', 'uppercase', 'cancellation'].includes(mode),
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
