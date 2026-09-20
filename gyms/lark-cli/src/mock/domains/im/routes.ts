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
