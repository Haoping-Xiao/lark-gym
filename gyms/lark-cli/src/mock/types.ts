import type { ApiObject } from '../types.ts';

/** HTTP-independent input for a business route. Paths are decoded once. */
export interface ApiRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  body: ApiObject;
}

/** Response data is synchronous; Promise/thenable values are not API payloads. */
export type ResponseData = Record<string, unknown> & { then?: never };

/** Return undefined only when this domain does not handle the request. */
export type RouteHandler = (request: ApiRequest) => ResponseData | undefined;

/** Preserve the original URL, including query parameters, for the audit log. */
export interface RequestRecord {
  method: string;
  path: string;
  body: ApiObject;
}

export interface ApiResult {
  status: number;
  response: { code: number; msg: string; data?: ResponseData };
}

export type RequestExecutor = (
  request: RequestRecord,
  operation: () => ResponseData,
) => ApiResult;
