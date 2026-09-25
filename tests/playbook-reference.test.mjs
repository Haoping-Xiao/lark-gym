import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { startMock } from '../gyms/lark-cli/src/server.ts';
test('Literal playbook reference stays in the opportunity while description wording varies', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'playbook-ref-')),
    task = repo + '/tasks/automationbench-sales-1146',
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
  try {
    for (const mode of [
      'reference',
      'natural_opp_description',
      'missing_ref',
      'event_only_ref',
    ]) {
      const cs = structuredClone(original),
        events = [cs[11], cs[13], cs[15]],
        atts = [cs[12], cs[14], cs[16]],
        update = cs[17],
        get = (c) => JSON.parse(c.at(-1)),
        put = (c, o) => (c[c.length - 1] = JSON.stringify(o));
      let commands = cs;
      for (let i = 0; i < 3; i++) {
        const o = get(events[i]);
        if (mode === 'natural_titles')
          o.summary += ' — TechStart - Platform Deal';
        if (mode === 'chinese_steps')
          o.description = 'TechStart - Platform Deal | 第' + (i + 1) + '步';
        if (mode === 'no_descriptions') delete o.description;
        if (mode === 'event_only_ref') o.description += ' SPB-2026-Q1';
        put(events[i], o);
      }
      if (mode === 'natural_opp_description')
        put(update, {
          stage: 'Proposal',
          description:
            '已按 SPB-2026-Q1 为 TechStart - Platform Deal 安排三步会议。',
        });
      if (mode === 'wrong_type') {
        const o = get(events[1]);
        o.summary = 'Business Case Review';
        put(events[1], o);
      }
      if (mode === 'wrong_pricing_person') {
        const o = get(atts[2]);
        o.attendees[0].third_party_email = 'terry@techstart.example.com';
        put(atts[2], o);
      }
      if (mode === 'wrong_plan') {
        const o = get(cs[9]);
        o.opp_stage_after = 'Proposal';
        put(cs[9], o);
      }
      if (mode === 'wrong_plan_opportunity') {
        const o = get(cs[9]);
        o.opportunity_id = 'opp_techstart_legacy';
        put(cs[9], o);
      }
      if (['missing_ref', 'event_only_ref'].includes(mode)) {
        const o = get(update);
        o.description = o.description.replace('SPB-2026-Q1', 'playbook');
        put(update, o);
      }
      if (mode === 'wrong_time') {
        const o = get(events[1]);
        o.start_time.timestamp = String(Number(o.start_time.timestamp) + 3600);
        o.end_time.timestamp = String(Number(o.end_time.timestamp) + 3600);
        put(events[1], o);
      }
      if (mode === 'missing_demo') {
        commands = cs.filter((_, i) => ![13, 14].includes(i));
        atts[2][atts[2].indexOf('--event-id') + 1] = 'evt_2';
      }
      if (mode === 'early_stage')
        commands = [...cs.slice(0, 11), update, ...cs.slice(11, 17)];
      const b = await startMock(seed);
      try {
        for (const c of commands)
          await exec(repo + '/gyms/lark-cli/bin/lark-cli', c, {
            env: { ...process.env, FEISHU_MOCK_URL: b.url },
            maxBuffer: 8e6,
          });
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
          maxBuffer: 8e6,
        });
        const result = JSON.parse(
          await fs.readFile(a + '/' + mode + '/result.json', 'utf8'),
        );
        assert.equal(
          result.business_success,
          ['reference', 'natural_opp_description'].includes(mode),
          mode,
        );
      } finally {
        await b.close();
      }
    }
  } finally {
    await fs.rm(a, { recursive: true, force: true });
  }
});
