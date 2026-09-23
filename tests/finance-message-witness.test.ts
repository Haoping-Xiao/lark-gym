import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('finance 4057: extra notices preserve a single-message amount witness', async () => {
  const root = 'tasks/automationbench-finance-4057',
    seed = JSON.parse(await readFile(`${root}/environment/seed.json`, 'utf8')),
    backend = await startMock(seed),
    dir = await mkdtemp(join(tmpdir(), 'amount-witness-'));
  try {
    await exec(process.execPath, [`${root}/solution/solve.ts`], {
      env: {
        ...process.env,
        FEISHU_MOCK_URL: backend.url,
        LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
      },
    });
    for (const mode of [
      'reference',
      'extra-before',
      'extra-after',
      'split',
      'missing',
      'forbidden',
    ]) {
      const world = structuredClone(backend.world),
        old = new Set(seed.messages.map((m: any) => m.message_id));
      const original = world.messages.find(
        (m: any) => !old.has(m.message_id) && m.chat_id === 'oc_email_2',
      )!;
      const extra = {
        ...structuredClone(original),
        message_id: 'extra',
        body: {
          content: JSON.stringify({ text: 'XI-3001 EUR Rate per USD 0.90' }),
        },
      };
      if (mode === 'extra-before') world.messages.unshift(extra);
      if (mode === 'extra-after') world.messages.push(extra);
      if (mode === 'split' || mode === 'missing') {
        original.body.content = JSON.stringify({
          text: 'EuroLogic GmbH XI-3001 EUR 9000 (9,000)',
        });
        if (mode === 'split')
          world.messages.push({
            ...extra,
            body: { content: JSON.stringify({ text: 'XI-3001 USD 10,000' }) },
          });
      }
      if (mode === 'forbidden')
        world.messages.push({ ...extra, chat_id: 'oc_email_1' });
      const state = join(dir, mode + '.json'),
        out = join(dir, mode);
      await writeFile(
        state,
        JSON.stringify({ seed, world, calls: backend.calls }),
      );
      await exec(process.execPath, [`${root}/tests/verify.ts`], {
        env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: out },
      });
      const result = JSON.parse(
        await readFile(join(out, 'result.json'), 'utf8'),
      );
      assert.equal(
        result.business_success,
        ['reference', 'extra-before', 'extra-after'].includes(mode),
        mode,
      );
    }
  } finally {
    await backend.close();
    await rm(dir, { recursive: true, force: true });
  }
});
