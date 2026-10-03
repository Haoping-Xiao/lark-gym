import type { World } from '../../../types.ts';
import type { ApiRequest } from '../../types.ts';
import { fail, requireValue } from '../../errors.ts';
import { page } from '../../pagination.ts';

export function searchMessages(
  world: Pick<World, 'messages' | 'chats'>,
  { method, path, query, body }: ApiRequest,
) {
  if (method === 'GET' && path === '/open-apis/im/v1/messages/mget') {
    const ids = query.getAll('message_ids');
    requireValue(
      ids.length > 0 && ids.length <= 50,
      '1–50 message_ids required',
    );
    return {
      items: ids.map((id) => {
        const message = world.messages.find((m) => m.message_id === id);
        if (!message) fail(404, 230001, 'Message not found');
        return structuredClone(message);
      }),
    };
  }
  if (method === 'POST' && path === '/open-apis/im/v1/chats/batch_query') {
    requireValue(
      Array.isArray(body.chat_ids) &&
        body.chat_ids.length <= 50 &&
        body.chat_ids.every((id: unknown) => typeof id === 'string'),
      'Up to 50 chat_ids required',
    );
    return {
      items: structuredClone(
        world.chats.filter((c) => body.chat_ids.includes(c.chat_id)),
      ),
    };
  }
  if (method !== 'POST' || path !== '/open-apis/im/v1/messages/search') return;
  const filter = body.filter ?? {};
  requireValue(
    typeof filter === 'object' && !Array.isArray(filter),
    'Invalid filter',
  );
  if (
    Object.keys(body).some((k) => !['query', 'filter'].includes(k)) ||
    Object.keys(filter).some(
      (k) => !['chat_ids', 'chat_type', 'time_range'].includes(k),
    )
  )
    fail(501, 990001, 'ENV_UNSUPPORTED: message search filters');
  requireValue(
    body.query === undefined || typeof body.query === 'string',
    'Invalid query',
  );
  requireValue(
    filter.chat_ids === undefined ||
      (Array.isArray(filter.chat_ids) &&
        filter.chat_ids.every((id: unknown) => typeof id === 'string')),
    'Invalid chat_ids',
  );
  requireValue(
    filter.chat_type === undefined ||
      ['group', 'p2p'].includes(filter.chat_type),
    'Invalid chat_type',
  );
  const time = filter.time_range ?? {};
  requireValue(
    typeof time === 'object' && !Array.isArray(time),
    'Invalid time_range',
  );
  if (Object.keys(time).some((k) => !['start_time', 'end_time'].includes(k)))
    fail(501, 990001, 'ENV_UNSUPPORTED: message time filter');
  for (const value of Object.values(time))
    requireValue(
      typeof value === 'string' && Number.isFinite(Date.parse(value)),
      'Invalid search time',
    );
  const start = time.start_time ? Date.parse(time.start_time) : -Infinity;
  const end = time.end_time ? Date.parse(time.end_time) : Infinity;
  requireValue(start <= end, 'Reversed time range');
  // Deterministic case-insensitive text terms; not full production search ranking.
  const terms = String(body.query ?? '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const found = world.messages.filter((m) => {
    let text: string;
    try {
      text = String(JSON.parse(m.body.content).text ?? '');
    } catch {
      text = m.body.content;
    }
    const timestamp = Number(m.create_time);
    const chat = world.chats.find((c) => c.chat_id === m.chat_id);
    return (
      terms.every((term) => text.toLowerCase().includes(term)) &&
      (!filter.chat_ids || filter.chat_ids.includes(m.chat_id)) &&
      (!filter.chat_type ||
        (chat?.chat_mode === 'p2p' ? 'p2p' : 'group') === filter.chat_type) &&
      timestamp >= start &&
      timestamp <= end
    );
  });
  return {
    ...page(
      found.map((m) => ({ meta_data: { message_id: m.message_id } })),
      query,
    ),
    total: found.length,
  };
}
