import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { verify } from './verify.mjs';
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
  writeFileSync(`${output}/result.json`, JSON.stringify(result, null, 2));
  writeFileSync(`${output}/reward.txt`, result.success ? '1\n' : '0\n');
  console.log(JSON.stringify(result));
} catch (error) {
  writeFileSync(`${output}/reward.txt`, '0\n');
  throw error;
}
