import { isDeepStrictEqual } from 'node:util';
import { isAsyncFunction, isPromise } from 'node:util/types';
import type { ApiCall, MockOptions, World } from '../types.ts';
import { ApiError } from './errors.ts';
import { collectMutations } from './history.ts';
import type { ApiResult, RequestExecutor } from './types.ts';

function rejectAsyncResult(data: unknown) {
  if (
    data !== null &&
    (typeof data === 'object' || typeof data === 'function') &&
    'then' in data &&
    typeof data.then === 'function'
  ) {
    // Observe invalid Promise rejections without running arbitrary thenables.
    if (isPromise(data)) void data.catch(() => {});
    throw new TypeError('Mock operations must return synchronous data');
  }
}

/** One trial's state and synchronous, audited business operations. */
export function createState(
  seed: World,
  onSnapshot?: MockOptions['onSnapshot'],
  onUnsupported?: MockOptions['onUnsupported'],
) {
  const world = structuredClone(seed);
  const calls: ApiCall[] = [];
  let aborted = false;

  const execute: RequestExecutor = (request, operation) => {
    // Snapshot after reading the HTTP body, so an unfinished request cannot
    // roll back a different request that committed while it was waiting.
    const before = structuredClone(world);
    let result: ApiResult;
    try {
      if (aborted)
        throw new ApiError(
          410,
          990003,
          'ENV_ABORTED: trial stopped after unsupported operation',
        );
      if (isAsyncFunction(operation))
        throw new TypeError('Mock operations must be synchronous');
      const data = operation();
      rejectAsyncResult(data);
      result = {
        status: 200,
        // Serialization failures must roll back and be audited too.
        response: structuredClone({ code: 0, msg: 'success', data }),
      };
    } catch (error) {
      // All domains share this object; preserve its identity across rollback.
      for (const key of Object.keys(world)) delete world[key];
      Object.assign(world, before);
      const e =
        error instanceof ApiError
          ? error
          : {
              status: 500,
              code: 990002,
              message: error instanceof Error ? error.message : String(error),
            };
      result = {
        status: e.status || 500,
        response: { code: e.code || 990002, msg: e.message },
      };
    }
    const call: ApiCall = {
      seq: calls.length + 1,
      timestamp: new Date().toISOString(),
      ...structuredClone(request),
      status: result.status,
      response: structuredClone(result.response),
      changed: !isDeepStrictEqual(before, world),
      mutations: collectMutations(before, world),
    };
    if (result.status === 501 && onUnsupported) {
      try {
        call.unsupported = onUnsupported(structuredClone(call));
        rejectAsyncResult(call.unsupported);
        if (call.unsupported.action === 'abort') aborted = true;
        if (typeof call.unsupported.feedback === 'string') {
          result.response = {
            ...result.response,
            msg: `${result.response.msg}; ${call.unsupported.feedback}`,
          };
        }
      } catch (error) {
        call.unsupported = { kind: 'hook_error', error: String(error) };
      }
    }
    calls.push(call);
    onSnapshot?.(world, calls);
    return result;
  };

  return { world, calls, execute };
}
