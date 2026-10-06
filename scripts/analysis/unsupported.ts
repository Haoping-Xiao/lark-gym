import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

type Call = {
  seq: number;
  method: string;
  path: string;
  status: number;
  timestamp?: string;
  response?: unknown;
};

/** Read Harbor trial artifacts only. Scores and agent-authored output are not inputs. */
export function analyzeUnsupported(jobPath: string) {
  const job = resolve(jobPath);
  const operations = new Map<string, { requests: number; trials: number }>();
  const trials = readdirSync(job, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .filter((name) =>
      ['config.json', 'trial.log', 'artifacts'].some((entry) =>
        existsSync(join(job, name, entry)),
      ),
    )
    .map((trial) => {
      const artifact = join(
        job,
        trial,
        'artifacts/var/lib/feishu-mock/state.json',
      );
      const base = { trial, artifact, agentLogs: join(job, trial, 'agent') };
      let state: { calls: Call[] };
      try {
        state = JSON.parse(readFileSync(artifact, 'utf8'));
        if (
          !Array.isArray(state.calls) ||
          state.calls.some(
            (call) =>
              !call ||
              !Number.isInteger(call.seq) ||
              !Number.isInteger(call.status) ||
              typeof call.method !== 'string' ||
              typeof call.path !== 'string',
          )
        )
          throw new Error('Invalid calls array');
      } catch (error) {
        return {
          ...base,
          evidence:
            (error as NodeJS.ErrnoException).code === 'ENOENT'
              ? 'missing'
              : 'invalid',
          error: error instanceof Error ? error.message : String(error),
          unsupportedRequests: null,
          requests: [],
        };
      }
      const requests = state.calls
        .filter((call) => call.status === 501)
        .map((call) => ({
          seq: call.seq,
          timestamp: call.timestamp,
          method: call.method,
          path: call.path,
          response: call.response,
        }));
      const seen = new Set<string>();
      for (const request of requests) {
        const key = `${request.method} ${request.path}`;
        const count = operations.get(key) ?? { requests: 0, trials: 0 };
        count.requests++;
        if (!seen.has(key)) count.trials++;
        operations.set(key, count);
        seen.add(key);
      }
      return {
        ...base,
        evidence: 'available',
        unsupportedRequests: requests.length,
        requests,
      };
    });
  if (!trials.length)
    throw new Error(`No Harbor trial directories found in ${job}`);
  return {
    job,
    trajectorySearchMarker: 'ENV_UNSUPPORTED',
    totalTrials: trials.length,
    trialsWithEvidence: trials.filter((t) => t.evidence === 'available').length,
    missingEvidenceTrials: trials.filter((t) => t.evidence === 'missing')
      .length,
    invalidEvidenceTrials: trials.filter((t) => t.evidence === 'invalid')
      .length,
    affectedTrials: trials.filter((t) => (t.unsupportedRequests ?? 0) > 0)
      .length,
    unsupportedRequests: trials.reduce(
      (sum, t) => sum + (t.unsupportedRequests ?? 0),
      0,
    ),
    operations: [...operations]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([operation, counts]) => ({ operation, ...counts })),
    trials,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (process.argv.length !== 3) {
    console.error(
      'Usage: node scripts/analysis/unsupported.ts <Harbor job directory>',
    );
    process.exitCode = 1;
  } else {
    try {
      console.log(JSON.stringify(analyzeUnsupported(process.argv[2]), null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
