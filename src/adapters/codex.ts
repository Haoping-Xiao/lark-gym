import { Codex } from '@openai/codex-sdk';
import {
  appendFile,
  writeFile,
  chmod,
  readFile,
  mkdir,
} from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type {
  AgentAdapter,
  AgentContext,
  AgentResult,
} from '../core/contracts.js';
const quote = (s: string) => `'${s.replaceAll("'", "'\\''")}'`;
export class CodexAdapter implements AgentAdapter {
  async run(ctx: AgentContext): Promise<AgentResult> {
    const env = Object.fromEntries(
      [
        'HOME',
        'PATH',
        'LANG',
        'LC_ALL',
        'CODEX_HOME',
        'SSL_CERT_FILE',
        'SSL_CERT_DIR',
        'HTTP_PROXY',
        'HTTPS_PROXY',
        'ALL_PROXY',
        'NO_PROXY',
        'http_proxy',
        'https_proxy',
        'all_proxy',
        'no_proxy',
      ]
        .filter((k) => process.env[k])
        .map((k) => [k, process.env[k]!]),
    );
    const auditPath = join(ctx.output, 'interception.jsonl');
    const hookConfig = join(ctx.output, 'hook-config.json');
    await writeFile(
      hookConfig,
      JSON.stringify({
        endpoint: ctx.endpoint,
        cliBinary: ctx.cliBinary,
        auditPath,
      }),
    );
    const hook = fileURLToPath(new URL('./codex/rewrite.py', import.meta.url));
    const launcher = join(ctx.output, 'codex-launcher');
    const codexJs = fileURLToPath(
      new URL('../../node_modules/@openai/codex/bin/codex.js', import.meta.url),
    );
    // Only hook trust is bypassed for this audited, invocation-local hook.
    // Codex tool approvals and workspace-write sandbox remain enabled.
    await writeFile(
      launcher,
      `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(codexJs)} --dangerously-bypass-hook-trust "$@" 2>>${quote(join(ctx.output, 'codex-stderr.log'))}\n`,
    );
    await chmod(launcher, 0o700);
    await promisify(execFile)('git', ['init', '--quiet', ctx.workspace]);
    await mkdir(join(ctx.workspace, '.codex'), { recursive: true });
    await writeFile(
      join(ctx.workspace, '.codex', 'config.toml'),
      '[features]\nhooks = true\n',
    );
    await writeFile(
      join(ctx.workspace, '.codex', 'hooks.json'),
      JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: '*',
              hooks: [
                {
                  type: 'command',
                  command: `python3 ${quote(hook)} ${quote(hookConfig)}`,
                  timeout: 10,
                },
              ],
            },
          ],
        },
      }),
    );
    const codex = new Codex({
      env,
      codexPathOverride: launcher,
      config: {
        features: { multi_agent: false, hooks: true },
        shell_environment_policy: { inherit: 'all' },
      },
      configOverrides: [
        `projects.${JSON.stringify(ctx.workspace)}.trust_level="trusted"`,
      ],
    });
    const thread = codex.startThread({
      workingDirectory: ctx.workspace,
      skipGitRepoCheck: true,
      sandboxMode: 'workspace-write',
      approvalPolicy: 'never',
      networkAccessEnabled: true,
      webSearchMode: 'disabled',
      ...(ctx.model ? { model: ctx.model } : {}),
    });
    const result: AgentResult = {
      completed: false,
      commands: 0,
      threadId: null,
      usage: null,
      failure: null,
    };
    try {
      const { events } = await thread.runStreamed(ctx.prompt, {
        signal: ctx.signal,
      });
      for await (const event of events) {
        await appendFile(
          join(ctx.output, 'trajectory.jsonl'),
          JSON.stringify(event) + '\n',
        );
        if (event.type === 'thread.started') result.threadId = event.thread_id;
        if (event.type === 'turn.completed') {
          result.completed = true;
          result.usage = event.usage;
        }
        if (event.type === 'turn.failed') result.failure = event.error.message;
        if (
          event.type === 'item.completed' &&
          event.item.type === 'command_execution'
        ) {
          result.commands++;
          console.log(
            `command ${result.commands}: exit ${event.item.exit_code}`,
          );
        }
        if (
          event.type === 'item.completed' &&
          event.item.type === 'agent_message'
        )
          await writeFile(join(ctx.output, 'answer.md'), event.item.text);
      }
      const audit = await readFile(auditPath, 'utf8').catch(() => '');
      if (
        !audit
          .split('\n')
          .filter(Boolean)
          .some((line) => JSON.parse(line).rewritten)
      )
        result.failure = 'CLI interception hook did not execute';
      if (!result.completed && !result.failure)
        result.failure = 'Stream ended without turn.completed';
    } catch (error) {
      result.failure = error instanceof Error ? error.message : String(error);
    }
    return result;
  }
}
