import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
type Fields = Record<string, string | number>;
type RecordRow = { record_id: string; fields: Fields };
type EventCheck = {
  semantic_text?: boolean;
  utc_date_window?: { date: string; duration_seconds: number };
  description?: string;
  description_rich?: string;
  description_contains?: string[];
  vc_data?: {
    vc_type: string;
    meeting_settings?: { password?: string; join_meeting_permission?: string };
  };
  vchat?: EventCheck['vc_data'];
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
type WorkflowEventSelector = {
  kind: string;
  record_id?: string;
  field?: string;
  equals?: Fields;
  chat_id?: string;
  collection?: string;
  spreadsheet_token?: string;
  sheet_id?: string;
  row?: number;
  column?: number;
};
const expected: {
  event_state_before_creates?: {
    collection: string;
    equals: Fields;
    event_index: number;
  }[];
  workflow_barriers?: {
    before: WorkflowEventSelector[];
    after: WorkflowEventSelector[];
  }[];
  record_state_before_updates?: {
    update: { record_id: string; field: string; value?: string | number };
    records: { collection: string; equals: Fields; one_of?: Fields[] }[];
    messages_before?: { chat_id: string; contains: string[] }[];
    updated_json_sets?: Record<string, string[]>;
  }[];
  record_state_before_messages?: {
    chat_id: string;
    records: { record_id?: string; collection?: string; equals: Fields }[];
  }[];
  action_prerequisites?: {
    notification: { chat_id: string; contains: string[] };
    records: { collection: string; equals: Fields }[];
    messages: { chat_id: string; contains: string[] }[];
  }[];
  entity_order?: {
    record?: {
      collection: string;
      equals: Fields;
      contains?: Record<string, string[]>;
    };
    record_before_message?: boolean;
    message: { chat_id: string; contains: string[] };
    cell: {
      spreadsheet_token: string;
      sheet_id: string;
      row: number;
      column: number;
      value: string | number;
    };
  }[];
  new_chats?: { name: string; description: string; user_ids: string[] }[];
  memberships?: { chat_id: string; user_ids: string[] }[];
  order_groups?: {
    kind: string;
    ids?: string[];
    collection?: string;
    all_messages?: boolean;
  }[];
  forbidden_records?: { equals: Fields; contains: Record<string, string> }[];
  forbidden_messages?: { chat_id?: string; contains: string[] }[];
  deletes?: string[];
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
const deletionChecks = (expected.deletes || []).map((id) => ({
  id,
  passed:
    seed.base.records.some((r: RecordRow) => r.record_id === id) &&
    !world.base.records.some((r: RecordRow) => r.record_id === id),
}));
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
const sameEventTimes = (
  event: Pick<EventCheck, 'start_time' | 'end_time'>,
  check: EventCheck,
) => {
  if (!check.utc_date_window)
    return (
      sameTime(event.start_time, check.start_time) &&
      sameTime(event.end_time, check.end_time)
    );
  const start = Number(event.start_time?.timestamp),
    end = Number(event.end_time?.timestamp);
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end - start !== check.utc_date_window.duration_seconds
  )
    return false;
  const date = new Date(start * 1000);
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === check.utc_date_window.date
  );
};
const eventMatches = (event: any, check: EventCheck): boolean => {
  const actualAttendees = (event.attendees || [])
    .map((a: { third_party_email: string }) => a.third_party_email)
    .sort();
  const videoSettings = [event.vc_data, event.vchat].filter(
    (value) => value !== undefined,
  );
  const videoMatches = (
    predicate: (value: NonNullable<EventCheck['vc_data']>) => boolean,
  ) =>
    videoSettings.length > 0 &&
    videoSettings.every(
      (value) =>
        value !== null && typeof value === 'object' && predicate(value),
    );
  return (
    (!check.description_contains ||
      ([event.description, event.description_rich].some(
        (text) => typeof text === 'string',
      ) &&
        [event.description, event.description_rich]
          .filter((text) => text !== undefined)
          .every(
            (text) =>
              typeof text === 'string' &&
              check.description_contains!.every((part) => text.includes(part)),
          ))) &&
    event.calendar_id === check.calendar_id &&
    event.status !== 'cancelled' &&
    (!(check.vc || check.vc_data?.vc_type === 'vc') ||
      videoMatches((value) => value.vc_type === 'vc')) &&
    (!(check.password_required || check.vc_data?.meeting_settings?.password) ||
      videoMatches((value) => Boolean(value.meeting_settings?.password))) &&
    (!(
      check.join_meeting_permission ||
      check.vc_data?.meeting_settings?.join_meeting_permission
    ) ||
      videoMatches(
        (value) =>
          value.meeting_settings?.join_meeting_permission ===
          (check.join_meeting_permission ||
            check.vc_data?.meeting_settings?.join_meeting_permission),
      )) &&
    (check.semantic_text ||
      (check.summary_contains
        ? event.summary.includes(check.summary_contains)
        : event.summary === check.summary)) &&
    sameEventTimes(event, check) &&
    (!check.location || event.location?.name === check.location.name) &&
    (!check.recurrence ||
      rrule(event.recurrence || '') === rrule(check.recurrence)) &&
    isDeepStrictEqual(actualAttendees, [...check.attendees].sort())
  );
};
const eventChecks = (expected.events || []).map((check) => ({
  ...check,
  passed: newEvents.some((event: any) => eventMatches(event, check)),
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
for (const id of expected.deletes || []) {
  if (!protectedWorld.base.records.some((r: RecordRow) => r.record_id === id)) {
    const index = seed.base.records.findIndex(
      (r: RecordRow) => r.record_id === id,
    );
    protectedWorld.base.records.splice(
      index,
      0,
      structuredClone(seed.base.records[index]),
    );
  }
}
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
      // This opt-in stage ends after every distinct new notification, not
      // after the first notification to each recipient. Edits are not sends.
      if (group.all_messages && group.kind === 'message') {
        if (mutation.before) continue;
      } else if (found.has(identity)) continue;
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
// Each entity has its own notification -> status dependency, optionally preceded by a record.
// Unrelated entities may interleave, and non-status cell corrections are not a barrier.
const entityOrderChecks = (expected.entity_order || []).map((rule) => {
  const records: number[] = [],
    messages: number[] = [],
    statuses: number[] = [];
  const activeRecords = new Set<string>(),
    recordReadyAtStatus: boolean[] = [];
  const recordRule = rule.record;
  const matchesRecord = (fields: Fields | undefined) =>
    Boolean(
      recordRule &&
      fields &&
      fields.collection === recordRule.collection &&
      Object.entries(recordRule.equals).every(([key, value]) =>
        isDeepStrictEqual(fields[key], value),
      ) &&
      Object.entries(recordRule.contains || {}).every(([key, parts]) => {
        const value = fields[key];
        return (
          typeof value === 'string' &&
          parts.every((part) => value.includes(part))
        );
      }),
    );
  for (const call of calls) {
    if (call.status >= 400) continue;
    for (const mutation of call.mutations || []) {
      if (rule.record_before_message === false && mutation.kind === 'record') {
        activeRecords.delete(mutation.id);
        if (matchesRecord(mutation.after?.fields))
          activeRecords.add(mutation.id);
      }
      if (!mutation.after) continue;
      if (mutation.kind === 'record' && matchesRecord(mutation.after.fields))
        records.push(call.seq);
      if (
        mutation.kind === 'message' &&
        !mutation.before &&
        mutation.after.chat_id === rule.message.chat_id
      ) {
        try {
          const text = JSON.parse(mutation.after.body.content).text;
          if (
            typeof text === 'string' &&
            rule.message.contains.every((part) => text.includes(part))
          )
            messages.push(call.seq);
        } catch {
          /* Malformed content cannot establish notification delivery. */
        }
      }
      const cell = rule.cell;
      if (
        mutation.kind === 'spreadsheet' &&
        mutation.id === cell.spreadsheet_token &&
        isDeepStrictEqual(
          mutation.after.sheets?.[cell.sheet_id]?.values[cell.row]?.[
            cell.column
          ],
          cell.value,
        ) &&
        !isDeepStrictEqual(
          mutation.before?.sheets?.[cell.sheet_id]?.values[cell.row]?.[
            cell.column
          ],
          cell.value,
        )
      ) {
        statuses.push(call.seq);
        recordReadyAtStatus.push(
          rule.record_before_message !== false || activeRecords.size > 0,
        );
      }
    }
  }
  return {
    rule,
    records,
    messages,
    statuses,
    recordReadyAtStatus,
    passed:
      (!rule.record ||
        (records.length > 0 &&
          (rule.record_before_message === false
            ? Math.min(...statuses)
            : Math.min(...messages)) > Math.min(...records))) &&
      messages.length > 0 &&
      statuses.length > 0 &&
      recordReadyAtStatus.every(Boolean) &&
      Math.min(...statuses) > Math.max(...messages),
  };
});
const actionPrerequisiteChecks = (expected.action_prerequisites || []).map(
  (rule) => {
    const notifications: number[] = [],
      actions: number[] = [];
    for (const call of calls) {
      if (call.status >= 400) continue;
      for (const mutation of call.mutations || []) {
        if (!mutation.after) continue;
        if (
          mutation.kind === 'record' &&
          rule.records.some(
            (record) =>
              mutation.after.fields?.collection === record.collection &&
              Object.entries(record.equals).every(([key, value]) =>
                isDeepStrictEqual(mutation.after.fields[key], value),
              ),
          )
        )
          actions.push(call.seq);
        if (mutation.kind !== 'message' || mutation.before) continue;
        try {
          const text = JSON.parse(mutation.after.body.content).text;
          const matches = (message: { chat_id: string; contains: string[] }) =>
            mutation.after.chat_id === message.chat_id &&
            typeof text === 'string' &&
            message.contains.every((part) => text.includes(part));
          if (matches(rule.notification)) notifications.push(call.seq);
          if (rule.messages.some(matches)) actions.push(call.seq);
        } catch {
          /* A malformed message cannot establish delivery. */
        }
      }
    }
    return {
      rule,
      notifications,
      actions,
      passed:
        notifications.length > 0 &&
        actions.length > 0 &&
        actions.every((seq) => seq > Math.min(...notifications)),
    };
  },
);
const recordStateBeforeUpdateChecks = (
  expected.record_state_before_updates || []
).map((rule) => {
  const current = new Map<string, Fields>(
    seed.base.records.map((row: RecordRow) => [
      row.record_id,
      structuredClone(row.fields),
    ]),
  );
  const checkpoints: { seq: number; passed: boolean }[] = [];
  for (const call of calls) {
    if (call.status >= 400) continue;
    // Read the state before the entire successful request, not after a sibling mutation.
    for (const mutation of call.mutations || []) {
      if (
        mutation.kind === 'record' &&
        mutation.id === rule.update.record_id &&
        mutation.after &&
        (Object.hasOwn(rule.update, 'value')
          ? isDeepStrictEqual(
              mutation.after.fields?.[rule.update.field],
              rule.update.value,
            ) &&
            !isDeepStrictEqual(
              mutation.before?.fields?.[rule.update.field],
              rule.update.value,
            )
          : !isDeepStrictEqual(
              mutation.before?.fields?.[rule.update.field],
              mutation.after.fields?.[rule.update.field],
            ))
      ) {
        checkpoints.push({
          seq: call.seq,
          passed:
            (rule.messages_before || []).every((message) =>
              calls.some(
                (prior: any) =>
                  prior.status < 400 &&
                  prior.seq < call.seq &&
                  (prior.mutations || []).some((item: any) => {
                    if (
                      item.kind !== 'message' ||
                      item.before ||
                      item.after?.chat_id !== message.chat_id
                    )
                      return false;
                    try {
                      const text = JSON.parse(item.after.body.content).text;
                      return (
                        typeof text === 'string' &&
                        message.contains.every((part) => text.includes(part))
                      );
                    } catch {
                      return false;
                    }
                  }),
              ),
            ) &&
            Object.entries(rule.updated_json_sets || {}).every(
              ([field, wanted]) => {
                const value = mutation.after.fields?.[field];
                if (typeof value !== 'string') return false;
                try {
                  const tags = JSON.parse(value);
                  return (
                    Array.isArray(tags) &&
                    tags.every((tag) => typeof tag === 'string') &&
                    new Set(tags).size === tags.length &&
                    isDeepStrictEqual([...tags].sort(), [...wanted].sort())
                  );
                } catch {
                  return false;
                }
              },
            ) &&
            rule.records.every((record) =>
              [...current.values()].some(
                (fields) =>
                  fields.collection === record.collection &&
                  Object.entries(record.equals).every(([key, value]) =>
                    isDeepStrictEqual(fields[key], value),
                  ) &&
                  (!record.one_of ||
                    record.one_of.some((choice) =>
                      Object.entries(choice).every(([key, value]) =>
                        isDeepStrictEqual(fields[key], value),
                      ),
                    )),
              ),
            ),
        });
      }
    }
    for (const mutation of call.mutations || []) {
      if (mutation.kind !== 'record') continue;
      if (mutation.after)
        current.set(mutation.id, structuredClone(mutation.after.fields));
      else current.delete(mutation.id);
    }
  }
  return {
    rule,
    checkpoints,
    passed:
      checkpoints.length > 0 && checkpoints.every((check) => check.passed),
  };
});
const recordStateBeforeMessageChecks = (
  expected.record_state_before_messages || []
).map((rule) => {
  const current = new Map<string, Fields>(
    seed.base.records.map((row: RecordRow) => [
      row.record_id,
      structuredClone(row.fields),
    ]),
  );
  const checkpoints: { seq: number; passed: boolean }[] = [];
  for (const call of calls) {
    if (call.status >= 400) continue;
    for (const mutation of call.mutations || []) {
      if (
        mutation.kind === 'message' &&
        mutation.after &&
        !mutation.before &&
        mutation.after.chat_id === rule.chat_id
      ) {
        checkpoints.push({
          seq: call.seq,
          passed: rule.records.every((record) =>
            record.record_id
              ? Object.entries(record.equals).every(([key, value]) =>
                  isDeepStrictEqual(
                    current.get(record.record_id!)?.[key],
                    value,
                  ),
                )
              : Boolean(record.collection) &&
                [...current.values()].some(
                  (fields) =>
                    fields.collection === record.collection &&
                    Object.entries(record.equals).every(([key, value]) =>
                      isDeepStrictEqual(fields[key], value),
                    ),
                ),
          ),
        });
      }
      if (mutation.kind === 'record') {
        if (mutation.after)
          current.set(mutation.id, structuredClone(mutation.after.fields));
        else current.delete(mutation.id);
      }
    }
  }
  return {
    rule,
    checkpoints,
    passed:
      checkpoints.length > 0 && checkpoints.every((check) => check.passed),
  };
});
const workflowEventSequences = (selector: WorkflowEventSelector): number[] => {
  const result: number[] = [];
  for (const call of calls) {
    if (call.status >= 400) continue;
    for (const mutation of call.mutations || []) {
      if (!mutation.after) continue;
      let matches = false;
      if (selector.kind === 'message')
        matches =
          mutation.kind === 'message' &&
          !mutation.before &&
          mutation.after.chat_id === selector.chat_id;
      if (selector.kind === 'record')
        matches =
          mutation.kind === 'record' &&
          !mutation.before &&
          mutation.after.fields?.collection === selector.collection &&
          Object.entries(selector.equals || {}).every(([key, value]) =>
            isDeepStrictEqual(mutation.after.fields?.[key], value),
          );
      if (selector.kind === 'record_field')
        matches =
          mutation.kind === 'record' &&
          mutation.id === selector.record_id &&
          Boolean(mutation.before) &&
          !isDeepStrictEqual(
            mutation.before.fields?.[selector.field!],
            mutation.after.fields?.[selector.field!],
          );
      if (
        selector.kind === 'cell' &&
        mutation.kind === 'spreadsheet' &&
        mutation.id === selector.spreadsheet_token
      ) {
        const before =
          mutation.before?.sheets?.[selector.sheet_id!]?.values?.[
            selector.row!
          ]?.[selector.column!];
        const after =
          mutation.after.sheets?.[selector.sheet_id!]?.values?.[
            selector.row!
          ]?.[selector.column!];
        matches = !isDeepStrictEqual(before, after);
      }
      if (matches) result.push(call.seq);
    }
  }
  return result;
};
const workflowBarrierChecks = (expected.workflow_barriers || []).map((rule) => {
  const before = rule.before.map(workflowEventSequences),
    after = rule.after.map(workflowEventSequences);
  return {
    rule,
    before,
    after,
    passed:
      before.every((events) => events.length > 0) &&
      after.every((events) => events.length > 0) &&
      Math.max(...before.flat()) < Math.min(...after.flat()),
  };
});
const eventStateBeforeCreateChecks = (
  expected.event_state_before_creates || []
).map((rule) => {
  const current = new Map<string, any>(
    seed.events.map((event: any) => [event.event_id, structuredClone(event)]),
  );
  const checkpoints: { seq: number; passed: boolean; events: any[] }[] = [];
  const check = expected.events?.[rule.event_index];
  for (const call of calls) {
    if (call.status >= 400) continue;
    for (const mutation of call.mutations || []) {
      if (
        mutation.kind === 'record' &&
        !mutation.before &&
        mutation.after?.fields?.collection === rule.collection &&
        Object.entries(rule.equals).every(([key, value]) =>
          isDeepStrictEqual(mutation.after.fields[key], value),
        )
      ) {
        const events = [...current.values()].filter(
          (event) =>
            !originalEvents.has(event.event_id) &&
            check &&
            eventMatches(event, check),
        );
        checkpoints.push({
          seq: call.seq,
          passed: events.length === 1,
          events: structuredClone(events),
        });
      }
    }
    for (const mutation of call.mutations || []) {
      if (mutation.kind !== 'event') continue;
      if (mutation.after)
        current.set(mutation.id, structuredClone(mutation.after));
      else current.delete(mutation.id);
    }
  }
  return {
    rule,
    checkpoints,
    passed:
      checkpoints.length > 0 &&
      checkpoints.every((checkpoint) => checkpoint.passed),
  };
});
const covered = !calls.some((c: { status: number }) => c.status === 501);
const success =
  eventStateBeforeCreateChecks.every((check) => check.passed) &&
  workflowBarrierChecks.every((check) => check.passed) &&
  recordStateBeforeUpdateChecks.every((check) => check.passed) &&
  recordStateBeforeMessageChecks.every((check) => check.passed) &&
  newChats.length === (expected.new_chats || []).length &&
  chatChecks.every((c) => c.passed) &&
  membershipChecks.every((c) => c.passed) &&
  orderChecks.every((c) => c.passed) &&
  actionPrerequisiteChecks.every((c) => c.passed) &&
  entityOrderChecks.every((c) => c.passed) &&
  eventChecks.every((c) => c.passed) &&
  cellChecks.every((c) => c.passed) &&
  messageChecks.every((c) => c.passed) &&
  forbiddenMessageChecks.every((c) => c.passed) &&
  forbiddenRecordChecks.every((c) => c.passed) &&
  deletionChecks.every((c) => c.passed) &&
  checks.every((c) => c.passed) &&
  creationChecks.every((c) => c.passed) &&
  unchanged &&
  covered;
writeFileSync(
  `${output}/result.json`,
  JSON.stringify(
    {
      status: !covered ? 'environment_incomplete' : success ? 'pass' : 'fail',
      success,
      checks,
      creationChecks,
      deletionChecks,
      chatChecks,
      membershipChecks,
      orderChecks,
      actionPrerequisiteChecks,
      recordStateBeforeUpdateChecks,
      recordStateBeforeMessageChecks,
      workflowBarrierChecks,
      entityOrderChecks,
      messageChecks,
      forbiddenMessageChecks,
      forbiddenRecordChecks,
      cellChecks,
      eventChecks,
      eventStateBeforeCreateChecks,
      unchanged,
      covered,
    },
    null,
    2,
  ),
);
if (!covered) {
  rmSync(`${output}/reward.txt`);
  throw new Error(
    'ENV_UNSUPPORTED: trial invalid because backend coverage is incomplete',
  );
}
writeFileSync(`${output}/reward.txt`, success ? '1\n' : '0\n');
