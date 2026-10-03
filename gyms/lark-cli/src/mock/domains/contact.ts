import { createHash } from 'node:crypto';
import { fail, requireValue } from '../errors.ts';
import { page } from '../pagination.ts';
import type { ApiRequest } from '../types.ts';

type DirectoryWorld = {
  base: { records: { fields: Record<string, string | number> }[] };
  chats: { chat_id: string; name?: string; chat_mode?: string }[];
};
export const openId = (id: string) =>
  `ou_mock_${createHash('sha256').update(id).digest('hex').slice(0, 24)}`;

// Protocol identities are deterministic simulator aliases, not real Feishu IDs.
// Business names/emails come only from existing user records or P2P recipients.
export function directory(world: DirectoryWorld) {
  const users = world.base.records
    .filter((r) => r.fields.collection === 'lookup_users')
    .map(({ fields }) => ({
      user_id: String(fields.id),
      open_id: openId(String(fields.id)),
      name: String(fields.real_name || fields.name || fields.id),
      email: typeof fields.email === 'string' ? fields.email : '',
      chat_id:
        world.chats.find((chat) => chat.chat_id === `oc_user_${fields.id}`)
          ?.chat_id || '',
    }));
  for (const chat of world.chats) {
    if (
      chat.chat_mode !== 'p2p' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chat.name || '')
    )
      continue;
    const email = chat.name!;
    const known = users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
    if (known) {
      known.chat_id ||= chat.chat_id;
      continue;
    }
    const id = `mail_${createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 24)}`;
    users.push({
      user_id: id,
      open_id: openId(id),
      name: email,
      email,
      chat_id: chat.chat_id,
    });
  }
  return users;
}
export function contactRoutes(
  world: DirectoryWorld,
  { method, path, query, body }: ApiRequest,
) {
  const prefix = '/open-apis/contact/v3/users';
  if (!path.startsWith(prefix)) return;
  const users = directory(world);
  if (method === 'POST' && path === prefix + '/search') {
    if (
      Object.keys(body).some((key) => !['query', 'filter'].includes(key)) ||
      [...query.keys()].some(
        (key) => !['page_size', 'page_token'].includes(key),
      )
    )
      fail(501, 990001, 'ENV_UNSUPPORTED: contact search option');
    const filter = body.filter ?? {};
    requireValue(
      filter && typeof filter === 'object' && !Array.isArray(filter),
      'Invalid contact filter',
    );
    if (
      Object.keys(filter).some(
        (key) => !['user_ids', 'has_contact'].includes(key),
      )
    )
      fail(
        501,
        990001,
        'ENV_UNSUPPORTED: organization/employment contact filters',
      );
    requireValue(
      body.query === undefined || typeof body.query === 'string',
      'Invalid query',
    );
    requireValue(
      filter.user_ids === undefined ||
        (Array.isArray(filter.user_ids) &&
          filter.user_ids.every((id: unknown) => typeof id === 'string')),
      'Invalid user_ids',
    );
    requireValue(
      filter.has_contact === undefined ||
        typeof filter.has_contact === 'boolean',
      'Invalid has_contact',
    );
    if (filter.user_ids?.includes('me'))
      fail(501, 990001, 'ENV_UNSUPPORTED: current directory user');
    requireValue(
      Number(query.get('page_size') || 20) <= 30,
      'page_size exceeds 30',
    );
    const keyword = String(body.query || '').toLowerCase();
    const matches = users.filter(
      (user) =>
        (!filter.user_ids || filter.user_ids.includes(user.open_id)) &&
        (!filter.has_contact || user.chat_id) &&
        `${user.name} ${user.email}`.toLowerCase().includes(keyword),
    );
    const result = page(matches, query);
    return {
      ...result,
      notice:
        'Mock directory aliases; activation/tenant metadata describe simulator accounts, not source employment or tenant facts.',
      items: result.items.map((user) => ({
        id: user.open_id,
        meta_data: {
          i18n_names: { en_us: user.name, zh_cn: user.name },
          mail_address: user.email,
          chat_id: user.chat_id,
          is_registered: true,
          is_cross_tenant: false,
        },
      })),
    };
  }
  const single = path.slice(prefix.length + 1);
  const batch = method === 'POST' && path === prefix + '/basic_batch';
  if (batch || (method === 'GET' && single && !single.includes('/'))) {
    if (
      [...query.keys()].some((key) => key !== 'user_id_type') ||
      (batch && Object.keys(body).some((key) => key !== 'user_ids'))
    )
      fail(501, 990001, 'ENV_UNSUPPORTED: contact profile option');
    const type = query.get('user_id_type') || 'open_id';
    if (!['open_id', 'user_id'].includes(type))
      fail(501, 990001, 'ENV_UNSUPPORTED: directory ID namespace');
    const ids = batch ? body.user_ids : [decodeURIComponent(single)];
    requireValue(
      Array.isArray(ids) &&
        ids.length > 0 &&
        ids.length <= 100 &&
        ids.every((id: unknown) => typeof id === 'string'),
      'user_ids requires 1..100 IDs',
    );
    const values = ids.map((id: string) => {
      const user = users.find(
        (user) => (type === 'open_id' ? user.open_id : user.user_id) === id,
      );
      if (!user) fail(404, 41050, 'User not found');
      return { ...user };
    });
    return batch ? { users: values } : { user: values[0] };
  }
}
