import { randomUUID } from 'node:crypto';
import type { ApiObject, World } from '../../types.ts';
import type { ApiRequest, ResponseData } from '../types.ts';
import { fail, requireValue } from '../errors.ts';
import { page } from '../pagination.ts';
import { parseMail } from './mail-mime.ts';

function options(object: object, allowed: string[]) {
  if (Object.keys(object).some((k) => !allowed.includes(k)))
    fail(501, 990001, 'ENV_UNSUPPORTED: mail options');
}
function rendered(message: ApiObject, format = 'full', draft = false) {
  requireValue(
    ['full', 'metadata', ...(draft ? ['raw'] : ['plain_text_full'])].includes(
      format,
    ),
    'Invalid mail format',
  );
  if (format === 'raw') return { raw: message.raw };
  const { mailbox_id, raw, ...result } = structuredClone(message);
  if (format === 'metadata') {
    delete result.body_html;
    delete result.body_plain_text;
  }
  if (format === 'plain_text_full') delete result.body_html;
  return result;
}
export function mailMessageRoutes(
  world: World,
  request: ApiRequest,
  mailbox: string,
  tail: string,
): ResponseData | undefined {
  // Tasks opt into a seeded mail environment; absent mail is a coverage gap.
  if (!world.mail) return;
  const { method, query, identity = 'user' } = request;
  const body = request.body ?? {};
  requireValue(
    typeof body === 'object' && !Array.isArray(body),
    'Mail body must be an object',
  );
  if (identity !== 'user')
    fail(403, 99991672, 'User identity required for this mailbox');
  const store = world.mail;
  const owner = store.mailboxes.find(
    (m) => m.email_address.toLowerCase() === mailbox.toLowerCase(),
  );
  if (!owner) fail(403, 99991672, 'Mailbox is outside fixture access');
  const messages = () =>
    store.messages.filter((m) => m.mailbox_id === owner.email_address);
  const drafts = () =>
    store.drafts.filter((d) => d.mailbox_id === owner.email_address);
  const get = (id: string) => {
    const m = messages().find((m) => m.message_id === id);
    if (!m) fail(404, 123001, 'Mail message not found');
    return m;
  };
  const pagination = (items: any[], max: number) => {
    requireValue(
      Number(query.get('page_size') || 20) <= max,
      'page_size out of range',
    );
    const q = new URLSearchParams(query);
    if (!q.has('page_size')) q.set('page_size', '20');
    return page(items, q);
  };
  const folders = ['INBOX', 'SENT', 'DRAFT', 'TRASH', 'SPAM', 'ARCHIVED'];
  if (tail === 'folders' && method === 'GET') {
    options(Object.fromEntries(query), ['folder_type']);
    options(body, []);
    requireValue(
      !query.has('folder_type') ||
        ['1', '2'].includes(query.get('folder_type')!),
      'Invalid folder_type',
    );
    return {
      items:
        query.get('folder_type') === '2'
          ? []
          : folders.map((id) => ({
              id,
              name: id,
              parent_folder_id: '0',
              folder_type: 1,
              unread_message_count: messages().filter(
                (m) => m.folder_id === id && m.label_ids.includes('UNREAD'),
              ).length,
              unread_thread_count: new Set(
                messages()
                  .filter(
                    (m) => m.folder_id === id && m.label_ids.includes('UNREAD'),
                  )
                  .map((m) => m.thread_id),
              ).size,
            })),
    };
  }
  const change = /^messages\/([^/]+)\/(modify|trash|send_status)$/.exec(tail);
  if (
    change &&
    ((change[2] === 'send_status' && method === 'GET') ||
      (change[2] === 'modify' && method === 'PUT') ||
      (change[2] === 'trash' && method === 'POST'))
  ) {
    const m = get(change[1]);
    options(Object.fromEntries(query), []);
    if (change[2] === 'send_status' && method === 'GET') {
      options(body, []);
      requireValue(m.message_state === 2, 'Message has not been sent');
      return {
        message_id: m.message_id,
        details: [...m.to, ...m.cc, ...m.bcc].map((recipient) => ({
          recipient,
          status: 4,
          last_updated_time: Math.floor(Number(m.internal_date) / 1000),
        })),
      };
    }
    if (change[2] === 'modify' && method === 'PUT') {
      options(body, ['add_label_ids', 'remove_label_ids', 'add_folder']);
      const add = body.add_label_ids || [],
        remove = body.remove_label_ids || [];
      requireValue(
        Array.isArray(add) &&
          Array.isArray(remove) &&
          [...add, ...remove].every((x) => typeof x === 'string'),
        'Invalid labels',
      );
      if (
        [...add, ...remove].some(
          (x) => !['UNREAD', 'IMPORTANT', 'OTHER', 'FLAGGED'].includes(x),
        )
      )
        fail(501, 990001, 'ENV_UNSUPPORTED: custom mail label');
      requireValue(
        !add.some((x) => remove.includes(x)),
        'Conflicting label changes',
      );
      if (body.add_folder !== undefined)
        requireValue(
          folders.includes(body.add_folder) &&
            body.add_folder !== 'DRAFT' &&
            m.message_state !== 3,
          'Invalid folder move',
        );
      m.label_ids = [
        ...new Set([
          ...m.label_ids.filter((x: string) => !remove.includes(x)),
          ...add,
        ]),
      ];
      if (body.add_folder) m.folder_id = body.add_folder;
      return {};
    }
    if (change[2] === 'trash' && method === 'POST') {
      options(body, []);
      requireValue(m.message_state !== 3, 'Delete drafts through drafts API');
      m.folder_id = 'TRASH';
      return {};
    }
  }
  const threadPath = /^threads\/([^/]+)$/.exec(tail);
  if (threadPath && method === 'GET') {
    options(Object.fromEntries(query), ['format', 'include_spam_trash']);
    options(body, []);
    requireValue(
      !query.has('include_spam_trash') ||
        ['true', 'false'].includes(query.get('include_spam_trash')!),
      'Invalid include_spam_trash',
    );
    const selected = messages()
      .filter(
        (m) =>
          m.thread_id === threadPath[1] &&
          (query.get('include_spam_trash') === 'true' ||
            !['SPAM', 'TRASH'].includes(m.folder_id)),
      )
      .sort((a, b) => Number(a.internal_date) - Number(b.internal_date));
    if (!selected.length) fail(404, 123002, 'Mail thread not found');
    return {
      thread: {
        id: threadPath[1],
        body_preview: selected.at(-1)!.body_preview,
        messages: selected.map((m) =>
          rendered(m, query.get('format') || 'full'),
        ),
      },
    };
  }
  if (tail === 'threads' && method === 'GET') {
    options(Object.fromEntries(query), [
      'page_size',
      'page_token',
      'folder_id',
      'label_id',
      'only_unread',
    ]);
    options(body, []);
    requireValue(
      query.has('folder_id') !== query.has('label_id'),
      'Exactly one folder_id or label_id required',
    );
    requireValue(
      !query.has('only_unread') ||
        ['true', 'false'].includes(query.get('only_unread')!),
      'Invalid only_unread',
    );
    if (query.has('folder_id') && !folders.includes(query.get('folder_id')!))
      fail(501, 990001, 'ENV_UNSUPPORTED: thread folder');
    if (
      query.has('label_id') &&
      !['IMPORTANT', 'OTHER', 'FLAGGED'].includes(query.get('label_id')!)
    )
      fail(501, 990001, 'ENV_UNSUPPORTED: thread label');
    const grouped = new Map<string, ApiObject[]>();
    for (const m of messages()) {
      if (query.has('folder_id') && m.folder_id !== query.get('folder_id'))
        continue;
      if (
        query.has('label_id') &&
        !m.label_ids.includes(query.get('label_id')!)
      )
        continue;
      const items = grouped.get(m.thread_id) || [];
      items.push(m);
      grouped.set(m.thread_id, items);
    }
    const items = [...grouped.entries()]
      .filter(
        ([, ms]) =>
          query.get('only_unread') !== 'true' ||
          ms.some((m) => m.label_ids.includes('UNREAD')),
      )
      .map(([id, ms]) => ({
        id,
        latest: ms.sort(
          (a, b) => Number(b.internal_date) - Number(a.internal_date),
        )[0],
      }))
      .sort(
        (a, b) =>
          Number(b.latest.internal_date) - Number(a.latest.internal_date),
      )
      .map(({ id, latest }) => ({ id, body_preview: latest.body_preview }));
    return pagination(items, 20);
  }
  if (tail === 'settings/signatures' && method === 'GET') {
    options(Object.fromEntries(query), []);
    options(body, []);
    return { signatures: [], usages: [] };
  }
  if (tail === 'messages' && method === 'GET') {
    options(Object.fromEntries(query), [
      'page_size',
      'page_token',
      'folder_id',
      'only_unread',
      'label_id',
    ]);
    options(body, []);
    requireValue(
      !query.has('only_unread') ||
        ['true', 'false'].includes(query.get('only_unread')!),
      'Invalid only_unread',
    );
    return pagination(
      messages()
        .filter(
          (m) =>
            (!query.has('folder_id') ||
              m.folder_id === query.get('folder_id')) &&
            (query.get('only_unread') !== 'true' ||
              m.label_ids.includes('UNREAD')) &&
            (!query.has('label_id') ||
              m.label_ids.includes(query.get('label_id')!)),
        )
        .map((m) => m.message_id),
      20,
    );
  }
  if (tail === 'messages/batch_get' && method === 'POST') {
    options(Object.fromEntries(query), []);
    options(body, ['message_ids', 'format']);
    requireValue(
      Array.isArray(body.message_ids) &&
        body.message_ids.length > 0 &&
        body.message_ids.length <= 20 &&
        body.message_ids.every((id: unknown) => typeof id === 'string'),
      'message_ids must contain 1–20 IDs',
    );
    return {
      messages: body.message_ids.map((id: string) =>
        rendered(get(id), body.format),
      ),
    };
  }
  const messagePath = /^messages\/([^/]+)$/.exec(tail);
  if (messagePath && method === 'GET') {
    options(Object.fromEntries(query), ['format']);
    options(body, []);
    return {
      message: rendered(get(messagePath[1]), query.get('format') || 'full'),
    };
  }
  if (tail === 'search' && method === 'POST') {
    options(Object.fromEntries(query), ['page_size', 'page_token']);
    options(body, ['query', 'filter']);
    requireValue(
      body.query === undefined || typeof body.query === 'string',
      'query must be a string',
    );
    const f = body.filter || {};
    requireValue(typeof f === 'object' && !Array.isArray(f), 'Invalid filter');
    options(f, [
      'from',
      'to',
      'cc',
      'bcc',
      'subject',
      'is_unread',
      'has_attachment',
      'folder',
      'create_time',
    ]);
    for (const field of ['from', 'to', 'cc', 'bcc', 'folder'])
      if (f[field] !== undefined)
        requireValue(
          Array.isArray(f[field]) &&
            f[field].every((x: unknown) => typeof x === 'string'),
          `Invalid ${field} filter`,
        );
    for (const field of ['is_unread', 'has_attachment'])
      if (f[field] !== undefined)
        requireValue(typeof f[field] === 'boolean', `Invalid ${field}`);
    if (f.subject !== undefined)
      requireValue(typeof f.subject === 'string', 'Invalid subject');
    if (f.create_time) {
      options(f.create_time, ['start_time', 'end_time']);
      for (const v of Object.values(f.create_time))
        requireValue(
          typeof v === 'string' && /^\d+$/.test(v),
          'Invalid create_time',
        );
    }
    const has = (a: string, b: string) =>
      a.toLowerCase().includes(b.toLowerCase());
    const matches = messages()
      .filter((m) => {
        const text = [
          m.subject,
          Buffer.from(m.body_plain_text || '', 'base64url').toString(),
          Buffer.from(m.body_html || '', 'base64url').toString(),
        ].join('\n');
        if (body.query && !has(text, body.query)) return false;
        if (f.subject && !has(m.subject, f.subject)) return false;
        for (const field of ['from', 'to', 'cc', 'bcc'])
          if (f[field]?.length) {
            const a = field === 'from' ? [m.head_from] : m[field];
            if (
              !f[field].some((needle: string) =>
                a.some(
                  (v: any) =>
                    has(v.mail_address, needle) || has(v.name || '', needle),
                ),
              )
            )
              return false;
          }
        if (
          f.folder?.length &&
          !f.folder.some(
            (name: string) =>
              name.toUpperCase().replace(/^ARCHIVE$/, 'ARCHIVED') ===
                m.folder_id ||
              ((
                {
                  priority: 'IMPORTANT',
                  flagged: 'FLAGGED',
                  other: 'OTHER',
                } as Record<string, string>
              )[name] &&
                m.label_ids.includes(
                  (
                    {
                      priority: 'IMPORTANT',
                      flagged: 'FLAGGED',
                      other: 'OTHER',
                    } as Record<string, string>
                  )[name],
                )),
          )
        )
          return false;
        if (
          f.is_unread !== undefined &&
          m.label_ids.includes('UNREAD') !== f.is_unread
        )
          return false;
        if (
          f.has_attachment !== undefined &&
          Boolean(m.attachments?.length) !== f.has_attachment
        )
          return false;
        if (
          f.create_time?.start_time &&
          Number(m.internal_date) < Number(f.create_time.start_time) * 1000
        )
          return false;
        if (
          f.create_time?.end_time &&
          Number(m.internal_date) > Number(f.create_time.end_time) * 1000
        )
          return false;
        return true;
      })
      .map((m) => ({
        meta_data: {
          message_biz_id: m.message_id,
          thread_id: m.thread_id,
          title: m.subject,
          create_time: m.internal_date,
          from: m.head_from,
          body_plain_text: m.body_plain_text,
          body_preview: m.body_preview,
        },
      }));
    return pagination(matches, 100);
  }
  if (tail === 'drafts' && method === 'GET') {
    options(Object.fromEntries(query), ['page_size', 'page_token']);
    options(body, []);
    return pagination(
      drafts().map((d) => ({ id: d.id })),
      100,
    );
  }
  const draftPath = /^drafts\/([^/]+)(\/send)?$/.exec(tail);
  if (
    (tail === 'drafts' && method === 'POST') ||
    (draftPath && method === 'PUT' && !draftPath[2])
  ) {
    options(Object.fromEntries(query), []);
    options(body, ['raw']);
    const previous = draftPath
      ? drafts().find((d) => d.id === draftPath[1])
      : undefined;
    if (draftPath && !previous) fail(404, 123002, 'Draft not found');
    const parsed = parseMail(body.raw);
    requireValue(
      parsed.head_from.mail_address.toLowerCase() ===
        owner.email_address.toLowerCase(),
      'From must match mailbox',
    );
    const id = previous?.id || randomUUID();
    const mid = previous?.message_id || randomUUID();
    const replied = messages().find(
      (m) => m.smtp_message_id && m.smtp_message_id === parsed.in_reply_to,
    );
    const message = {
      ...parsed,
      message_id: mid,
      mailbox_id: owner.email_address,
      thread_id: replied?.thread_id || mid,
      internal_date: String(Date.parse(world.now)),
      message_state: 3,
      folder_id: 'DRAFT',
      label_ids: [],
    };
    if (previous) Object.assign(get(mid), message);
    else {
      store.messages.push(message);
      store.drafts.push({
        id,
        message_id: mid,
        mailbox_id: owner.email_address,
      });
    }
    return { draft: { id, message: rendered(message) } };
  }
  if (
    draftPath &&
    ((!draftPath[2] && ['GET', 'DELETE'].includes(method)) ||
      (draftPath[2] && method === 'POST'))
  ) {
    const d = drafts().find((d) => d.id === draftPath[1]);
    if (!d) fail(404, 123002, 'Draft not found');
    const message = get(d.message_id);
    if (method === 'GET' && !draftPath[2]) {
      options(Object.fromEntries(query), ['format']);
      options(body, []);
      return {
        draft: {
          id: d.id,
          message: rendered(message, query.get('format') || 'full', true),
        },
      };
    }
    if (method === 'DELETE' && !draftPath[2]) {
      options(Object.fromEntries(query), []);
      options(body, []);
      store.drafts = store.drafts.filter((x) => x !== d);
      store.messages = store.messages.filter((x) => x !== message);
      return {};
    }
    if (method === 'POST' && draftPath[2]) {
      options(Object.fromEntries(query), []);
      options(body, ['send_time']);
      if (body.send_time) fail(501, 990001, 'ENV_UNSUPPORTED: scheduled mail');
      requireValue(
        message.to.length + message.cc.length + message.bcc.length > 0,
        'Recipient required',
      );
      message.message_state = 2;
      message.folder_id = 'SENT';
      message.internal_date = String(Date.parse(world.now));
      message.smtp_message_id ||= `${message.message_id}@fixture.invalid`;
      store.drafts = store.drafts.filter((x) => x !== d);
      return {
        message_id: message.message_id,
        thread_id: message.thread_id,
        recall_status: 'unavailable',
      };
    }
  }
}
