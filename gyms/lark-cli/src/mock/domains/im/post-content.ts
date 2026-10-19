import { directory } from '../contact.ts';
import type { ApiObject, World } from '../../../types.ts';
import { fail, requireValue } from '../../errors.ts';
export function postContent(
  world: Pick<World, 'base' | 'chats'>,
  chatId: string,
  content: string,
): { content: string; mentions?: ApiObject[] } {
  const chat = world.chats.find((c) => c.chat_id === chatId);
  if (!chat?.post_support)
    fail(
      501,
      990001,
      'ENV_UNSUPPORTED: rich post requires a seeded group contract',
    );
  const payload = JSON.parse(content);
  requireValue(
    payload && typeof payload === 'object' && !Array.isArray(payload),
    'Post object required',
  );
  requireValue(Object.keys(payload).length > 0, 'Post locale required');
  const users = directory(world),
    mentions: ApiObject[] = [];
  for (const [locale, raw] of Object.entries(payload)) {
    if (!['zh_cn', 'en_us', 'ja_jp'].includes(locale))
      fail(501, 990001, 'ENV_UNSUPPORTED: post locale');
    const post = raw as ApiObject;
    requireValue(
      post && typeof post === 'object' && !Array.isArray(post),
      'Invalid post locale',
    );
    if (Object.keys(post).some((k) => !['title', 'content'].includes(k)))
      fail(501, 990001, 'ENV_UNSUPPORTED: post properties');
    requireValue(
      (post.title === undefined || typeof post.title === 'string') &&
        Array.isArray(post.content),
      'Post title/content required',
    );
    for (const line of post.content) {
      requireValue(Array.isArray(line), 'Post paragraph must be an array');
      for (const node of line) {
        requireValue(
          node && typeof node === 'object' && !Array.isArray(node),
          'Post node required',
        );
        if (!['text', 'a', 'at', 'md'].includes(node.tag))
          fail(501, 990001, 'ENV_UNSUPPORTED: post node');
        const allowed =
          node.tag === 'at'
            ? ['tag', 'user_id', 'user_name', 'style']
            : node.tag === 'a'
              ? ['tag', 'text', 'href', 'style']
              : ['tag', 'text', 'style', 'un_escape'];
        if (Object.keys(node).some((k) => !allowed.includes(k)))
          fail(501, 990001, 'ENV_UNSUPPORTED: post node properties');
        if (node.style !== undefined)
          requireValue(
            Array.isArray(node.style) &&
              node.style.every((s: unknown) =>
                ['bold', 'italic', 'underline', 'lineThrough'].includes(
                  String(s),
                ),
              ),
            'Invalid post style',
          );
        if (node.un_escape === true)
          fail(501, 990001, 'ENV_UNSUPPORTED: post entity unescape');
        if (node.tag === 'at') {
          requireValue(
            typeof node.user_id === 'string',
            'Mention user_id required',
          );
          if (node.user_id === 'all')
            fail(501, 990001, 'ENV_UNSUPPORTED: everyone mention');
          const user = users.find((u) => u.open_id === node.user_id);
          if (
            user &&
            (chat.member_ids || []).includes(user.user_id) &&
            !mentions.some((m) => m.id === user.open_id)
          )
            mentions.push({
              key: `@_user_${mentions.length + 1}`,
              id: user.open_id,
              id_type: 'open_id',
              name: user.name,
            });
        } else {
          requireValue(typeof node.text === 'string', 'Post text required');
          if (node.tag === 'md' && /<at\b/i.test(node.text))
            fail(
              501,
              990001,
              'ENV_UNSUPPORTED: mention markup inside markdown',
            );
          if (node.tag === 'a')
            requireValue(
              typeof node.href === 'string' &&
                /^https?:\/\/\S+$/i.test(node.href),
              'HTTP(S) post link required',
            );
        }
      }
    }
  }
  return { content, ...(mentions.length ? { mentions } : {}) };
}
