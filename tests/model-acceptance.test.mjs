import test from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
test('model acceptance partitions tasks and distinguishes gaps, missing trials and judge errors', async () => {
  await exec('python3', ['scripts/tests/test_model_acceptance.py']);
});
