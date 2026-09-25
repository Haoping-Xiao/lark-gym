import { prepareSemantic } from './semantic.ts';
import { scoreUnsupported } from './unsupported.ts';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
type Fields = Record<string, string | number>;
type RecordRow = { record_id: string; fields: Fields };
type EventCheck = {
  description?: string;
  description_contains?: string[];
  vc_data?: {
    vc_type: string;
    meeting_settings?: { password?: string; join_meeting_permission?: string };
  };
  vc?: boolean;
  password_required?: boolean;
  join_meeting_permission?: string;
  calendar_id: string;
  summary: string;
  summary_contains?: string;
  start_time: Record<string, string>;
  end_time: Record<string, string>;
  location?: { name: string };
  recurrence?: string;
  attendees: string[];
};
type Check = {
  record_id: string;
  field: string;
  value: string | number;
  mode: string;
  contains?: string[];
  forbidden?: string[];
};
const expected: {
  new_chats?: { name: string; description: string; user_ids: string[] }[];
  memberships?: { chat_id: string; user_ids: string[] }[];
  order_groups?: { kind: string; ids?: string[]; collection?: string }[];
  forbidden_records?: { equals: Fields; contains: Record<string, string> }[];
  forbidden_messages?: { chat_id?: string; contains: string[] }[];
  updates: Check[];
  events?: EventCheck[];
  create_contains?: Record<string, string[]>;
  creation_contains?: Record<string, Record<string, string[]>>;
  cells?: {
    one_of?: (string | number)[];
    contains?: string[];
    spreadsheet_token?: string;
    sheet_id: string;
    row: number;
    column: number;
    value: string | number;
  }[];
  creates: Fields[];
  messages: { chat_id?: string; chat_name?: string; contains: string[] }[];
} = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('./expected.json', import.meta.url)),
    'utf8',
  ),
);
const output = process.env.VERIFIER_OUTPUT || '/logs/verifier';
mkdirSync(output, { recursive: true });
writeFileSync(`${output}/reward.txt`, '0\n');
const { seed, world, calls } = JSON.parse(
  readFileSync(
    process.env.MOCK_STATE || '/var/lib/feishu-mock/state.json',
    'utf8',
  ),
);
const semantic = prepareSemantic(
  expected,
  world,
  new URL('./semantic-config.json', import.meta.url),
  seed,
);
const checks = expected.updates.map((check) => {
  const value = world.base.records.find(
    (r: RecordRow) => r.record_id === check.record_id,
  )?.fields[check.field];
  return {
    ...check,
    passed:
      !(check.forbidden || []).some((part) => String(value).includes(part)) &&
      (check.contains
        ? check.contains.every((part) => String(value).includes(part))
        : check.mode === 'contains'
          ? typeof value === 'string' && value.includes(String(check.value))
          : isDeepStrictEqual(value, check.value)),
  };
});
const originalIds = new Set(
  seed.base.records.map((r: RecordRow) => r.record_id),
);
const created: RecordRow[] = world.base.records.filter(
  (r: RecordRow) => !originalIds.has(r.record_id),
);
const consumed = new Set<string>();
const creationChecks = expected.creates.map((fields, index) => {
  const contains = {
    ...expected.create_contains,
    ...expected.creation_contains?.[String(index)],
  };
  const match = created.find(
    (r) =>
      !consumed.has(r.record_id) &&
      Object.entries(fields).every(([key, value]) =>
        contains[key]
          ? typeof r.fields[key] === 'string' &&
            contains[key].every((part) => String(r.fields[key]).includes(part))
          : isDeepStrictEqual(r.fields[key], value),
      ),
  );
  if (match) consumed.add(match.record_id);
  return { fields, passed: Boolean(match) };
});
const forbiddenRecordChecks = (expected.forbidden_records || []).map(
  (check) => ({
    ...check,
    passed: !world.base.records.some(
      (r: RecordRow) =>
        Object.entries(check.equals).every(([key, value]) =>
          isDeepStrictEqual(r.fields[key], value),
        ) &&
        Object.entries(check.contains).every(([key, value]) =>
          String(r.fields[key] ?? '')
            .toLowerCase()
            .includes(value.toLowerCase()),
        ),
    ),
  }),
);
const originalMessages = new Set(
  seed.messages.map((m: { message_id: string }) => m.message_id),
);
const sent = world.messages.filter(
  (m: { message_id: string }) => !originalMessages.has(m.message_id),
);
const consumedMessages = new Set<string>();
const messageChecks = (expected.messages || []).map((check) => {
  const match = sent.find(
    (m: { message_id: string; chat_id: string; body: { content: string } }) => {
      if (
        consumedMessages.has(m.message_id) ||
        m.chat_id !==
          (check.chat_name
            ? world.chats.find(
                (c: { name: string }) => c.name === check.chat_name,
              )?.chat_id
            : check.chat_id)
      )
        return false;
      try {
        const text = JSON.parse(m.body.content).text;
        return (
          typeof text === 'string' &&
          check.contains.every((part) =>
            text
              .replace(/\s/g, '')
              .toLowerCase()
              .includes(part.replace(/\s/g, '').toLowerCase()),
          )
        );
      } catch {
        return false;
      }
    },
  );
  if (match) consumedMessages.add(match.message_id);
  return { ...check, passed: Boolean(match) };
});
const forbiddenMessageChecks = (expected.forbidden_messages || []).map(
  (check) => ({
    ...check,
    passed: !sent.some((m: { chat_id: string; body: { content: string } }) => {
      if (check.chat_id && m.chat_id !== check.chat_id) return false;
      try {
        const text = JSON.parse(m.body.content).text;
        return (
          typeof text === 'string' &&
          check.contains.every((part) =>
            text.toLowerCase().includes(part.toLowerCase()),
          )
        );
      } catch {
        return false;
      }
    }),
  }),
);
const originalEvents = new Set(
  seed.events.map((e: { event_id: string }) => e.event_id),
);
const newEvents = world.events.filter(
  (e: { event_id: string }) => !originalEvents.has(e.event_id),
);
const rrule = (rule: string) =>
  rule
    .replace(/^RRULE:/, '')
    .split(';')
    .sort()
    .join(';');
