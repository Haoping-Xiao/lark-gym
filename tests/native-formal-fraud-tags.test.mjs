import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('fraud tags preserve exact membership across JSON text formats', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'fraud-tags-')),
    t = r + '/tasks/automationbench-support-1577',
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
    'compact',
    'spaces',
    'newlines',
    'escaped',
    'reordered_tags',
    'reordered_tracking',
    'missing_tag',
    'missing_original',
    'wrong_case',
    'extra_tag',
    'invalid_json',
    'array_type',
    'no_tracking',
    'wrong_email',
    'tag_vip',
    'tag_hold',
    'tag_legal',
    'tag_exempt',
    'tag_cleared',
    'tag_in_review',
    'public_reply',
    'missing_reply',
    'wrong_indicators',
    'no_notice',
    'noop',
  ]) {
    let cs = structuredClone(original),
      writes = cs.filter(
        (c) => c[1] === '+record-upsert' && c.includes('--record-id'),
      ),
      replies = cs.filter(
        (c) => c[1] === '+record-upsert' && !c.includes('--record-id'),
      );
    for (const c of writes) {
      const i = c.indexOf('--json') + 1,
        f = JSON.parse(c[i]),
        tags = JSON.parse(f.tags);
      if (mode === 'compact') f.tags = JSON.stringify(tags);
      if (mode === 'spaces')
        f.tags = '[ ' + tags.map((x) => JSON.stringify(x)).join(' , ') + ' ]';
      if (mode === 'newlines') f.tags = JSON.stringify(tags, null, 2);
      if (mode === 'escaped')
        f.tags = JSON.stringify(tags).replace('fraud', '\\u0066raud');
      if (mode === 'reordered_tags') f.tags = JSON.stringify(tags.reverse());
      if (mode === 'missing_original') f.tags = '["fraud-review"]';
      if (mode === 'wrong_case') f.tags = '["order-issue","Fraud-review"]';
      if (mode === 'extra_tag')
        f.tags = JSON.stringify([...tags, 'blacklisted']);
      if (mode === 'invalid_json') f.tags = '["order-issue","fraud-review",]';
      if (mode === 'array_type') f.tags = tags;
      c[i] = JSON.stringify(f);
    }
    if (mode === 'missing_tag')
      cs = cs.filter((c) => !c.includes('rec_gorgias_tickets_g_312'));
    if (mode === 'no_tracking') cs = cs.filter((c) => c[1] !== '+cells-set');
    if (mode === 'reordered_tracking')
      for (const c of cs.filter((c) => c[1] === '+cells-set')) {
        let i = c.indexOf('--range') + 1;
        c[i] = c[i][0] + (7 - Number(c[i].slice(1)));
      }
    if (mode === 'wrong_email')
      for (const c of cs.filter(
        (c) => c[1] === '+cells-set' && c.includes('B2'),
      ))
        c[c.length - 1] = '[[{"value":"wrong@example.com"}]]';
    if (mode.startsWith('tag_')) {
      const id = {
          tag_vip: '303',
          tag_hold: '308',
          tag_legal: '313',
          tag_exempt: '314',
          tag_cleared: '310',
          tag_in_review: '311',
        }[mode],
        c = structuredClone(writes[0]);
      c[c.indexOf('--record-id') + 1] = 'rec_gorgias_tickets_g_' + id;
      cs.push(c);
    }
    if (mode === 'public_reply') {
      const c = replies[0],
        i = c.indexOf('--json') + 1,
        f = JSON.parse(c[i]);
      f.public = 'true';
      c[i] = JSON.stringify(f);
    }
    if (mode === 'missing_reply') cs = cs.filter((c) => c !== replies[0]);
    if (mode === 'wrong_indicators') {
      const c = replies[0],
        i = c.indexOf('--json') + 1,
        f = JSON.parse(c[i]);
      f.body_text =
        'fraud investigation | High | Customer admitted intentional fraud and bank confirmed a chargeback.';
      c[i] = JSON.stringify(f);
    }
    if (mode === 'no_notice') cs.pop();
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
          'compact',
          'spaces',
          'newlines',
          'escaped',
          'reordered_tags',
          'reordered_tracking',
          'wrong_indicators',
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
