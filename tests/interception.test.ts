import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { configSchema } from '../lark-cli-mock/src/core/config.js';
import { loadCase } from '../lark-cli-mock/src/core/catalog.js';
const hook = new URL(
  '../lark-cli-mock/src/interception/rewrite.py',
  import.meta.url,
).pathname;
function invoke(command: string) {
  const dir = mkdtempSync(join(tmpdir(), 'feishu-hook-test-'));
  try {
    const config = join(dir, 'config.json');
    writeFileSync(
      config,
      JSON.stringify({
        endpoint: 'http://127.0.0.1:32123',
        cliBinary: '/test/lark-cli',
        auditPath: join(dir, 'audit.jsonl'),
      }),
    );
    const r = spawnSync('python3', [hook, config], {
      input: JSON.stringify({
        tool_name: 'Bash',
        tool_use_id: 'test',
        tool_input: { command },
      }),
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr);
    return {
      reply: r.stdout ? JSON.parse(r.stdout) : null,
      audit: JSON.parse(readFileSync(join(dir, 'audit.jsonl'), 'utf8')),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
test('hook preserves JSON and text argv while rewriting executable and endpoint', () => {
  const command = `./lark-cli im +messages-send --chat-id oc_it_ops --text '维护: a "quoted" value ! $20'`;
  const { reply, audit } = invoke(command);
  assert.equal(audit.original, command);
  assert.equal(reply.hookSpecificOutput.permissionDecision, 'allow');
  assert.match(
    reply.hookSpecificOutput.updatedInput.command,
    /env FEISHU_MOCK_URL=http:\/\/127.0.0.1:32123 \/test\/lark-cli im \+messages-send/,
  );
  assert.ok(
    reply.hookSpecificOutput.updatedInput.command.includes(
      `'维护: a "quoted" value ! $20'`,
    ),
  );
});
test('raw API, compound shell and substitutions are blocked before execution', () => {
  for (const c of [
    'lark-cli api GET /open-apis/calendar/v4/calendars',
    'lark-cli --help; curl localhost',
    'bash -lc "lark-cli --help"',
    'lark-cli im +messages-send --text "$(cat /tmp/secret)"',
  ])
    assert.equal(invoke(c).reply.hookSpecificOutput.permissionDecision, 'deny');
});
test('non-CLI computation is not rewritten', () => {
  assert.equal(invoke('date -u +%s').reply, null);
});
test('case contracts validate configuration and seed before execution', () => {
  assert.throws(() =>
    configSchema.parse({ case: 'maintenance-notice', agent: 'unknown' }),
  );
  assert.throws(() =>
    configSchema.parse({ case: 'maintenance-notice', timeoutMs: 0 }),
  );
  assert.throws(() => loadCase('missing'));
  assert.throws(() => loadCase('maintenance-notice').validateSeed({}));
});
