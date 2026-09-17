import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { configSchema } from './core/config.js';
import { runTask } from './runtime/runner.js';
const root = fileURLToPath(new URL('..', import.meta.url));
try {
  const { values } = parseArgs({
    options: {
      config: {
        type: 'string',
        default: 'experiments/local-codex.json',
      },
      task: { type: 'string' },
      agent: { type: 'string' },
      model: { type: 'string' },
    },
  });
  const raw = JSON.parse(await readFile(resolve(root, values.config), 'utf8'));
  const config = configSchema.parse({
    ...raw,
    ...(values.task ? { task: values.task } : {}),
    ...(values.agent ? { agent: values.agent } : {}),
    ...(values.model || process.env.EVAL_MODEL
      ? { model: values.model || process.env.EVAL_MODEL }
      : {}),
    ...(process.env.EVAL_TIMEOUT_MS
      ? { timeoutMs: Number(process.env.EVAL_TIMEOUT_MS) }
      : {}),
  });
  const { output, result } = await runTask(config, root);
  console.log(JSON.stringify(result, null, 2));
  console.log(`Artifacts: ${output}`);
  if (!result.success) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
