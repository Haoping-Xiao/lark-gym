import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
const taskNames = (await readdir('tasks')).filter((name) =>
  name.startsWith('automationbench-'),
);
describe('Native task programmatic regressions', { concurrency: 4 }, () => {
  for (const task of taskNames) {
    test(
      `${task}: programmatic verification and semantic handoff`,
      { timeout: 30000 },
      async () => {
        const dir = await mkdtemp(join(tmpdir(), 'lark-gym-migration-'));
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
            JSON.stringify({
              seed,
              world: backend.world,
              calls: backend.calls,
            }),
          );
          await exec(process.execPath, [`tasks/${task}/tests/verify.ts`], {
            env,
          });
          return (await readFile(join(dir, 'reward.txt'), 'utf8')).trim();
        }
        try {
          const initialGrade = await grade();
          if (initialGrade === '1') {
            const initial = JSON.parse(
              await readFile(join(dir, 'result.json'), 'utf8'),
            );
            assert.equal(
              initial.semantic?.required,
              true,
              'An unchanged world may pass structural checks only if semantic judgment is still required',
            );
            assert.ok(initial.semantic.deferred.length > 0);
          } else assert.equal(initialGrade, '0');
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
          const expected = JSON.parse(
            await readFile(`tasks/${task}/tests/expected.json`, 'utf8'),
          );
          if (expected.deletes?.length) {
            const id = expected.deletes[0];
            backend.world.base.records.push(
              structuredClone(
                seed.base.records.find(
                  (r: { record_id: string }) => r.record_id === id,
                ),
              ),
            );
            assert.equal(
              await grade(),
              '0',
              'Leaving an erased account must fail',
            );
            Object.assign(backend.world, structuredClone(solved));
          }
          if (expected.order_groups?.length) {
            const originalSeq = backend.calls.map((call) => call.seq);
            backend.calls.forEach((call, index) => {
              call.seq = backend.calls.length - index;
            });
            assert.equal(
              await grade(),
              '0',
              'correct final state with reversed SOP stages must fail',
            );
            backend.calls.forEach((call, index) => {
              call.seq = originalSeq[index];
            });
            assert.equal(await grade(), '1');
          }
          const forbidden = expected.forbidden_messages?.find(
            (check: { chat_id?: string; contains: string[] }) =>
              check.contains.length > 0 &&
              backend.world.messages.some(
                (m: { message_id: string; chat_id: string }) =>
                  (!check.chat_id || m.chat_id === check.chat_id) &&
                  !seed.messages.some(
                    (old: { message_id: string }) =>
                      old.message_id === m.message_id,
                  ),
              ),
          );
          if (forbidden) {
            const message = backend.world.messages.find(
              (m: { message_id: string; chat_id: string }) =>
                (!forbidden.chat_id || m.chat_id === forbidden.chat_id) &&
                !seed.messages.some(
                  (old: { message_id: string }) =>
                    old.message_id === m.message_id,
                ),
            );
            assert.ok(message);
            const content = JSON.parse(message.body.content);
            message.body.content = JSON.stringify({
              ...content,
              text: content.text + ' ' + forbidden.contains.join(' '),
            });
            await grade();
            const review = JSON.parse(
              await readFile(join(dir, 'result.json'), 'utf8'),
            ).semantic;
            assert.ok(
              review.required &&
                review.deferred.some((item: string) =>
                  item.startsWith('forbidden_messages['),
                ),
              'Content guard must reach the semantic judge, not a substring verdict',
            );
            Object.assign(backend.world, structuredClone(solved));
          }

          const recordBan = expected.forbidden_records?.find(
            (check: {
              equals: Record<string, unknown>;
              contains: Record<string, string>;
            }) =>
              Object.keys(check.contains).length > 0 &&
              backend.world.base.records.some(
                (record: {
                  record_id: string;
                  fields: Record<string, unknown>;
                }) =>
                  !seed.base.records.some(
                    (old: { record_id: string }) =>
                      old.record_id === record.record_id,
                  ) &&
                  Object.entries(check.equals).every(
                    ([field, value]) => record.fields[field] === value,
                  ),
              ),
          );
          if (recordBan) {
            const record = backend.world.base.records.find(
              (record: {
                record_id: string;
                fields: Record<string, unknown>;
              }) =>
                !seed.base.records.some(
                  (old: { record_id: string }) =>
                    old.record_id === record.record_id,
                ) &&
                Object.entries(recordBan.equals).every(
                  ([field, value]) => record.fields[field] === value,
                ),
            );
            assert.ok(record);
            for (const [field, text] of Object.entries(recordBan.contains)) {
              record.fields[field] =
                String(record.fields[field] ?? '') + ' ' + text;
            }
            await grade();
            const review = JSON.parse(
              await readFile(join(dir, 'result.json'), 'utf8'),
            ).semantic;
            assert.ok(
              review.required &&
                review.deferred.some((item: string) =>
                  item.startsWith('forbidden_records['),
                ),
              'Publication meaning must reach the semantic judge',
            );
            Object.assign(backend.world, structuredClone(solved));
          }

          const flexible = expected.cells?.find(
            (c: { one_of?: unknown[] }) => c.one_of && c.one_of.length > 1,
          );
          if (flexible) {
            const sheet =
              backend.world.spreadsheets![flexible.spreadsheet_token].sheets[
                flexible.sheet_id
              ];
            sheet.values[flexible.row][flexible.column] = flexible.one_of.find(
              (v: unknown) => v !== flexible.value,
            );
            assert.equal(
              await grade(),
              '1',
              'Another permitted business recommendation must pass',
            );
            sheet.values[flexible.row][flexible.column] =
              'unsupported recommendation';
            assert.equal(
              await grade(),
              '0',
              'An unsupported recommendation must fail',
            );
            Object.assign(backend.world, structuredClone(solved));
          }

          for (const vcEvent of (expected.events || []).filter(
            (e: { vc_data?: unknown }) => e.vc_data,
          )) {
            const event = backend.world.events.find(
              (e: { summary: string }) => e.summary === vcEvent.summary,
            );
            assert.ok(event);
            delete event.vc_data;
            assert.equal(
              await grade(),
              '0',
              'A scheduled event missing its required video settings must fail',
            );
            Object.assign(backend.world, structuredClone(solved));
          }

          for (const createdChat of expected.new_chats || []) {
            const chat = backend.world.chats.find(
              (c: { name: string }) => c.name === createdChat.name,
            );
            assert.ok(chat);
            chat.member_ids = createdChat.user_ids.length
              ? []
              : ['unexpected_member'];
            assert.equal(
              await grade(),
              '0',
              'Created room membership must match the required members',
            );
            Object.assign(backend.world, structuredClone(solved));
          }

          for (const membership of expected.memberships || []) {
            const chat = backend.world.chats.find(
              (c: { chat_id: string }) => c.chat_id === membership.chat_id,
            );
            assert.ok(chat);
            chat.member_ids = chat.member_ids.filter(
              (id: string) => id !== membership.user_ids[0],
            );
            assert.equal(
              await grade(),
              '0',
              'A welcome message without required membership must fail',
            );
            Object.assign(backend.world, structuredClone(solved));
          }

          const beforeIds = new Set(
            seed.base.records.map((r: { record_id: string }) => r.record_id),
          );
          const created = backend.world.base.records.find(
            (r: { record_id: string }) => !beforeIds.has(r.record_id),
          );
          const newMessage = backend.world.messages.find(
            (m: { message_id: string }) =>
              !seed.messages.some(
                (old: { message_id: string }) =>
                  old.message_id === m.message_id,
              ),
          );
          const newMail = backend.world.mail?.messages.find(
            (m) =>
              m.message_state === 2 &&
              !(seed.mail?.messages || []).some(
                (old: { message_id: string }) =>
                  old.message_id === m.message_id,
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
            // A missing recipient is structural even when complete report
            // content can legitimately span or combine messages.
            backend.world.messages = backend.world.messages.filter(
              (m: { message_id: string; chat_id: string }) =>
                m.chat_id !== newMessage.chat_id ||
                seed.messages.some(
                  (old: { message_id: string }) =>
                    old.message_id === m.message_id,
                ),
            );
          else if (newMail)
            backend.world.mail!.messages = backend.world.mail!.messages.filter(
              (m) => m.message_id !== newMail.message_id,
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
          const incompleteGrade = await grade();
          if (incompleteGrade === '1') {
            assert.equal(
              initialGrade,
              '1',
              'A missing structural action must still fail in code',
            );
            const incomplete = JSON.parse(
              await readFile(join(dir, 'result.json'), 'utf8'),
            );
            assert.equal(
              incomplete.semantic?.required,
              true,
              'Missing text-only work must still reach the semantic judge',
            );
          } else assert.equal(incompleteGrade, '0');
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
});
