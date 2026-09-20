import { requireValue } from './errors.ts';

export function page<T>(items: T[], q: URLSearchParams) {
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
    items: structuredClone(items.slice(offset, offset + size)),
    has_more: offset + size < items.length,
    page_token: offset + size < items.length ? String(offset + size) : '',
  };
}
