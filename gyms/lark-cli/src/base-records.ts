type Row = { record_id: string; fields: Record<string, unknown> };
export function deleteRecords(
  base: { records: Row[] },
  ids: unknown,
  fail: (status: number, code: number, message: string) => never,
) {
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.length > 200 ||
    ids.some((id) => typeof id !== 'string')
  )
    fail(400, 99992402, 'record_id_list requires 1 to 200 string IDs');
  const requested = new Set(ids as string[]);
  if (
    [...requested].some((id) => !base.records.some((r) => r.record_id === id))
  )
    fail(404, 1254043, 'Record not found');
  base.records = base.records.filter((r) => !requested.has(r.record_id));
  return { record_id_list: [...requested] };
}