const sameTime = (
  actual: Record<string, string>,
  expected: Record<string, string>,
) =>
  Boolean(actual) &&
  (expected.date
    ? actual.date === expected.date
    : Number(actual.timestamp) === Number(expected.timestamp)) &&
  (!expected.timezone || actual.timezone === expected.timezone);
const eventChecks = (expected.events || []).map((check) => ({
  ...check,
  passed: newEvents.some(
    (
      event: Omit<EventCheck, 'attendees'> & {
        status: string;
        attendees: { third_party_email: string }[];
      },
    ) => {
      const actualAttendees = (event.attendees || [])
        .map((a: { third_party_email: string }) => a.third_party_email)
        .sort();
      return (
        (!check.description_contains ||
          check.description_contains.every((part) =>
            (event.description || '').includes(part),
          )) &&
        event.calendar_id === check.calendar_id &&
        event.status !== 'cancelled' &&
        (!(check.vc || check.vc_data?.vc_type === 'vc') ||
          event.vc_data?.vc_type === 'vc') &&
        (!(
          check.password_required || check.vc_data?.meeting_settings?.password
        ) ||
          Boolean(event.vc_data?.meeting_settings?.password)) &&
        (!(
          check.join_meeting_permission ||
          check.vc_data?.meeting_settings?.join_meeting_permission
        ) ||
          event.vc_data?.meeting_settings?.join_meeting_permission ===
            (check.join_meeting_permission ||
              check.vc_data?.meeting_settings?.join_meeting_permission)) &&
        (check.summary_contains
          ? event.summary.includes(check.summary_contains)
          : event.summary === check.summary) &&
        sameTime(event.start_time, check.start_time) &&
        sameTime(event.end_time, check.end_time) &&
        (!check.location || event.location?.name === check.location.name) &&
        (!check.recurrence ||
          rrule(event.recurrence || '') === rrule(check.recurrence)) &&
        isDeepStrictEqual(actualAttendees, [...check.attendees].sort())
      );
    },
  ),
}));
const membershipChecks = (expected.memberships || []).map((check) => ({
  ...check,
  passed: isDeepStrictEqual(
    [
      ...(world.chats.find(
        (c: { chat_id: string }) => c.chat_id === check.chat_id,
      )?.member_ids || []),
    ].sort(),
    [
      ...new Set([
        ...(seed.chats.find(
          (c: { chat_id: string }) => c.chat_id === check.chat_id,
        )?.member_ids || []),
        ...check.user_ids,
      ]),
    ].sort(),
  ),
}));
const originalChats = new Set(
  seed.chats.map((c: { chat_id: string }) => c.chat_id),
);
const newChats = world.chats.filter(
  (c: { chat_id: string }) => !originalChats.has(c.chat_id),
);
const chatChecks = (expected.new_chats || []).map((check) => ({
  ...check,
  passed:
    newChats.filter(
      (c: { name: string; description: string; member_ids: string[] }) =>
        c.name === check.name &&
        c.description === check.description &&
        isDeepStrictEqual(
          [...(c.member_ids || [])].sort(),
          [...check.user_ids].sort(),
        ),
    ).length === 1,
}));
const protectedWorld = structuredClone(world);
protectedWorld.chats = protectedWorld.chats.filter((c: { chat_id: string }) =>
  originalChats.has(c.chat_id),
);
for (const check of expected.memberships || []) {
  const chat = protectedWorld.chats.find(
    (c: { chat_id: string }) => c.chat_id === check.chat_id,
  );
  if (chat)
    chat.member_ids = seed.chats.find(
      (c: { chat_id: string }) => c.chat_id === check.chat_id,
    ).member_ids;
}
protectedWorld.events = protectedWorld.events.filter(
  (e: { event_id: string }) => originalEvents.has(e.event_id),
);
protectedWorld.messages = protectedWorld.messages.filter(
  (m: { message_id: string }) => originalMessages.has(m.message_id),
);
protectedWorld.base.records = protectedWorld.base.records.filter(
  (r: RecordRow) => originalIds.has(r.record_id),
);
for (const check of expected.updates) {
  const before = seed.base.records.find(
    (r: RecordRow) => r.record_id === check.record_id,
  );
  const after = protectedWorld.base.records.find(
    (r: RecordRow) => r.record_id === check.record_id,
  );
  if (after) after.fields[check.field] = before.fields[check.field];
}
const sheetsFor = (
  state: typeof world,
  cell: { spreadsheet_token?: string },
) =>
  cell.spreadsheet_token
    ? state.spreadsheets[cell.spreadsheet_token].sheets
    : state.sheets;
