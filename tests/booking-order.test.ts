import test from 'node:test';
import assert from 'node:assert/strict';
import { checkBookingOrder } from '../scripts/task-support/booking-order.ts';
test('booking replies depend on their own completed invitation and summaries follow all work', () => {
  const events = ['A', 'B'].map((name) => ({
    calendar_id: 'cal',
    summary: name,
    start_time: { timestamp: '100' },
    end_time: { timestamp: '200' },
    attendees: [name + '@example.com'],
  }));
  const expected = {
    events,
    booking_order: {
      summary_chat_id: 'summary',
      replies: [
        { conversation_id: 'a', event_index: 0 },
        { conversation_id: 'b', event_index: 1 },
      ],
    },
  };
  const event = (i: number, complete = true) => ({
    kind: 'event',
    id: 'e' + i,
    after: {
      ...events[i],
      attendees: complete
        ? events[i].attendees.map((third_party_email) => ({
            third_party_email,
          }))
        : [],
    },
  });
  const reply = (conversation_id: string) => ({
    kind: 'record',
    after: { fields: { collection: 'intercom_replies', conversation_id } },
  });
  const summary = { kind: 'message', after: { chat_id: 'summary' } };
  const tag = {
    kind: 'record',
    before: { fields: { tags: [] } },
    after: { fields: { tags: ['demo-scheduled'] } },
  };
  const pass = (mutations: any[]) =>
    checkBookingOrder(
      expected,
      mutations.map((m, seq) => ({
        seq,
        status: 200,
        mutations: m ? [m] : [],
      })),
    ).every((c: any) => c.passed);
  assert.equal(
    pass([event(0), reply('a'), event(1), reply('b'), summary]),
    true,
  );
  assert.equal(
    pass([
      reply('declined'),
      event(0),
      reply('a'),
      event(1),
      reply('b'),
      summary,
    ]),
    true,
  );
  assert.equal(
    pass([event(0), event(1), reply('a'), reply('b'), summary]),
    true,
  );
  assert.equal(
    pass([reply('a'), event(0), event(1), reply('b'), summary]),
    false,
  );
  assert.equal(
    pass([
      event(0, false),
      reply('a'),
      event(0),
      event(1),
      reply('b'),
      summary,
    ]),
    false,
  );
  assert.equal(
    pass([event(0), reply('a'), summary, event(1), reply('b')]),
    false,
  );
  assert.equal(
    pass([event(0), reply('a'), event(1), reply('b'), summary, tag]),
    false,
  );
  assert.equal(
    pass([
      event(0),
      reply('a'),
      event(1),
      reply('b'),
      summary,
      null,
      { ...tag, before: tag.after },
    ]),
    true,
  );
  // A once-valid invitation is not proof if it was changed before the reply.
  for (const invalid of [
    event(0, false),
    { kind: 'event', id: 'e0', before: event(0).after },
  ]) {
    assert.equal(
      pass([
        event(0),
        invalid,
        reply('a'),
        event(0),
        event(1),
        reply('b'),
        summary,
      ]),
      false,
    );
  }
  const failed = [event(0), reply('a'), event(1), reply('b'), summary].map(
    (m, seq) => ({ seq, status: seq === 0 ? 500 : 200, mutations: [m] }),
  );
  assert.equal(
    checkBookingOrder(expected, failed).every((c: any) => c.passed),
    false,
  );
});
