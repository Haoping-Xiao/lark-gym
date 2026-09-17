import { fileURLToPath } from 'node:url';
import { seedSchema } from '../../gyms/lark-cli/src/schema.js';
import { startMock } from '../../gyms/lark-cli/src/server.mjs';
import { verify } from './tests/verify.mjs';
import { oracle } from './solution/oracle.mjs';
import type { TaskDefinition } from '../../src/core/contracts.js';
export const maintenanceNotice: TaskDefinition = {
  id: 'maintenance-notice',
  directory: fileURLToPath(new URL('.', import.meta.url)),
  validateSeed: (input) => seedSchema.parse(input),
  createBackend: startMock,
  verify,
  oracle,
};
