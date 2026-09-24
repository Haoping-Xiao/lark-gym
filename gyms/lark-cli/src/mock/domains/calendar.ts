import type { ApiObject, World } from '../../types.ts';
import { fail, requireValue } from '../errors.ts';
import { page } from '../pagination.ts';
import type { RouteHandler } from '../types.ts';

export function createCalendarRoutes(
  world: Pick<World, 'calendars' | 'events'>,
): RouteHandler {
  let nextEvent = 1;
  let nextAttendee = 1;
  function calendar(id: string, write = false) {
    const c = world.calendars.find((c) => c.calendar_id === id);
    if (!c) fail(404, 191001, 'Calendar not found');
    if (write && c.role === 'reader') fail(403, 99991672, 'Permission denied');
    return c;
  }
  const eventTime = (time: ApiObject) =>
    time?.timestamp !== undefined
      ? Number(time.timestamp)
      : /^\d{4}-\d{2}-\d{2}$/.test(time?.date || '')
        ? Date.parse(time.date + 'T00:00:00Z') / 1000
        : NaN;
  function checkEvent(e: ApiObject) {
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

  return ({ identity, method, path: p, query: q, body }) => {
    if (method === 'POST' && p === '/open-apis/calendar/v4/calendars/primary') {
      if (
        identity !== 'user' ||
        Object.keys(body).length ||
        [...q.keys()].some((key) => key !== 'user_id_type') ||
        (q.has('user_id_type') && q.get('user_id_type') !== 'open_id')
      )
        fail(501, 990001, 'ENV_UNSUPPORTED: primary calendar identity/options');
      return {
        calendars: world.calendars
          .filter((c) => c.calendar_id === 'primary')
          .map((c) => ({ calendar: structuredClone(c) })),
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
            (item: ApiObject) => item.third_party_email === a.third_party_email,
          );
          if (existing) {
            continue;
          }
          while (
            world.events.some((e) =>
              (e.attendees || []).some(
                (item: ApiObject) => item.attendee_id === `att_${nextAttendee}`,
              ),
            )
          )
            nextAttendee++;
          const attendee = {
            ...structuredClone(a),
            attendee_id: `att_${nextAttendee++}`,
            rsvp_status: 'needs_action',
          };
          event.attendees.push(attendee);
        }
        return { attendees: structuredClone(event.attendees || []) };
      }
      if (method === 'POST' && action === 'batch_delete') {
        requireValue(Array.isArray(body.attendee_ids), 'attendee_ids required');
        event.attendees = (event.attendees || []).filter(
          (a: ApiObject) => !body.attendee_ids.includes(a.attendee_id),
        );
        return {};
      }
      fail(501, 990001, 'ENV_UNSUPPORTED: attendee operation');
    }
    const m = p.match(
      /^\/open-apis\/calendar\/v4\/calendars\/([^/]+)(?:\/events(?:\/([^/]+))?)?$/,
    );
    if (m) {
      const [, cid, eid] = m;
      // Search actions are not event IDs. Report the missing capability before
      // resource lookup or write-permission checks can disguise it as 404/403.
      if (eid === 'search' || eid === 'search_event')
        fail(501, 990001, 'ENV_UNSUPPORTED: event search');
      calendar(cid, method !== 'GET');
      if (!p.includes('/events')) {
        if (method === 'GET')
          return { calendar: structuredClone(calendar(cid)) };
        fail(501, 990001, 'ENV_UNSUPPORTED: calendar metadata write');
      }
      const es = world.events.filter(
        (e) => e.calendar_id === cid && e.status !== 'cancelled',
      );
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
        const event: World['events'][number] = {
          summary: body.summary as string,
          ...structuredClone(body),
          event_id: `evt_${nextEvent++}`,
          calendar_id: cid,
          status: 'confirmed',
        };
        if (event.vc_data?.vc_type === 'vc')
          event.vc_data.meeting_url = `https://meeting.example.invalid/${event.event_id}`;
        world.events.push(event);
        return { event: structuredClone(event) };
      }
      const e = world.events.find(
        (e) => e.calendar_id === cid && e.event_id === eid,
      );
      if (!e) fail(404, 191002, 'Event not found');
      if (method === 'GET') return { event: structuredClone(e) };
      if (method === 'PATCH') {
        const updated = {
          ...e,
          ...body,
          event_id: e.event_id,
          calendar_id: cid,
        };
        checkEvent(updated);
        Object.assign(e, updated);
        return { event: structuredClone(e) };
      }
      if (method === 'DELETE') {
        e.status = 'cancelled';
        return {};
      }
    }
  };
}
