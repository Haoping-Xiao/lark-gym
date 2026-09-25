import { existsSync, readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

type Json = Record<string, any>;
// Text-backed JSON keeps its field type while comparing the represented value.
function sameJsonText(
  actual: unknown,
  expected: unknown,
  mode: string,
): boolean {
  if (typeof actual !== 'string' || typeof expected !== 'string') return false;
  try {
    const a = JSON.parse(actual),
      b = JSON.parse(expected);
    if (mode === 'string_set') {
      const tags = (value: unknown): value is string[] =>
        Array.isArray(value) &&
        value.every((v) => typeof v === 'string') &&
        new Set(value).size === value.length;
      return (
        tags(a) && tags(b) && isDeepStrictEqual([...a].sort(), [...b].sort())
      );
    }
    return mode === 'structure' && isDeepStrictEqual(a, b);
  } catch {
    return false;
  }
}
export function prepareSemantic(
  expected: Json,
  world: Json,
  configPath: URL,
  seed?: Json,
) {
  const config = existsSync(configPath)
    ? JSON.parse(readFileSync(configPath, 'utf8'))
    : { enabled: false };
  const original = structuredClone(expected);
  if (!config.enabled)
    return { required: false, original, deferred: [] as string[] };
  const fields = new Set<string>(
    config.text_fields.map((field: string) => field.toLowerCase()),
  );
  const literalFields = new Set<string>(config.literal_fields || []);
  const semanticField = (field: string) =>
    !config.json_text_fields?.[field] &&
    !literalFields.has(field) &&
    (fields.has(field.toLowerCase()) ||
      /_(memo|notes?|reason|description)$/i.test(field));
  const deferred: string[] = [];
  const semanticCell = (cell: Json) =>
    cell.contains?.length ||
    (typeof cell.value === 'string' && cell.value.length > 80) ||
    (config.semantic_cell_columns || []).some(
      (rule: Json) =>
        rule.spreadsheet_token === cell.spreadsheet_token &&
        rule.sheet_id === cell.sheet_id &&
        rule.columns.includes(cell.column),
    );
  const literalMessageTerms = new Map(
    (expected.messages || []).map((m: Json, i: number) => [
      m,
      config.literal_message_terms?.[String(i)] || [],
    ]),
  );
  // Only reviewed recipients may vary message count. Other recipients retain
  // their original per-message checks, including indexed literal requirements.
  if (seed && config.message_count === 'per_recipient') {
    const old = new Set(seed.messages.map((m: Json) => m.message_id));
    const sent = world.messages.filter((m: Json) => !old.has(m.message_id));
    const scope: string[] | undefined = config.message_count_chats;
    if (scope) original.message_count_chats = scope;
    const visited = new Set<string>();
    expected.messages = (expected.messages || []).flatMap((message: Json) => {
      const chat_id = message.chat_id;
      if (scope && !scope.includes(chat_id)) return [message];
      if (visited.has(chat_id)) return [];
      visited.add(chat_id);
      return Array.from(
        {
          length: Math.max(
            1,
            sent.filter((m: Json) => m.chat_id === chat_id).length,
          ),
        },
        () => ({ chat_id, contains: [] }),
      );
    });
    deferred.push('messages.per_recipient_completeness_and_no_redundancy');
  }
  if (seed && config.unordered_new_rows) {
    const groups = new Map<string, Json[]>();
    for (const cell of expected.cells || []) {
      const key = JSON.stringify([
        cell.spreadsheet_token,
        cell.sheet_id,
        cell.row,
      ]);
      groups.set(key, [...(groups.get(key) || []), cell]);
    }
    const used = new Set<string>();
    for (const cells of groups.values()) {
      const first = cells[0];
      const sheet = (state: Json) =>
        (first.spreadsheet_token
          ? state.spreadsheets?.[first.spreadsheet_token]?.sheets
          : state.sheets)?.[first.sheet_id]?.values || [];
      const before = sheet(seed),
        after = sheet(world);
      const empty = (row: any[]) =>
        !row || row.every((v) => v === '' || v === null);
      if (!empty(before[first.row])) continue; // Existing records keep their identity.
      const row = after.findIndex((values: any[], index: number) => {
        const key = JSON.stringify([
          first.spreadsheet_token,
          first.sheet_id,
          index,
        ]);
        return (
          empty(before[index]) &&
          !used.has(key) &&
          cells.every((c) =>
            semanticCell(c)
              ? true
              : c.one_of
                ? c.one_of.some((v: any) =>
                    isDeepStrictEqual(values[c.column], v),
                  )
                : isDeepStrictEqual(values[c.column], c.value),
          )
        );
      });
      if (row >= 0) {
        used.add(
          JSON.stringify([first.spreadsheet_token, first.sheet_id, row]),
        );
        for (const cell of cells) cell.row = row;
      }
    }
  }
  for (const [i, message] of (expected.messages || []).entries()) {
    if (message.contains?.length) {
      message.contains = literalMessageTerms.get(message) || [];
      deferred.push(`messages[${i}].content`);
    }
  }
  // Recipient-level literal requirements apply to every actual output, including
  // each member of an expanded report. Keep them after semantic text removal.
  for (const message of expected.messages || []) {
    const terms =
      config.literal_terms_per_message_chat?.[message.chat_id] || [];
    message.contains = [...new Set([...(message.contains || []), ...terms])];
  }
  // Only reviewed optional deliveries may be absent; present messages retain
  // their original count, recipient and content checks.
  if (seed && config.optional_message_chats?.length) {
    const old = new Set(seed.messages.map((m: Json) => m.message_id));
    const recipients = new Set(
      world.messages
        .filter((m: Json) => !old.has(m.message_id))
        .map((m: Json) => m.chat_id),
    );
    original.optional_message_chats = config.optional_message_chats;
    expected.messages = (expected.messages || []).filter((message: Json) => {
      if (!config.optional_message_chats.includes(message.chat_id)) return true;
      deferred.push(
        `messages.optional_delivery[${message.chat_id}].check_content_if_present`,
      );
      return recipients.has(message.chat_id);
    });
  }
  // Reviewed, optional follow-up requests are graded for purpose, not an
  // invented fixed count. Required deliveries and all other recipients remain strict.
  if (seed && config.optional_requests?.length) {
    original.optional_requests = config.optional_requests;
    const old = new Set(seed.messages.map((m: Json) => m.message_id));
    const allowed = new Set(
      config.optional_requests.map((rule: Json) => rule.chat_id),
    );
    const requests = world.messages.filter(
      (m: Json) => !old.has(m.message_id) && allowed.has(m.chat_id),
    );
    expected.messages = [
      ...(expected.messages || []),
      ...requests.map((m: Json) => ({ chat_id: m.chat_id, contains: [] })),
    ];
    if (requests.length)
      deferred.push(
        'messages.optional_requests.business_scope_and_no_redundancy',
      );
  }
  for (const key of ['forbidden_messages', 'forbidden_records']) {
    expected[key] = (expected[key] || []).filter((check: Json, i: number) => {
      const hasContent = Array.isArray(check.contains)
        ? check.contains.length > 0
        : Object.keys(check.contains || {}).length > 0;
      if (hasContent) deferred.push(`${key}[${i}].meaning`);
      return !hasContent;
    });
  }
  for (const check of expected.updates || []) {
    const mode = config.json_text_fields?.[check.field];
    if (!mode || check.mode !== 'equals') continue;
    const actual = world.base.records.find(
      (r: Json) => r.record_id === check.record_id,
    )?.fields[check.field];
    if (sameJsonText(actual, check.value, mode)) check.value = actual;
  }
  for (const record of expected.creates || []) {
    const keys = Object.keys(record).filter(
      (key) => config.json_text_fields?.[key],
    );
    if (!keys.length) continue;
    const actual = world.base.records.find(
      (r: Json) =>
        !seed?.base?.records.some(
          (old: Json) => old.record_id === r.record_id,
        ) &&
        Object.entries(record).every(([key, value]) =>
          config.json_text_fields?.[key]
            ? sameJsonText(r.fields[key], value, config.json_text_fields[key])
            : semanticField(key) || isDeepStrictEqual(r.fields[key], value),
        ),
    );
    if (actual) for (const key of keys) record[key] = actual.fields[key];
  }
  for (const [i, record] of (expected.creates || []).entries()) {
    for (const key of Object.keys(record))
      if (semanticField(key) && typeof record[key] === 'string') {
        delete record[key];
        deferred.push(`creates[${i}].${key}`);
      }
  }
  for (const [i, check] of (expected.updates || []).entries())
    if (semanticField(check.field) && typeof check.value === 'string') {
      check.value = world.base.records.find(
        (r: Json) => r.record_id === check.record_id,
      )?.fields[check.field];
      check.mode = 'equals';
      delete check.contains;
      delete check.forbidden;
      deferred.push(`updates[${i}].${check.field}`);
    }
  for (const [i, check] of (expected.cells || []).entries()) {
    if (semanticCell(check)) {
      check.value = (
        check.spreadsheet_token
          ? world.spreadsheets?.[check.spreadsheet_token]?.sheets
          : world.sheets
      )?.[check.sheet_id]?.values[check.row]?.[check.column];
      delete check.contains;
      delete check.one_of;
      deferred.push(`cells[${i}].content`);
    }
  }
  return { required: deferred.length > 0, original, deferred };
}
