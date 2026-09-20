import type { RouteHandler } from '../types.ts';

export const identityRoutes: RouteHandler = ({ method, path: p }) => {
  if (method === 'GET' && p === '/open-apis/authen/v1/user_info')
    return {
      open_id: 'ou_eval',
      name: 'Evaluation User',
      email: 'agent@company.example.com',
    };
};
