import type { BaseRecord, World } from '../../../types.ts';
import { deleteRecords } from './records.ts';
import { fail, requireValue } from '../../errors.ts';
import { page } from '../../pagination.ts';
import type { ApiRequest, ResponseData } from '../../types.ts';

export function baseRoutes(
  world: Pick<World, 'base'>,
  { method, path: p, query: q, body }: ApiRequest,
): ResponseData | undefined {
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
  const matrix = (records: BaseRecord[]) => ({
    fields: fields.map((f) => f.name),
    record_id_list: records.map((r) => r.record_id),
    data: records.map((r) => fields.map((f) => r.fields[f.name])),
    has_more: false,
  });
  const createRecord = (data: unknown) => {
    requireValue(validFields(data), 'Invalid field map');
    let id = 1;
    while (world.base.records.some((r) => r.record_id === `rec_created_${id}`))
      id++;
    const record = {
      record_id: `rec_created_${id}`,
      fields: structuredClone(data),
    };
    world.base.records.push(record);
    return structuredClone(record);
  };
  if (method === 'POST' && p === baseV3 + '/records') return createRecord(body);
  if (method === 'POST' && p === baseV3 + '/records/batch_delete')
    return deleteRecords(world.base, body.record_id_list);
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
    return { ...structuredClone(r) };
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
    if (method === 'GET') return { record: structuredClone(r) };
    if (method === 'DELETE') {
      deleteRecords(world.base, [r.record_id]);
      return { record_id: r.record_id, deleted: true };
    }
    if (method === 'PUT') {
      requireValue(validFields(body.fields), 'Unknown field or invalid text');
      Object.assign(r.fields, body.fields);
      return { record: structuredClone(r) };
    }
  }
}
