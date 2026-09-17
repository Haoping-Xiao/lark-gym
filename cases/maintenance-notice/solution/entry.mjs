import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { oracle } from './oracle.mjs';
await oracle((args) =>
  promisify(execFile)('lark-cli', args, { timeout: 30000 }),
);
