import http from 'node:http';
import { isDeepStrictEqual } from 'node:util';

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const fail = (status, code, message) => {
  throw new ApiError(status, code, message);
};
const requireValue = (ok, message) => {
  if (!ok) fail(400, 99992402, message);
};
const clone = (x) => structuredClone(x);

// A fresh server owns one world. No reset/admin/score HTTP endpoints exist.
export async function startMock(seed, options = {}) {
  const world = clone(seed),
    calls = [];
  let nextEvent = 1,
    nextMessage = 1;
  function page(items, q) {
    const offset = Number(q.get('page_token') || 0),
      size = Number(q.get('page_size') || 100);
    requireValue(
      Number.isInteger(offset) &&
        offset >= 0 &&
        Number.isInteger(size) &&
        size > 0 &&
        size <= 1000,
      'Invalid pagination',
    );
    return {
      items: clone(items.slice(offset, offset + size)),
      has_more: offset + size < items.length,
      page_token: offset + size < items.length ? String(offset + size) : '',
    };
  }
  function calendar(id, write = false) {
    const c = world.calendars.find((c) => c.calendar_id === id);
    if (!c) fail(404, 191001, 'Calendar not found');
    if (write && c.role === 'reader') fail(403, 99991672, 'Permission denied');
    return c;
  }
  function checkEvent(e) {
    requireValue(
      typeof e.summary === 'string' && e.summary.length > 0,
      'summary required',
    );
    const a = Number(e.start_time?.timestamp),
      b = Number(e.end_time?.timestamp);
    requireValue(
      Number.isFinite(a) && Number.isFinite(b) && b > a,
      'start_time/end_time require epoch seconds with end > start',
    );
  }
  function values(range) {
    const [id, cells] = range.split('!'),
      sheet = world.sheets[id];
    if (!sheet) fail(404, 1310002, 'Sheet not found');
    if (!cells) return { range, values: clone(sheet.values) };
    const match = /^([A-Z]+)(\d+)?(?::([A-Z]+)(\d+)?)?$/.exec(cells);
    requireValue(match, 'Unsupported A1 range');
    const col = (x) =>
      [...x].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
    const left = col(match[1]),
      right = col(match[3] || match[1]);
    const top = Number(match[2] || 1) - 1,
      bottom = Number(
        match[4] ||
          (match[3] ? sheet.values.length : match[2] || sheet.values.length),
      );
    requireValue(right >= left && bottom > top, 'Invalid A1 range');
    return {
      range,
      values: clone(
        sheet.values
          .slice(top, bottom)
          .map((row) => row.slice(left, right + 1)),
      ),
    };
  }
  function route(method, u, body) {
    const p = decodeURIComponent(u.pathname),
      q = u.searchParams;
    if (method === 'GET' && p === '/open-apis/authen/v1/user_info')
      return { open_id: 'ou_eval', name: 'Evaluation User' };
    if (
      method === 'GET' &&
      p === `/open-apis/sheets/v3/spreadsheets/${world.spreadsheet_token}`
    )
      return {
        spreadsheet: {
          spreadsheet_token: world.spreadsheet_token,
          title: 'Maintenance Plan',
        },
      };
    if (
      method === 'GET' &&
      p ===
        `/open-apis/sheets/v3/spreadsheets/${world.spreadsheet_token}/sheets/query`
    )
      return {
        sheets: Object.entries(world.sheets).map(([sheet_id, s], index) => ({
          sheet_id,
          title: s.title,
          index,
          grid_properties: {
            row_count: s.values.length,
            column_count: s.values[0].length,
          },
        })),
      };
    if (
      method === 'POST' &&
      p ===
        `/open-apis/sheet_ai/v2/spreadsheets/${world.spreadsheet_token}/tools/invoke_read`
    ) {
      let input;
      try {
        input = JSON.parse(body.input);
      } catch {
        fail(400, 99992402, 'Invalid tool input');
      }
      let output;
      if (body.tool_name === 'get_workbook_structure')
        output = {
          revision: 1,
          sheets: Object.entries(world.sheets).map(([sheet_id, s], index) => ({
            sheet_id,
            title: s.title,
            name: s.title,
            index,
            row_count: s.values.length,
            column_count: s.values[0].length,
            hidden: false,
          })),
        };
      else if (
        body.tool_name === 'get_cell_ranges' ||
        body.tool_name === 'get_range_as_csv'
      ) {
        const sid =
          input.sheet_id ||
          Object.keys(world.sheets).find(
            (id) => world.sheets[id].title === input.sheet_name,
          );
        requireValue(sid && world.sheets[sid], 'Unknown sheet');
        const ranges = input.ranges || [input.range];
        requireValue(
          Array.isArray(ranges) && ranges.every((x) => typeof x === 'string'),
          'ranges required',
        );
        output = {
          sheet_id: sid,
          ranges: ranges.map((range) => {
            const v = values(`${sid}!${range}`);
            return {
              range,
              values: v.values,
              cells: v.values.map((row) => row.map((value) => ({ value }))),
              has_more: false,
            };
          }),
          has_more: false,
        };
        if (body.tool_name === 'get_range_as_csv')
          output = {
            csv: output.ranges[0].values
              .map((row) => row.map((v) => JSON.stringify(v)).join(','))
              .join('\n'),
            has_more: false,
          };
      } else fail(501, 990001, `ENV_UNSUPPORTED: sheet tool ${body.tool_name}`);
      return { output: JSON.stringify(output) };
    }
    const baseV3 = `/open-apis/base/v3/bases/${world.base.app_token}/tables/${world.base.table_id}`;
    const fields = [
      {
        field_id: 'fld_system',
        field_name: 'System',
        name: 'System',
        type: 'text',
      },
      {
        field_id: 'fld_log',
        field_name: 'Maintenance log',
        name: 'Maintenance log',
        type: 'text',
      },
    ];
    const matrix = (records) => ({
      fields: fields.map((f) => f.name),
      record_id_list: records.map((r) => r.record_id),
      data: records.map((r) => fields.map((f) => r.fields[f.name])),
      has_more: false,
    });
    if (method === 'GET' && p === baseV3 + '/fields')
      return { fields, field_list: fields, items: fields, has_more: false };
    if (method === 'GET' && p === baseV3 + '/records')
      return matrix(world.base.records);
    if (method === 'POST' && p === baseV3 + '/records/batch_get')
      return matrix(
        world.base.records.filter((r) =>
          body.record_id_list?.includes(r.record_id),
        ),
      );
    if (method === 'PATCH' && p.startsWith(baseV3 + '/records/')) {
      const r = world.base.records.find(
        (r) => r.record_id === p.split('/').at(-1),
      );
      if (!r) fail(404, 1254043, 'Record not found');
      requireValue(
        Object.keys(body).every(
          (k) =>
            ['System', 'Maintenance log'].includes(k) &&
            typeof body[k] === 'string',
        ),
        'Invalid field map',
      );
      Object.assign(r.fields, body);
      return clone(r);
    }
    if (method === 'POST' && p === baseV3 + '/records/batch_update') {
      requireValue(
        body.update_records && typeof body.update_records === 'object',
        'update_records required',
      );
      for (const [id, updates] of Object.entries(body.update_records)) {
        const r = world.base.records.find((r) => r.record_id === id);
        if (!r) fail(404, 1254043, 'Record not found');
        requireValue(
          Object.keys(updates).every(
            (k) =>
              ['System', 'Maintenance log'].includes(k) &&
              typeof updates[k] === 'string',
          ),
          'Invalid field map',
        );
        Object.assign(r.fields, updates);
      }
      return {};
    }
    const valPrefix = `/open-apis/sheets/v2/spreadsheets/${world.spreadsheet_token}/`;
    if (method === 'GET' && p.startsWith(valPrefix + 'values/'))
      return {
        spreadsheetToken: world.spreadsheet_token,
        revision: 1,
        valueRange: values(p.slice((valPrefix + 'values/').length)),
      };
    if (method === 'GET' && p === valPrefix + 'values_batch_get') {
      const ranges = q.getAll('ranges').flatMap((x) => x.split(','));
      requireValue(ranges.length, 'ranges required');
      return {
        spreadsheetToken: world.spreadsheet_token,
        revision: 1,
        valueRanges: ranges.map(values),
      };
    }
    if (method === 'GET' && p === '/open-apis/calendar/v4/calendars')
      return {
        calendar_list: page(world.calendars, q).items,
        ...Object.fromEntries(
          Object.entries(page(world.calendars, q)).filter(
            ([k]) => k !== 'items',
          ),
        ),
      };
    let m = p.match(
      /^\/open-apis\/calendar\/v4\/calendars\/([^/]+)(?:\/events(?:\/([^/]+))?)?$/,
    );
    if (m) {
      const [, cid, eid] = m;
      calendar(cid, method !== 'GET');
      if (!p.includes('/events')) {
        if (method === 'GET') return { calendar: clone(calendar(cid)) };
        fail(501, 990001, 'ENV_UNSUPPORTED: calendar metadata write');
      }
      const es = world.events.filter(
        (e) => e.calendar_id === cid && e.status !== 'cancelled',
      );
      if (eid === 'search') fail(501, 990001, 'ENV_UNSUPPORTED: event search');
      if (eid === 'instance_view' && method !== 'GET')
        fail(501, 990001, 'ENV_UNSUPPORTED: instance view write');
      if (method === 'GET' && (!eid || eid === 'instance_view')) {
        if (eid === 'instance_view' && es.some((e) => e.recurrence))
          fail(501, 990001, 'ENV_UNSUPPORTED: recurring event expansion');
        const a = Number(q.get('start_time') || '-Infinity'),
          b = Number(q.get('end_time') || 'Infinity');
        return page(
          es.filter(
            (e) =>
              Number(e.end_time.timestamp) > a &&
              Number(e.start_time.timestamp) < b,
          ),
          q,
        );
      }
      if (method === 'POST' && !eid) {
        checkEvent(body);
        const event = {
          ...clone(body),
          event_id: `evt_${nextEvent++}`,
          calendar_id: cid,
          status: 'confirmed',
        };
        world.events.push(event);
        return { event: clone(event) };
      }
      const e = world.events.find(
        (e) => e.calendar_id === cid && e.event_id === eid,
      );
      if (!e) fail(404, 191002, 'Event not found');
      if (method === 'GET') return { event: clone(e) };
      if (method === 'PATCH') {
        const updated = {
          ...e,
          ...body,
          event_id: e.event_id,
          calendar_id: cid,
        };
        checkEvent(updated);
        Object.assign(e, updated);
        return { event: clone(e) };
      }
      if (method === 'DELETE') {
        e.status = 'cancelled';
        return {};
      }
    }
    const base = `/open-apis/bitable/v1/apps/${world.base.app_token}/tables/${world.base.table_id}`;
    if (method === 'GET' && p === base + '/records')
      return {
        ...page(world.base.records, q),
        total: world.base.records.length,
      };
    if (method === 'GET' && p === base + '/fields')
      return {
        items: [
          { field_name: 'System', type: 1 },
          { field_name: 'Maintenance log', type: 1 },
        ],
        has_more: false,
      };
    if (p.startsWith(base + '/records/')) {
      const r = world.base.records.find(
        (r) => r.record_id === p.slice((base + '/records/').length),
      );
      if (!r) fail(404, 1254043, 'Record not found');
      if (method === 'GET') return { record: clone(r) };
      if (method === 'PUT') {
        requireValue(
          body.fields &&
            Object.keys(body.fields).every(
              (k) =>
                ['System', 'Maintenance log'].includes(k) &&
                typeof body.fields[k] === 'string',
            ),
          'Unknown field or invalid text',
        );
        Object.assign(r.fields, body.fields);
        return { record: clone(r) };
      }
    }
    if (method === 'GET' && p === '/open-apis/im/v1/chats')
      return page(world.chats, q);
    if (method === 'POST' && p === '/open-apis/im/v1/messages') {
      requireValue(
        q.get('receive_id_type') === 'chat_id' &&
          world.chats.some((c) => c.chat_id === body.receive_id),
        'Unknown chat or receive_id_type',
      );
      requireValue(
        body.msg_type === 'text',
        'Only text messages are supported in this case',
      );
      let content;
      try {
        content = JSON.parse(body.content);
      } catch {
        fail(400, 99992402, 'content must be JSON-encoded text');
      }
      requireValue(
        typeof content.text === 'string' && content.text.length > 0,
        'text required',
      );
      const msg = {
        message_id: `om_${nextMessage++}`,
        chat_id: body.receive_id,
        msg_type: 'text',
        body: { content: body.content },
        create_time: String(Date.parse(world.now)),
      };
      world.messages.push(msg);
      return clone(msg);
    }
    if (method === 'GET' && p === '/open-apis/im/v1/messages')
      return page(
        world.messages.filter((x) => x.chat_id === q.get('container_id')),
        q,
      );
    if (method === 'GET' && p.startsWith('/open-apis/im/v1/messages/')) {
      const msg = world.messages.find(
        (x) => x.message_id === p.split('/').at(-1),
      );
      if (!msg) fail(404, 230001, 'Message not found');
      return { items: [clone(msg)] };
    }
    fail(501, 990001, `ENV_UNSUPPORTED: ${method} ${p}`);
  }
  const server = http.createServer(async (req, res) => {
    const before = clone(world);
    let body = {},
      status = 200,
      response;
    try {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 1_000_000) fail(413, 99992402, 'Body too large');
      }
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        fail(400, 99992402, 'Malformed JSON');
      }
      if (req.headers.authorization !== 'Bearer local-evaluation-only')
        fail(401, 99991663, 'Synthetic token required');
      response = {
        code: 0,
        msg: 'success',
        data: route(req.method, new URL(req.url, 'http://localhost'), body),
      };
    } catch (e) {
      // Reject atomically, including programmer errors; never leak a half-write.
      for (const k of Object.keys(world)) delete world[k];
      Object.assign(world, before);
      status = e.status || 500;
      response = { code: e.code || 990002, msg: e.message };
    }
    const mutations = [];
    for (const [kind, oldItems, newItems, key] of [
      ['event', before.events, world.events, 'event_id'],
      ['record', before.base.records, world.base.records, 'record_id'],
      ['message', before.messages, world.messages, 'message_id'],
    ]) {
      for (const item of newItems) {
        const previous = oldItems.find((x) => x[key] === item[key]);
        if (!isDeepStrictEqual(previous, item))
          mutations.push({
            kind,
            id: item[key],
            before: clone(previous),
            after: clone(item),
          });
      }
    }
    calls.push({
      seq: calls.length + 1,
      method: req.method,
      path: req.url,
      body: clone(body),
      status,
      response: clone(response),
      changed: !isDeepStrictEqual(before, world),
      mutations,
    });
    options.onSnapshot?.(world, calls);
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(response));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    world,
    calls,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
