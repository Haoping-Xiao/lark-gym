import { searchMessages } from './search.ts';
import type { ApiObject, World } from '../../../types.ts';
import { chatMembers, createChat } from './chats.ts';
import { fail, requireValue } from '../../errors.ts';
import { page } from '../../pagination.ts';
import type { RouteHandler } from '../../types.ts';

export function createImRoutes(
  world: Pick<
    World,
    'chats' | 'base' | 'messages' | 'now' | 'chat_creation_allowed'
  >,
): RouteHandler {
  let nextMessage = 1;
  return ({ method, path: p, query: q, body }) => {
    const searched = searchMessages(world, { method, path: p, query: q, body });
    if (searched !== undefined) return searched;
    if (
      method === 'POST' &&
      p === '/open-apis/im/v1/messages/reactions/batch_query'
    ) {
      requireValue(
        Array.isArray(body.queries) && body.queries.length <= 20,
        'queries must contain up to 20 messages',
      );
      const messages = body.queries.map((query: ApiObject) => {
        const message = world.messages.find(
          (m) => m.message_id === query.message_id,
        );
        if (!message) fail(404, 230001, 'Message not found');
        return message;
      });
      return {
        success_msg_reaction_counts: messages.map((m: ApiObject) => ({
          message_id: m.message_id,
          reaction_count: m.reaction_count || [],
        })),
        success_msg_reaction_details: messages.map((m: ApiObject) => ({
          message_id: m.message_id,
          message_reaction_items: m.message_reaction_items || [],
        })),
      };
    }
    const membershipPath = p.match(
      /^\/open-apis\/im\/v1\/chats\/([^/]+)\/members$/,
    );
    if (membershipPath)
      return chatMembers(
        world,
        method,
        decodeURIComponent(membershipPath[1]),
        q,
        body,
      );
    if (method === 'POST' && p === '/open-apis/im/v2/chats/search') {
      const filter = body.filter || {};
      requireValue(
        typeof filter === 'object' && !Array.isArray(filter),
        'Invalid chat filter',
      );
      for (const key of ['member_ids', 'chat_modes'])
        requireValue(
          filter[key] === undefined ||
            (Array.isArray(filter[key]) &&
              filter[key].every((value: unknown) => typeof value === 'string')),
          `Invalid ${key}`,
        );
      requireValue(
        filter.disable_search_by_user === undefined ||
          typeof filter.disable_search_by_user === 'boolean',
        'Invalid disable_search_by_user',
      );
      requireValue(
        body.query === undefined || typeof body.query === 'string',
        'Invalid query',
      );
      const unsupported = Object.keys(filter).filter(
        (key) =>
          !['chat_modes', 'member_ids', 'disable_search_by_user'].includes(key),
      );
      if (unsupported.length || body.sorter)
        fail(
          501,
          990001,
          'ENV_UNSUPPORTED: chat search visibility/manager/sort filters',
        );
      requireValue(
        typeof body.query === 'string' || Array.isArray(filter.member_ids),
        'query or member_ids required',
      );
      const keyword = String(body.query || '')
        .replace(/^"|"$/g, '')
        .toLowerCase();
      const matches = world.chats.filter(
        (chat) =>
          chat.chat_mode !== 'p2p' &&
          (chat.name.toLowerCase().includes(keyword) ||
            (!filter.disable_search_by_user &&
              (chat.member_ids || []).some((id: string) =>
                world.base.records.some(
                  (record) =>
                    record.fields.collection === 'lookup_users' &&
                    record.fields.id === id &&
                    String(record.fields.real_name || record.fields.name || '')
                      .toLowerCase()
                      .includes(keyword),
                ),
              ))) &&
          (!filter.chat_modes ||
            filter.chat_modes.includes(
              chat.chat_mode === 'topic' ? 'thread' : 'default',
            )) &&
          (!filter.member_ids ||
            filter.member_ids.every((id: string) =>
              (chat.member_ids || []).includes(id),
            )),
      );
      const result = page(matches, q);
      return {
        ...result,
        total: matches.length,
        items: result.items.map((chat) => ({ meta_data: chat })),
      };
    }
    if (method === 'POST' && p === '/open-apis/im/v1/chats')
      return createChat(world, q, body);
    const chatPath = p.match(/^\/open-apis\/im\/v1\/chats\/([^/]+)$/);
    if (method === 'GET' && chatPath) {
      const chat = world.chats.find((c) => c.chat_id === chatPath[1]);
      if (!chat) fail(404, 232001, 'Chat not found');
      return structuredClone(chat);
    }
    if (method === 'GET' && p === '/open-apis/im/v1/chats')
      return page(world.chats, q);
    if (method === 'POST' && p === '/open-apis/im/v1/messages') {
      requireValue(
        q.get('receive_id_type') === 'chat_id' &&
          world.chats.some((c) => c.chat_id === body.receive_id),
        'Unknown chat or receive_id_type',
      );
      requireValue(
        body.msg_type === 'text',
        'Only text messages are supported in this case',
      );
      let content;
      try {
        content = JSON.parse(body.content);
      } catch {
        fail(400, 99992402, 'content must be JSON-encoded text');
      }
      requireValue(
        typeof content.text === 'string' && content.text.length > 0,
        'text required',
      );
      const msg = {
        message_id: `om_${nextMessage++}`,
        chat_id: body.receive_id,
        msg_type: 'text',
        body: { content: body.content },
        create_time: String(Date.parse(world.now)),
      };
      world.messages.push(msg);
      return structuredClone(msg);
    }
    if (method === 'GET' && p === '/open-apis/im/v1/messages')
      return page(
        world.messages.filter((x) => x.chat_id === q.get('container_id')),
        q,
      );
    if (method === 'GET' && p.startsWith('/open-apis/im/v1/messages/')) {
      const msg = world.messages.find(
        (x) => x.message_id === p.split('/').at(-1),
      );
      if (!msg) fail(404, 230001, 'Message not found');
      return { items: [structuredClone(msg)] };
    }
  };
}
