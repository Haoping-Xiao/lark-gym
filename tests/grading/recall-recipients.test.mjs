import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../../gyms/lark-cli/src/server.ts';
test('recall notices accept one message per case while preserving destinations', async () => {
  const exec = promisify(execFile),
    r = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'recall-')),
    t = r + '/tasks/automationbench-support-1579',
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
    'reverse',
    'missing_beth',
    'missing_reason',
    'wrong_reason',
    'duplicate',
    'wrong_channel',
    'no_safety',
    'wrong_price',
  ]) {
    let cs = structuredClone(original);
    const val = (c, k) => c[c.indexOf(k) + 1],
      set = (c, k, v) => (c[c.indexOf(k) + 1] = v),
      safety = cs.find((c) => c.includes('oc_C_SAFE')),
      lines = val(safety, '--text').split('\n'),
      copy = (text) => {
        const c = structuredClone(safety);
        set(c, '--text', text);
        return c;
      };
    if (
      [
        'split',
        'reverse',
        'missing_beth',
        'missing_reason',
        'wrong_reason',
        'duplicate',
        'wrong_channel',
      ].includes(mode)
    ) {
      let parts = mode === 'reverse' ? [...lines].reverse() : [...lines];
      if (mode === 'missing_beth') parts = parts.slice(1);
      if (mode === 'missing_reason')
        parts[0] =
          'g_516 | Vertex Trekking Poles | Beth Huang | beth.huang@gmail.com | recall reported';
      if (mode === 'wrong_reason')
        parts[0] = parts[0].replace(
          'locking mechanism failure — risk of collapse under load',
          'locking mechanism is safe; recall concerns packaging color only',
        );
      if (mode === 'duplicate') parts.push(lines[0]);
      let replacements = parts.map(copy);
      if (mode === 'wrong_channel')
        set(replacements[0], '--chat-id', 'oc_C_INV');
      cs.splice(cs.indexOf(safety), 1, ...replacements);
    }
    if (mode === 'no_safety') cs = cs.filter((c) => c !== safety);
    if (mode === 'wrong_price') {
      const c = cs.find(
        (c) =>
          c.includes('--json') &&
          JSON.parse(val(c, '--json')).ticket_id === 'g_501',
      );
      const d = JSON.parse(val(c, '--json'));
      d.body_text = d.body_text.replace('$169', '$189');
      set(c, '--json', JSON.stringify(d));
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
        !['wrong_channel', 'no_safety'].includes(mode),
        mode,
      );
      assert.ok(b.calls.every((c) => c.status < 400));
    } finally {
      await b.close();
    }
  }
  await fs.rm(a, { recursive: true, force: true });
});
