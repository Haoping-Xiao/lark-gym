import type { RouteHandler } from '../types.ts';
import { fail } from '../errors.ts';

export const evaluationIdentity = {
  open_id: 'ou_eval',
  name: 'Evaluation User',
  email: 'agent@company.example.com',
} as const;

export const identityRoutes: RouteHandler = ({
  method,
  path: p,
  identity = 'user',
}) => {
  if (method === 'GET' && p === '/open-apis/authen/v1/user_info') {
    if (identity !== 'user') fail(403, 99991672, 'User identity required');
    return { ...evaluationIdentity };
  }
};
