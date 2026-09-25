import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('native mail contract 3177 preserves workflow and semantic review', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'native-mail-3177-')),
    t = repo + '/tasks/automationbench-simple-3177',
    seed = JSON.parse(await fs.readFile(t + '/environment/seed.json')),
    src = await fs.readFile(t + '/solution/solve.ts', 'utf8'),
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
      'paraphrase',
      'english',
      'search',
      'no_read',
      'late_read',
      'wrong_topic',
      'empty_topic',
      'missing_topic',
      'wrong_name',
      'wrong_email',
      'false_sale',
    ]) {
      let cs = structuredClone(original);
      const read = cs[0],
        write = cs.at(-1);
      const o = JSON.parse(write.at(-1));
      if (mode === 'paraphrase')
        o.Topic = '咨询用于数据流水线的 API 集成方案及更多详情';
      if (mode === 'english')
        o.Topic = 'API integration options for the data pipeline';
      if (mode === 'wrong_topic') o.Topic = 'Billing refund request';
      if (mode === 'empty_topic') o.Topic = '';
      if (mode === 'missing_topic') delete o.Topic;
      if (mode === 'wrong_name') o.Name = 'Other Person';
      if (mode === 'wrong_email') o.Email = 'other@example.com';
      if (mode === 'false_sale')
        o.Topic = 'Sara 已批准采购，合同已经签署付款。';
      write[write.length - 1] = JSON.stringify(o);
      if (mode === 'search')
        cs[0] = [
          'mail',
          '+triage',
          '--mailbox',
          'info@company.example.com',
          '--query',
          'API',
          '--as',
          'user',
        ];
      if (mode === 'no_read') cs.shift();
      if (mode === 'late_read') {
        cs.shift();
        cs.push(read);
      }
      const b = await startMock(seed);
      try {
        for (const c of cs)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        const file = a + '/states/' + mode + '.json';
        await fs.writeFile(
          file,
          JSON.stringify({ seed, world: b.world, calls: b.calls }),
        );
        await exec(process.execPath, [t + '/tests/verify.ts'], {
          env: {
            ...process.env,
            MOCK_STATE: file,
            VERIFIER_OUTPUT: a + '/' + mode + '-program',
          },
          maxBuffer: 8e6,
        });
        const d = JSON.parse(
          await fs.readFile(a + '/' + mode + '-program/result.json'),
        );
        assert.equal(
          d.business_success,
          [
            'reference',
            'english',
            'paraphrase',
            'search',
            'wrong_topic',
            'empty_topic',
            'missing_topic',
            'false_sale',
          ].includes(mode),
          mode,
        );
        if (d.business_success) assert.equal(d.semantic.required, true);
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
