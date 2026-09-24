import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const id of [4059, 4060])
  test(`finance ${id}: source message groups allow combined or split reports`, async () => {
    const root = `tasks/automationbench-finance-${id}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      backend = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'source-groups-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: backend.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      for (const mode of [
        'combined',
        'split',
        'separated-pair',
        'missing',
        'wrong-recipient',
        'forbidden',
      ]) {
        const world = structuredClone(backend.world),
          old = new Set(seed.messages.map((m: any) => m.message_id)),
          chat = id === 4059 ? 'oc_email_5' : 'oc_email_6';
        const original = world.messages.find(
          (m: any) => !old.has(m.message_id) && m.chat_id === chat,
        )!;
        if (mode !== 'combined') {
          let texts =
            id === 4059
              ? [
                  'Defunct Co | INV-6001 | $8,400',
                  'NoReply Corp | INV-6005 | $4,100',
                  'Total write-off | $12,500',
                ]
              : [
                  'Jane Smith Consulting | $28,500 | Ready',
                  "Mike's Design Shop | $12,200 | Missing W-9",
                  'Rivera Photography | $4,800 | Ready',
                ];
          if (mode === 'separated-pair') {
            const parts = texts.shift()!.split(' | ');
            texts.unshift(parts[0], parts.slice(1).join(' | '));
          }
          if (mode === 'missing')
            texts = texts.filter(
              (t) => !t.includes(id === 4059 ? 'NoReply' : 'Rivera'),
            );
          world.messages = world.messages.filter(
            (m: any) => m.message_id !== original.message_id,
          );
          texts.forEach((text, i) =>
            world.messages.push({
              ...structuredClone(original),
              message_id: 'report-' + i,
              chat_id: mode === 'wrong-recipient' ? 'oc_wrong' : chat,
              body: { content: JSON.stringify({ text }) },
            }),
          );
          if (mode === 'forbidden')
            world.messages.push({
              ...structuredClone(original),
              message_id: 'forbidden',
              chat_id: id === 4059 ? 'oc_email_3' : chat,
              body: { content: JSON.stringify({ text: 'TechCorp 已排除。' }) },
            });
        }
        const state = join(dir, mode + '.json'),
          output = join(dir, mode);
        await writeFile(
          state,
          JSON.stringify({ seed, world, calls: backend.calls }),
        );
        await exec(process.execPath, [`${root}/tests/verify.ts`], {
          env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
        });
        const result = JSON.parse(
          await readFile(join(output, 'result.json'), 'utf8'),
        );
        assert.equal(
          result.business_success,
          ['combined', 'split'].includes(mode),
          mode,
        );
      }
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
