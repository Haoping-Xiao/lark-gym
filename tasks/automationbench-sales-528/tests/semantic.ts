import { existsSync, readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

type Json = Record<string, any>;
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
    !literalFields.has(field) &&
    (fields.has(field.toLowerCase()) ||
      /_(memo|notes?|reason|description)$/i.test(field));
  const deferred: string[] = [];
  // Opt-in policies follow task review; explicit message counts remain strict.
  if (seed && config.message_count === 'per_recipient') {
    const old = new Set(seed.messages.map((m: Json) => m.message_id));
    const sent = world.messages.filter((m: Json) => !old.has(m.message_id));
    const recipients = [
      ...new Set<string>((expected.messages || []).map((m: Json) => m.chat_id)),
    ];
    expected.messages = recipients.flatMap((chat_id) =>
      Array.from(
        {
          length: Math.max(
            1,
            sent.filter((m: Json) => m.chat_id === chat_id).length,
          ),
        },
        () => ({ chat_id, contains: [] }),
      ),
    );
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
            c.contains?.length ||
            (typeof c.value === 'string' && c.value.length > 80)
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
      message.contains = config.literal_message_terms?.[String(i)] || [];
      deferred.push(`messages[${i}].content`);
    }
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
    if (
      check.contains?.length ||
      (typeof check.value === 'string' && check.value.length > 80)
    ) {
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
