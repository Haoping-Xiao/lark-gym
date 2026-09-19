import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.mjs';
const exec = promisify(execFile);
for (const task of (await readdir('tasks')).filter((n) =>
  n.startsWith('automationbench-'),
)) {
  test(
    `${task}: no-op fails, CLI oracle passes, collateral edits fail`,
    { timeout: 30000 },
    async () => {
      const dir = await mkdtemp(join(tmpdir(), 'officegym-migration-'));
      const seed = JSON.parse(
        await readFile(`tasks/${task}/environment/seed.json`, 'utf8'),
      );
      const backend = await startMock(seed);
      const state = join(dir, 'state.json');
      const env = {
        ...process.env,
        FEISHU_MOCK_URL: backend.url,
        LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        MOCK_STATE: state,
        VERIFIER_OUTPUT: dir,
      };
      async function grade() {
        await writeFile(
          state,
          JSON.stringify({ seed, world: backend.world, calls: backend.calls }),
        );
        await exec(process.execPath, [`tasks/${task}/tests/verify.ts`], {
          env,
        });
        return (await readFile(join(dir, 'reward.txt'), 'utf8')).trim();
      }
      try {
        assert.equal(await grade(), '0');
        await exec(process.execPath, [`tasks/${task}/solution/solve.ts`], {
          env,
        });
        assert.equal(
          await grade(),
          '1',
          (await readFile(join(dir, 'result.json'), 'utf8')) +
            JSON.stringify(backend.calls.filter((c) => c.status !== 200)),
        );
        const solved = structuredClone(backend.world);
        const beforeIds = new Set(
          seed.base.records.map((r: { record_id: string }) => r.record_id),
        );
        const created = backend.world.base.records.find(
          (r: { record_id: string }) => !beforeIds.has(r.record_id),
        );
        const newMessage = backend.world.messages.find(
          (m: { message_id: string }) =>
            !seed.messages.some(
              (old: { message_id: string }) => old.message_id === m.message_id,
            ),
        );
        const newEvent = backend.world.events.find(
          (e: { event_id: string }) =>
            !seed.events.some(
              (old: { event_id: string }) => old.event_id === e.event_id,
            ),
        );
        if (created)
          backend.world.base.records = backend.world.base.records.filter(
            (r: { record_id: string }) => r.record_id !== created.record_id,
          );
        else if (newMessage)
          backend.world.messages = backend.world.messages.filter(
            (m: { message_id: string }) =>
              m.message_id !== newMessage.message_id,
          );
        else if (newEvent)
          backend.world.events = backend.world.events.filter(
            (e: { event_id: string }) => e.event_id !== newEvent.event_id,
          );
        else {
          backend.world.base = structuredClone(seed.base);
          backend.world.sheets = structuredClone(seed.sheets);
          if (seed.spreadsheets)
            backend.world.spreadsheets = structuredClone(seed.spreadsheets);
        }
        assert.equal(
          await grade(),
          '0',
          'Omitting a required business action must fail',
        );
        Object.assign(backend.world, solved);
        backend.world.now = '1900-01-01T00:00:00Z';
        assert.equal(await grade(), '0');
      } finally {
        await backend.close();
        await rm(dir, { recursive: true, force: true });
      }
    },
  );
}
