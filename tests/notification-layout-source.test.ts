import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const [id, chat, required] of [
  [4074, 'oc_email_3', '47,500'],
  [4078, 'oc_email_0', 'Marketing'],
  [4085, 'oc_email_2', '7,875'],
  [5078, 'oc_email_2', 'Sarah Nakamura'],
  [5131, 'oc_email_8', 'Hugo Fernandez'],
] as const)
  test(`notification ${id}: layout freedom retains source body and recipient constraints`, async () => {
    const root = `tasks/automationbench-${id >= 5000 ? 'hr' : 'finance'}-${id}`,
      seed = JSON.parse(
        await readFile(`${root}/environment/seed.json`, 'utf8'),
      ),
      backend = await startMock(seed),
      dir = await mkdtemp(join(tmpdir(), 'notification-layout-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: backend.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      const old = new Set(seed.messages.map((m: any) => m.message_id));
      for (const mode of ['layout', 'missing', 'wrong-recipient']) {
        const world = structuredClone(backend.world),
          msgs = world.messages.filter(
            (m: any) => !old.has(m.message_id) && m.chat_id === chat,
          ),
          prototype = msgs[0];
        let texts = msgs.map((m: any) => JSON.parse(m.body.content).text);
        if (id === 5131) texts = [texts.join('\n')];
        else if (id === 4074 || id === 4078)
          texts = texts.flatMap((t: string) => t.split('\n'));
        else if (id === 4085)
          texts = [
            'Alpine Solutions Group | QU-104 | Invoice total $7,875',
            'Alpine Solutions Group | QU-104 | Due 2026-03-12',
          ];
        else
          texts = [
            'David Okonkwo | Taking over Platform team (currently under VP Eng)',
            'New Direct Reports: Alice Park, Sarah Nakamura, Alicia Fernandez',
          ];
        if (mode === 'missing')
          texts = texts.map((t: string) => t.replaceAll(required, ''));
        world.messages = world.messages.filter(
          (m: any) => old.has(m.message_id) || m.chat_id !== chat,
        );
        texts.forEach((text: string, i: number) =>
          world.messages.push({
            ...structuredClone(prototype),
            message_id: 'layout-' + i,
            chat_id: mode === 'wrong-recipient' ? 'oc_wrong' : chat,
            body: { content: JSON.stringify({ text }) },
          }),
        );
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
        assert.equal(result.business_success, mode === 'layout', mode);
      }
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
