import type { BaseRecord } from '../../../types.ts';
import { fail, requireValue } from '../../errors.ts';

// Scalar subset of the CLI's view-filter protocol. Unsupported operators must
// fail even on an empty table, rather than silently returning an empty result.
export function filterRecords(
  records: BaseRecord[],
  filter: unknown,
  fieldName: (id: string) => string,
): BaseRecord[] {
  if (filter === undefined) return records;
  requireValue(
    filter && typeof filter === 'object' && !Array.isArray(filter),
    'filter must be an object',
  );
  const value = filter as Record<string, unknown>;
  if (Object.keys(value).some((key) => !['logic', 'conditions'].includes(key)))
    fail(501, 990001, 'ENV_UNSUPPORTED: record filter option');
  requireValue(
    value.logic === 'and' || value.logic === 'or',
    'Invalid filter logic',
  );
  requireValue(Array.isArray(value.conditions), 'conditions must be an array');
  const predicates = value.conditions.map((condition: unknown) => {
    requireValue(
      Array.isArray(condition) &&
        condition.length === 3 &&
        typeof condition[0] === 'string',
      'Each condition requires [field, operator, value]',
    );
    const [id, operator, wanted] = condition;
    const name = fieldName(id);
    if (!['==', '!=', '>', '>=', '<', '<='].includes(operator))
      fail(501, 990001, 'ENV_UNSUPPORTED: record filter operator');
    if (typeof wanted === 'boolean' || Array.isArray(wanted))
      fail(501, 990001, 'ENV_UNSUPPORTED: non-scalar-text/number filter value');
    requireValue(
      wanted === null ||
        typeof wanted === 'string' ||
        (typeof wanted === 'number' && Number.isFinite(wanted)),
      'Scalar text/number filter value required',
    );
    if (!['==', '!='].includes(operator) && typeof wanted !== 'number')
      fail(501, 990001, 'ENV_UNSUPPORTED: ordered filter requires numbers');
    return (record: BaseRecord) => {
      const actual = record.fields[name] ?? null;
      if (operator === '==') return actual === wanted;
      if (operator === '!=') return actual !== wanted;
      if (typeof actual !== 'number' || typeof wanted !== 'number')
        return false;
      if (operator === '>') return actual > wanted;
      if (operator === '>=') return actual >= wanted;
      if (operator === '<') return actual < wanted;
      return actual <= wanted;
    };
  });
  return records.filter((record) =>
    value.logic === 'and'
      ? predicates.every((predicate) => predicate(record))
      : predicates.some((predicate) => predicate(record)),
  );
}
