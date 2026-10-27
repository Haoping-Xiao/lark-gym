import type { World } from '../../types.ts';
import { mailMessageRoutes } from './mail-messages.ts';
import type { RouteHandler } from '../types.ts';
import { fail, requireValue } from '../errors.ts';
import { evaluationIdentity } from './identity.ts';

// The fixture grants access to its one evaluation user's primary mailbox.
// No public mailboxes, aliases or message data are inferred from recipient names.
export const createMailRoutes =
  (world: World): RouteHandler =>
  ({ method, path, query, body, identity = 'user' }) => {
    const route = /^\/open-apis\/mail\/v1\/user_mailboxes\/([^/]+)\/(.+)$/.exec(
      path,
    );
    if (route && !['profile', 'accessible_mailboxes'].includes(route[2]))
      return mailMessageRoutes(
        world,
        { method, path, query, body, identity },
        route[1] === 'me' ? evaluationIdentity.email : route[1],
        route[2],
      );
    const match =
      /^\/open-apis\/mail\/v1\/user_mailboxes\/([^/]+)\/(profile|accessible_mailboxes)$/.exec(
        path,
      );
    if (method !== 'GET' || !match) return;
    if (query.size || Object.keys(body).length)
      fail(501, 990001, 'ENV_UNSUPPORTED: mailbox identity lookup options');
    const [, mailbox, operation] = match;
    if (operation === 'profile') {
      if (identity !== 'user') fail(403, 99991672, 'User identity required');
      requireValue(mailbox === 'me', 'Mailbox profile requires me');
      return { primary_email_address: evaluationIdentity.email };
    }
    requireValue(
      identity === 'user' || mailbox !== 'me',
      'Bot identity requires a user email address',
    );
    if (mailbox !== 'me' && mailbox.toLowerCase() !== evaluationIdentity.email)
      fail(403, 99991672, 'Mailbox is outside this fixture identity');
    return {
      accessible_mailboxes: [
        { email_address: evaluationIdentity.email, email_type: 'USER_PRIMARY' },
        ...(world.mail?.mailboxes || [])
          .filter(
            (m) => m.email_address.toLowerCase() !== evaluationIdentity.email,
          )
          .map((m) => ({
            email_address: m.email_address,
            email_type: m.email_type || 'PUBLIC_MAILBOX',
          })),
      ],
    };
  };
