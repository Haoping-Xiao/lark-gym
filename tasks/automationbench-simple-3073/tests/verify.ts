import { prepareSemantic } from './semantic.ts';
import { scoreUnsupported } from './unsupported.ts';
import { createHash } from 'node:crypto';
function decodedMessageText(content: string): string | undefined {
  const value = JSON.parse(content);
  if (typeof value?.text === 'string') return value.text;
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  const parts: string[] = [];
  for (const [locale, post] of Object.entries(value) as [string, any][]) {
    if (
      !['zh_cn', 'en_us', 'ja_jp'].includes(locale) ||
      !post ||
      !Array.isArray(post.content)
    )
      return undefined;
    if (typeof post.title === 'string') parts.push(post.title);
    for (const line of post.content) {
      if (!Array.isArray(line)) return undefined;
      const words: string[] = [];
      for (const node of line) {
        if (['text', 'md'].includes(node?.tag) && typeof node.text === 'string')
          words.push(node.text);
        else if (
          node?.tag === 'a' &&
          typeof node.text === 'string' &&
          typeof node.href === 'string'
        )
          words.push(node.text + ' (' + node.href + ')');
        else if (node?.tag === 'at') words.push('@' + (node.user_name || ''));
        else return undefined;
      }
      parts.push(words.join(''));
    }
  }
  return parts.join('\n');
}
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
  summary_contains_case_insensitive?: boolean;
  start_time: Record<string, string>;
  end_time: Record<string, string>;
  location?: { name: string };
  recurrence?: string;
  host_user_email?: string;
  source_message_id?: string;
  single_occurrence?: boolean;
  attendees: string[];
  attendee_options?: string[][];
};
type Check = {
  required_url?: string;
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
  cells_before_mail?: { to: string; cells: any[] }[];
  mail?: {
    attachments?: {
      filename: string;
      content_types: string[];
      sha256: string;
    }[];
    source_message_id?: string;
    reply_to_source?: boolean;
    to: string[];
    subject?: string;
    subject_contains?: string[];
    body_contains?: string[];
  }[];
  creation_contains_guarded?: boolean;
  rrule_default_interval?: boolean;
  rrule_byday_set?: boolean;
  read_records_before_updates?: {
    record_id: string;
    field: string;
    source_record_id: string;
    identity: Fields;
  }[];
  read_records_before_creates?: {
    create_index: number;
    record_id: string;
    identity: Fields;
  }[];
  read_before_creates?: { create_index: number; source_message_id: string }[];
  read_before_updates?: {
    require_record_read?: boolean;
    record_after_source?: boolean;
    record_id: string;
    field: string;
    source_message_id: string;
    identity: Fields;
  }[];
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
    message_contains?: string[];
    records: {
      record_id?: string;
      collection?: string;
      equals: Fields;
      contains?: Record<string, string[]>;
    }[];
  }[];
  action_prerequisites?: {
    notification: { chat_id: string; contains: string[] };
    records: { collection: string; equals: Fields }[];
    messages: {
      source_mail_id?: string;
      chat_id: string;
      contains: string[];
    }[];
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
    sent_mail_only?: boolean;
  }[];
  forbidden_records?: { equals: Fields; contains: Record<string, string> }[];
  forbidden_messages?: { chat_id?: string; contains: string[] }[];
  deletes?: string[];
  updates: Check[];
  events?: EventCheck[];
  create_contains?: Record<string, string[]>;
  creation_contains?: Record<string, Record<string, string[]>>;
  cells?: {
    numeric_equivalent?: boolean;
    one_of?: (string | number)[];
    contains?: string[];
    spreadsheet_token?: string;
    sheet_id: string;
    row: number;
    column: number;
    value: string | number;
  }[];
  creates: Fields[];
  messages: {
    chat_id?: string;
    chat_name?: string;
    contains: string[];
    mention_open_ids?: string[];
    source_mail_id?: string;
  }[];
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
// Compare actual URL targets, not substrings inside another host/path or link label.
const includesSourceUrl = (text: unknown, source: string): boolean => {
  if (typeof text !== 'string') return false;
  const destinations: string[] = [];
  const visible = text.replace(
    /\[[^\]\n]*\]\(\s*<?(https?:\/\/[^\s)>]+)>?(?:\s+"[^"\n]*")?\s*\)/gi,
    (_match, target: string) => {
      destinations.push(target);
      return ' ';
    },
  );
  destinations.push(...(visible.match(/https?:\/\/[^\s<>"`\[\]]+/gi) || []));
  return destinations.some((raw) => {
    const candidate = raw.replace(/[).,;!?，。；！？？]+$/u, '');
    try {
      return new URL(candidate).href === new URL(source).href;
    } catch {
      return false;
    }
  });
};

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
      (!check.required_url || includesSourceUrl(value, check.required_url)) &&
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
const supportContains = (actual: string, needle: string) => {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/(\d),(\d)/g, '$1$2')
      .replace(/(\.\d*[1-9])0+(?!\d)/g, '$1')
      .replace(/(\d)\.0+(?!\d)/g, '$1');
  const n = norm(needle);
  if (!n) return false;
  const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    (/^[a-z0-9]/.test(n) ? '(?<![a-z0-9])' : '') +
      escaped +
      (/\d$/.test(n) ? '(?!\\d|\\.\\d)' : ''),
  ).test(norm(actual));
};
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
            (expected.creation_contains_guarded
              ? contains[key].every((part) =>
                  supportContains(String(r.fields[key]), part),
                )
              : contains[key].every((part) =>
                  String(r.fields[key]).includes(part),
                ))
          : isDeepStrictEqual(r.fields[key], value),
      ),
  );
  if (match) consumed.add(match.record_id);
  return { fields, record_id: match?.record_id, passed: Boolean(match) };
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
const sourceMailBeforeMessage = (message: any, id: string) => {
  const source = seed.mail?.messages.find((m: any) => m.message_id === id);
  if (!source) return false;
  const walk = (v: any): boolean =>
    v !== null &&
    typeof v === 'object' &&
    (((v.message_id === id || v.message_biz_id === id) &&
      (v.subject === source.subject || v.title === source.subject) &&
      v.body_plain_text === source.body_plain_text) ||
      Object.values(v).some(walk));
  const reads = calls
    .filter(
      (c: any) =>
        c.status < 400 &&
        ['GET', 'POST'].includes(c.method) &&
        !(c.mutations || []).length &&
        walk(c.response),
    )
    .map((c: any) => c.seq);
  const sent = calls.find(
    (c: any) =>
      c.status < 400 &&
      (c.mutations || []).some(
        (m: any) =>
          m.kind === 'message' && m.id === message.message_id && !m.before,
      ),
  );
  return !!sent && reads.some((seq: number) => seq < sent.seq);
};
const messageChecks = (expected.messages || []).map((check) => {
  const match = sent.find((m: any) => {
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
      const text = decodedMessageText(m.body.content);
      return (
        typeof text === 'string' &&
        (!check.source_mail_id ||
          sourceMailBeforeMessage(m, check.source_mail_id)) &&
        (check.mention_open_ids || []).every(
          (id) =>
            (m.mentions || []).some(
              (mention: any) =>
                mention.id === id && mention.id_type === 'open_id',
            ) &&
            calls.some(
              (call: any) =>
                call.status < 400 &&
                (call.mutations || []).some(
                  (mutation: any) =>
                    mutation.kind === 'message' &&
                    mutation.id === m.message_id &&
                    !mutation.before &&
                    (mutation.after?.mentions || []).some(
                      (mention: any) =>
                        mention.id === id && mention.id_type === 'open_id',
                    ),
                ),
            ),
        ) &&
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
  });
  if (match) consumedMessages.add(match.message_id);
  return { ...check, passed: Boolean(match) };
});
const forbiddenMessageChecks = (expected.forbidden_messages || []).map(
  (check) => ({
    ...check,
    passed: !sent.some((m: { chat_id: string; body: { content: string } }) => {
      if (check.chat_id && m.chat_id !== check.chat_id) return false;
      try {
        const text = decodedMessageText(m.body.content);
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
const rrule = (rule: string) => {
  const parts = rule.replace(/^RRULE:/, '').split(';');
  if (!expected.rrule_default_interval) return parts.sort().join(';');
  const parsed = new Map<string, string>();
  for (const part of parts) {
    const match = /^([A-Z]+)=([^;]+)$/.exec(part);
    if (!match || parsed.has(match[1])) return 'INVALID:' + rule;
    parsed.set(match[1], match[2]);
  }
  if (/^0*1$/.test(parsed.get('INTERVAL') || '')) parsed.delete('INTERVAL');
  if (expected.rrule_byday_set && parsed.has('BYDAY')) {
    const days = parsed.get('BYDAY')!.split(',');
    if (
      days.some((day) => !/^(MO|TU|WE|TH|FR|SA|SU)$/.test(day)) ||
      new Set(days).size !== days.length
    )
      return 'INVALID:' + rule;
    parsed.set('BYDAY', days.sort().join(','));
  }
  return [...parsed]
    .map(([key, value]) => key + '=' + value)
    .sort()
    .join(';');
};
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
const eventHostProof = (event: any, email: string) => {
  const creator = calls.find(
    (call: any) =>
      call.status < 400 &&
      (call.mutations || []).some(
        (m: any) =>
          m.kind === 'event' && m.id === event.event_id && !m.before && m.after,
      ),
  );
  const account =
    creator &&
    calls.find(
      (call: any) =>
        call.status < 400 &&
        call.identity === 'user' &&
        call.method === 'GET' &&
        call.path.split('?')[0] === '/open-apis/authen/v1/user_info' &&
        call.seq < creator.seq &&
        call.response?.data?.email === email,
    );
  return {
    event_id: event.event_id,
    expected_email: email,
    creator_seq: creator?.seq,
    creator_identity: creator?.identity,
    account_seq: account?.seq,
    passed: !!creator && creator.identity === 'user' && !!account,
  };
};
const eventSourceProof = (event: any, messageId: string) => {
  const sourceMail = seed.mail?.messages.find(
    (m: any) => m.message_id === messageId,
  );
  const source = seed.messages.find((m: any) => m.message_id === messageId);
  const text = (m: any): unknown => {
    try {
      return decodedMessageText(m?.body?.content);
    } catch {
      return undefined;
    }
  };
  const sourceText = text(source);
  const walk = (value: any): boolean =>
    value !== null &&
    typeof value === 'object' &&
    ((sourceMail &&
      (value.message_id === messageId || value.message_biz_id === messageId) &&
      (value.subject === sourceMail.subject ||
        value.title === sourceMail.subject) &&
      value.body_plain_text === sourceMail.body_plain_text) ||
      (!sourceMail &&
        value.message_id === messageId &&
        typeof sourceText === 'string' &&
        text(value) === sourceText) ||
      Object.values(value).some(walk));
  const reads = calls
    .filter(
      (call: any) =>
        call.status < 400 &&
        ['GET', 'POST'].includes(call.method) &&
        !(call.mutations || []).length &&
        walk(call.response),
    )
    .map((call: any) => call.seq);
  const creation = calls.find(
    (call: any) =>
      call.status < 400 &&
      (call.mutations || []).some(
        (m: any) =>
          m.kind === 'event' && m.id === event.event_id && !m.before && m.after,
      ),
  );
  return {
    event_id: event.event_id,
    message_id: messageId,
    reads,
    creation_seq: creation?.seq,
    passed: !!creation && reads.some((seq: number) => seq < creation.seq),
  };
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
    (!check.source_message_id ||
      eventSourceProof(event, check.source_message_id).passed) &&
    (!check.host_user_email ||
      eventHostProof(event, check.host_user_email).passed) &&
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
    (!check.summary_contains ||
      (check.summary_contains_case_insensitive
        ? String(event.summary || '')
            .toLowerCase()
            .includes(check.summary_contains.toLowerCase())
        : String(event.summary || '').includes(check.summary_contains))) &&
    (check.semantic_text ||
      (check.summary_contains
        ? check.summary_contains_case_insensitive
          ? event.summary
              .toLowerCase()
              .includes(check.summary_contains.toLowerCase())
          : event.summary.includes(check.summary_contains)
        : event.summary === check.summary)) &&
    sameEventTimes(event, check) &&
    (!check.location || event.location?.name === check.location.name) &&
    (!check.single_occurrence ||
      event.recurrence === undefined ||
      event.recurrence === '') &&
    (!check.recurrence ||
      rrule(event.recurrence || '') === rrule(check.recurrence)) &&
    (check.attendee_options || [check.attendees]).some((option) =>
      isDeepStrictEqual(actualAttendees, [...option].sort()),
    )
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
const initialMailIDs = new Set(
  (seed.mail?.messages || []).map((m: any) => m.message_id),
);
const sentMail = (world.mail?.messages || []).filter(
  (m: any) => !initialMailIDs.has(m.message_id) && m.message_state === 2,
);
const consumedMail = new Set<string>();
const mailSourceProof = (
  message: any,
  rule: { source_message_id?: string; reply_to_source?: boolean },
) => {
  if (!rule.source_message_id) return true;
  const source = seed.mail?.messages.find(
    (m: any) => m.message_id === rule.source_message_id,
  );
  if (
    !source ||
    (rule.reply_to_source &&
      (message.thread_id !== source.thread_id ||
        message.mailbox_id !== source.mailbox_id))
  )
    return false;
  const walk = (value: any): boolean =>
    value !== null &&
    typeof value === 'object' &&
    (((value.message_id === source.message_id ||
      value.message_biz_id === source.message_id) &&
      (value.subject === source.subject || value.title === source.subject) &&
      value.body_plain_text === source.body_plain_text) ||
      Object.values(value).some(walk));
  const reads = calls
    .filter(
      (c: any) =>
        c.status < 400 &&
        ['GET', 'POST'].includes(c.method) &&
        !(c.mutations || []).length &&
        walk(c.response),
    )
    .map((c: any) => c.seq);
  const sent = calls.find(
    (c: any) =>
      c.status < 400 &&
      (c.mutations || []).some(
        (m: any) =>
          m.kind === 'mail_message' &&
          m.id === message.message_id &&
          m.after?.message_state === 2 &&
          m.before?.message_state === 3,
      ),
  );
  return !!sent && reads.some((seq: number) => seq < sent.seq);
};
const mailChecks = (expected.mail || []).map((rule) => {
  const match = sentMail.find(
    (m: any) =>
      !consumedMail.has(m.message_id) &&
      mailSourceProof(m, rule) &&
      (!rule.attachments ||
        ((m.attachments || []).length === rule.attachments.length &&
          rule.attachments.every((want) =>
            (m.attachments || []).some(
              (got: any) =>
                got.filename === want.filename &&
                want.content_types.includes(got.content_type) &&
                typeof got.content_base64 === 'string' &&
                createHash('sha256')
                  .update(Buffer.from(got.content_base64, 'base64'))
                  .digest('hex') === want.sha256,
            ),
          ))) &&
      isDeepStrictEqual(
        (m.to || []).map((a: any) => a.mail_address.toLowerCase()).sort(),
        rule.to.map((a) => a.toLowerCase()).sort(),
      ) &&
      !(m.cc || []).length &&
      !(m.bcc || []).length &&
      (rule.subject === undefined || m.subject === rule.subject) &&
      (rule.subject_contains || []).every((term) =>
        supportContains(m.subject, term),
      ) &&
      (rule.body_contains || []).every((term) =>
        supportContains(
          Buffer.from(m.body_plain_text || '', 'base64url').toString('utf8'),
          term,
        ),
      ) &&
      calls.some(
        (call: any) =>
          call.status < 400 &&
          (call.mutations || []).some(
            (mutation: any) =>
              mutation.kind === 'mail_message' &&
              mutation.id === m.message_id &&
              mutation.after?.message_state === 2 &&
              mutation.before?.message_state === 3,
          ),
      ),
  );
  if (match) consumedMail.add(match.message_id);
  return { ...rule, message_id: match?.message_id, passed: !!match };
});
const protectedWorld = structuredClone(world);
if (expected.mail && protectedWorld.mail)
  protectedWorld.mail.messages = protectedWorld.mail.messages.filter(
    (m: any) => !consumedMail.has(m.message_id),
  );

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
  if (after) {
    if (Object.hasOwn(before.fields, check.field))
      after.fields[check.field] = before.fields[check.field];
    else delete after.fields[check.field];
  }
}
const sheetsFor = (
  state: typeof world,
  cell: { spreadsheet_token?: string },
) =>
  cell.spreadsheet_token
    ? state.spreadsheets[cell.spreadsheet_token].sheets
    : state.sheets;
const numericCellEqual = (actual: unknown, expected: string | number) => {
  const parse = (value: unknown): number | undefined => {
    if (typeof value === 'number')
      return Number.isFinite(value) ? value : undefined;
    if (typeof value !== 'string') return undefined;
    const raw = value
      .trim()
      .replace(/^[$€£¥₹]/, '')
      .replace(/,/g, '');
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw))
      return undefined;
    const number = Number(raw);
    return Number.isFinite(number) ? number : undefined;
  };
  const left = parse(actual),
    right = parse(expected);
  return left !== undefined && right !== undefined && left === right;
};
const cellChecks = (expected.cells || []).map((c) => ({
  ...c,
  passed: c.numeric_equivalent
    ? numericCellEqual(
        sheetsFor(world, c)[c.sheet_id]?.values[c.row]?.[c.column],
        c.value,
      )
    : c.one_of
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
      if (
        group.sent_mail_only &&
        !(
          mutation.before?.message_state === 3 &&
          mutation.after?.message_state === 2
        )
      )
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
          const text = decodedMessageText(mutation.after.body.content);
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
          const text = decodedMessageText(mutation.after.body.content);
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
                      const text = decodedMessageText(item.after.body.content);
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
        mutation.after.chat_id === rule.chat_id &&
        (() => {
          try {
            const text = decodedMessageText(mutation.after.body.content);
            return (rule.message_contains || []).every(
              (part) => typeof text === 'string' && text.includes(part),
            );
          } catch {
            return false;
          }
        })()
      ) {
        checkpoints.push({
          seq: call.seq,
          passed: rule.records.every((record) =>
            record.record_id
              ? Object.entries(record.contains || {}).every(([key, parts]) =>
                  parts.every((part) =>
                    String(
                      current.get(record.record_id!)?.[key] || '',
                    ).includes(part),
                  ),
                ) &&
                Object.entries(record.equals).every(([key, value]) =>
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
const readBeforeUpdateChecks = (expected.read_before_updates || []).map(
  (rule) => {
    const sourceMail = seed.mail?.messages.find(
      (m: any) => m.message_id === rule.source_message_id,
    );
    const source = seed.messages.find(
      (m: any) => m.message_id === rule.source_message_id,
    );
    const text = (m: any): unknown => {
      try {
        return decodedMessageText(m?.body?.content);
      } catch {
        return undefined;
      }
    };
    const sourceText = text(source);
    const walk = (value: any, predicate: (object: any) => boolean): boolean =>
      value !== null &&
      typeof value === 'object' &&
      (predicate(value) ||
        Object.values(value).some((child) => walk(child, predicate)));
    const messageReads: number[] = [],
      recordReads: number[] = [];
    for (const call of calls) {
      if (
        call.status >= 400 ||
        !['GET', 'POST'].includes(call.method) ||
        (call.mutations || []).length
      )
        continue;
      if (
        walk(call.response, (obj: any) =>
          sourceMail
            ? (obj.message_id === rule.source_message_id ||
                obj.message_biz_id === rule.source_message_id) &&
              (obj.subject === sourceMail.subject ||
                obj.title === sourceMail.subject) &&
              obj.body_plain_text === sourceMail.body_plain_text
            : typeof sourceText === 'string' &&
              obj.message_id === rule.source_message_id &&
              text(obj) === sourceText,
        )
      )
        messageReads.push(call.seq);
      if (
        walk(call.response, (obj: any) => {
          let fields: any;
          if (
            obj.record_id === rule.record_id &&
            obj.fields &&
            !Array.isArray(obj.fields)
          )
            fields = obj.fields;
          else if (
            Array.isArray(obj.record_id_list) &&
            Array.isArray(obj.fields) &&
            Array.isArray(obj.data)
          ) {
            const i = obj.record_id_list.indexOf(rule.record_id);
            if (i >= 0 && Array.isArray(obj.data[i]))
              fields = Object.fromEntries(
                obj.fields.map((key: string, j: number) => [
                  key,
                  obj.data[i][j],
                ]),
              );
          }
          return (
            fields &&
            Object.entries(rule.identity).every(([key, value]) =>
              isDeepStrictEqual(fields[key], value),
            )
          );
        })
      )
        recordReads.push(call.seq);
    }
    const checkpoints = calls
      .filter(
        (call: any) =>
          call.status < 400 &&
          (call.mutations || []).some(
            (m: any) =>
              m.kind === 'record' &&
              m.id === rule.record_id &&
              m.after &&
              !isDeepStrictEqual(
                m.before?.fields?.[rule.field],
                m.after.fields?.[rule.field],
              ),
          ),
      )
      .map((call: any) => ({
        seq: call.seq,
        passed:
          rule.require_record_read === false
            ? messageReads.some((messageSeq) => messageSeq < call.seq)
            : recordReads.some(
                (recordSeq) =>
                  recordSeq < call.seq &&
                  messageReads.some(
                    (messageSeq) =>
                      messageSeq <
                      (rule.record_after_source === false
                        ? call.seq
                        : recordSeq),
                  ),
              ),
      }));
    return {
      rule,
      messageReads,
      recordReads,
      checkpoints,
      passed: checkpoints.length > 0 && checkpoints.every((x: any) => x.passed),
    };
  },
);

const readBeforeCreateChecks = (expected.read_before_creates || []).map(
  (rule) => {
    const sourceMail = seed.mail?.messages.find(
      (m: any) => m.message_id === rule.source_message_id,
    );
    const source = seed.messages.find(
      (m: any) => m.message_id === rule.source_message_id,
    );
    const text = (m: any): unknown => {
      try {
        return decodedMessageText(m?.body?.content);
      } catch {
        return undefined;
      }
    };
    const sourceText = text(source);
    const walk = (value: any): boolean =>
      value !== null &&
      typeof value === 'object' &&
      ((sourceMail &&
        (value.message_id === rule.source_message_id ||
          value.message_biz_id === rule.source_message_id) &&
        (value.subject === sourceMail.subject ||
          value.title === sourceMail.subject) &&
        value.body_plain_text === sourceMail.body_plain_text) ||
        (!sourceMail &&
          value.message_id === rule.source_message_id &&
          typeof sourceText === 'string' &&
          text(value) === sourceText) ||
        Object.values(value).some(walk));
    const reads = calls
      .filter(
        (call: any) =>
          call.status < 400 &&
          ['GET', 'POST'].includes(call.method) &&
          !(call.mutations || []).length &&
          walk(call.response),
      )
      .map((call: any) => call.seq);
    const created = world.base.records.filter(
      (record: any) =>
        record.record_id === creationChecks[rule.create_index]?.record_id,
    );
    const checkpoints = created.map((record: any) => {
      const call = calls.find(
        (call: any) =>
          call.status < 400 &&
          (call.mutations || []).some(
            (m: any) =>
              m.kind === 'record' &&
              m.id === record.record_id &&
              !m.before &&
              m.after,
          ),
      );
      return {
        record_id: record.record_id,
        seq: call?.seq,
        passed: !!call && reads.some((seq: number) => seq < call.seq),
      };
    });
    return {
      rule,
      reads,
      checkpoints,
      passed: checkpoints.length > 0 && checkpoints.every((x: any) => x.passed),
    };
  },
);
const readRecordsBeforeCreateChecks = (
  expected.read_records_before_creates || []
).map((rule) => {
  const matches = (obj: any) => {
    let fields: any;
    if (
      obj.record_id === rule.record_id &&
      obj.fields &&
      !Array.isArray(obj.fields)
    )
      fields = obj.fields;
    else if (
      Array.isArray(obj.record_id_list) &&
      Array.isArray(obj.fields) &&
      Array.isArray(obj.data)
    ) {
      const i = obj.record_id_list.indexOf(rule.record_id);
      if (i >= 0 && Array.isArray(obj.data[i]))
        fields = Object.fromEntries(
          obj.fields.map((key: string, j: number) => [key, obj.data[i][j]]),
        );
    }
    return (
      fields &&
      Object.entries(rule.identity).every(([key, value]) =>
        isDeepStrictEqual(fields[key], value),
      )
    );
  };
  const walk = (value: any): boolean =>
    value !== null &&
    typeof value === 'object' &&
    (matches(value) || Object.values(value).some(walk));
  const reads = calls
    .filter(
      (call: any) =>
        call.status < 400 &&
        ['GET', 'POST'].includes(call.method) &&
        !(call.mutations || []).length &&
        walk(call.response),
    )
    .map((call: any) => call.seq);
  const desired = expected.creates[rule.create_index];
  const created = world.base.records.filter(
    (record: any) =>
      !originalIds.has(record.record_id) &&
      desired &&
      Object.entries(desired).every(([key, value]) =>
        isDeepStrictEqual(record.fields[key], value),
      ),
  );
  const checkpoints = created.map((record: any) => {
    const call = calls.find(
      (call: any) =>
        call.status < 400 &&
        (call.mutations || []).some(
          (m: any) =>
            m.kind === 'record' &&
            m.id === record.record_id &&
            !m.before &&
            m.after,
        ),
    );
    return {
      record_id: record.record_id,
      seq: call?.seq,
      passed: !!call && reads.some((seq: number) => seq < call.seq),
    };
  });
  return {
    rule,
    reads,
    checkpoints,
    passed: checkpoints.length > 0 && checkpoints.every((x: any) => x.passed),
  };
});
const readRecordsBeforeUpdateChecks = (
  expected.read_records_before_updates || []
).map((rule) => {
  const matches = (obj: any) => {
    let fields: any;
    if (
      obj.record_id === rule.source_record_id &&
      obj.fields &&
      !Array.isArray(obj.fields)
    )
      fields = obj.fields;
    else if (
      Array.isArray(obj.record_id_list) &&
      Array.isArray(obj.fields) &&
      Array.isArray(obj.data)
    ) {
      const i = obj.record_id_list.indexOf(rule.source_record_id);
      if (i >= 0 && Array.isArray(obj.data[i]))
        fields = Object.fromEntries(
          obj.fields.map((key: string, j: number) => [key, obj.data[i][j]]),
        );
    }
    return (
      fields &&
      Object.entries(rule.identity).every(([key, value]) =>
        isDeepStrictEqual(fields[key], value),
      )
    );
  };
  const walk = (value: any): boolean =>
    value !== null &&
    typeof value === 'object' &&
    (matches(value) || Object.values(value).some(walk));
  const reads = calls
    .filter(
      (call: any) =>
        call.status < 400 &&
        ['GET', 'POST'].includes(call.method) &&
        !(call.mutations || []).length &&
        walk(call.response),
    )
    .map((call: any) => call.seq);
  const checkpoints = calls
    .filter(
      (call: any) =>
        call.status < 400 &&
        (call.mutations || []).some(
          (m: any) =>
            m.kind === 'record' &&
            m.id === rule.record_id &&
            m.after &&
            !isDeepStrictEqual(
              m.before?.fields?.[rule.field],
              m.after.fields?.[rule.field],
            ),
        ),
    )
    .map((call: any) => ({
      seq: call.seq,
      passed: reads.some((seq: number) => seq < call.seq),
    }));
  return {
    rule,
    reads,
    checkpoints,
    passed: checkpoints.length > 0 && checkpoints.every((x: any) => x.passed),
  };
});
function mailCheckpointNumber(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value)
    .trim()
    .replace(/^([+-]?)\./, (_, sign) => sign + '0.');
  if (!Number.isFinite(Number(text))) return null;
  const match = /^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(text);
  if (!match) return null;
  let digits = (match[2] + (match[3] || '')).replace(/^0+/, '');
  if (!digits) return '0';
  const trailing = digits.length - digits.replace(/0+$/, '').length;
  digits = digits.replace(/0+$/, '');
  const exponent =
    BigInt(match[4] || '0') -
    BigInt((match[3] || '').length) +
    BigInt(trailing);
  return `${match[1] === '-' ? '-' : ''}${digits}e${exponent}`;
}
const cellsBeforeMailChecks = (expected.cells_before_mail || []).map((rule) => {
  const state = structuredClone(seed);
  const checkpoints: any[] = [];
  for (const call of calls) {
    if (call.status >= 400) continue;
    for (const mutation of call.mutations || [])
      if (
        mutation.kind === 'mail_message' &&
        mutation.before?.message_state === 3 &&
        mutation.after?.message_state === 2 &&
        mutation.after.to.some(
          (a: any) => a.mail_address.toLowerCase() === rule.to.toLowerCase(),
        )
      ) {
        const cells = rule.cells.map((cell: any) => {
          const actual = sheetsFor(state, cell)[cell.sheet_id]?.values[
            cell.row
          ]?.[cell.column];
          return {
            ...cell,
            passed: cell.numeric_equivalent
              ? mailCheckpointNumber(actual) !== null &&
                mailCheckpointNumber(actual) ===
                  mailCheckpointNumber(cell.value)
              : isDeepStrictEqual(actual, cell.value),
          };
        });
        checkpoints.push({
          seq: call.seq,
          cells,
          passed: cells.every((c: any) => c.passed),
        });
      }
    for (const mutation of call.mutations || []) {
      if (mutation.kind === 'sheet') {
        if (mutation.after)
          state.sheets[mutation.id] = structuredClone(mutation.after);
        else delete state.sheets[mutation.id];
      }
      if (mutation.kind === 'spreadsheet') {
        state.spreadsheets ||= {};
        if (mutation.after)
          state.spreadsheets[mutation.id] = structuredClone(mutation.after);
        else delete state.spreadsheets[mutation.id];
      }
    }
  }
  return {
    rule,
    checkpoints,
    passed: checkpoints.length > 0 && checkpoints.every((c) => c.passed),
  };
});
const covered = !calls.some((c: { status: number }) => c.status === 501);
const success =
  cellsBeforeMailChecks.every((c) => c.passed) &&
  mailChecks.every((c) => c.passed) &&
  sentMail.length === consumedMail.size &&
  readRecordsBeforeUpdateChecks.every((check) => check.passed) &&
  readRecordsBeforeCreateChecks.every((check) => check.passed) &&
  readBeforeCreateChecks.every((check) => check.passed) &&
  readBeforeUpdateChecks.every((check) => check.passed) &&
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
  semantic.literalMessageChecks.every((c) => c.passed) &&
  semantic.recordGroupChecks.every((c) => c.passed) &&
  semantic.literalCellChecks.every((c) => c.passed) &&
  forbiddenMessageChecks.every((c) => c.passed) &&
  forbiddenRecordChecks.every((c) => c.passed) &&
  deletionChecks.every((c) => c.passed) &&
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
      readRecordsBeforeUpdateChecks,
      readRecordsBeforeCreateChecks,
      readBeforeCreateChecks,
      readBeforeUpdateChecks,
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
      mailChecks,
      forbiddenMessageChecks,
      forbiddenRecordChecks,
      cellChecks,
      cellsBeforeMailChecks,
      eventChecks,
      eventSourceChecks: (expected.events || []).flatMap((check) =>
        check.source_message_id
          ? newEvents.map((event: any) =>
              eventSourceProof(event, check.source_message_id!),
            )
          : [],
      ),
      eventHostChecks: (expected.events || []).flatMap((check) =>
        check.host_user_email
          ? newEvents.map((event: any) =>
              eventHostProof(event, check.host_user_email!),
            )
          : [],
      ),
      eventStateBeforeCreateChecks,
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
