import type { World } from '../../types.ts';
import type { ApiRequest } from '../types.ts';
import { fail, requireValue } from '../errors.ts';
import { page } from '../pagination.ts';
import { baseMetadata } from './base/metadata.ts';

// Derive the catalogue from live business objects; never from expected answers.
function resources(world: World) {
  const books = world.spreadsheets || {
    [world.spreadsheet_token]: {
      title: world.spreadsheet_title || world.spreadsheet_token,
      sheets: world.sheets,
    },
  };
  return [
    ...(world.drive_files || []).map((f) => ({
      ...f,
      text: '',
      url: `https://company.feishu.cn/file/${f.token}`,
    })),
    ...(world.docs?.documents || []).map((d) => ({
      token: d.document_id,
      name: d.title,
      type: 'docx',
      text: d.content,
      parent_token: d.parent_token,
      url: `https://company.feishu.cn/docx/${d.document_id}`,
    })),
    ...(world.docs?.folders || []).map((d) => ({
      token: d.token,
      name: d.name,
      type: 'folder',
      text: '',
      parent_token: d.parent_token || '',
      url: `https://company.feishu.cn/drive/folder/${d.token}`,
    })),
    ...Object.entries(books).map(([token, book]) => ({
      token,
      name: book.title,
      type: 'sheet',
      text: JSON.stringify(book),
      url: `https://company.feishu.cn/sheets/${token}`,
    })),
    ...(world.base
      ? [
          {
            token: world.base.app_token,
            name: baseMetadata(world.base).name,
            type: 'bitable',
            text: JSON.stringify(world.base),
            url: `https://company.feishu.cn/base/${world.base.app_token}`,
          },
        ]
      : []),
  ];
}
function supported(keys: string[], allowed: string[]) {
  for (const key of keys)
    if (!allowed.includes(key))
      fail(501, 990001, `ENV_UNSUPPORTED: resource filter ${key}`);
}
export function driveRoutes(
  world: World,
  { method, path, query, body }: ApiRequest,
) {
  if (method === 'POST' && path === '/open-apis/drive/v1/files/create_folder') {
    if (!world.docs)
      fail(501, 990001, 'ENV_UNSUPPORTED: writable Drive folders not enabled');
    supported(Object.keys(body), ['name', 'folder_token']);
    requireValue(
      typeof body.name === 'string' &&
        Buffer.byteLength(body.name) > 0 &&
        Buffer.byteLength(body.name) <= 256,
      'Invalid folder name',
    );
    requireValue(
      typeof body.folder_token === 'string',
      'folder_token must be text',
    );
    const parent = world.docs!.folders.find(
      (f) => f.token === body.folder_token,
    );
    requireValue(!body.folder_token || !!parent, 'Parent folder not found');
    if (parent?.writable === false)
      fail(403, 1061004, 'Parent folder is read only');
    let n = 1;
    while (world.docs!.folders.some((f) => f.token === `fldMock${n}`)) n++;
    const token = `fldMock${n}`;
    world.docs!.folders.push({
      token,
      name: body.name,
      parent_token: body.folder_token,
    });
    return { token, url: `https://company.feishu.cn/drive/folder/${token}` };
  }
  const move = /^\/open-apis\/drive\/v1\/files\/([^/]+)\/move$/.exec(path);
  if (method === 'POST' && move) {
    supported(Object.keys(body), ['type', 'folder_token']);
    if (!['file', 'docx'].includes(body.type))
      fail(501, 990001, 'ENV_UNSUPPORTED: move resource type');
    const id = decodeURIComponent(move[1]);
    const target =
      body.type === 'file'
        ? world.drive_files?.find((f) => f.token === id)
        : world.docs?.documents.find((d) => d.document_id === id);
    if (!target) fail(404, 1061002, 'File not found');
    const parent = world.docs?.folders.find(
      (f) => f.token === body.folder_token,
    );
    if (!parent) fail(404, 1061002, 'Target folder not found');
    if (target!.writable === false || parent!.writable === false)
      fail(403, 1061004, 'Move permission denied');
    target!.parent_token = body.folder_token;
    return {};
  }
  const commentsPath = path.match(
    /^\/open-apis\/drive\/v1\/files\/([^/]+)\/comments(?:\/(batch_query)|\/([^/]+)\/replies)?$/,
  );
  if (
    commentsPath &&
    ((method === 'GET' && !commentsPath[2]) ||
      (method === 'POST' && commentsPath[2]))
  ) {
    const token = decodeURIComponent(commentsPath[1]);
    const file = resources(world).find((file) => file.token === token);
    if (!file) fail(404, 1061002, 'File not found');
    requireValue(
      query.get('file_type') === file.type,
      'File type does not match resource',
    );
    const batch = Boolean(commentsPath[2]);
    const replyId = commentsPath[3] && decodeURIComponent(commentsPath[3]);
    supported(
      [...query.keys()],
      batch
        ? ['file_type']
        : [
            'file_type',
            'page_size',
            'page_token',
            ...(replyId ? [] : ['is_solved', 'is_whole']),
          ],
    );
    if (!batch)
      requireValue(
        Number(query.get('page_size') || 50) <= 100,
        'Comment page_size must be at most 100',
      );
    const comments = (world.drive_comments || []).filter(
      (comment) =>
        comment.file_token === token && comment.file_type === file.type,
    );
    const visible = ({
      file_token: _token,
      file_type: _type,
      ...comment
    }: NonNullable<World['drive_comments']>[number]) =>
      structuredClone(comment);
    if (batch) {
      supported(Object.keys(body), ['comment_ids']);
      requireValue(
        Array.isArray(body.comment_ids) &&
          body.comment_ids.length > 0 &&
          body.comment_ids.length <= 100 &&
          body.comment_ids.every((id: unknown) => typeof id === 'string'),
        'comment_ids requires 1..100 IDs',
      );
      const items = body.comment_ids.map((id: string) => {
        const comment = comments.find((comment) => comment.comment_id === id);
        if (!comment) fail(404, 1061002, 'Comment not found');
        return visible(comment);
      });
      return { items };
    }
    if (replyId) {
      const comment = comments.find(
        (comment) => comment.comment_id === replyId,
      );
      if (!comment) fail(404, 1061002, 'Comment not found');
      return page(comment.reply_list?.replies || [], query);
    }
    for (const field of ['is_solved', 'is_whole'])
      requireValue(
        !query.has(field) || ['true', 'false'].includes(query.get(field)!),
        `Invalid ${field}`,
      );
    return page(
      comments
        .filter((comment) =>
          ['is_solved', 'is_whole'].every(
            (field) =>
              !query.has(field) ||
              comment[field] === (query.get(field) === 'true'),
          ),
        )
        .map(visible),
      query,
    );
  }
  if (method === 'GET' && path === '/open-apis/drive/v1/files') {
    supported([...query.keys()], ['page_size', 'page_token', 'folder_token']);
    // All current business documents are at the accessible root. Unknown folder
    // IDs must not silently return that root's contents.
    const parent = query.get('folder_token') || '';
    requireValue(
      !parent || !!world.docs?.folders.some((f) => f.token === parent),
      'Folder does not exist',
    );
    const result = page(
      resources(world).filter(
        (file) => ('parent_token' in file ? file.parent_token : '') === parent,
      ),
      query,
    );
    return {
      files: result.items.map(({ text: _text, ...file }) => file),
      has_more: result.has_more,
      next_page_token: result.page_token,
    };
  }
  if (method === 'POST' && path === '/open-apis/search/v2/doc_wiki/search') {
    supported(Object.keys(body), [
      'query',
      'page_size',
      'page_token',
      'doc_filter',
      'wiki_filter',
    ]);
    requireValue(typeof body.query === 'string', 'query must be text');
    for (const filter of [body.doc_filter, body.wiki_filter]) {
      requireValue(
        filter === undefined ||
          (filter !== null &&
            typeof filter === 'object' &&
            !Array.isArray(filter)),
        'Invalid search filter',
      );
      supported(Object.keys(filter || {}), ['only_title', 'doc_types']);
      requireValue(
        filter?.doc_types === undefined ||
          (Array.isArray(filter.doc_types) &&
            filter.doc_types.every(
              (type: unknown) => typeof type === 'string',
            )),
        'Invalid doc_types',
      );
      requireValue(
        filter?.only_title === undefined ||
          typeof filter.only_title === 'boolean',
        'Invalid only_title',
      );
    }
    const filter = body.doc_filter || {};
    const queryText = body.query.toLocaleLowerCase();
    const matches = resources(world).filter(
      (file) =>
        (!filter.doc_types?.length ||
          filter.doc_types.includes(file.type.toUpperCase())) &&
        (filter.only_title ? file.name : `${file.name} ${file.text}`)
          .toLocaleLowerCase()
          .includes(queryText),
    );
    const result = page(
      matches,
      new URLSearchParams({
        page_size: String(body.page_size ?? 20),
        page_token: String(body.page_token ?? ''),
      }),
    );
    return {
      total: matches.length,
      has_more: result.has_more,
      page_token: result.page_token,
      res_units: result.items.map((file) => ({
        title: file.name,
        title_highlighted: file.name,
        entity_type: 'DOC',
        result_meta: {
          token: file.token,
          doc_types: file.type.toUpperCase(),
          url: file.url,
        },
      })),
    };
  }
}
