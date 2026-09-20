import type { World } from '../types.ts';
import { baseRoutes } from './domains/base/routes.ts';
import { createCalendarRoutes } from './domains/calendar.ts';
import { identityRoutes } from './domains/identity.ts';
import { createImRoutes } from './domains/im/routes.ts';
import { sheetsRoutes } from './domains/sheets.ts';
import { fail } from './errors.ts';
import type { ApiRequest, ResponseData } from './types.ts';

export function createRouter(world: World) {
  // Keep the world reference: rollback replaces its contents, not the object.
  const calendarRoutes = createCalendarRoutes(world);
  const imRoutes = createImRoutes(world);

  return (request: ApiRequest): ResponseData => {
    // Select the API family before a domain reads or validates business state.
    const family = /^\/open-apis\/([^/]+)\//.exec(request.path)?.[1];
    let result: ResponseData | undefined;
    switch (family) {
      case 'authen':
        result = identityRoutes(request);
        break;
      case 'sheets':
      case 'sheet_ai':
        result = sheetsRoutes(world, request);
        break;
      case 'base':
      case 'bitable':
        result = baseRoutes(world, request);
        break;
      case 'calendar':
        result = calendarRoutes(request);
        break;
      case 'im':
        result = imRoutes(request);
        break;
    }
    if (result !== undefined) return result;
    fail(501, 990001, `ENV_UNSUPPORTED: ${request.method} ${request.path}`);
  };
}
