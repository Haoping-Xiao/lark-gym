import type {
  World,
  ApiCall,
  Verdict,
} from '../../../gyms/lark-cli/src/types.ts';
import { isDeepStrictEqual as equal } from 'node:util';
// Independent fixed contract for this case; never ask the solving model to grade.

export function verify(seed: World, world: World, calls: ApiCall[]): Verdict {
  const start = '2026-02-22T02:00:00Z',
    end = '2026-02-22T04:00:00Z';
  const events = world.events.filter(
    (e) => !seed.events.some((s) => s.event_id === e.event_id),
  );
  const target = events.filter(
    (e) =>
      e.calendar_id === 'cal_ops' &&
      e.status === 'confirmed' &&
      e.summary.includes('Data Closet') &&
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
  const unsupported = calls
    .filter((c) => c.status === 501)
    .map((c) => `${c.method} ${c.path}`);
  const infrastructureErrors = calls.filter(
    (c) => c.status >= 500 && c.status !== 501,
  ).length;
  const valid = unsupported.length === 0 && infrastructureErrors === 0;
  return {
    status: !valid
      ? 'environment_incomplete'
      : Object.values(checks).every(Boolean)
        ? 'pass'
        : 'fail',
    success: valid && Object.values(checks).every(Boolean),
    checks,
    unsupported,
    infrastructureErrors,
    apiCalls: calls.length,
  };
}
