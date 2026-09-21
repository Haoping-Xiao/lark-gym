import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startMock } from '../gyms/lark-cli/src/server.ts';
import {
  onUnsupported,
  scoreUnsupported,
  validatePolicy,
} from '../scripts/task-support/unsupported.ts';

const event = {
  seq: 1,
  method: 'GET',
  path: '/missing',
  status: 501,
  changed: false,
  response: { msg: 'ENV_UNSUPPORTED' },
};
test('coverage facts survive optional exclusion and penalty bounds', () => {
  const defaults = scoreUnsupported(1, [event]);
  assert.equal(defaults.valid_sample, false);
  assert.equal(defaults.raw_reward, 1);
  assert.equal(defaults.reward, 1);
  const calls = [event, { ...event, seq: 2 }, { ...event, seq: 3 }];
  assert.equal(scoreUnsupported(1, calls, { penalty_per_call: 0.6 }).reward, 0);
  assert.equal(
    scoreUnsupported(1, calls, { penalty_per_call: 0.6, max_penalty: 0.5 })
      .reward,
    0.5,
  );
  assert.ok(
    scoreUnsupported(1, calls, { penalty_per_call: 0.6, score_floor: null })
      .reward < 0,
  );
  const included = scoreUnsupported(1, calls, {
    exclude_from_valid_samples: false,
  });
  assert.equal(included.valid_sample, true);
  assert.equal(included.environment_incomplete, true);
  assert.equal(included.events.length, 3);
  assert.throws(() => validatePolicy({ penalty_per_call: -1 }));
  assert.throws(() => validatePolicy({ score_floor: 1 }));
  assert.throws(() => onUnsupported({ ...event, changed: true }));
});
test('unsupported requests invoke the task hook, preserve state, and allow the next call', async () => {
  const seed = JSON.parse(
    await readFile(
      'tasks/automationbench-simple-3151/environment/seed.json',
      'utf8',
    ),
  );
  const hookCalls: number[] = [];
  const backend = await startMock(seed, {
    onUnsupported(call) {
      hookCalls.push(call.seq);
      return onUnsupported(call);
    },
  });
  try {
    const headers = { authorization: 'Bearer local-evaluation-only' };
    const result = await fetch(backend.url + '/open-apis/missing/v1/objects', {
      headers,
    });
    assert.equal(result.status, 501);
    assert.match((await result.json()).msg, /可以尝试其他方式/);
    assert.deepEqual(backend.world, seed);
    assert.deepEqual(hookCalls, [1]);
    assert.equal(backend.calls[0].unsupported?.executed, false);
    const valid = await fetch(
      backend.url +
        `/open-apis/base/v3/bases/base_crm/tables/${seed.base.tables[0].table_id}/fields`,
      { headers },
    );
    assert.equal(valid.status, 200);
    assert.deepEqual(hookCalls, [1]);
  } finally {
    await backend.close();
  }
});
