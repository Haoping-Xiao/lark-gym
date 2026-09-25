import importedParser from 'emailjs-mime-parser';
import { convert } from 'html-to-text';
import { fail, requireValue } from '../errors.ts';
import type { ApiObject } from '../../types.ts';

// The pinned CJS package exposes a nested default under Node's ESM interop.
const parse =
  typeof importedParser === 'function'
    ? importedParser
    : importedParser.default;
export function parseMail(raw: unknown): ApiObject {
  requireValue(
    typeof raw === 'string' &&
      raw.length > 0 &&
      raw.length <= 2_000_000 &&
      /^[\w=-]+$/.test(raw),
    'raw must be base64url MIME, at most 2 MB',
  );
  const text = Buffer.from(raw, 'base64url').toString('utf8');
  requireValue(/\r?\n\r?\n/.test(text), 'MIME headers and body required');
  let root: any;
  try {
    root = parse(text);
  } catch {
    fail(400, 99992402, 'Invalid MIME');
  }
  const header = (name: string) => root.headers[name]?.[0]?.value;
  const addresses = (name: string) => {
    const values = root.headers[name] || [];
    return values.flatMap((h: any) => {
      requireValue(Array.isArray(h.value), `Invalid ${name} address header`);
      return h.value.map((a: any) => {
        requireValue(
          typeof a.address === 'string' &&
            /^[^\s@<>]+@[^\s@<>]+$/.test(a.address),
          `Invalid ${name} address`,
        );
        return { mail_address: a.address, name: a.name || '' };
      });
    });
  };
  const from = addresses('from');
  requireValue(from.length === 1, 'Exactly one From address required');
  const bodies: Record<string, string[]> = {
    'text/plain': [],
    'text/html': [],
  };
  function visit(node: any, depth = 0) {
    requireValue(depth <= 30, 'MIME nesting too deep');
    const type = node.contentType?.value;
    if (
      node.headers['content-disposition']?.some(
        (h: any) => h.value === 'attachment',
      ) ||
      node.headers['content-id']
    )
      fail(501, 990001, 'ENV_UNSUPPORTED: mail attachments');
    if (type?.startsWith('multipart/')) {
      for (const child of node.childNodes) visit(child, depth + 1);
      return;
    }
    if (!(type in bodies)) fail(501, 990001, `ENV_UNSUPPORTED: MIME ${type}`);
    bodies[type].push(Buffer.from(node.content || []).toString('utf8'));
  }
  visit(root);
  const html = bodies['text/html'].join('\n');
  const plain =
    bodies['text/plain'].join('\n') ||
    (html
      ? convert(html, {
          wordwrap: false,
          selectors: [
            { selector: 'a', options: { ignoreHref: true } },
            { selector: 'img', format: 'skip' },
          ],
        })
      : '');
  return {
    raw,
    subject: String(header('subject') || ''),
    head_from: from[0],
    to: addresses('to'),
    cc: addresses('cc'),
    bcc: addresses('bcc'),
    body_plain_text: Buffer.from(plain).toString('base64url'),
    body_html: Buffer.from(html).toString('base64url'),
    body_preview: Buffer.from(plain.slice(0, 100)).toString('base64url'),
    smtp_message_id: String(header('message-id') || '').replace(/^<|>$/g, ''),
    in_reply_to: String(header('in-reply-to') || '').replace(/^<|>$/g, ''),
    references: String(header('references') || ''),
    reply_to: addresses('reply-to')[0]?.mail_address || '',
    attachments: [],
  };
}
