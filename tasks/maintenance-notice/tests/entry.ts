import { scoreUnsupported } from './unsupported.ts';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { verify } from './verify.ts';
const output = process.env.VERIFIER_OUTPUT || '/logs/verifier';
mkdirSync(output, { recursive: true });
try {
  const snapshot = JSON.parse(
    readFileSync(
      process.env.MOCK_STATE || '/var/lib/feishu-mock/state.json',
      'utf8',
    ),
  );
  const result = verify(snapshot.seed, snapshot.world, snapshot.calls);
  const coverage = scoreUnsupported(
    Object.values(result.checks).every(Boolean) ? 1 : 0,
    snapshot.calls,
    JSON.parse(
      readFileSync(
        new URL('./unsupported-policy.json', import.meta.url),
        'utf8',
      ),
    ),
  );
  writeFileSync(
    `${output}/result.json`,
    JSON.stringify(
      {
        ...result,
        coverage,
        business_success: coverage.raw_reward === 1,
        success: coverage.valid_sample && coverage.raw_reward === 1,
        status: coverage.environment_incomplete
          ? 'environment_incomplete'
          : coverage.raw_reward === 1
            ? 'pass'
            : 'fail',
      },
      null,
      2,
    ),
  );
  if (
    !coverage.valid_sample ||
    result.infrastructureErrors ||
    snapshot.calls.some(
      (call: { unsupported?: { kind: string } }) =>
        call.unsupported?.kind === 'hook_error',
    )
  )
    throw new Error('ENV_UNSUPPORTED: invalid trial');
  writeFileSync(`${output}/reward.txt`, `${coverage.reward}\n`);
  console.log(JSON.stringify(result));
} catch (error) {
  rmSync(`${output}/reward.txt`, { force: true });
  throw error;
}
