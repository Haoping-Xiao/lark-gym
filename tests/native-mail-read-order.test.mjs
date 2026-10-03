import test from 'node:test';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('feedback mail read state follows routing, preserves labels and permits independent read order', async () => {
  const repo = process.cwd(),
    a = await fs.mkdtemp(path.join(os.tmpdir(), 'mail-update-order-')),
    task = repo + '/tasks/automationbench-operations-1283',
    seed = JSON.parse(await fs.readFile(task + '/environment/seed.json')),
    code = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
    commands = vm.runInNewContext(
      code.match(/const commands: string\[\]\[\] = ([\s\S]*?);\nfor/)[1],
    ),
    marks = commands.filter((c) => c[0] === 'mail' && c[2] === 'modify'),
    rest = commands.filter((c) => !marks.includes(c)),
    allowed = new Set(marks.map((c) => c[c.indexOf('--message-id') + 1])),
    results = [];
  try {
    for (const mode of [
      'early-read',
      'skip-one',
      'extra-read',
      'remove-processed',
      'reverse-read',
      'repeat-read',
    ]) {
      const server = await startMock(seed),
        env = { ...process.env, FEISHU_MOCK_URL: server.url },
        out = a + '/controls/' + mode;
      await fs.mkdir(out, { recursive: true });
      try {
        const plan =
          mode === 'early-read'
            ? [...marks, ...rest]
            : mode === 'skip-one'
              ? [...rest, ...marks.slice(1)]
              : mode === 'reverse-read'
                ? [...rest, ...[...marks].reverse()]
                : [...commands];
        if (mode === 'repeat-read') plan.push(marks[0]);
        if (['extra-read', 'remove-processed'].includes(mode)) {
          const m = seed.mail.messages.find((m) =>
            mode === 'extra-read'
              ? m.label_ids.includes('UNREAD') && !allowed.has(m.message_id)
              : m.label_ids.some(
                  (l) => !['UNREAD', 'IMPORTANT', 'FLAGGED'].includes(l),
                ),
          );
          if (!m) throw Error('missing negative fixture');
          const c = [...marks[0]];
          c[c.indexOf('--message-id') + 1] = m.message_id;
          c[c.indexOf('--data') + 1] = JSON.stringify({
            remove_label_ids: [
              mode === 'extra-read'
                ? 'UNREAD'
                : m.label_ids.find(
                    (l) => !['UNREAD', 'IMPORTANT', 'FLAGGED'].includes(l),
                  ),
            ],
          });
          plan.push(c);
        }
        for (const c of plan)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env,
            maxBuffer: 16e6,
          });
        if (server.calls.some((c) => c.status >= 400))
          throw Error('HTTP failure');
        await fs.writeFile(
          out + '/state.json',
          JSON.stringify({ seed, world: server.world, calls: server.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: {
            ...env,
            MOCK_STATE: out + '/state.json',
            VERIFIER_OUTPUT: out,
          },
          maxBuffer: 8e6,
        });
        const v = JSON.parse(await fs.readFile(out + '/result.json')),
          want = ['reverse-read', 'repeat-read'].includes(mode);
        if (v.business_success !== want)
          throw Error(mode + ' unexpected ' + v.business_success);
        results.push({
          mode,
          program_pass: v.business_success,
          calls: server.calls.length,
        });
        console.log(JSON.stringify(results.at(-1)));
      } finally {
        await server.close();
      }
      await fs.writeFile(
        a + '/control-results.json',
        JSON.stringify(results, null, 2),
      );
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
