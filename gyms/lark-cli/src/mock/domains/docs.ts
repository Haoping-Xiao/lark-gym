import type { World } from '../../types.ts';
import type { ApiRequest } from '../types.ts';
import { fail, requireValue } from '../errors.ts';

const unsupported = (detail: string): never =>
  fail(501, 990001, `ENV_UNSUPPORTED: document ${detail}`);
const unescapeTitle = (s: string) =>
  s
    .replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_, hex, dec) =>
      String.fromCodePoint(parseInt(hex || dec, hex ? 16 : 10)),
    )
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
function contentParts(content: string) {
  const title = /^<title>([\s\S]*?)<\/title>\n?/.exec(content);
  return {
    title: title ? unescapeTitle(title[1]) : '',
    content: title ? content.slice(title[0].length) : content,
  };
}
function keys(body: Record<string, unknown>, allowed: string[]) {
  for (const key of Object.keys(body))
    if (!allowed.includes(key)) unsupported(`option ${key}`);
}
export function docsRoutes(world: World, { method, path, body }: ApiRequest) {
  const match =
    /^\/open-apis\/docs_ai\/v1\/documents(?:\/([^/]+)(\/fetch)?)?$/.exec(path);
  if (!match) return;
  if (!world.docs) unsupported('domain not enabled in this fixture');
  const docs = world.docs!;
  const visible = (doc: NonNullable<World['docs']>['documents'][number]) => ({
    document_id: doc.document_id,
    title: doc.title,
    revision_id: doc.revision_id,
    url: `https://company.feishu.cn/docx/${doc.document_id}`,
  });
  if (method === 'POST' && !match[1]) {
    keys(body, [
      'format',
      'content',
      'parent_token',
      'parent_position',
      'extra_param',
      'scene',
    ]);
    if (body.format !== 'markdown') unsupported('format (supported: markdown)');
    requireValue(typeof body.content === 'string', 'content must be text');
    requireValue(
      !(body.parent_token && body.parent_position),
      'Conflicting parent selectors',
    );
    requireValue(
      !body.parent_position || body.parent_position === 'my_library',
      'Unknown parent position',
    );
    const parent = body.parent_token || '';
    if (parent) {
      const folder = docs.folders.find((f) => f.token === parent);
      if (!folder) fail(404, 1061002, 'Parent folder not found');
      if (folder!.writable === false)
        fail(403, 1061004, 'Parent folder is read only');
    }
    let n = 1;
    while (docs.documents.some((d) => d.document_id === `doxcnMock${n}`)) n++;
    const parsed = contentParts(body.content);
    const doc = {
      document_id: `doxcnMock${n}`,
      parent_token: parent,
      title: parsed.title || 'Untitled',
      content: parsed.content,
      revision_id: 1,
      format: 'markdown' as const,
    };
    docs.documents.push(doc);
    return { document: visible(doc) };
  }
  const doc = docs.documents.find(
    (d) => d.document_id === decodeURIComponent(match[1] || ''),
  );
  if (!doc) fail(404, 1061002, 'Document not found');
  const found = doc!;
  if (method === 'POST' && match[2]) {
    keys(body, [
      'format',
      'extra_param',
      'revision_id',
      'lang',
      'export_option',
      'read_option',
      'scene',
    ]);
    if (body.format !== 'markdown') unsupported('format (supported: markdown)');
    if (
      body.read_option ||
      body.export_option?.export_block_id ||
      body.export_option?.export_style_attrs
    )
      unsupported('block-level reads');
    requireValue(
      !body.revision_id ||
        body.revision_id === -1 ||
        body.revision_id === found.revision_id,
      'Revision unavailable',
    );
    return {
      document: {
        ...visible(found),
        content: found.content,
        format: 'markdown',
      },
    };
  }
  if (method === 'PUT' && !match[2]) {
    keys(body, [
      'format',
      'command',
      'content',
      'pattern',
      'block_id',
      'revision_id',
      'scene',
    ]);
    if (found.writable === false) fail(403, 1061004, 'Document is read only');
    if (body.format !== 'markdown') unsupported('format (supported: markdown)');
    requireValue(
      !body.revision_id ||
        body.revision_id === -1 ||
        body.revision_id === found.revision_id,
      'Revision conflict',
    );
    requireValue(typeof body.content === 'string', 'content must be text');
    if (body.command === 'overwrite') {
      const parsed = contentParts(body.content);
      found.content = parsed.content;
      if (parsed.title) found.title = parsed.title;
    } else if (
      body.command === 'block_insert_after' &&
      ['-1', '0'].includes(body.block_id)
    ) {
      found.content =
        body.block_id === '-1'
          ? `${found.content}\n${body.content}`
          : `${body.content}\n${found.content}`;
    } else if (body.command === 'str_replace') {
      requireValue(
        typeof body.pattern === 'string' && body.pattern.length > 0,
        'pattern required',
      );
      requireValue(found.content.includes(body.pattern), 'Pattern not found');
      requireValue(
        found.content.split(body.pattern).length === 2,
        'Pattern is ambiguous',
      );
      found.content = found.content.replace(body.pattern, () => body.content);
    } else unsupported(`command ${body.command}`);
    found.revision_id++;
    return { document: visible(found) };
  }
}
