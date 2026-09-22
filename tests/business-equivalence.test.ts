import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
for (const id of [4001, 4008, 4010])
  test(`finance ${id}: business-equivalent output passes structural rules; bad output fails`, async () => {
    const root = `tasks/automationbench-finance-${id}`;
    const seed = JSON.parse(
      await readFile(`${root}/environment/seed.json`, 'utf8'),
    );
    const expected = JSON.parse(
      await readFile(`${root}/tests/expected.json`, 'utf8'),
    );
    const backend = await startMock(seed);
    const dir = await mkdtemp(join(tmpdir(), 'business-equivalence-'));
    try {
      await exec(process.execPath, [`${root}/solution/solve.ts`], {
        env: {
          ...process.env,
          FEISHU_MOCK_URL: backend.url,
          LARK_CLI: resolve('gyms/lark-cli/bin/lark-cli'),
        },
      });
      const world = structuredClone(backend.world);
      if (id === 4001) {
        const first = expected.cells[0];
        const rows = [
          ...new Set<number>(expected.cells.map((c: any) => c.row)),
        ];
        assert.equal(rows.length, 2);
        const sheet = first.spreadsheet_token
          ? world.spreadsheets![first.spreadsheet_token].sheets[first.sheet_id]
          : world.sheets[first.sheet_id];
        // Source date spelling and explanatory notes are semantic checks, not row identity.
        sheet.values[rows[1]][4] = 'January 30, 2026';
        sheet.values[rows[1]][3] =
          'REVIEW - over threshold; corrected by Controller';
        sheet.values[rows[0]][3] = 'Invoice source retained';
        [sheet.values[rows[0]], sheet.values[rows[1]]] = [
          sheet.values[rows[1]],
          sheet.values[rows[0]],
        ];
      } else {
        const old = new Set(seed.messages.map((m: any) => m.message_id));
        const message = world.messages.find((m) => !old.has(m.message_id))!;
        const text = JSON.parse(message.body.content).text;
        const middle = Math.floor(text.length / 2);
        message.body.content = JSON.stringify({ text: text.slice(0, middle) });
        world.messages.push({
          ...structuredClone(message),
          message_id: 'split-second',
          body: {
            ...message.body,
            content: JSON.stringify({ text: text.slice(middle) }),
          },
        });
      }
      const verify = async (state: any, name: string) => {
        const file = join(dir, `${name}.json`),
          output = join(dir, name);
        await writeFile(
          file,
          JSON.stringify({ seed, world: state, calls: backend.calls }),
        );
        await exec(process.execPath, [`${root}/tests/verify.ts`], {
          env: { ...process.env, MOCK_STATE: file, VERIFIER_OUTPUT: output },
        }).catch(() => {});
        return JSON.parse(await readFile(join(output, 'result.json'), 'utf8'));
      };
      const accepted = await verify(world, 'equivalent');
      assert.equal(accepted.business_success, true);
      // Structural acceptance is not final semantic acceptance.
      assert.equal(accepted.semantic.required, true);
      const bad = structuredClone(world);
      if (id === 4001) {
        const first = expected.cells[0];
        const sheet = first.spreadsheet_token
          ? bad.spreadsheets![first.spreadsheet_token].sheets[first.sheet_id]
          : bad.sheets[first.sheet_id];
        sheet.values[first.row][first.column] = 'wrong-vendor';
      } else {
        bad.messages.at(-1)!.chat_id = 'wrong-recipient';
      }
      assert.equal((await verify(bad, 'wrong')).business_success, false);
    } finally {
      await backend.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
