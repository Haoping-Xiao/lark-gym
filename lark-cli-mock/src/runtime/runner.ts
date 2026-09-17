import {
  readFile,
  writeFile,
  mkdir,
  mkdtemp,
  symlink,
  appendFile,
} from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID, createHash } from 'node:crypto';
import { loadCase } from '../core/catalog.js';
import type { RunConfig } from '../core/config.js';
import type { AgentResult } from '../core/contracts.js';
import { CodexAdapter } from '../adapters/codex.js';
export async function runCase(config: RunConfig, root: string) {
  const entry = loadCase(config.case);
  const seed = entry.validateSeed(
    JSON.parse(
      await readFile(join(entry.directory, 'environment', 'seed.json'), 'utf8'),
    ),
  );
  const runId = `${new Date().toISOString().replaceAll(':', '-')}-${randomUUID().slice(0, 8)}`;
  const output = resolve(root, config.outputDir, runId),
    workspace = await mkdtemp(join(tmpdir(), 'feishu-case-'));
  const binary = resolve(root, config.cliBinary);
  await mkdir(output, { recursive: true });
  await symlink(binary, join(workspace, 'lark-cli'));
  const prompt = await readFile(
    join(entry.directory, 'instruction.md'),
    'utf8',
  );
  await writeFile(
    join(workspace, 'AGENTS.md'),
    await readFile(join(entry.directory, 'harness', 'tools.md')),
  );
  const seedHash = createHash('sha256')
    .update(JSON.stringify(seed))
    .digest('hex');
  await writeFile(
    join(output, 'manifest.json'),
    JSON.stringify(
      {
        runId,
        config,
        caseId: entry.id,
        seedHash,
        sdkVersion: '0.154.0',
        cliCommit: '0493db0cd1a10d6dd8a2295128bec3e319c7fbb0',
        node: process.version,
      },
      null,
      2,
    ),
  );
  const backend = await entry.createBackend(seed);
  const started = Date.now();
  const abort = new AbortController();
  const timeout = setTimeout(
    () => abort.abort(new Error('Run timed out')),
    config.timeoutMs,
  );
  const interrupt = () => abort.abort(new Error('Run interrupted'));
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  let agent: AgentResult = {
    completed: false,
    commands: 0,
    threadId: null,
    usage: null,
    failure: null,
  };
  try {
    if (config.agent === 'oracle') {
      await entry.oracle(async (args) => {
        const result = await promisify(execFile)(binary, args, {
          env: {
            PATH: process.env.PATH,
            HOME: process.env.HOME,
            FEISHU_MOCK_URL: backend.url,
          },
          cwd: workspace,
          timeout: 30000,
          signal: abort.signal,
          maxBuffer: 4 * 1024 * 1024,
        });
        agent.commands++;
        await appendFile(
          join(output, 'commands.jsonl'),
          JSON.stringify({ args, ...result }) + '\n',
        );
        return result;
      });
      agent.completed = true;
    } else
      agent = await new CodexAdapter().run({
        workspace,
        output,
        prompt,
        endpoint: backend.url,
        cliBinary: binary,
        timeoutMs: config.timeoutMs,
        model: config.model,
        signal: abort.signal,
      });
  } catch (error) {
    agent.failure = error instanceof Error ? error.message : String(error);
  } finally {
    clearTimeout(timeout);
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
    await backend.close();
  }
  const verdict = entry.verify(seed, backend.world, backend.calls);
  const result = {
    ...verdict,
    ...agent,
    status:
      agent.failure || !agent.completed ? 'execution_error' : verdict.status,
    success: !agent.failure && agent.completed && verdict.success,
    caseId: entry.id,
    runId,
    durationMs: Date.now() - started,
  };
  await writeFile(
    join(output, 'final-state.json'),
    JSON.stringify(backend.world, null, 2),
  );
  await writeFile(
    join(output, 'api.jsonl'),
    backend.calls.map((c) => JSON.stringify(c)).join('\n') + '\n',
  );
  await writeFile(join(output, 'result.json'), JSON.stringify(result, null, 2));
  return { output, result };
}
