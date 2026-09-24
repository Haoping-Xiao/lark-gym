import { isDeepStrictEqual } from 'node:util';
type Json = Record<string, any>;
/** Validate customer-local booking dependencies against successful state mutations. */
export function checkBookingOrder(expected: Json, calls: Json[]) {
  const rules = expected.booking_order;
  if (!rules) return [];
  const changes = calls
    .filter((c) => c.status < 400)
    .flatMap((c) =>
      (c.mutations || [])
        .filter((m: Json) => !isDeepStrictEqual(m.before, m.after))
        .map((m: Json) => ({ ...m, seq: c.seq })),
    );
  const checks = rules.replies.map((rule: Json) => {
    const wanted = expected.events[rule.event_index];
    const matchesBooking = (m: Json) => {
      if (m.kind !== 'event' || !m.after) return false;
      const e = m.after;
      return (
        e.calendar_id === wanted.calendar_id &&
        e.summary === wanted.summary &&
        e.status !== 'cancelled' &&
        Number(e.start_time?.timestamp) ===
          Number(wanted.start_time.timestamp) &&
        Number(e.end_time?.timestamp) === Number(wanted.end_time.timestamp) &&
        isDeepStrictEqual(
          (e.attendees || []).map((a: Json) => a.third_party_email).sort(),
          [...wanted.attendees].sort(),
        )
      );
    };
    const booking = changes.filter(matchesBooking).map((m: Json) => m.seq);
    const replies = changes
      .filter(
        (m: Json) =>
          m.kind === 'record' &&
          !m.before &&
          m.after?.fields?.collection === 'intercom_replies' &&
          m.after.fields?.conversation_id === rule.conversation_id,
      )
      .map((m: Json) => m.seq);
    return {
      conversation_id: rule.conversation_id,
      booking,
      replies,
      passed:
        booking.length > 0 &&
        replies.length > 0 &&
        replies.every((seq: number) =>
          (() => {
            const latest = new Map<string, Json>();
            for (const change of changes) {
              if (change.kind === 'event' && change.seq < seq)
                latest.set(change.id, change);
            }
            return [...latest.values()].some(matchesBooking);
          })(),
        ),
    };
  });
  const completed = changes
    .filter((m: Json) => ['event', 'record'].includes(m.kind))
    .map((m: Json) => m.seq);
  const summaries = changes
    .filter(
      (m: Json) =>
        m.kind === 'message' &&
        !m.before &&
        m.after?.chat_id === rules.summary_chat_id,
    )
    .map((m: Json) => m.seq);
  checks.push({
    summary_chat_id: rules.summary_chat_id,
    completed,
    summaries,
    passed:
      completed.length > 0 &&
      summaries.length > 0 &&
      summaries.every((seq: number) => seq > Math.max(...completed)),
  });
  return checks;
}
