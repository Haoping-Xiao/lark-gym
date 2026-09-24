import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
test('Proposal schedule accepts natural text while retaining source titles and roles', async () => {
  const exec = promisify(execFile),
    repo = process.cwd(),
    a = await fs.mkdtemp(path.join(tmpdir(), 'proposal-events-')),
    task = repo + '/tasks/automationbench-sales-1179',
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
      'record_ids',
      'opp_record_ids',
      'account_record_id',
      'upper_prep',
      'lower_technical',
      'upper_technical',
      'reference',
      'natural_titles',
      'chinese_description',
      'formatted_amount',
      'no_description',
      'wrong_opportunity',
      'wrong_account',
      'wrong_points_relation',
      'missing_prep',
      'missing_technical',
      'wrong_buyer',
      'prep_customer',
      'sent_contract',
      'missing_video',
      'missing_proposal',
    ]) {
      const cs = structuredClone(original),
        events = cs.filter((c) => c[0] === 'calendar' && c[1] === 'events'),
        att = cs.filter((c) => c[1] === 'event.attendees'),
        get = (c) => JSON.parse(c.at(-1)),
        put = (c, o) => (c[c.length - 1] = JSON.stringify(o)),
        change = (c, f) => {
          let o = get(c);
          f(o);
          put(c, o);
        };
      const contract = cs.find(
          (c) => c[1] === '+record-upsert' && c.at(-1).includes('template_id'),
        ),
        points = cs.find(
          (c) => c[1] === '+record-upsert' && c.at(-1).includes('body'),
        );
      if (['record_ids', 'opp_record_ids'].includes(mode)) {
        change(contract, (o) => (o.opportunity_id = 'rec_opp_tv'));
        change(points, (o) => (o.opportunity_id = 'rec_opp_tv'));
      }
      if (['record_ids', 'account_record_id'].includes(mode))
        change(contract, (o) => (o.account_id = 'rec_001_TV'));
      if (mode === 'wrong_opportunity')
        change(contract, (o) => (o.opportunity_id = 'rec_006xx000099NO002'));
      if (mode === 'wrong_account')
        change(contract, (o) => (o.account_id = 'rec_001xx000099NA002'));
      if (mode === 'wrong_points_relation')
        change(points, (o) => (o.opportunity_id = 'rec_006xx000099NO002'));
      if (mode === 'upper_prep')
        change(
          events[0],
          (o) => (o.summary = 'TechVentures Internal Proposal Prep'),
        );
      if (mode === 'lower_technical')
        change(events[2], (o) => (o.summary = 'TechVentures technical q&a'));
      if (mode === 'upper_technical')
        change(events[2], (o) => (o.summary = 'TECHVENTURES TECHNICAL Q&A'));
      if (mode === 'natural_titles')
        for (const [i, ev] of events.entries())
          change(
            ev,
            (o) =>
              (o.summary = [
                'TechVentures 提案准备 prep',
                'TechVentures Pricing Discussion',
                'TechVentures Technical Q&A',
              ][i]),
          );
      if (mode === 'chinese_description')
        for (const [i, ev] of events.entries())
          change(
            ev,
            (o) =>
              (o.description = [
                'TechVentures 内部提案准备',
                'TechVentures 商机金额250000，定价讨论',
                'TechVentures 技术负责人答疑',
              ][i]),
          );
      if (mode === 'formatted_amount')
        change(events[1], (o) => (o.description = 'TechVentures | 250,000'));
      if (mode === 'no_description')
        for (const [i, ev] of events.entries())
          change(ev, (o) => {
            delete o.description;
            o.summary = [
              'TechVentures prep',
              'TechVentures Pricing Discussion',
              'TechVentures Technical Q&A',
            ][i];
          });
      if (mode === 'missing_prep')
        change(events[0], (o) => (o.summary = 'TechVentures 提案准备'));
      if (mode === 'missing_technical')
        change(events[2], (o) => (o.summary = 'TechVentures 技术答疑'));
      if (mode === 'wrong_customer')
        change(
          events[1],
          (o) => (o.description = 'BlueStar Ventures | 250000'),
        );
      if (mode === 'wrong_amount')
        change(events[1], (o) => (o.description = 'TechVentures | 25000'));
      if (mode === 'wrong_buyer')
        change(
          att[0],
          (o) =>
            (o.attendees[0].third_party_email =
              'tech@techventures.example.com'),
        );
      if (mode === 'wrong_technical')
        change(
          att[1],
          (o) =>
            (o.attendees[0].third_party_email =
              'buyer@techventures.example.com'),
        );
      if (mode === 'prep_customer') {
        const c = structuredClone(att[0]);
        c[c.indexOf('--event-id') + 1] = 'evt_1';
        cs.push(c);
      }
      if (mode === 'sent_contract')
        change(
          cs.find(
            (c) =>
              c[1] === '+record-upsert' &&
              c.at(-1).includes('signature') === false &&
              c.at(-1).includes('template_id'),
          ),
          (o) => (o.status = 'Sent'),
        );
      if (mode === 'wrong_duration')
        change(
          events[1],
          (o) => (o.end_time.timestamp = String(+o.end_time.timestamp + 900)),
        );
      if (mode === 'missing_video') change(events[2], (o) => delete o.vc_data);
      if (mode === 'invented_roi')
        change(
          cs.find(
            (c) => c[1] === '+record-upsert' && c.at(-1).includes('body'),
          ),
          (o) =>
            (o.body =
              'TechVentures | 250000 | primary buyer与technical lead已经同意签署，ROI保证300%，不需待客户确认。Draft。'),
        );
      if (mode === 'missing_proposal')
        cs.at(-1)[cs.at(-1).length - 1] = cs
          .at(-1)
          .at(-1)
          .replace('Proposal', '提案');
      const b = await startMock(seed);
      try {
        for (const c of cs)
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
        const d = JSON.parse(
          await fs.readFile(a + '/' + mode + '/result.json', 'utf8'),
        );
        assert.equal(
          d.business_success,
          [
            'record_ids',
            'opp_record_ids',
            'account_record_id',
            'upper_prep',
            'lower_technical',
            'upper_technical',
            'reference',
            'natural_titles',
            'chinese_description',
            'formatted_amount',
            'no_description',
          ].includes(mode),
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
