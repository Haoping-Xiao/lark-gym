import type { ApiObject, World } from '../../types.ts';
import { fail, requireValue } from '../errors.ts';
import { page } from '../pagination.ts';

export function searchCalendarEvents(
  world: Pick<World, 'events' | 'calendars' | 'now'>,
  calendarId: string,
  query: URLSearchParams,
  body: ApiObject,
) {
  const filter = body.filter ?? {};
  requireValue(
    filter && typeof filter === 'object' && !Array.isArray(filter),
    'Invalid filter',
  );
  if (
    Object.keys(body).some((k) => !['query', 'filter'].includes(k)) ||
    Object.keys(filter).some((k) => k !== 'time_range') ||
    [...query.keys()].some(
      (k) => !['page_size', 'page_token', 'user_id_type'].includes(k),
    ) ||
    (query.has('user_id_type') && query.get('user_id_type') !== 'open_id')
  )
    fail(501, 990001, 'ENV_UNSUPPORTED: event search filter or options');
  requireValue(typeof body.query === 'string', 'query required');
  requireValue(
    Number(query.get('page_size') || 20) <= 30,
    'page_size exceeds 30',
  );
  const range = filter.time_range ?? {};
  requireValue(
    range && typeof range === 'object' && !Array.isArray(range),
    'Invalid time_range',
  );
  if (Object.keys(range).some((k) => !['start_time', 'end_time'].includes(k)))
    fail(501, 990001, 'ENV_UNSUPPORTED: event search time option');
  const now = Date.parse(world.now),
    week = 7 * 24 * 60 * 60 * 1000;
  const parse = (value: unknown, fallback: number) => {
    if (value === undefined) return fallback;
    requireValue(
      typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
          value,
        ),
      'RFC3339 time required',
    );
    const n = Date.parse(value as string);
    requireValue(Number.isFinite(n), 'Invalid time');
    return n;
  };
  const start = parse(range.start_time, now - week),
    end = parse(range.end_time, now + week);
  requireValue(end > start, 'end_time must follow start_time');
  // Unsupported filters are classified before resource errors; searches are
  // reads and remain available on seeded reader calendars.
  if (!world.calendars.some((c) => c.calendar_id === calendarId))
    fail(404, 191001, 'Calendar not found');
  const events = world.events.filter(
    (e) => e.calendar_id === calendarId && e.status !== 'cancelled',
  );
  if (events.some((e) => e.recurrence))
    fail(501, 990001, 'ENV_UNSUPPORTED: recurring event search expansion');
  const time = (t: ApiObject) =>
    t.timestamp !== undefined
      ? Number(t.timestamp) * 1000
      : Date.parse(t.date + 'T00:00:00Z');
  const info = (t: ApiObject) =>
    t.date
      ? { date: t.date }
      : {
          date_time: new Date(time(t)).toISOString(),
          timezone: t.timezone || 'UTC',
        };
  const needle = body.query.toLowerCase();
  const matches = events.filter(
    (e) =>
      (e.summary.includes('_')
        ? e.summary.toLowerCase() === needle
        : e.summary.toLowerCase().includes(needle)) &&
      time(e.end_time) > start &&
      time(e.start_time) < end,
  );
  return page(
    matches.map((e) => ({
      meta_data: {
        calendar_id: e.calendar_id,
        event_id: e.event_id,
        summary: e.summary,
        start: info(e.start_time),
        end: info(e.end_time),
        is_all_day: !!e.start_time.date,
      },
    })),
    query,
  );
}
