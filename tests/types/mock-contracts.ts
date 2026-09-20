import type {
  RequestExecutor,
  RouteHandler,
} from '../../gyms/lark-cli/src/mock/types.ts';

// Checked by npm run typecheck. These assignments must remain compiler errors.
const asyncOperation = async () => ({ ok: true });

// @ts-expect-error Routes must not return a Promise.
export const asyncRoute: RouteHandler = asyncOperation;

// @ts-expect-error Promise-like objects are not synchronous response data.
export const thenableRoute: RouteHandler = () => ({ then() {} });

export function checkExecutorContract(execute: RequestExecutor) {
  const request = { method: 'GET', path: '/example', body: {} };
  // @ts-expect-error The transaction executor only accepts synchronous operations.
  execute(request, asyncOperation);
}
