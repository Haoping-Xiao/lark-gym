import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
test('quality audit notes preserve ticket-rule facts without fixed prose', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'quality-notes-')),
    t = r + '/tasks/automationbench-support-1489',
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
  for (const mode of [
    'reference',
    'chinese',
    'english',
    'reversed',
    'wrong_field',
    'empty_issue',
    'vague_issue',
    'missing_second_rule',
    'no_mail',
    'wrong_recipient',
    'wrong_count',
    'tag_exempt',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      cells = cs.filter((c) => c[1] === '+cells-set'),
      issues = cells.filter((c) => /^C\d+$/.test(val(c, '--range'))),
      mail = cs.at(-1);
    if (['chinese', 'english'].includes(mode))
      for (const c of issues) {
        const org = val(c, '--cells').includes('organization_id');
        set(
          c,
          '--cells',
          JSON.stringify([
            [
              {
                value:
                  mode === 'chinese'
                    ? org
                      ? '缺少组织关联'
                      : '初始工单没有任何标签'
                    : org
                      ? 'organization_id is missing'
                      : 'No tags were set on the initial ticket',
              },
            ],
          ]),
        );
      }
    if (mode === 'reversed')
      for (const c of cells) {
        const x = val(c, '--range');
        set(c, '--range', x[0] + String(10 - Number(x.slice(1))));
      }
    if (['wrong_field', 'empty_issue', 'vague_issue'].includes(mode))
      set(
        issues[0],
        '--cells',
        JSON.stringify([
          [
            {
              value: {
                wrong_field: 'Missing tags',
                empty_issue: '',
                vague_issue: '有问题',
              }[mode],
            },
          ],
        ]),
      );
    if (mode === 'missing_second_rule')
      cs = cs.filter(
        (c) => !(c[1] === '+cells-set' && /^[ABC]5$/.test(val(c, '--range'))),
      );
    if (mode === 'no_mail') cs = cs.filter((c) => c !== mail);
    if (mode === 'wrong_recipient') set(mail, '--to', 'q1@test.com');
    if (mode === 'wrong_count')
      set(
        mail,
        '--body',
        val(mail, '--body').replace('6 failing', '4 failing'),
      );
    if (mode === 'tag_exempt') {
      const c = structuredClone(cs.find((c) => c[1] === '+record-upsert'));
      set(c, '--record-id', 'rec_zendesk_tkt_q07');
      set(c, '--json', JSON.stringify({ tags: '["data-quality-issue"]' }));
      cs.push(c);
    }
    const b = await startMock(seed);
    try {
      for (const c of cs)
        await exec(r + '/gyms/lark-cli/bin/lark-cli', c, {
          env: { ...process.env, FEISHU_MOCK_URL: b.url },
          maxBuffer: 8e6,
        });
      const p = a + '/states/' + mode + '.json';
      await fs.writeFile(
        p,
        JSON.stringify({ seed, world: b.world, calls: b.calls }),
      );
      const out = a + '/' + mode + '-program';
      await exec(process.execPath, [t + '/tests/verify.ts'], {
        env: { ...process.env, MOCK_STATE: p, VERIFIER_OUTPUT: out },
        maxBuffer: 8e6,
      });
      assert.equal(
        JSON.parse(await fs.readFile(out + '/result.json')).business_success,
        [
          'reference',
          'chinese',
          'english',
          'reversed',
          'wrong_field',
          'empty_issue',
          'vague_issue',
          'wrong_count',
        ].includes(mode),
        mode,
      );
      assert.ok(b.calls.every((c) => c.status < 400));
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
