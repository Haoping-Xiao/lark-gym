import { existsSync, readFileSync } from 'node:fs';

type Json = Record<string, any>;
export function prepareSemantic(expected: Json, world: Json, configPath: URL) {
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
