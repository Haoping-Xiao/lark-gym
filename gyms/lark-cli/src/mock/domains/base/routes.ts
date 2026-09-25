import { filterRecords } from './query.ts';
import { baseMetadata } from './metadata.ts';
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
  const workspace =
    /^\/open-apis\/base\/v3\/workspaces\/([^/]+)\/entities$/.exec(p);
  if (method === 'GET' && workspace && allBase.workspace_discovery) {
    if (
      Object.keys(body).length ||
      [...q.keys()].some(
        (k) => !['page_size', 'page_token', 'entity_type'].includes(k),
      )
    )
      fail(501, 990001, 'ENV_UNSUPPORTED: workspace entity query options');
    if (decodeURIComponent(workspace[1]) !== allBase.workspace_token)
      fail(404, 990004, 'Workspace not found in fixture');
    const entityType = q.get('entity_type') || '';
    requireValue(
      ['', 'base', 'baseapp'].includes(entityType),
      'Invalid entity type',
    );
    const size = Number(q.get('page_size') || 30);
    requireValue(
      Number.isInteger(size) && size > 0 && size <= 30,
      'Invalid pagination',
    );
    const params = new URLSearchParams(q);
    params.set('page_size', String(size));
    const entities =
      entityType === 'baseapp'
        ? []
        : [
            {
              token: allBase.app_token,
              name: baseMetadata(allBase).name,
              entity_type: 'base',
              url: `https://company.feishu.cn/base/${allBase.app_token}`,
            },
          ];
    const result = page(entities, params);
    return {
      entities: result.items,
      has_more: result.has_more,
      page_token: result.page_token,
    };
  }

  const baseToken = /^\/open-apis\/base\/v3\/bases\/([^/]+)$/.exec(p)?.[1];
  if (method === 'GET' && baseToken) {
    if (baseToken !== allBase.app_token)
      fail(404, 990004, 'Base not found in fixture');
    if (q.size || Object.keys(body).length)
      fail(501, 990001, 'ENV_UNSUPPORTED: Base metadata lookup options');
    return baseMetadata(allBase);
  }
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
  if (
    method === 'POST' &&
    p === `/open-apis/base/v3/bases/${allBase.app_token}/blocks/list`
  ) {
    if (
      Object.keys(body).some((key) => key !== 'parent_id') ||
      (body.parent_id !== undefined && body.parent_id !== '')
    )
      fail(501, 990001, 'ENV_UNSUPPORTED: nested Base blocks or list options');
    // These task bases contain flat tables only. Read their canonical catalog;
    // do not invent documents, folders, dashboards or separate sidebar state.
    const blocks = (
      allBase.tables || [{ table_id: allBase.table_id, name: allBase.table_id }]
    ).map(({ table_id, name }) => ({ id: table_id, type: 'table', name }));
    return { blocks, total: blocks.length };
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
  const fieldName = (id: string) => projection([id])[0].name;
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
      (key) =>
        !['field_id', 'offset', 'limit', 'user_id_type', 'filter'].includes(
          key,
        ),
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
    let filter: unknown;
    if (q.has('filter')) {
      try {
        filter = JSON.parse(q.get('filter')!);
      } catch {
        fail(400, 99992402, 'Invalid filter JSON');
      }
    }
    return matrix(
      filterRecords(table.records, filter, fieldName),
      selection,
      offset,
      limit,
    );
  }
  if (method === 'POST' && p === baseV3 + '/records/search') {
    if (
      Object.keys(body).some(
        (key) =>
          ![
            'keyword',
            'search_fields',
            'select_fields',
            'offset',
            'limit',
            'filter',
          ].includes(key),
      ) ||
      [...q.keys()].some((key) => key !== 'user_id_type')
    )
      fail(501, 990001, 'ENV_UNSUPPORTED: record search option');
    requireValue(
      typeof body.keyword === 'string' && body.keyword.length > 0,
      'keyword required',
    );
    requireValue(
      Array.isArray(body.search_fields) && body.search_fields.length > 0,
      'search_fields required',
    );
    const names = projection(body.search_fields).map((field) => field.name);
    const offset = body.offset ?? 0,
      limit = body.limit ?? 200;
    requireValue(
      Number.isInteger(offset) &&
        offset >= 0 &&
        Number.isInteger(limit) &&
        limit > 0,
      'Invalid offset or limit',
    );
    const keyword = body.keyword.toLowerCase();
    const records = filterRecords(table.records, body.filter, fieldName).filter(
      (record) =>
        names.some((name) =>
          String(record.fields[name] ?? '')
            .toLowerCase()
            .includes(keyword),
        ),
    );
    return matrix(records, body.select_fields, offset, limit);
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
