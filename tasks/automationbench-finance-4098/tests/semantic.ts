import { existsSync, readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

type Json = Record<string, any>;
// Reviewed USD result columns only. Compare cents exactly, never via floats.
function usdCents(value: unknown): bigint | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (typeof value === 'number' && !Number.isFinite(value)) return null;
  const match = /^(-?)(?:\$)?(\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d+))?$/.exec(
    String(value).trim(),
  );
  if (!match || /[1-9]/.test((match[3] || '').slice(2))) return null;
  return (
    (BigInt(match[2].replaceAll(',', '')) * 100n +
      BigInt((match[3] || '').slice(0, 2).padEnd(2, '0'))) *
    (match[1] ? -1n : 1n)
  );
}
// Reviewed derived ratios only; normalize decimal notation without float rounding.
function decimalValue(value: unknown): string | null {
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
// Strict RFC3339 calendar validation; Date.parse alone normalizes bad dates.
function instant(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const m =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  if (!m) return null;
  const [year, month, day, hour, minute, second] = m.slice(1, 7).map(Number);
  if (hour > 23 || minute > 59 || second > 59) return null;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  const zone = m[8];
  const fraction = (m[7] || '').replace(/0+$/, '');
  if (zone === 'Z') return `${date.getTime()}:${fraction}`;
  const h = Number(zone.slice(1, 3)),
    min = Number(zone.slice(4));
  if (h > 23 || min > 59) return null;
  return `${date.getTime() - (zone[0] === '+' ? 1 : -1) * (h * 60 + min) * 60000}:${fraction}`;
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
    !config.instant_fields?.includes(field) &&
    !config.schedule_fields?.includes(field) &&
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
  const derivedCellEqual = (check: Json, actual: unknown): boolean | null => {
    if (check.contains || check.one_of) return null;
    for (const [key, parse] of [
      ['usd_result_columns', usdCents],
      ['numeric_result_columns', decimalValue],
    ] as const) {
      const rule = (config[key] || []).find(
        (rule: Json) =>
          rule.spreadsheet_token === check.spreadsheet_token &&
          rule.sheet_id === check.sheet_id &&
          rule.columns.includes(check.column),
      );
      if (rule) {
        const value = parse(check.value),
          actualValue = parse(actual);
        if (value === null || value !== actualValue) return false;
        if (key === 'usd_result_columns' && rule.require_grouping) {
          if (typeof actual !== 'string') return false;
          const cents = usdCents(actual)!;
          if ((cents >= 100000n || cents <= -100000n) && !actual.includes(','))
            return false;
        }
        return true;
      }
    }
    return null;
  };
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
          cells.every(
            (c) =>
              derivedCellEqual(c, values[c.column]) ??
              (semanticCell(c)
                ? true
                : c.one_of
                  ? c.one_of.some((v: any) =>
                      isDeepStrictEqual(values[c.column], v),
                    )
                  : isDeepStrictEqual(values[c.column], c.value)),
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
  const reviewedField = (key: string) =>
    config.json_text_fields?.[key] ||
    config.instant_fields?.includes(key) ||
    config.schedule_fields?.includes(key);
  const sameReviewedField = (key: string, actual: unknown, value: unknown) => {
    if (config.schedule_fields?.includes(key)) return instant(actual) !== null;
    if (config.instant_fields?.includes(key)) {
      const expectedTime = instant(value);
      return expectedTime !== null && instant(actual) === expectedTime;
    }
    return sameJsonText(actual, value, config.json_text_fields[key]);
  };
  for (const check of expected.updates || []) {
    const mode = reviewedField(check.field);
    if (config.schedule_fields?.includes(check.field))
      deferred.push('updates.schedule_window');
    if (!mode || check.mode !== 'equals') continue;
    const actual = world.base.records.find(
      (r: Json) => r.record_id === check.record_id,
    )?.fields[check.field];
    if (sameReviewedField(check.field, actual, check.value))
      check.value = actual;
  }
  for (const [index, record] of (expected.creates || []).entries()) {
    const options = config.creation_one_of?.[String(index)] || {};
    const keys = Object.keys(record).filter(
      (key) => reviewedField(key) || options[key],
    );
    if (!keys.length) continue;
    if (keys.some((key) => config.schedule_fields?.includes(key)))
      deferred.push('creates.schedule_window');
    const actual = world.base.records.find(
      (r: Json) =>
        !seed?.base?.records.some(
          (old: Json) => old.record_id === r.record_id,
        ) &&
        Object.entries(record).every(([key, value]) =>
          options[key]
            ? options[key].some((candidate: unknown) =>
                isDeepStrictEqual(r.fields[key], candidate),
              )
            : reviewedField(key)
              ? sameReviewedField(key, r.fields[key], value)
              : semanticField(key) || isDeepStrictEqual(r.fields[key], value),
        ),
    );
    if (actual) for (const key of keys) record[key] = actual.fields[key];
  }
  for (const [i, record] of (expected.creates || []).entries()) {
    for (const key of Object.keys(record))
      if (semanticField(key) && typeof record[key] === 'string') {
        const terms = config.literal_creation_terms?.[String(i)]?.[key];
        if (terms?.length) {
          expected.creation_contains ||= {};
          expected.creation_contains[String(i)] ||= {};
          expected.creation_contains[String(i)][key] = terms;
        } else delete record[key];
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
    const actual = (
      check.spreadsheet_token
        ? world.spreadsheets?.[check.spreadsheet_token]?.sheets
        : world.sheets
    )?.[check.sheet_id]?.values[check.row]?.[check.column];
    const equivalent = derivedCellEqual(check, actual);
    if (equivalent !== null) {
      if (equivalent) check.value = actual;
      continue; // Reviewed numbers never fall back to semantic text.
    }
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
