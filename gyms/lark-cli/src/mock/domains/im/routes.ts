import { directory, openId } from '../contact.ts';
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
  const sentByUuid = new Map<
    string,
    { time: number; fingerprint: string; message: ApiObject }
  >();
  return ({ method, path: p, query: q, body, identity = 'user' }) => {
    if (method === 'POST' && p === '/open-apis/im/v1/chat_p2p/batch_query') {
      if (identity !== 'user') fail(403, 99991672, 'User identity required');
      if (
        [...q.keys()].some((k) => k !== 'chatter_id_type') ||
        Object.keys(body).some((k) => k !== 'chatter_ids') ||
        q.get('chatter_id_type') !== 'open_id'
      )
        fail(501, 990001, 'ENV_UNSUPPORTED: P2P lookup option or ID namespace');
      requireValue(
        Array.isArray(body.chatter_ids) &&
          body.chatter_ids.length > 0 &&
          body.chatter_ids.every(
            (id: unknown) => typeof id === 'string' && id.length > 0,
          ),
        'chatter_ids must contain user IDs',
      );
      const users = directory(world);
      return {
        p2p_chats: body.chatter_ids.flatMap((id: string) => {
          const user = users.find((u) => u.open_id === id);
          const chat = world.chats.find(
            (c) => c.chat_id === user?.chat_id && c.chat_mode === 'p2p',
          );
          return chat ? [{ chat_id: chat.chat_id }] : [];
        }),
      };
    }
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
    const membersListPath = p.match(
      /^\/open-apis\/im\/v1\/chats\/([^/]+)\/members\/list$/,
    );
    if (method === 'GET' && membersListPath) {
      if (
        [...q.keys()].some(
          (key) => !['member_id_type', 'page_size', 'page_token'].includes(key),
        )
      )
        fail(501, 990001, 'ENV_UNSUPPORTED: member list option');
      requireValue(
        Number(q.get('page_size') || 100) <= 100,
        'page_size exceeds 100',
      );
      const result = chatMembers(
        world,
        method,
        decodeURIComponent(membersListPath[1]),
        q,
        body,
      );
      requireValue('items' in result, 'Invalid membership read result');
      return {
        users: result.items,
        bots: [],
        has_more: result.has_more,
        page_token: result.page_token,
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
              (chat.member_ids || []).some(
                (member: string) => member === id || openId(member) === id,
              ),
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
      if (
        [...q.keys()].some((k) => k !== 'receive_id_type') ||
        Object.keys(body).some(
          (k) => !['receive_id', 'msg_type', 'content', 'uuid'].includes(k),
        )
      )
        fail(501, 990001, 'ENV_UNSUPPORTED: message send option');
      const type = q.get('receive_id_type');
      if (type && !['chat_id', 'open_id'].includes(type))
        fail(501, 990001, 'ENV_UNSUPPORTED: message receiver ID namespace');
      const chatId =
        type === 'chat_id'
          ? body.receive_id
          : type === 'open_id'
            ? directory(world).find((u) => u.open_id === body.receive_id)
                ?.chat_id
            : undefined;
      requireValue(
        typeof chatId === 'string' &&
          world.chats.some(
            (c) =>
              c.chat_id === chatId &&
              (type === 'chat_id' || c.chat_mode === 'p2p'),
          ),
        'Unknown chat or receive_id_type',
      );
      if (
        [
          'post',
          'image',
          'file',
          'audio',
          'media',
          'interactive',
          'share_chat',
          'share_user',
        ].includes(body.msg_type)
      )
        fail(501, 990001, 'ENV_UNSUPPORTED: non-text message content');
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
      requireValue(
        body.uuid === undefined ||
          (typeof body.uuid === 'string' &&
            body.uuid.length > 0 &&
            body.uuid.length <= 50),
        'uuid must contain 1..50 characters',
      );
      const now = Date.parse(world.now);
      const fingerprint = JSON.stringify({
        identity,
        chatId,
        content: body.content,
      });
      const cached = body.uuid && sentByUuid.get(body.uuid);
      if (cached && now - cached.time < 60 * 60 * 1000) {
        if (cached.fingerprint !== fingerprint)
          fail(
            501,
            990001,
            'ENV_UNSUPPORTED: conflicting payload or actor for an active message uuid',
          );
        return structuredClone(cached.message);
      }
      const msg = {
        message_id: `om_${nextMessage++}`,
        chat_id: chatId,
        msg_type: 'text',
        body: { content: body.content },
        create_time: String(Date.parse(world.now)),
      };
      world.messages.push(msg);
      if (body.uuid)
        sentByUuid.set(body.uuid, {
          time: now,
          fingerprint,
          message: structuredClone(msg),
        });
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
