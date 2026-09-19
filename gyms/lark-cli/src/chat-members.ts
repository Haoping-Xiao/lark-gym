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
type Fail = (status: number, code: number, message: string) => never;
// This fixture models user_id memberships and explicit caller management rights.
export function chatMembers(
  world: World,
  method: string,
  chatId: string,
  query: URLSearchParams,
  body: { id_list?: unknown },
  fail: Fail,
  page: (items: unknown[], query: URLSearchParams) => unknown,
) {
  const chat = world.chats.find((c) => c.chat_id === chatId);
  if (!chat) return fail(404, 232001, 'Chat not found');
  if (chat.chat_mode === 'p2p') return fail(400, 232002, 'Group chat required');
  if (query.get('member_id_type') !== 'user_id')
    return fail(
      501,
      990001,
      'ENV_UNSUPPORTED: membership fixture requires member_id_type=user_id',
    );
  const users = world.base.records.filter(
    (r) => r.fields.collection === 'lookup_users',
  );
  const members = chat.member_ids || [];
  if (method === 'GET')
    return page(
      members.map((id) => ({
        member_id: id,
        member_id_type: 'user_id',
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
  const invalid = ids.filter((id) => !users.some((r) => r.fields.id === id));
  const mode = query.get('succeed_type') || '0';
  if (!['0', '1', '2'].includes(mode))
    return fail(400, 232003, 'Invalid succeed_type');
  if (invalid.length && mode !== '1')
    return fail(400, 232004, 'Unknown user ID; no membership changed');
  const valid = ids.filter((id) => !invalid.includes(id));
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
