import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('Contract Sent transition requires a currently valid related sent request', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'contract-state-')),
    task = repo + '/tasks/automationbench-sales-1008',
    seed = JSON.parse(
      await fs.readFile(task + '/environment/seed.json', 'utf8'),
    ),
    src = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
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
    'draft_first',
    'message_first',
    'revoked',
    'restored',
    'wrong_link_checkpoint',
    'draft_late',
  ]) {
    const cs = structuredClone(original),
      create = cs.find(
        (c) => c[1] === '+record-upsert' && !c.includes('--record-id'),
      ),
      update = cs.find((c) => c.includes('--record-id')),
      msg = cs.find((c) => c[1] === '+messages-send'),
      reads = cs.filter((c) => c !== create && c !== update && c !== msg),
      b = await startMock(seed);
    try {
      const run = async (c) =>
        exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
          env: { ...process.env, FEISHU_MOCK_URL: b.url },
          maxBuffer: 8e6,
        });
      for (const c of reads) await run(c);
      const patch = async (fields) => {
        const id = b.calls.find(
          (c) => c.method === 'POST' && c.path.includes('/records'),
        )?.response?.data?.record_id;
        if (!id) throw Error('missing record response');
        const c = create.slice(0, create.indexOf('--json'));
        c.push('--record-id', id, '--json', JSON.stringify(fields));
        await run(c);
      };
      if (mode === 'message_first') await run(msg);
      if (mode === 'draft_first' || mode === 'draft_late') {
        const o = JSON.parse(create.at(-1));
        o.status = 'Draft';
        create[create.length - 1] = JSON.stringify(o);
      }
      await run(create);
      if (mode === 'draft_first') await patch({ status: 'Sent' });
      if (mode !== 'message_first') await run(msg);
      if (mode === 'revoked' || mode === 'restored')
        await patch({ status: 'Draft' });
      if (mode === 'wrong_link_checkpoint')
        await patch({ opportunity_id: '006xx000099NO001' });
      if (mode === 'restored') await patch({ status: 'Sent' });
      await run(update);
      if (mode === 'revoked' || mode === 'draft_late')
        await patch({ status: 'Sent' });
      if (mode === 'wrong_link_checkpoint')
        await patch({ opportunity_id: '006xx000006OPP1' });
      if (b.calls.some((c) => c.status >= 400)) throw Error(mode);
      await fs.writeFile(
        a + '/states/' + mode + '.json',
        JSON.stringify({ seed, world: b.world, calls: b.calls }),
      );
      await exec(process.execPath, [task + '/tests/verify.ts'], {
        env: {
          ...process.env,
          MOCK_STATE: a + '/states/' + mode + '.json',
          VERIFIER_OUTPUT: a + '/' + mode,
        },
      });
      const result = JSON.parse(
        await fs.readFile(a + '/' + mode + '/result.json', 'utf8'),
      );
      assert.equal(
        result.business_success,
        ['reference', 'draft_first', 'message_first', 'restored'].includes(
          mode,
        ),
        mode,
      );
      assert.equal(result.recordStateBeforeUpdateChecks.length, 1);
      assert.equal(
        result.recordStateBeforeUpdateChecks[0].passed,
        ['reference', 'draft_first', 'message_first', 'restored'].includes(
          mode,
        ),
        mode,
      );
    } finally {
      await b.close();
    }
  }
  await fs.rm(a, { recursive: true, force: true });
});
