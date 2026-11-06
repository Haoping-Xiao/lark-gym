import type { World, ApiCall } from '../../../gyms/lark-cli/src/types.ts';
import { isDeepStrictEqual as equal } from 'node:util';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
// Independent fixed contract for this case; never ask the solving model to grade.

export function verify(seed: World, world: World, calls: ApiCall[]) {
  const start = '2026-02-22T02:00:00Z',
    end = '2026-02-22T04:00:00Z';
  const events = world.events.filter(
    (e) => !seed.events.some((s) => s.event_id === e.event_id),
  );
  const target = events.filter(
    (e) =>
      e.calendar_id === 'cal_ops' &&
      e.status === 'confirmed' &&
      Number(e.start_time.timestamp) === Date.parse(start) / 1000 &&
      Number(e.end_time.timestamp) === Date.parse(end) / 1000,
  );
  const completeText = (s: unknown) =>
    typeof s === 'string' &&
    ['Data Closet', start, end].every((x) => s.includes(x));
  const record = world.base.records.find((r) => r.record_id === 'rec_200');
  const firstWrite = calls.findIndex((c) => c.changed);
  const flatten = (v: unknown): string =>
    typeof v === 'string'
      ? (() => {
          try {
            return flatten(JSON.parse(v));
          } catch {
            return v;
          }
        })()
      : v && typeof v === 'object'
        ? Object.values(v).map(flatten).join('\n')
        : String(v);
  const prior = calls
    .slice(0, firstWrite < 0 ? 0 : firstWrite)
    .filter((c) => !c.changed && c.status === 200)
    .map((c) => flatten(c.response))
    .join('\n');
  const policyRead = seed.sheets.ws_maint_policy.values
    .slice(1)
    .every((row) => row.every((s) => prior.includes(String(s))));
  const planRead = seed.sheets.ws_plan.values
    .slice(1)
    .filter((row) => row[0] === 'Data Closet')
    .every((row) =>
      row.filter(Boolean).every((s) => prior.includes(String(s))),
    );
  const initialUnchanged = seed.events.every((e) =>
    equal(
      e,
      world.events.find((x) => x.event_id === e.event_id),
    ),
  );
  const wrongWrites = calls.some(
    (c) =>
      c.changed &&
      c.method === 'POST' &&
      c.path.includes('/events') &&
      (Number(c.body.start_time?.timestamp) !== Date.parse(start) / 1000 ||
        Number(c.body.end_time?.timestamp) !== Date.parse(end) / 1000 ||
        !c.path.includes('/cal_ops/')),
  );
  const checks = {
    read_all_policy_before_write: policyRead,
    read_plan_before_write: planRead,
    exactly_one_correct_event: events.length === 1 && target.length === 1,
    no_forbidden_window_ever_created: !wrongWrites,
    maintenance_record_complete:
      completeText(record?.fields['Maintenance log']) &&
      record?.fields.System === 'Data Closet',
    exactly_one_correct_notification:
      world.messages.length === 1 &&
      world.messages[0].chat_id === 'oc_it_ops' &&
      completeText(JSON.parse(world.messages[0].body.content).text),
    unrelated_events_unchanged:
      initialUnchanged &&
      !calls.some((c) =>
        (c.mutations || []).some(
          (m) =>
            m.kind === 'event' && seed.events.some((e) => e.event_id === m.id),
        ),
      ),
    unrelated_records_unchanged:
      !calls.some((c) =>
        (c.mutations || []).some(
          (m) => m.kind === 'record' && m.id !== 'rec_200',
        ),
      ) &&
      seed.base.records
        .filter((r) => r.record_id !== 'rec_200')
        .every((r) =>
          equal(
            r,
            world.base.records.find((x) => x.record_id === r.record_id),
          ),
        ),
    reference_data_unchanged:
      equal(seed.sheets, world.sheets) &&
      equal(seed.calendars, world.calendars) &&
      equal(seed.chats, world.chats),
  };
  const infrastructureErrors = calls.filter(
    (c) => c.status >= 500 && c.status !== 501,
  ).length;
  const valid = infrastructureErrors === 0;
  return {
    status: !valid
      ? 'error'
      : Object.values(checks).every(Boolean)
        ? 'pending_semantic'
        : 'fail',
    success: false,
    business_success: valid && Object.values(checks).every(Boolean),
    semantic: {
      required: true,
      deferred: [
        'events.business_purpose_and_optional_description',
        'maintenance.record_and_notification_business_meaning',
      ],
      original: {
        events: [
          {
            calendar_id: 'cal_ops',
            purpose:
              '为 Data Closet 安排已批准的断电维护；中文标题可以，但须明确指向该维护，不能仅写“会议”等空泛标题。',
            start,
            end,
          },
        ],
        maintenance: {
          record_id: 'rec_200',
          field: 'Maintenance log',
          chat_id: 'oc_it_ops',
          system: 'Data Closet',
          start,
          end,
          requirement:
            '记录及通知应明确表达已安排本次维护，并与实际日程一致。不能宣布取消或否认安排，不能只引用作废的旧计划。允许说明旧计划已取消、同时清楚确认本次有效安排；不能仅凭出现取消一词拒绝。',
        },
      },
    },
    checks,
    infrastructureErrors,
    apiCalls: calls.length,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const output = process.env.VERIFIER_OUTPUT || '/logs/verifier';
  mkdirSync(output, { recursive: true });
  const snapshot = JSON.parse(
    readFileSync(
      process.env.MOCK_STATE || '/var/lib/feishu-mock/state.json',
      'utf8',
    ),
  );
  const result = verify(snapshot.seed, snapshot.world, snapshot.calls);
  writeFileSync(`${output}/result.json`, JSON.stringify(result, null, 2));
  if (result.infrastructureErrors)
    throw new Error('Mock infrastructure failure');
}
