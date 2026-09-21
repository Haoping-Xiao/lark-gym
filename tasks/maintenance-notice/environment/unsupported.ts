export interface UnsupportedPolicy {
  version: 1;
  penalty_per_call: number;
  max_penalty: number | null;
  score_floor: number | null;
  exclude_from_valid_samples: boolean;
  feedback: string;
}
export const defaultPolicy: UnsupportedPolicy = {
  version: 1,
  penalty_per_call: 0,
  max_penalty: null,
  score_floor: 0,
  exclude_from_valid_samples: true,
  feedback: '当前模拟环境尚未实现此操作，本次操作未执行。你可以尝试其他方式。',
};
export function validatePolicy(
  input: Partial<UnsupportedPolicy>,
): UnsupportedPolicy {
  const policy = { ...defaultPolicy, ...input };
  if (
    policy.version !== 1 ||
    !Number.isFinite(policy.penalty_per_call) ||
    policy.penalty_per_call < 0 ||
    (policy.max_penalty !== null &&
      (!Number.isFinite(policy.max_penalty) || policy.max_penalty < 0)) ||
    (policy.score_floor !== null &&
      (!Number.isFinite(policy.score_floor) || policy.score_floor > 0)) ||
    typeof policy.exclude_from_valid_samples !== 'boolean' ||
    typeof policy.feedback !== 'string'
  )
    throw new Error('Invalid unsupported policy');
  return policy;
}
export interface UnsupportedEvent {
  seq: number;
  method: string;
  path: string;
  status: number;
  changed: boolean;
  response: unknown;
}
export function onUnsupported(
  event: UnsupportedEvent,
  input: Partial<UnsupportedPolicy> = {},
) {
  const policy = validatePolicy(input);
  if (event.status !== 501 || event.changed)
    throw new Error('Unsupported hook requires a rolled-back 501');
  return {
    kind: 'environment_unsupported',
    policy_version: policy.version,
    call_seq: event.seq,
    method: event.method,
    path: event.path,
    reason: event.response,
    executed: false,
    action: 'continue',
    penalty: policy.penalty_per_call,
    feedback: policy.feedback,
  };
}
export function scoreUnsupported(
  rawReward: number,
  calls: UnsupportedEvent[],
  input: Partial<UnsupportedPolicy> = {},
) {
  const policy = validatePolicy(input);
  if (!Number.isFinite(rawReward)) throw new Error('Invalid raw reward');
  const events = calls
    .filter((c) => c.status === 501)
    .map((c) => onUnsupported(c, policy));
  const penalty = Math.min(
    events.length * policy.penalty_per_call,
    policy.max_penalty ?? Infinity,
  );
  const reward = Math.max(policy.score_floor ?? -Infinity, rawReward - penalty);
  return {
    environment_incomplete: events.length > 0,
    valid_sample: !(events.length > 0 && policy.exclude_from_valid_samples),
    raw_reward: rawReward,
    penalty,
    reward,
    policy,
    events,
  };
}
