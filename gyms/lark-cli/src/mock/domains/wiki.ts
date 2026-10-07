import type { World } from '../../types.ts';
import type { ApiRequest } from '../types.ts';
import { fail, requireValue } from '../errors.ts';
import { page } from '../pagination.ts';

// This fixture collection contains the spaces accessible to the evaluation
// identity. It is independent of Drive files and does not infer Wiki membership.
export function wikiRoutes(world: World, { method, path, query }: ApiRequest) {
  if (method !== 'GET') return;
  const visible = (space: NonNullable<World['wiki_spaces']>[number]) => ({
    space_id: space.space_id,
    name: space.name,
    description: space.description,
    space_type: space.space_type,
    visibility: space.visibility,
    open_sharing: space.open_sharing,
  });
  const spaces = world.wiki_spaces || [];
  if (path === '/open-apis/wiki/v2/spaces') {
    for (const key of query.keys())
      if (!['page_size', 'page_token', 'space_type'].includes(key))
        fail(501, 990001, `ENV_UNSUPPORTED: Wiki space filter ${key}`);
    const type = query.get('space_type');
    if (type && type !== 'my_library_resigned')
      fail(501, 990001, `ENV_UNSUPPORTED: Wiki space type ${type}`);
    const size = Number(query.get('page_size') ?? 20);
    requireValue(
      Number.isInteger(size) && size >= 1 && size <= 50,
      'Wiki page_size must be 1..50',
    );
    const params = new URLSearchParams(query);
    params.set('page_size', String(size));
    const result = page(
      spaces
        .filter((space) =>
          type
            ? space.space_type === type
            : ['team', 'person'].includes(space.space_type),
        )
        .map(visible),
      params,
    );
    return {
      items: result.items,
      has_more: result.has_more,
      ...(result.has_more ? { page_token: result.page_token } : {}),
    };
  }
  const match = path.match(/^\/open-apis\/wiki\/v2\/spaces\/([^/]+)$/);
  if (!match) return;
  for (const key of query.keys())
    if (key !== 'lang')
      fail(501, 990001, `ENV_UNSUPPORTED: Wiki space parameter ${key}`);
  if (query.has('lang') && query.get('lang') !== 'en')
    fail(501, 990001, 'ENV_UNSUPPORTED: localized Wiki library names');
  const id = decodeURIComponent(match[1]);
  const space = spaces.find((space) =>
    id === 'my_library'
      ? space.space_type === 'my_library'
      : space.space_id === id,
  );
  if (!space) fail(404, 990004, 'Wiki space not found or inaccessible');
  return { space: visible(space) };
}
