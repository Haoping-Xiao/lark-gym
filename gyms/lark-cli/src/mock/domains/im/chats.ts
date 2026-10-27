import { openId } from '../contact.ts';
import { fail } from '../../errors.ts';
import { page } from '../../pagination.ts';

type Chat = {
  chat_id: string;
  chat_mode?: string;
  can_manage_members?: boolean;
  member_ids?: string[];
};
type World = {
  chats: Chat[];
  base: { records: { fields: Record<string, string | number> }[] };
};
// This fixture models user_id memberships and explicit caller management rights.
export function chatMembers(
  world: World,
  method: string,
  chatId: string,
  query: URLSearchParams,
  body: { id_list?: unknown },
) {
  const chat = world.chats.find((c) => c.chat_id === chatId);
  if (!chat) return fail(404, 232001, 'Chat not found');
  if (chat.chat_mode === 'p2p') return fail(400, 232002, 'Group chat required');
  const idType = query.get('member_id_type') || 'open_id';
  if (!['user_id', 'open_id'].includes(idType))
    return fail(
      501,
      990001,
      'ENV_UNSUPPORTED: unsupported membership ID namespace',
    );
  const users = world.base.records.filter(
    (r) => r.fields.collection === 'lookup_users',
  );
  const members = chat.member_ids || [];
  if (method === 'GET')
    return page(
      members.map((id) => ({
        member_id: idType === 'open_id' ? openId(id) : id,
        member_id_type: idType,
        name: users.find((r) => r.fields.id === id)?.fields.real_name || id,
      })),
      query,
    );
  if (!['POST', 'DELETE'].includes(method))
    return fail(501, 990001, 'ENV_UNSUPPORTED: membership method');
  if (!chat.can_manage_members) return fail(403, 99991672, 'Permission denied');
  const ids = body.id_list;
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.length > 50 ||
    ids.some((id) => typeof id !== 'string')
  )
    return fail(400, 232003, 'id_list requires 1..50 user IDs');
  const resolveId = (id: string) =>
    users.find(
      (r) =>
        (idType === 'open_id' ? openId(String(r.fields.id)) : r.fields.id) ===
        id,
    )?.fields.id;
  const invalid = ids.filter((id) => !resolveId(id));
  const mode = query.get('succeed_type') || '0';
  if (!['0', '1', '2'].includes(mode))
    return fail(400, 232003, 'Invalid succeed_type');
  if (invalid.length && mode !== '1')
    return fail(400, 232004, 'Unknown user ID; no membership changed');
  const valid = ids
    .filter((id) => !invalid.includes(id))
    .map((id) => String(resolveId(id)));
  chat.member_ids =
    method === 'POST'
      ? [...new Set([...members, ...valid])]
      : members.filter((id) => !valid.includes(id));
  return {
    invalid_id_list: invalid,
    not_existed_id_list: invalid,
    pending_approval_id_list: [],
  };
}

// Group creation uses the same chat and membership state as list/read/send.
export function createChat(
  world: World & { chat_creation_allowed?: boolean },
  query: URLSearchParams,
  body: Record<string, unknown>,
) {
  if (!world.chat_creation_allowed)
    return fail(403, 99991672, 'Chat creation not permitted');
  if (query.get('user_id_type') !== 'user_id')
    return fail(501, 990001, 'ENV_UNSUPPORTED: chat creation requires user_id');
  if (
    Object.keys(body).some(
      (key) =>
        ![
          'name',
          'description',
          'chat_mode',
          'chat_type',
          'user_id_list',
        ].includes(key),
    ) ||
    query.has('uuid')
  )
    return fail(501, 990001, 'ENV_UNSUPPORTED: chat creation option');
  if (
    typeof body.name !== 'string' ||
    !body.name.trim() ||
    (body.description !== undefined && typeof body.description !== 'string') ||
    (body.chat_mode && body.chat_mode !== 'group') ||
    (body.chat_type && !['private', 'public'].includes(String(body.chat_type)))
  )
    return fail(400, 232003, 'Invalid group fields');
  const ids = body.user_id_list || [];
  if (
    !Array.isArray(ids) ||
    ids.some(
      (id) =>
        typeof id !== 'string' ||
        !world.base.records.some(
          (r) => r.fields.collection === 'lookup_users' && r.fields.id === id,
        ),
    )
  )
    return fail(400, 232004, 'Unknown user ID; no chat created');
  let index = 1;
  while (world.chats.some((c) => c.chat_id === `oc_created_${index}`)) index++;
  const chat = {
    chat_id: `oc_created_${index}`,
    name: body.name,
    description: body.description || '',
    chat_mode: 'group',
    chat_type: body.chat_type || 'private',
    member_ids: [...new Set(ids)],
    can_manage_members: true,
  };
  world.chats.push(chat);
  return chat;
}
