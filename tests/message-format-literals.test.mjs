import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
test('Message literals survive JSON text inputs and unsupported formats remain excluded', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'message-format-'));
  try {
    for (const [num, term] of [
      [3077, 'data sync'],
      [3078, 'v2.4.0'],
      [3079, 'CRM migration'],
      [3080, '$1.24M'],
    ]) {
      const task = repo + '/tasks/automationbench-simple-' + num,
        seed = JSON.parse(
          await fs.readFile(task + '/environment/seed.json', 'utf8'),
        ),
        src = await fs.readFile(task + '/solution/solve.ts', 'utf8'),
        original = JSON.parse(
          vm.runInNewContext(
            src
              .slice(
                src.indexOf('const commands'),
                src.indexOf('for (const args'),
              )
              .replace('commands: string[][]', 'commands') +
              '\nJSON.stringify(commands)',
          ),
        );
      await fs.mkdir(a + '/states-' + num, { recursive: true });
      for (const mode of [
        'reference',
        'json_text',
        'upper_term',
        'bold_term',
        'markdown',
        'post',
        'card',
        'wrong_recipient',
        'missing_term',
      ]) {
        const cs = structuredClone(original),
          send = cs.at(-1),
          text = send.at(-1);
        if (mode === 'upper_term')
          send[send.length - 1] = text.replace(term, term.toUpperCase());
        if (mode === 'bold_term')
          send[send.length - 1] = text.replace(term, '**' + term + '**');
        if (mode === 'json_text') {
          send.splice(
            -2,
            2,
            '--msg-type',
            'text',
            '--content',
            JSON.stringify({ text }),
          );
        }
        if (mode === 'markdown') send[send.indexOf('--text')] = '--markdown';
        if (mode === 'post')
          send.splice(
            -2,
            2,
            '--msg-type',
            'post',
            '--content',
            JSON.stringify({
              zh_cn: { title: '通知', content: [[{ tag: 'text', text }]] },
            }),
          );
        if (mode === 'card')
          send.splice(
            -2,
            2,
            '--msg-type',
            'interactive',
            '--content',
            JSON.stringify({ elements: [{ tag: 'markdown', content: text }] }),
          );
        if (mode === 'wrong_recipient')
          send[send.indexOf('--chat-id') + 1] =
            num === 3079 ? 'oc_U001' : 'oc_CGENERAL';
        if (mode === 'missing_term')
          send[send.length - 1] = text.replace(
            term,
            num === 3080 ? '$1,240,000' : '',
          );
        if (mode === 'wrong_fact')
          send[send.length - 1] = text.replace(
            num === 3077
              ? '6点'
              : num === 3078
                ? '15分钟'
                : num === 3079
                  ? '90%'
                  : '342',
            num === 3077
              ? '9点'
              : num === 3078
                ? '90分钟'
                : num === 3079
                  ? '100%'
                  : '999',
          );
        const b = await startMock(seed);
        try {
          for (const c of cs) {
            try {
              await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
                env: { ...process.env, FEISHU_MOCK_URL: b.url },
                maxBuffer: 8e6,
              });
            } catch (e) {
              if (!['markdown', 'post', 'card'].includes(mode)) throw e;
            }
          }
          await fs.writeFile(
            a + '/states-' + num + '/' + mode + '.json',
            JSON.stringify({ seed, world: b.world, calls: b.calls }),
          );
          if (['markdown', 'post', 'card'].includes(mode)) {
            assert.ok(b.calls.some((c) => c.status === 501));
            assert.equal(b.world.messages.length, seed.messages.length);
            continue;
          }
          await exec(process.execPath, [task + '/tests/verify.ts'], {
            env: {
              ...process.env,
              MOCK_STATE: a + '/states-' + num + '/' + mode + '.json',
              VERIFIER_OUTPUT: a + '/' + num + '-' + mode,
            },
            maxBuffer: 8e6,
          });
          const d = JSON.parse(
            await fs.readFile(
              a + '/' + num + '-' + mode + '/result.json',
              'utf8',
            ),
          );
          assert.equal(
            d.business_success,
            ['reference', 'json_text', 'upper_term', 'bold_term'].includes(
              mode,
            ),
            num + ':' + mode,
          );
          if (['markdown', 'post', 'card'].includes(mode))
            assert.ok(b.calls.some((c) => c.status === 501));
        } finally {
          await b.close();
        }
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
