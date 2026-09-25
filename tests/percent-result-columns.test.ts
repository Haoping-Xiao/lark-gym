import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import vm from 'node:vm';
import { startMock } from '../gyms/lark-cli/src/server.ts';
const exec = promisify(execFile);
test('SEO backlog row identity and percentage units survive alternate row ordering', async () => {
  const task = 'tasks/automationbench-marketing-1055',
    dir = await mkdtemp(join(tmpdir(), 'seo-percent-'));
  const seed = JSON.parse(
    await readFile(task + '/environment/seed.json', 'utf8'),
  );
  const source = await readFile(task + '/solution/solve.ts', 'utf8');
  const block = source
    .slice(source.indexOf('const commands'), source.indexOf('for (const args'))
    .replace('commands: string[][]', 'commands');
  const original: string[][] = JSON.parse(
    vm.runInNewContext(block + '\nJSON.stringify(commands)'),
  );
  const cases: [string, string[][], boolean][] = [];
  for (const mode of [
    'reference',
    'both',
    'wrong_rate',
    'no_unit',
    'numeric',
    'duplicate_row',
    'wrong_priority',
    'message_literal',
    'text_format',
    'reverse_text_format',
    'missing_unit_text_format',
    'source_format',
  ]) {
    const commands = structuredClone(original);
    for (const c of commands) {
      if (c[1] === '+cells-set') {
        const i = c.indexOf('--cells') + 1,
          d = JSON.parse(c[i]),
          ri = c.indexOf('--range') + 1,
          range = c[ri];
        let v = d[0][0].value;
        if (
          ['both', 'reverse_text_format'].includes(mode) &&
          range.startsWith('B')
        )
          v = v.replace('%', v.includes('.') ? '0%' : '.0%');
        if (range === 'B2') {
          const values: Record<string, string | number> = {
            wrong_rate: '141%',
            no_unit: '140',
            numeric: 140,
          };
          if (Object.hasOwn(values, mode)) v = values[mode];
        }
        if (mode === 'duplicate_row' && range === 'A4')
          v = 'AI automation tools';
        if (mode === 'wrong_priority' && range === 'C4') v = 'high';
        if (
          [
            'text_format',
            'reverse_text_format',
            'missing_unit_text_format',
          ].includes(mode) &&
          range.startsWith('B')
        )
          d[0][0].cell_styles = { number_format: '@' };
        if (mode === 'missing_unit_text_format' && range === 'B2') v = '140';
        d[0][0].value = v;
        c[i] = JSON.stringify(d);
        if (['both', 'reverse_text_format'].includes(mode))
          c[ri] =
            range[0] +
            ({ '2': '4', '3': '3', '4': '2' } as Record<string, string>)[
              range.slice(1)
            ];
      }
      if (mode === 'message_literal' && c[1] === '+messages-send') {
        const i = c.indexOf('--text') + 1;
        c[i] = c[i].replace('140%', '140.0%');
      }
    }
    if (mode === 'source_format')
      commands.splice(commands.length - 1, 0, [
        'sheets',
        '+cells-set',
        '--spreadsheet-token',
        'ss_trends',
        '--sheet-id',
        'ws_kw',
        '--range',
        'B2',
        '--cells',
        JSON.stringify([
          [{ value: '5000', cell_styles: { number_format: '@' } }],
        ]),
      ]);
    cases.push([
      mode,
      commands,
      ['reference', 'both', 'text_format', 'reverse_text_format'].includes(
        mode,
      ),
    ]);
  }
  try {
    for (const [name, commands, expected] of cases) {
      const backend = await startMock(seed);
      try {
        for (const args of commands)
          await exec(resolve('gyms/lark-cli/bin/lark-cli'), args, {
            env: { ...process.env, FEISHU_MOCK_URL: backend.url },
          });
        assert.equal(backend.calls.filter((c) => c.status >= 400).length, 0);
        const state = join(dir, name + '.json'),
          output = join(dir, name);
        await writeFile(
          state,
          JSON.stringify({ seed, world: backend.world, calls: backend.calls }),
        );
        await exec(process.execPath, [task + '/tests/verify.ts'], {
          env: { ...process.env, MOCK_STATE: state, VERIFIER_OUTPUT: output },
        });
        assert.equal(
          JSON.parse(await readFile(join(output, 'result.json'), 'utf8'))
            .business_success,
          expected,
          name,
        );
      } finally {
        await backend.close();
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
