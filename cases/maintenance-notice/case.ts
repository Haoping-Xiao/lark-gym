import { fileURLToPath } from 'node:url';
import { seedSchema } from '../../lark-cli-mock/src/backends/feishu/schema.js';
import { startMock } from '../../lark-cli-mock/src/backends/feishu/server.mjs';
import { verify } from './tests/verify.mjs';
import { oracle } from './solution/oracle.mjs';
import type { CaseDefinition } from '../../lark-cli-mock/src/core/contracts.js';
export const maintenanceNotice: CaseDefinition = {
  id: 'maintenance-notice',
  directory: fileURLToPath(new URL('.', import.meta.url)),
  validateSeed: (input) => seedSchema.parse(input),
  createBackend: startMock,
  verify,
  oracle,
};
