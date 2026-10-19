import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { verify } from './verify.ts';
const output = process.env.VERIFIER_OUTPUT || '/logs/verifier';
mkdirSync(output, { recursive: true });
rmSync(`${output}/reward.txt`, { force: true });
const snapshot = JSON.parse(
  readFileSync(
    process.env.MOCK_STATE || '/var/lib/feishu-mock/state.json',
    'utf8',
  ),
);
const result = verify(snapshot.seed, snapshot.world, snapshot.calls);
writeFileSync(`${output}/result.json`, JSON.stringify(result, null, 2));
if (result.infrastructureErrors) throw new Error('Mock infrastructure failure');
writeFileSync(`${output}/reward.txt`, result.success ? '1\n' : '0\n');
console.log(JSON.stringify(result));
