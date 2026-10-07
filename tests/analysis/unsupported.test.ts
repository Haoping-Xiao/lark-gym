import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { analyzeUnsupported } from '../../scripts/analysis/unsupported.ts';

test('counts backend requests per trial, preserves rewards, and separates missing or invalid evidence', () => {
  const job = mkdtempSync(join(tmpdir(), 'unsupported-analysis-'));
  try {
    const call = {
      seq: 1,
      method: 'POST',
      path: '/missing',
      status: 501,
      response: { msg: 'ENV_UNSUPPORTED' },
    };
    for (const [name, calls] of Object.entries({
      task__attempt1: [call, { ...call, seq: 2 }],
      task__attempt2: [{ ...call, path: '/other' }],
      clean: [{ ...call, status: 200 }],
      missing: null,
      invalid: 'not an array',
    })) {
      const dir = join(job, name);
      mkdirSync(join(dir, 'artifacts/var/lib/feishu-mock'), {
        recursive: true,
      });
      writeFileSync(join(dir, 'config.json'), '{}');
      writeFileSync(join(dir, 'reward.txt'), '1\n');
      if (calls !== null)
        writeFileSync(
          join(dir, 'artifacts/var/lib/feishu-mock/state.json'),
          JSON.stringify({ calls }),
        );
    }
    mkdirSync(join(job, 'unrelated'));
    // Repeated quoted errors in an agent log must not inflate request counts.
    writeFileSync(
      join(job, 'clean', 'agent.txt'),
      'ENV_UNSUPPORTED\n'.repeat(10),
    );
    const report = analyzeUnsupported(job);
    assert.equal(report.totalTrials, 5);
    assert.equal(report.trialsWithEvidence, 3);
    assert.equal(report.affectedTrials, 2);
    assert.equal(report.unsupportedRequests, 3);
    assert.equal(report.missingEvidenceTrials, 1);
    assert.equal(report.invalidEvidenceTrials, 1);
    assert.deepEqual(report.operations, [
      { operation: 'POST /missing', requests: 2, trials: 1 },
      { operation: 'POST /other', requests: 1, trials: 1 },
    ]);
    assert.equal(
      report.trials.find((t) => t.trial === 'missing')?.unsupportedRequests,
      null,
    );
    assert.equal(
      report.trials.find((t) => t.trial === 'clean')?.unsupportedRequests,
      0,
    );
    assert.equal(
      readFileSync(join(job, 'task__attempt1/reward.txt'), 'utf8'),
      '1\n',
    );
  } finally {
    rmSync(job, { recursive: true, force: true });
  }
});

test('an empty job is not reported as a successful zero-gap evaluation', () => {
  const job = mkdtempSync(join(tmpdir(), 'unsupported-empty-'));
  try {
    assert.throws(() => analyzeUnsupported(job), /No Harbor trial/);
  } finally {
    rmSync(job, { recursive: true, force: true });
  }
});
