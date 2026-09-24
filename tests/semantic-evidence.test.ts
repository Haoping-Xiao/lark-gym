import test from 'node:test';
import assert from 'node:assert/strict';
import { semanticEvidence } from '../scripts/task-support/semantic-evidence.ts';
test('small semantic evidence retains its exact complete JSON payload', () => {
  const input = {
    instruction: '任务',
    seed: { n: '001' },
    world: { n: '002' },
    calls: [{ seq: 1, status: 200 }],
  };
  assert.deepEqual(semanticEvidence(input), [
    { name: 'input.json', data: JSON.stringify(input) },
  ]);
});
test('large evidence partitions complete ordered calls without dropping values or exceeding byte limits', () => {
  const calls = Array.from({ length: 12 }, (_, i) => ({
    seq: i + 1,
    status: 200,
    body: '汉'.repeat(90),
    mutations: [{ before: { value: '001' }, after: { value: String(i) } }],
  }));
  const input = {
    instruction: '验证全部调用',
    expected_facts: { amount: '123.45' },
    seed: { id: '0007' },
    world: { id: '0007' },
    calls,
  };
  const files = semanticEvidence(input, 1000);
  assert.ok(files.length > 2);
  assert.ok(files.every((f) => Buffer.byteLength(f.data) <= 1000));
  const { call_files, evidence_layout, ...core } = JSON.parse(files[0].data);
  assert.match(evidence_layout, /no calls are omitted/);
  assert.deepEqual(
    call_files,
    files.slice(1).map((f) => f.name),
  );
  let next = 0;
  const restored = files.slice(1).flatMap((f) => {
    const part = JSON.parse(f.data);
    assert.equal(part.start_index, next);
    next += part.calls.length;
    return part.calls;
  });
  assert.deepEqual({ ...core, calls: restored }, input);
  assert.throws(
    () => semanticEvidence({ calls: [{ body: 'x'.repeat(2000) }] }, 1000),
    /single semantic call/,
  );
  assert.throws(
    () => semanticEvidence({ seed: 'x'.repeat(2000), calls: [] }, 1000),
    /seed\/world evidence/,
  );
});
