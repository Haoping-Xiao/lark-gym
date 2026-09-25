import { directory } from '../contact.ts';
import type { ApiObject, World } from '../../../types.ts';
import { fail } from '../../errors.ts';

// Opt-in simulator contract: resolve individual group-member open IDs. No push
// delivery or read receipt is implied by a recorded mention.
export function mentionContent(
  world: Pick<World, 'base' | 'chats'>,
  chatId: string,
  content: string,
): { content: string; mentions?: ApiObject[] } {
  const body = JSON.parse(content);
  if (!/<at\b/i.test(body.text)) return { content };
  const chat = world.chats.find((c) => c.chat_id === chatId);
  if (!chat?.mention_support)
    fail(
      501,
      990001,
      'ENV_UNSUPPORTED: mentions require a seeded group contract',
    );
  const users = directory(world);
  const mentions: ApiObject[] = [];
  let unsupported = false;
  const text = body.text.replace(
    /<at\s+user_id="([^"]+)"\s*>([^<]*)<\/at>/g,
    (_: string, id: string, label: string) => {
      if (id === 'all') {
        unsupported = true;
        return label;
      }
      const user = users.find((u) => u.open_id === id);
      // Invalid IDs and non-members render their labels without an effective
      // mention. Literal display names never prove that a member was tagged.
      if (!user || !(chat.member_ids || []).includes(user.user_id))
        return label;
      let mention = mentions.find((m) => m.id === id);
      if (!mention) {
        mention = {
          key: `@_user_${mentions.length + 1}`,
          id,
          id_type: 'open_id',
          name: user.name,
        };
        mentions.push(mention);
      }
      return mention.key;
    },
  );
  if (unsupported || /<at\b/i.test(text))
    fail(501, 990001, 'ENV_UNSUPPORTED: mention syntax or everyone mention');
  return {
    content: JSON.stringify({ ...body, text }),
    ...(mentions.length ? { mentions } : {}),
  };
}