const cellChecks = (expected.cells || []).map((c) => ({
  ...c,
  passed: c.one_of
    ? c.one_of.some((value) =>
        isDeepStrictEqual(
          sheetsFor(world, c)[c.sheet_id]?.values[c.row]?.[c.column],
          value,
        ),
      )
    : c.contains
      ? c.contains.every((part) =>
          String(
            sheetsFor(world, c)[c.sheet_id]?.values[c.row]?.[c.column] ?? '',
          ).includes(part),
        )
      : isDeepStrictEqual(
          sheetsFor(world, c)[c.sheet_id]?.values[c.row]?.[c.column],
          c.value,
        ),
}));
for (const cell of expected.cells || []) {
  const before = sheetsFor(seed, cell)[cell.sheet_id].values;
  const after = sheetsFor(protectedWorld, cell)[cell.sheet_id].values;
  if (after[cell.row])
    after[cell.row][cell.column] = before[cell.row]?.[cell.column] ?? '';
}
for (const cell of expected.cells || []) {
  const before = sheetsFor(seed, cell)[cell.sheet_id].values,
    after = sheetsFor(protectedWorld, cell)[cell.sheet_id].values;
  while (
    after.length > before.length &&
    after[after.length - 1].every((value: unknown) => value === '')
  )
    after.pop();
}
const unchanged =
  isDeepStrictEqual(seed, protectedWorld) &&
  created.length === consumed.size &&
  sent.length === (expected.messages || []).length &&
  newEvents.length === (expected.events || []).length;
let previousStageEnd = -1;
const orderChecks = (expected.order_groups || []).map((group) => {
  const sequences: number[] = [];
  const found = new Set<string>();
  for (const call of calls) {
    for (const mutation of call.mutations || []) {
      if (mutation.kind !== group.kind || !mutation.after || call.status >= 400)
        continue;
      const identity =
        group.kind === 'message' ? mutation.after.chat_id : mutation.id;
      if (group.ids && !group.ids.includes(identity)) continue;
      if (
        group.collection &&
        mutation.after.fields?.collection !== group.collection
      )
        continue;
      if (found.has(identity)) continue;
      found.add(identity);
      sequences.push(call.seq);
    }
  }
  const passed =
    sequences.length > 0 &&
    (!group.ids || group.ids.every((id) => found.has(id))) &&
    Math.min(...sequences) > previousStageEnd;
  previousStageEnd = Math.max(previousStageEnd, ...sequences);
  return { group, passed };
});
const covered = !calls.some((c: { status: number }) => c.status === 501);
const success =
  newChats.length === (expected.new_chats || []).length &&
  chatChecks.every((c) => c.passed) &&
  membershipChecks.every((c) => c.passed) &&
  orderChecks.every((c) => c.passed) &&
  eventChecks.every((c) => c.passed) &&
  cellChecks.every((c) => c.passed) &&
  messageChecks.every((c) => c.passed) &&
  forbiddenMessageChecks.every((c) => c.passed) &&
  forbiddenRecordChecks.every((c) => c.passed) &&
  checks.every((c) => c.passed) &&
  creationChecks.every((c) => c.passed) &&
  unchanged;
const coverage = scoreUnsupported(
  success ? 1 : 0,
  calls,
  JSON.parse(
    readFileSync(new URL('./unsupported-policy.json', import.meta.url), 'utf8'),
  ),
);
writeFileSync(`${output}/unsupported.json`, JSON.stringify(coverage, null, 2));
writeFileSync(
  `${output}/result.json`,
  JSON.stringify(
    {
      status: !covered ? 'environment_incomplete' : success ? 'pass' : 'fail',
      success: coverage.valid_sample && success,
      business_success: success,
      semantic,
      coverage,
      checks,
      creationChecks,
      chatChecks,
      membershipChecks,
      orderChecks,
      messageChecks,
      forbiddenMessageChecks,
      forbiddenRecordChecks,
      cellChecks,
      eventChecks,
      unchanged,
      covered,
    },
    null,
    2,
  ),
);
if (!coverage.valid_sample) {
  rmSync(`${output}/reward.txt`);
  throw new Error(
    'ENV_UNSUPPORTED: trial invalid because backend coverage is incomplete',
  );
}
writeFileSync(`${output}/reward.txt`, `${coverage.reward}\n`);
