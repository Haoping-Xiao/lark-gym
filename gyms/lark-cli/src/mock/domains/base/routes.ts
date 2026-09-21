import type { BaseRecord, World } from '../../../types.ts';
import { deleteRecords } from './records.ts';
import { fail, requireValue } from '../../errors.ts';
import { page } from '../../pagination.ts';
import type { ApiRequest, ResponseData } from '../../types.ts';

export function baseRoutes(
  world: Pick<World, 'base'>,
  { method, path: p, query: q, body }: ApiRequest,
): ResponseData | undefined {
  const allBase = world.base;
  const tablesPath = `/open-apis/base/v3/bases/${allBase.app_token}/tables`;
  if (method === 'GET' && p === tablesPath) {
    const entries = (
      allBase.tables || [{ table_id: allBase.table_id, name: allBase.table_id }]
    ).map(({ table_id, name }) => ({ table_id, name }));
    const offset = Number(q.get('offset') ?? 0),
      limit = Number(q.get('limit') ?? 200);
    requireValue(
      Number.isInteger(offset) &&
        offset >= 0 &&
        Number.isInteger(limit) &&
        limit > 0,
      'Invalid pagination',
    );
    const items = entries.slice(offset, offset + limit);
    return {
      items,
      tables: items,
      total: entries.length,
      has_more: offset + limit < entries.length,
    };
  }
  const tableId = /\/tables\/([^/]+)/.exec(p)?.[1];
  const selected = allBase.tables?.find(
    (table) => table.table_id === tableId || table.name === tableId,
  );
  if (tableId && allBase.tables?.length && !selected)
    fail(404, 1254041, 'Table not found');
  const table = selected
    ? { ...allBase, table_id: selected.table_id, fields: selected.fields }
    : allBase;
  if (selected)
    Object.defineProperty(table, 'records', {
      get: () =>
        allBase.records.filter(
          (record) => record.fields.collection === selected.collection,
        ),
      set: (records: BaseRecord[]) => {
        const remaining = new Map(
          records.map((record) => [record.record_id, record]),
        );
        allBase.records = allBase.records.flatMap((record) => {
          if (record.fields.collection !== selected.collection) return [record];
          const replacement = remaining.get(record.record_id);
          remaining.delete(record.record_id);
          return replacement ? [replacement] : [];
        });
        allBase.records.push(...remaining.values());
      },
    });
  if (
    selected?.read_only &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
    /\/records(?:\/batch_(?:create|update|delete)|\/[^/]+)?$/.test(p) &&
    !p.endsWith('/records/batch_get') &&
    !p.endsWith('/records/search')
  )
    fail(403, 1254302, 'Read-only business reference table');
  const baseV3 = `/open-apis/base/v3/bases/${table.app_token}/tables/${tableId || table.table_id}`;
  const fieldNames = [
    ...new Set(table.records.flatMap((r) => Object.keys(r.fields))),
  ];
  const fields = (
    table.fields ||
    fieldNames.map((name) => ({
      name,
      type: table.records.some((r) => typeof r.fields[name] === 'number')
        ? 'number'
        : 'text',
    }))
  ).map((field, index) => ({
    field_id: `fld_${index}`,
    field_name: field.name,
    ...field,
  }));
  const validFields = (
    updates: unknown,
  ): updates is Record<string, string | number> =>
    !!updates &&
    typeof updates === 'object' &&
    !Array.isArray(updates) &&
    Object.entries(updates).every(([key, value]) => {
      const field = fields.find((f) => f.name === key);
      return (
        field &&
        typeof value === (field.type === 'number' ? 'number' : 'string')
      );
    });
  const projection = (selection: unknown) => {
    if (selection === undefined) return fields;
    requireValue(
      Array.isArray(selection) &&
        selection.every((id) => typeof id === 'string'),
      'select_fields must be a string array',
    );
    return selection.map((id) => {
      const field = fields.find((f) => f.name === id || f.field_id === id);
      if (!field) fail(400, 1254045, 'Field not found');
      return field;
    });
  };
  const matrix = (
    records: BaseRecord[],
    selection?: unknown,
    offset = 0,
    limit = records.length,
  ) => {
    const selected = projection(selection);
    const rows = records.slice(offset, offset + limit);
    return {
      fields: selected.map((f) => f.name),
      record_id_list: rows.map((r) => r.record_id),
      data: rows.map((r) => selected.map((f) => r.fields[f.name] ?? null)),
      has_more: offset + limit < records.length,
      total: records.length,
    };
  };
  const visible = (record: BaseRecord) => ({
    ...structuredClone(record),
    fields: Object.fromEntries(
      fields
        .filter((field) => Object.hasOwn(record.fields, field.name))
        .map((field) => [field.name, record.fields[field.name]]),
    ),
  });
  const createRecord = (data: unknown) => {
    requireValue(validFields(data), 'Invalid field map');
    let id = 1;
    while (allBase.records.some((r) => r.record_id === `rec_created_${id}`))
      id++;
    const record = {
      record_id: `rec_created_${id}`,
      fields: {
        ...structuredClone(data),
        ...(selected ? { collection: selected.collection } : {}),
      },
    };
    allBase.records.push(record);
    return visible(record);
  };
  if (method === 'POST' && p === baseV3 + '/records') return createRecord(body);
  if (method === 'POST' && p === baseV3 + '/records/batch_delete')
    return deleteRecords(table, body.record_id_list);
  if (method === 'POST' && p === baseV3 + '/records/batch_create') {
    requireValue(
      Array.isArray(body.create_records) &&
        body.create_records.length > 0 &&
        body.create_records.length <= 200,
      'create_records requires 1 to 200 records',
    );
    const records: BaseRecord[] = body.create_records.map(createRecord);
    return { records, record_id_list: records.map((r) => r.record_id) };
  }
  if (method === 'GET' && p === baseV3)
    return {
      table_id: table.table_id,
      name: selected?.name || table.table_id,
      fields,
    };
  if (method === 'GET' && p === baseV3 + '/views')
    return { items: [], views: [], has_more: false };
  if (method === 'GET' && p === baseV3 + '/fields')
    return { fields, field_list: fields, items: fields, has_more: false };
  if (method === 'GET' && p === baseV3 + '/records') {
    const unsupported = [...q.keys()].filter(
      (key) => !['field_id', 'offset', 'limit', 'user_id_type'].includes(key),
    );
    if (unsupported.length)
      fail(
        501,
        990001,
        `ENV_UNSUPPORTED: record list parameters ${unsupported.join(', ')}`,
      );
    const offset = Number(q.get('offset') ?? 0),
      limit = Number(q.get('limit') ?? 200);
    requireValue(
      Number.isInteger(offset) &&
        offset >= 0 &&
        Number.isInteger(limit) &&
        limit > 0,
      'Invalid offset or limit',
    );
    let selection: unknown = q.has('field_id')
      ? q.getAll('field_id')
      : undefined;
    if (
      Array.isArray(selection) &&
      selection.length === 1 &&
      selection[0].startsWith('[')
    ) {
      try {
        selection = JSON.parse(selection[0]);
      } catch {
        fail(400, 99992402, 'Invalid field_id');
      }
    }
    return matrix(table.records, selection, offset, limit);
  }
  if (method === 'POST' && p === baseV3 + '/records/batch_get') {
    requireValue(
      Array.isArray(body.record_id_list) &&
        body.record_id_list.length > 0 &&
        body.record_id_list.every((id: unknown) => typeof id === 'string'),
      'record_id_list required',
    );
    const records = body.record_id_list.map((id: string) => {
      const record = table.records.find((r) => r.record_id === id);
      if (!record) fail(404, 1254043, 'Record not found');
      return record;
    });
    return matrix(records, body.select_fields);
  }
  if (method === 'PATCH' && p.startsWith(baseV3 + '/records/')) {
    const r = table.records.find((r) => r.record_id === p.split('/').at(-1));
    if (!r) fail(404, 1254043, 'Record not found');
    requireValue(validFields(body), 'Invalid field map');
    Object.assign(r.fields, body);
    return visible(r);
  }
  if (method === 'POST' && p === baseV3 + '/records/batch_update') {
    requireValue(
      body.update_records && typeof body.update_records === 'object',
      'update_records required',
    );
    for (const [id, updates] of Object.entries(body.update_records)) {
      const r = table.records.find((r) => r.record_id === id);
      if (!r) fail(404, 1254043, 'Record not found');
      requireValue(validFields(updates), 'Invalid field map');
      Object.assign(r.fields, updates);
    }
    return {};
  }
  const base = `/open-apis/bitable/v1/apps/${table.app_token}/tables/${tableId || table.table_id}`;
  if (method === 'GET' && p === base + '/records')
    return {
      ...page(table.records.map(visible), q),
      total: table.records.length,
    };
  if (method === 'GET' && p === base + '/fields')
    return {
      items: fields.map((f) => ({ ...f, type: f.type === 'number' ? 2 : 1 })),
      has_more: false,
    };
  if (p.startsWith(base + '/records/')) {
    const r = table.records.find(
      (r) => r.record_id === p.slice((base + '/records/').length),
    );
    if (!r) fail(404, 1254043, 'Record not found');
    if (method === 'GET') return { record: visible(r) };
    if (method === 'DELETE') {
      deleteRecords(table, [r.record_id]);
      return { record_id: r.record_id, deleted: true };
    }
    if (method === 'PUT') {
      requireValue(validFields(body.fields), 'Unknown field or invalid text');
      Object.assign(r.fields, body.fields);
      return { record: visible(r) };
    }
  }
}
