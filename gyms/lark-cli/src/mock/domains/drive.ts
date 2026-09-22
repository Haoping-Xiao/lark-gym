import type { World } from '../../types.ts';
import type { ApiRequest } from '../types.ts';
import { fail, requireValue } from '../errors.ts';
import { page } from '../pagination.ts';

// Derive the catalogue from live business objects; never from expected answers.
function resources(world: World) {
  const books = world.spreadsheets || {
    [world.spreadsheet_token]: {
      title: world.spreadsheet_title || world.spreadsheet_token,
      sheets: world.sheets,
    },
  };
  return [
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
            name: '业务台账',
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
  if (method === 'GET' && path === '/open-apis/drive/v1/files') {
    supported([...query.keys()], ['page_size', 'page_token', 'folder_token']);
    // All current business documents are at the accessible root. Unknown folder
    // IDs must not silently return that root's contents.
    requireValue(!query.get('folder_token'), 'Folder does not exist');
    const result = page(resources(world), query);
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
