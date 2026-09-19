import { deleteRecords } from './base-records.ts';
import { chatMembers, createChat } from './chat-members.ts';
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
  const eventTime = (time) =>
    time?.timestamp !== undefined
      ? Number(time.timestamp)
      : /^\d{4}-\d{2}-\d{2}$/.test(time?.date || '')
        ? Date.parse(time.date + 'T00:00:00Z') / 1000
        : NaN;
  function checkEvent(e) {
    requireValue(
      typeof e.summary === 'string' && e.summary.length > 0,
      'summary required',
    );
    const a = eventTime(e.start_time),
      b = eventTime(e.end_time);
    requireValue(
      Number.isFinite(a) && Number.isFinite(b) && b > a,
      'start_time/end_time require epoch seconds with end > start',
    );
  }
  function values(range, sheets = world.sheets) {
    const [id, cells] = range.split('!'),
      sheet = sheets[id];
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
    const spreadsheetId =
      /^\/open-apis\/(?:sheets|sheet_ai)\/v[23]\/spreadsheets\/([^/]+)/.exec(
        p,
      )?.[1];
    const book = world.spreadsheets?.[spreadsheetId];
    const sheets = book?.sheets ?? world.sheets;
    const spreadsheetToken = book ? spreadsheetId : world.spreadsheet_token;
    const spreadsheetTitle = book?.title ?? world.spreadsheet_title;
    if (method === 'GET' && p === '/open-apis/authen/v1/user_info')
      return {
        open_id: 'ou_eval',
        name: 'Evaluation User',
        email: 'agent@company.example.com',
      };
    if (
      method === 'GET' &&
      p === `/open-apis/sheets/v3/spreadsheets/${spreadsheetToken}`
    )
      return {
        spreadsheet: {
          spreadsheet_token: spreadsheetToken,
          title: spreadsheetTitle || 'Maintenance Plan',
        },
      };
    if (
      method === 'GET' &&
      p === `/open-apis/sheets/v3/spreadsheets/${spreadsheetToken}/sheets/query`
    )
      return {
        sheets: Object.entries(sheets).map(([sheet_id, s], index) => ({
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
        `/open-apis/sheet_ai/v2/spreadsheets/${spreadsheetToken}/tools/invoke_read`
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
          sheets: Object.entries(sheets).map(([sheet_id, s], index) => ({
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
          Object.keys(sheets).find(
            (id) => sheets[id].title === input.sheet_name,
          );
        requireValue(sid && sheets[sid], 'Unknown sheet');
        const ranges = input.ranges || [input.range];
        requireValue(
          Array.isArray(ranges) && ranges.every((x) => typeof x === 'string'),
          'ranges required',
        );
        output = {
          sheet_id: sid,
          ranges: ranges.map((range) => {
            const v = values(`${sid}!${range}`, sheets);
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
    if (
      method === 'POST' &&
      p ===
        `/open-apis/sheet_ai/v2/spreadsheets/${spreadsheetToken}/tools/invoke_write`
    ) {
      let input;
      try {
        input = JSON.parse(body.input);
      } catch {
        fail(400, 99992402, 'Invalid tool input');
      }
      if (body.tool_name !== 'set_cell_range')
        fail(501, 990001, `ENV_UNSUPPORTED: sheet tool ${body.tool_name}`);
      if (
        Object.keys(input).some(
          (key) =>
            !['excel_id', 'sheet_id', 'sheet_name', 'range', 'cells'].includes(
              key,
            ),
        )
      )
        fail(501, 990001, 'ENV_UNSUPPORTED: sheet write options');
      const sid =
        input.sheet_id ||
        Object.keys(sheets).find((id) => sheets[id].title === input.sheet_name);
      const sheet = sheets[sid];
      requireValue(sheet, 'Unknown sheet');
      const match = /^([A-Z]+)([1-9][0-9]*)(?::([A-Z]+)([1-9][0-9]*))?$/.exec(
        input.range || '',
      );
      requireValue(match, 'Finite A1 range required');
      const col = (letters) =>
        [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
      const left = col(match[1]),
        top = Number(match[2]) - 1;
      const right = col(match[3] || match[1]),
        bottom = Number(match[4] || match[2]) - 1;
      requireValue(
        left <= right && top <= bottom && bottom < 100000 && right < 1000,
        'Invalid write range',
      );
      requireValue(
        Array.isArray(input.cells) &&
          input.cells.length === bottom - top + 1 &&
          input.cells.every(
            (row) => Array.isArray(row) && row.length === right - left + 1,
          ),
        'Cell matrix must match range',
      );
      for (const row of input.cells)
        for (const cell of row) {
          if (!cell || Object.keys(cell).some((key) => key !== 'value'))
            fail(
              501,
              990001,
              'ENV_UNSUPPORTED: only cell values are supported',
            );
          requireValue(
            ['string', 'number', 'boolean'].includes(typeof cell.value),
            'Invalid cell value',
          );
        }
      for (let y = top; y <= bottom; y++) {
        while (sheet.values.length <= y) sheet.values.push([]);
        for (let x = left; x <= right; x++) {
          while (sheet.values[y].length <= x) sheet.values[y].push('');
          sheet.values[y][x] = input.cells[y - top][x - left].value;
        }
      }
      return {
        output: JSON.stringify({
          sheet_id: sid,
          range: input.range,
          updated_cells: input.cells.length * input.cells[0].length,
        }),
      };
    }
    const baseV3 = `/open-apis/base/v3/bases/${world.base.app_token}/tables/${world.base.table_id}`;
    const fieldNames = [
      ...new Set(world.base.records.flatMap((r) => Object.keys(r.fields))),
    ];
    const fields = (
      world.base.fields ||
      fieldNames.map((name) => ({
        name,
        type: world.base.records.some((r) => typeof r.fields[name] === 'number')
          ? 'number'
          : 'text',
      }))
    ).map((field, index) => ({
      field_id: `fld_${index}`,
      field_name: field.name,
      ...field,
    }));
    const validFields = (updates) =>
      updates &&
      typeof updates === 'object' &&
      !Array.isArray(updates) &&
      Object.entries(updates).every(([key, value]) => {
        const field = fields.find((f) => f.name === key);
        return (
          field &&
          typeof value === (field.type === 'number' ? 'number' : 'string')
        );
      });
    const matrix = (records) => ({
      fields: fields.map((f) => f.name),
      record_id_list: records.map((r) => r.record_id),
      data: records.map((r) => fields.map((f) => r.fields[f.name])),
      has_more: false,
    });
    const createRecord = (data) => {
      requireValue(validFields(data), 'Invalid field map');
      let id = 1;
      while (
        world.base.records.some((r) => r.record_id === `rec_created_${id}`)
      )
        id++;
      const record = { record_id: `rec_created_${id}`, fields: clone(data) };
      world.base.records.push(record);
      return clone(record);
    };
    if (method === 'POST' && p === baseV3 + '/records')
      return createRecord(body);
    if (method === 'POST' && p === baseV3 + '/records/batch_delete')
      return deleteRecords(world.base, body.record_id_list, fail);
    if (method === 'POST' && p === baseV3 + '/records/batch_create') {
      requireValue(
        Array.isArray(body.create_records) &&
          body.create_records.length > 0 &&
          body.create_records.length <= 200,
        'create_records requires 1 to 200 records',
      );
      const records = body.create_records.map(createRecord);
      return { records, record_id_list: records.map((r) => r.record_id) };
    }
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
      requireValue(validFields(body), 'Invalid field map');
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
        requireValue(validFields(updates), 'Invalid field map');
        Object.assign(r.fields, updates);
      }
      return {};
    }
    const valPrefix = `/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/`;
    if (method === 'GET' && p.startsWith(valPrefix + 'values/'))
      return {
        spreadsheetToken: spreadsheetToken,
        revision: 1,
        valueRange: values(p.slice((valPrefix + 'values/').length), sheets),
      };
    if (method === 'GET' && p === valPrefix + 'values_batch_get') {
      const ranges = q.getAll('ranges').flatMap((x) => x.split(','));
      requireValue(ranges.length, 'ranges required');
      return {
        spreadsheetToken: spreadsheetToken,
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
    const attendeePath = p.match(
      /^\/open-apis\/calendar\/v4\/calendars\/([^/]+)\/events\/([^/]+)\/attendees(?:\/(batch_delete))?$/,
    );
    if (attendeePath) {
      const [, cid, eid, action] = attendeePath;
      calendar(cid, method !== 'GET');
      const event = world.events.find(
        (e) => e.calendar_id === cid && e.event_id === eid,
      );
      if (!event) fail(404, 191002, 'Event not found');
      if (method === 'GET' && !action) return page(event.attendees || [], q);
      if (method === 'POST' && !action) {
        requireValue(
          Array.isArray(body.attendees) && body.attendees.length <= 1000,
          'attendees required',
        );
        const added = [];
        for (const a of body.attendees) {
          if (a.type !== 'third_party')
            fail(501, 990001, 'ENV_UNSUPPORTED: attendee type');
          requireValue(
            typeof a.third_party_email === 'string' &&
              a.third_party_email.includes('@'),
            'attendee email required',
          );
          event.attendees ||= [];
          const existing = event.attendees.find(
            (item) => item.third_party_email === a.third_party_email,
          );
          if (existing) {
            added.push(clone(existing));
            continue;
          }
          const attendee = {
            ...clone(a),
            attendee_id: `att_${event.attendees.length + 1}`,
            rsvp_status: 'needs_action',
          };
          event.attendees.push(attendee);
          added.push(clone(attendee));
        }
        return { attendees: added };
      }
      if (method === 'POST' && action === 'batch_delete') {
        requireValue(Array.isArray(body.attendee_ids), 'attendee_ids required');
        event.attendees = (event.attendees || []).filter(
          (a) => !body.attendee_ids.includes(a.attendee_id),
        );
        return {};
      }
      fail(501, 990001, 'ENV_UNSUPPORTED: attendee operation');
    }
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
            (e) => eventTime(e.end_time) > a && eventTime(e.start_time) < b,
          ),
          q,
        );
      }
      if (method === 'POST' && !eid) {
        checkEvent(body);
        while (
          world.events.some((event) => event.event_id === `evt_${nextEvent}`)
        )
          nextEvent++;
        const event = {
          ...clone(body),
          event_id: `evt_${nextEvent++}`,
          calendar_id: cid,
          status: 'confirmed',
        };
        if (event.vc_data?.vc_type === 'vc')
          event.vc_data.meeting_url = `https://meeting.example.invalid/${event.event_id}`;
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
        items: fields.map((f) => ({ ...f, type: f.type === 'number' ? 2 : 1 })),
        has_more: false,
      };
    if (p.startsWith(base + '/records/')) {
      const r = world.base.records.find(
        (r) => r.record_id === p.slice((base + '/records/').length),
      );
      if (!r) fail(404, 1254043, 'Record not found');
      if (method === 'GET') return { record: clone(r) };
      if (method === 'DELETE') {
        deleteRecords(world.base, [r.record_id], fail);
        return { record_id: r.record_id, deleted: true };
      }
      if (method === 'PUT') {
        requireValue(validFields(body.fields), 'Unknown field or invalid text');
        Object.assign(r.fields, body.fields);
        return { record: clone(r) };
      }
    }
    if (
      method === 'POST' &&
      p === '/open-apis/im/v1/messages/reactions/batch_query'
    ) {
      requireValue(
        Array.isArray(body.queries) && body.queries.length <= 20,
        'queries must contain up to 20 messages',
      );
      const messages = body.queries.map((query) => {
        const message = world.messages.find(
          (m) => m.message_id === query.message_id,
        );
        if (!message) fail(404, 230001, 'Message not found');
        return message;
      });
      return {
        success_msg_reaction_counts: messages.map((m) => ({
          message_id: m.message_id,
          reaction_count: m.reaction_count || [],
        })),
        success_msg_reaction_details: messages.map((m) => ({
          message_id: m.message_id,
          message_reaction_items: m.message_reaction_items || [],
        })),
      };
    }
    const membershipPath = p.match(
      /^\/open-apis\/im\/v1\/chats\/([^/]+)\/members$/,
    );
    if (membershipPath)
      return chatMembers(
        world,
        method,
        decodeURIComponent(membershipPath[1]),
        q,
        body,
        fail,
        page,
      );
    if (method === 'POST' && p === '/open-apis/im/v1/chats')
      return createChat(world, q, body, fail);
    const chatPath = p.match(/^\/open-apis\/im\/v1\/chats\/([^/]+)$/);
    if (method === 'GET' && chatPath) {
      const chat = world.chats.find((c) => c.chat_id === chatPath[1]);
      if (!chat) fail(404, 232001, 'Chat not found');
      return clone(chat);
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
      ['chat', before.chats, world.chats, 'chat_id'],
    ]) {
      for (const item of oldItems) {
        if (!newItems.some((x) => x[key] === item[key]))
          mutations.push({
            kind,
            id: item[key],
            before: clone(item),
            after: null,
          });
      }
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
    for (const id of new Set([
      ...Object.keys(before.sheets),
      ...Object.keys(world.sheets),
    ])) {
      if (!isDeepStrictEqual(before.sheets[id], world.sheets[id]))
        mutations.push({
          kind: 'sheet',
          id,
          before: clone(before.sheets[id]),
          after: clone(world.sheets[id]),
        });
    }
    for (const token of new Set([
      ...Object.keys(before.spreadsheets || {}),
      ...Object.keys(world.spreadsheets || {}),
    ])) {
      const oldBook = before.spreadsheets?.[token],
        newBook = world.spreadsheets?.[token];
      if (!isDeepStrictEqual(oldBook, newBook))
        mutations.push({
          kind: 'spreadsheet',
          id: token,
          before: clone(oldBook),
          after: clone(newBook),
        });
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
  await new Promise((resolve) =>
    server.listen(options.port ?? 0, options.host ?? '127.0.0.1', resolve),
  );
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    world,
    calls,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
