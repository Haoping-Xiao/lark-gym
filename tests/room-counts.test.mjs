import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Deal room keeps four external members plus owner and allows optional total', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'room-counts-')),
    task = repo + '/tasks/automationbench-sales-706',
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
      'with_total',
      'natural_text',
      'five_contacts',
      'missing_owner',
      'missing_contact',
      'wrong_role',
      'wrong_amount',
      'wrong_account',
    ]) {
      let cs = structuredClone(original),
        rs = cs.filter((c) => c[1] === '+record-upsert'),
        notice = cs.at(-1),
        change = (c, f) => {
          let o = JSON.parse(c.at(-1));
          f(o);
          c[c.length - 1] = JSON.stringify(o);
        };
      if (mode === 'with_total')
        notice[notice.length - 1] = notice
          .at(-1)
          .replace(
            '已加入4位账户联系人。',
            '4位账户联系人加创建者，共5名成员。',
          );
      if (mode === 'natural_text')
        notice[notice.length - 1] =
          'workspace Horizon Corp - Deal Room已就绪，关联Horizon Corp - Platform Migration，金额450,000；已按角色加入4名账户联系人。';
      if (mode === 'five_contacts')
        notice[notice.length - 1] = notice
          .at(-1)
          .replace('4位账户联系人', '5位账户联系人');
      if (mode === 'missing_owner') cs = cs.filter((c) => c !== rs[1]);
      if (mode === 'missing_contact') cs = cs.filter((c) => c !== rs[3]);
      if (mode === 'wrong_role') change(rs[2], (o) => (o.role = 'member'));
      if (mode === 'wrong_amount')
        change(
          rs[0],
          (o) => (o.description = o.description.replace('450000', '45000')),
        );
      if (mode === 'wrong_account')
        change(rs[2], (o) => (o.room_key = '001xx000003APX1'));
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
            'with_total',
            'natural_text',
            'five_contacts',
            'wrong_amount',
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
