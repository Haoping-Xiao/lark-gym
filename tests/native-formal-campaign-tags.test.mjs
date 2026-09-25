import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('campaign attribution accepts JSON text representation without loosening tags', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'campaign-tags-')),
    t = r + '/tasks/automationbench-support-1533',
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
    'spaces',
    'newlines',
    'escaped',
    'reordered_tracking',
    'missing_tag',
    'wrong_case',
    'extra_tag',
    'duplicate_tag',
    'invalid_json',
    'object_json',
    'number_json',
    'array_type',
    'no_tracking',
    'wrong_email',
    'expired_tag',
    'generic_match',
    'no_notice',
    'wrong_count',
    'noop',
  ]) {
    let cs = structuredClone(original),
      writes = cs.filter((c) => c[1] === '+record-upsert'),
      notice = cs.at(-1);
    for (const c of writes) {
      const i = c.indexOf('--json') + 1,
        f = JSON.parse(c[i]),
        tags = JSON.parse(f.tags);
      if (mode === 'spaces') f.tags = '[ ' + JSON.stringify(tags[0]) + ' ]';
      if (mode === 'newlines') f.tags = JSON.stringify(tags, null, 2);
      if (mode === 'escaped')
        f.tags = JSON.stringify(tags).replace('campaign', '\\u0063ampaign');
      if (mode === 'wrong_case')
        f.tags = JSON.stringify(
          tags.map((x) => x.replace('campaign', 'Campaign')),
        );
      if (mode === 'extra_tag')
        f.tags = JSON.stringify([...tags, 'campaign-bf']);
      if (mode === 'duplicate_tag') f.tags = JSON.stringify([...tags, ...tags]);
      if (mode === 'invalid_json') f.tags = '["' + tags[0] + '",]';
      if (mode === 'object_json') f.tags = JSON.stringify({ tag: tags[0] });
      if (mode === 'number_json') f.tags = '[1]';
      if (mode === 'array_type') f.tags = tags;
      c[i] = JSON.stringify(f);
    }
    if (mode === 'missing_tag')
      cs = cs.filter((c) => !c.includes('rec_reamaze_conversations_rm_1312'));
    if (mode === 'no_tracking') cs = cs.filter((c) => c[1] !== '+cells-set');
    if (mode === 'reordered_tracking')
      for (const c of cs.filter((c) => c[1] === '+cells-set')) {
        let i = c.indexOf('--range') + 1;
        c[i] = c[i][0] + (9 - Number(c[i].slice(1)));
      }
    if (mode === 'wrong_email')
      for (const c of cs.filter(
        (c) => c[1] === '+cells-set' && c.includes('C2'),
      ))
        c[c.length - 1] = '[[{"value":"wrong@example.com"}]]';
    if (['expired_tag', 'generic_match'].includes(mode)) {
      const c = structuredClone(writes[0]);
      c[c.indexOf('--record-id') + 1] =
        'rec_reamaze_conversations_' +
        (mode === 'expired_tag' ? 'rm_1306' : 'rm_1311');
      c[c.indexOf('--json') + 1] = JSON.stringify({
        tags: JSON.stringify([
          mode === 'expired_tag' ? 'campaign-bf' : 'campaign-winter',
        ]),
      });
      cs.splice(cs.length - 1, 0, c);
    }
    if (mode === 'no_notice') cs.pop();
    if (mode === 'wrong_count')
      notice[notice.length - 1] = notice
        .at(-1)
        .replace('campaign-winter=2', 'campaign-winter=9');
    if (mode === 'noop') cs = [];
    const b = await startMock(seed);
    try {
      for (const c of cs) {
        try {
          await exec(r + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
        } catch (e) {
          if (mode !== 'array_type') throw e;
        }
      }
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
          'spaces',
          'newlines',
          'escaped',
          'reordered_tracking',
          'wrong_count',
        ].includes(mode),
        mode,
      );
      if (mode === 'array_type')
        assert.ok(b.calls.some((c) => c.status === 400));
      else assert.ok(b.calls.every((c) => c.status < 400));
    } finally {
      await b.close();
    }
  }

  await fs.rm(a, { recursive: true, force: true });
});
