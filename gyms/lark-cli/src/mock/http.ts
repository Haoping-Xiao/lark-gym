import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ApiObject } from '../types.ts';
import { fail } from './errors.ts';
import type {
  ApiRequest,
  RequestExecutor,
  RequestRecord,
  ResponseData,
} from './types.ts';

async function readBody(req: IncomingMessage): Promise<ApiObject> {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) fail(413, 99992402, 'Body too large');
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    fail(400, 99992402, 'Malformed JSON');
  }
}

export function createHttpHandler(
  execute: RequestExecutor,
  route: (request: ApiRequest) => ResponseData,
) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const request: RequestRecord = {
      method: req.method || 'GET',
      path: req.url || '/',
      body: {},
    };
    let failure: { error: unknown } | undefined;
    try {
      request.body = await readBody(req);
    } catch (error) {
      failure = { error };
    }
    const result = execute(request, () => {
      if (failure) throw failure.error;
      if (req.headers.authorization !== 'Bearer local-evaluation-only')
        fail(401, 99991663, 'Synthetic token required');
      const url = new URL(request.path, 'http://localhost');
      return route({
        method: request.method,
        path: decodeURIComponent(url.pathname),
        query: url.searchParams,
        body: request.body,
      });
    });
    res.writeHead(result.status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(result.response));
  };
}
