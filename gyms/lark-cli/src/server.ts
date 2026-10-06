import http from 'node:http';
import type { World, MockOptions } from './types.ts';
import { createHttpHandler } from './mock/http.ts';
import { createRouter } from './mock/router.ts';
import { createState } from './mock/state.ts';

// A fresh server owns one world. No reset/admin/score HTTP endpoints exist.
export async function startMock(seed: World, options: MockOptions = {}) {
  const { world, calls, execute } = createState(seed, options.onSnapshot);
  const server = http.createServer(
    createHttpHandler(execute, createRouter(world)),
  );
  await new Promise<void>((resolve) =>
    server.listen(options.port ?? 0, options.host ?? '127.0.0.1', resolve),
  );
  return {
    url: `http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`,
    world,
    calls,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}
