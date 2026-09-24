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
// Reviewed UTC clock results only; keep source times and other cells literal.
function utcClockSeconds(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const m =
    /^(\d{1,2})(?::([0-5]\d)(?::([0-5]\d))?)?\s*(AM|PM)?(?:\s*(UTC|Z|\+00:00))?$/i.exec(
      value.trim(),
    );
  if (!m || (!m[2] && !m[4])) return null;
  let hour = Number(m[1]);
  if (m[4]) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (m[4].toUpperCase() === 'PM' ? 12 : 0);
  } else if (hour > 23) return null;
  return hour * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
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
    return {
      required: false,
      creationContainsCaseInsensitive: false,
      original,
      deferred: [] as string[],
      literalMessageChecks: [] as Json[],
      recordGroupChecks: [] as Json[],
      literalCellChecks: [] as Json[],
    };
  const fields = new Set<string>(
    config.text_fields.map((field: string) => field.toLowerCase()),
  );
  const literalFields = new Set<string>(config.literal_fields || []);
  const semanticField = (field: string) =>
    !config.instant_fields?.includes(field) &&
    !config.schedule_fields?.includes(field) &&
    !config.json_text_fields?.[field] &&
    !config.usd_text_fields?.includes(field) &&
    !literalFields.has(field) &&
    (fields.has(field.toLowerCase()) ||
      /_(memo|notes?|reason|description)$/i.test(field));
  const deferred: string[] = [];
  if (config.source_read_before_create?.length) {
    original.source_read_before_create = structuredClone(
      config.source_read_before_create,
    );
    deferred.push('workflow.source_read_before_create');
  }
  // Optional, source-supported enrichment is reviewed independently. Actual
  // values only unmask these edits from the unchanged-state guard; they are
  // never promoted into the judge's required reference facts.
  if (seed && config.optional_record_edits?.length) {
    original.optional_record_edits = structuredClone(
      config.optional_record_edits,
    );
    for (const rule of config.optional_record_edits) {
      const before = seed.base.records.find(
        (r: Json) => r.record_id === rule.record_id,
      );
      const after = world.base.records.find(
        (r: Json) => r.record_id === rule.record_id,
      );
      if (!before || !after) continue;
      for (const field of rule.fields) {
        const value = after.fields[field];
        if (
          isDeepStrictEqual(value, before.fields[field]) ||
          typeof value !== 'string' ||
          !value.trim() ||
          expected.updates.some(
            (u: Json) => u.record_id === rule.record_id && u.field === field,
          )
        )
          continue;
        expected.updates.push({
          record_id: rule.record_id,
          field,
          value,
          mode: 'equals',
        });
        deferred.push(
          `optional_record_edits.source_supported_enrichment:${rule.record_id}.${field}`,
        );
      }
    }
  }
  const recordGroupChecks: Json[] = [];
  if (seed && config.optional_cell_edits?.length) {
    original.optional_cell_edits = structuredClone(config.optional_cell_edits);
    for (const rule of config.optional_cell_edits) {
      const read = (state: Json) =>
        (rule.spreadsheet_token
          ? state.spreadsheets?.[rule.spreadsheet_token]?.sheets
          : state.sheets)?.[rule.sheet_id]?.values?.[rule.row]?.[rule.column];
      const before = read(seed),
        value = read(world);
      if (
        before === undefined ||
        isDeepStrictEqual(before, value) ||
        typeof value !== 'string' ||
        !value.trim() ||
        (expected.cells || []).some(
          (c: Json) =>
            c.spreadsheet_token === rule.spreadsheet_token &&
            c.sheet_id === rule.sheet_id &&
            c.row === rule.row &&
            c.column === rule.column,
        )
      )
        continue;
      expected.cells ||= [];
      // The value only exempts this cell from the unchanged-state guard.
      // Its truth must be established from source evidence by the judge.
      const { literal_terms, ...cell } = rule;
      if (literal_terms?.length)
        recordGroupChecks.push({
          kind: 'optional_cell_source_literals',
          ...cell,
          passed: literal_terms.every((term: string) => value.includes(term)),
        });
      expected.cells.push({ ...cell, value });
      deferred.push('optional_cell_edits.source_supported_correction');
    }
  }
  // Reviewed payment policies constrain the group, not a reference split.
  if (seed && config.payment_split_groups?.length) {
    original.payment_split_groups = structuredClone(
      config.payment_split_groups,
    );
    const oldIds = new Set(seed.base.records.map((r: Json) => r.record_id));
    for (const rule of config.payment_split_groups) {
      const matches = (fields: Json) =>
        Object.entries(rule.fields).every(([key, value]) =>
          isDeepStrictEqual(fields[key], value),
        );
      const actual = world.base.records.filter(
        (r: Json) => !oldIds.has(r.record_id) && matches(r.fields),
      );
      const references = (expected.creates || []).filter(matches);
      const values = actual.map((r: Json) => r.fields[rule.amount_field]);
      let passed =
        actual.length === rule.count &&
        references.length === rule.count &&
        values.every(
          (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0,
        );
      if (passed) {
        // Align finite decimal representations exactly; avoid binary float sums.
        const parts = [...values, rule.total, rule.maximum].map((v: number) => {
          const [digits, exponent = '0'] = decimalValue(v)!.split('e');
          return { digits: BigInt(digits), exponent: Number(exponent) };
        });
        const exponent = Math.min(...parts.map((p) => p.exponent));
        const units = parts.map(
          (p) => p.digits * 10n ** BigInt(p.exponent - exponent),
        );
        const maximum = units.pop()!,
          total = units.pop()!;
        passed =
          units.every((v) => v <= maximum) &&
          units.reduce((a, b) => a + b, 0n) === total;
      }
      recordGroupChecks.push({
        kind: 'payment_split',
        fields: rule.fields,
        passed,
      });
      if (passed)
        references.forEach((r: Json, i: number) => {
          r[rule.amount_field] = values[i];
        });
    }
    deferred.push('creates.payment_split.notifications_match_actual');
  }
  if (config.event_utc_date_windows?.length) {
    original.event_utc_date_windows = structuredClone(
      config.event_utc_date_windows,
    );
    for (const index of config.event_utc_date_windows) {
      const check = expected.events?.[index];
      if (!check)
        throw new Error('Configured event date window does not exist');
      const start = Number(check.start_time?.timestamp),
        end = Number(check.end_time?.timestamp);
      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        end <= start
      )
        throw new Error(
          'Configured event date window requires valid reference timestamps',
        );
      check.utc_date_window = {
        date: new Date(start * 1000).toISOString().slice(0, 10),
        duration_seconds: end - start,
      };
      original.events[index].utc_date_window = structuredClone(
        check.utc_date_window,
      );
    }
    deferred.push('events.utc_date_window_and_notice_consistency');
  }
  if (config.event_description_text && expected.events?.length) {
    for (const event of expected.events) delete event.description_contains;
    deferred.push('events.required_description_business_facts');
  }
  if (config.event_text && expected.events?.length)
    deferred.push('events.business_purpose_and_optional_description');
  // Each source assertion is existential over one actual, newly sent body.
  // Distinct assertions may share the same message or use different messages.
  const literalMessageChecks: Json[] = [];
  const initialMessageIds = new Set(
    (seed?.messages || []).map((m: Json) => m.message_id),
  );
  for (const [chat_id, groups] of Object.entries(
    config.literal_message_groups_chat || {},
  )) {
    for (const terms of groups as string[][]) {
      const passed =
        Boolean(seed) &&
        world.messages.some((m: Json) => {
          if (initialMessageIds.has(m.message_id) || m.chat_id !== chat_id)
            return false;
          try {
            const text = JSON.parse(m.body.content).text;
            return (
              typeof text === 'string' &&
              terms.every((term) =>
                text
                  .replace(/\s/g, '')
                  .toLowerCase()
                  .includes(term.replace(/\s/g, '').toLowerCase()),
              )
            );
          } catch {
            return false;
          }
        });
      literalMessageChecks.push({ chat_id, contains: terms, passed });
    }
  }

  // Adapted email tasks can declare first-line subject / remaining-body
  // assertions separately. Only newly sent messages at the declared recipient
  // count; a subject token must not satisfy a body assertion (or vice versa).
  for (const [chat_id, parts] of Object.entries(
    config.literal_message_parts_chat || {},
  )) {
    const rule = parts as { subject?: string[]; body?: string[] };
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .replace(/(\d),(\d)/g, '$1$2')
        .replace(/(\d+)\.0+%/g, '$1%')
        .replace(/\s*->\s*/g, '->')
        .replace(/(\.\d*[1-9])0+(?!\d)/g, '$1')
        .replace(/(\d)\.0+(?!\d)/g, '$1');
    const bodyContains = (body: string, term: string) => {
      const needle = normalize(term);
      if (!needle) return false;
      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(
        (/^[a-z0-9]/.test(needle) ? '(?<![a-z0-9])' : '') +
          escaped +
          (/\d$/.test(needle) ? String.raw`(?!\d|\.\d)` : ''),
      ).test(normalize(body));
    };
    const passed =
      Boolean(seed) &&
      world.messages.some((m: Json) => {
        if (initialMessageIds.has(m.message_id) || m.chat_id !== chat_id)
          return false;
        try {
          const text = JSON.parse(m.body.content).text;
          if (typeof text !== 'string') return false;
          const [subject, ...body] = text.split(/\r?\n/);
          return (
            (rule.subject || []).every((term) =>
              subject.toLowerCase().includes(term.toLowerCase()),
            ) &&
            (rule.body || []).every((term) =>
              bodyContains(body.join('\n'), term),
            )
          );
        } catch {
          return false;
        }
      });
    literalMessageChecks.push({ chat_id, parts: rule, passed });
  }

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
    // Reviewed source columns keep their exact visible text. A numeric cell is
    // equivalent only when its canonical text is identical, without rounding,
    // stripping leading zeros, currency marks, grouping or fractional digits.
    const literal = (config.literal_number_columns || []).find(
      (rule: Json) =>
        rule.spreadsheet_token === check.spreadsheet_token &&
        rule.sheet_id === check.sheet_id &&
        rule.columns.includes(check.column) &&
        (!rule.rows || rule.rows.includes(check.row)),
    );
    if (literal)
      return (
        typeof check.value === 'string' &&
        (typeof actual === 'string' ||
          (typeof actual === 'number' && Number.isFinite(actual))) &&
        String(actual) === check.value
      );
    for (const [key, parse] of [
      ['usd_result_columns', usdCents],
      ['numeric_result_columns', decimalValue],
      ['utc_clock_result_columns', utcClockSeconds],
    ] as const) {
      const rule = (config[key] || []).find(
        (rule: Json) =>
          rule.spreadsheet_token === check.spreadsheet_token &&
          rule.sheet_id === check.sheet_id &&
          rule.columns.includes(check.column) &&
          (!rule.rows || rule.rows.includes(check.row)),
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
  // Terms refer to original expected-cell indices, so row remapping preserves
  // their entity association. Only explicitly sourced literal terms are listed.
  const literalCellChecks = Object.entries(config.literal_cell_terms || {}).map(
    ([index, terms]) => {
      const cell = expected.cells?.[Number(index)];
      const value =
        cell &&
        (cell.spreadsheet_token
          ? world.spreadsheets?.[cell.spreadsheet_token]?.sheets
          : world.sheets)?.[cell.sheet_id]?.values?.[cell.row]?.[cell.column];
      return {
        index: Number(index),
        terms,
        passed:
          Array.isArray(terms) &&
          typeof value === 'string' &&
          terms.every(
            (term: unknown) => typeof term === 'string' && value.includes(term),
          ),
      };
    },
  );
  // Reviewed text formatting is representation metadata only on permitted
  // string-valued output cells. The authoritative state file is never rewritten.
  if (seed && config.text_format_cells) {
    for (const cell of expected.cells || []) {
      const sheet = (state: Json) =>
        cell.spreadsheet_token
          ? state.spreadsheets?.[cell.spreadsheet_token]?.sheets?.[
              cell.sheet_id
            ]
          : state.sheets?.[cell.sheet_id];
      const before = sheet(seed),
        after = sheet(world);
      const key = `${cell.row}:${cell.column}`;
      if (
        typeof after?.values?.[cell.row]?.[cell.column] !== 'string' ||
        !isDeepStrictEqual(after.cell_styles?.[key], { number_format: '@' }) ||
        before?.cell_styles?.[key] !== undefined
      )
        continue;
      delete after.cell_styles[key];
      if (
        !Object.keys(after.cell_styles).length &&
        before?.cell_styles === undefined
      )
        delete after.cell_styles;
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
  // One witness message must contain every required term. Put this check first
  // for its recipient so later unconstrained checks cannot consume the witness.
  const witnessChats = new Set<string>();
  for (const message of expected.messages || []) {
    const terms = config.literal_terms_in_one_message_chat?.[message.chat_id];
    if (!terms || witnessChats.has(message.chat_id)) continue;
    witnessChats.add(message.chat_id);
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
      return (
        !hasContent ||
        (key === 'forbidden_messages' &&
          config.literal_forbidden_message_indices?.includes(String(i)))
      );
    });
  }
  const reviewedField = (key: string) =>
    config.json_text_fields?.[key] ||
    config.usd_text_fields?.includes(key) ||
    config.instant_fields?.includes(key) ||
    config.schedule_fields?.includes(key);
  const sameReviewedField = (key: string, actual: unknown, value: unknown) => {
    if (config.usd_text_fields?.includes(key)) {
      // The reviewed field has USD context; a currency symbol is optional.
      if (typeof actual !== 'string' || typeof value !== 'string') return false;
      const expectedCents = usdCents(value);
      return expectedCents !== null && usdCents(actual) === expectedCents;
    }

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
  // Only explicitly reviewed note groups may partition their text across records.
  // Structural identities/privacy remain fixed, and other creations stay strict.
  if (seed && config.record_count_groups?.length) {
    original.record_count_groups = config.record_count_groups;
    const oldIds = new Set(seed.base.records.map((r: Json) => r.record_id));
    const added = world.base.records.filter(
      (r: Json) => !oldIds.has(r.record_id),
    );
    const expanded: Json[] = [],
      contains: Json = {};
    for (const [index, record] of (expected.creates || []).entries()) {
      const rule = config.record_count_groups.find((group: Json) => {
        const structural = { ...record };
        delete structural[group.text_field];
        return isDeepStrictEqual(structural, group.fields);
      });
      let count = 1;
      if (rule) {
        const records = added.filter((r: Json) =>
          Object.entries(rule.fields).every(([key, value]) =>
            isDeepStrictEqual(r.fields[key], value),
          ),
        );
        const bodies = records.map((r: Json) => r.fields[rule.text_field]);
        recordGroupChecks.push({
          fields: rule.fields,
          passed:
            records.length > 0 &&
            bodies.every(
              (body: unknown) =>
                typeof body === 'string' && body.trim().length > 0,
            ) &&
            new Set(bodies).size === bodies.length,
        });
        count = Math.max(1, records.length);
      }
      for (let n = 0; n < count; n++) {
        if (expected.creation_contains?.[String(index)])
          contains[String(expanded.length)] =
            expected.creation_contains[String(index)];
        expanded.push(structuredClone(record));
      }
    }
    expected.creates = expanded;
    expected.creation_contains = contains;
    deferred.push('creates.grouped_notes.completeness_and_no_redundancy');
  }
  return {
    required: deferred.length > 0,
    creationContainsCaseInsensitive:
      config.creation_contains_case_insensitive === true,
    original,
    deferred,
    literalMessageChecks,
    recordGroupChecks,
    literalCellChecks,
  };
}
