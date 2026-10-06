import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { semanticEvidence } from './semantic-evidence.ts';
const root = dirname(fileURLToPath(import.meta.url));
const output = resolve(process.env.VERIFIER_OUTPUT || '/logs/verifier');
const rulesOutput = join(output, 'programmatic');
mkdirSync(rulesOutput, { recursive: true });
for (const name of ['reward.txt', 'reward.json'])
  rmSync(join(output, name), { force: true });
try {
  execFileSync(process.execPath, [join(root, 'verify.ts')], {
    env: { ...process.env, VERIFIER_OUTPUT: rulesOutput },
    stdio: 'inherit',
  });
  const result = JSON.parse(
    readFileSync(join(rulesOutput, 'result.json'), 'utf8'),
  );
  const state = JSON.parse(
    readFileSync(
      process.env.MOCK_STATE || '/var/lib/feishu-mock/state.json',
      'utf8',
    ),
  );
  if (
    state.calls.some((call: any) => call.status >= 500 && call.status !== 501)
  )
    throw new Error('Mock infrastructure failure');
  let rawReward = (result.business_success ?? result.success) ? 1 : 0;
  const programmaticReward = rawReward;
  let judge: unknown = null;
  let semanticStatus = !result.semantic?.required
    ? 'not_required'
    : !rawReward
      ? 'blocked_by_rules'
      : 'pending';
  if (rawReward && result.semantic?.required) {
    const semanticDir = join(output, 'semantic');
    mkdirSync(semanticDir, { recursive: true });
    const evidence = semanticEvidence({
      instruction: readFileSync(join(root, 'task-instruction.md'), 'utf8'),
      deferred_checks: result.semantic.deferred,
      expected_facts: result.semantic.original,
      seed: state.seed,
      world: state.world,
      calls: state.calls,
    });
    const paths = evidence.map(({ name, data }) => {
      const path = join(semanticDir, name);
      writeFileSync(path, data);
      return path;
    });
    const template = readFileSync(join(root, 'semantic.toml'), 'utf8');
    if (!template.includes('files = ["__INPUT_PATH__"]'))
      throw new Error('Missing semantic evidence file placeholder');
    const rubric = template.replace(
      'files = ["__INPUT_PATH__"]',
      `files = ${JSON.stringify(paths)}`,
    );
    writeFileSync(join(semanticDir, 'quality.toml'), rubric);
    execFileSync(
      'rewardkit',
      [semanticDir, '--output', join(semanticDir, 'reward.json')],
      { stdio: 'inherit', timeout: 240000 },
    );
    judge = JSON.parse(
      readFileSync(join(semanticDir, 'reward-details.json'), 'utf8'),
    );
    const judgeErrors: string[] = [];
    const inspect = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (node.error) judgeErrors.push(String(node.error));
      for (const value of Object.values(node)) inspect(value);
    };
    inspect(judge);
    if (judgeErrors.length)
      throw new Error(`Judge failure: ${judgeErrors.join('; ')}`);
    const score = JSON.parse(
      readFileSync(join(semanticDir, 'reward.json'), 'utf8'),
    ).reward;
    if (typeof score !== 'number' || !Number.isFinite(score))
      throw new Error('Judge did not return a finite reward');
    rawReward = score === 1 ? 1 : 0;
    semanticStatus = rawReward ? 'passed' : 'failed';
  }
  writeFileSync(
    join(output, 'result.json'),
    JSON.stringify(
      {
        ...result,
        judge,
        status: rawReward === 1 ? 'pass' : 'fail',
        programmatic_reward: programmaticReward,
        semantic_status: semanticStatus,
        business_success: rawReward === 1,
        success: rawReward === 1,
      },
      null,
      2,
    ),
  );
  writeFileSync(join(output, 'reward.txt'), `${rawReward}\n`);
} catch (error) {
  writeFileSync(join(output, 'verification-error.txt'), String(error));
  throw error;
}
