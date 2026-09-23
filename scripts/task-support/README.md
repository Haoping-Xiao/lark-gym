# Task review and verifier support

All task packages remain native Harbor tasks. Each task owns its environment hook,
policy, instructions and grading rubric. `install.py` stages the default support
files after task generation; task-specific policy JSON is retained. Run:

```sh
python scripts/task-support/business-context.py
python scripts/task-support/business-tables.py
python scripts/task-support/install.py
python scripts/task-support/audit.py
npm run format
```

`reports/task-audit.json` inventories every task and flags old substring checks.
It is an inventory, not evidence that every business interpretation has been
independently reviewed or that the Mock matches production.

## Environment gaps

The default policy preserves the previous behavior: a 501 returns to the agent,
the agent may continue within its Harbor timeout, and the sample is excluded.
The hook runs after rollback. Every call retains its sequence, timestamp, request,
original error, mutations and hook decision in the exported backend state.

Task `environment/unsupported-policy.json` controls:

- `penalty_per_call`: nonnegative, default 0.
- `max_penalty`: nonnegative cumulative cap, or null for no cap.
- `score_floor`: default 0; a negative value or null allows negative reward.
- `exclude_from_valid_samples`: default true. False retains a reward even though
  the coverage gap remains recorded.
- `feedback`: factual text, without solution hints.

After editing policy, run `install.py` to copy the same configuration to the
separate verifier. A hook failure is an infrastructure error. There is no claim
that a task-side error kills an external agent process.

## Semantic checks

`tests/verify.ts` performs programmatic checks and records checks deferred to
`tests/semantic.toml`. Its output is an intermediate result, not the final score
for a task that needs a judge. `tests/evaluate.ts`, invoked by `test.sh`, runs the
semantic judge only after hard checks pass, then applies the environment policy.
The final reward is not written if the judge fails or the sample is excluded.

The judge reads trusted backend state/history, task instructions and applicable
policies, not an agent's claim of success. Reference facts anchor the business
requirements; reference wording is not a unique acceptable answer. The rubric
explicitly distinguishes forbidden actions/disclosures from negations, quotes,
and corrections containing the same word. Object identity, recipients, counts,
numeric state and unrelated-state protection remain programmatic checks.

`tests/semantic-config.json` selects semantic text fields. An explicit literal
message requirement can be retained in code using `literal_message_terms`, keyed
by the index in `expected.messages`. Changes must be justified by the user request
or policy; do not add literal requirements to fit a reference answer.

The verifier image installs `harbor-rewardkit==0.2.1`; the rubric defaults to
`openai/gpt-6-astra`. Pass the provider configuration only to the separate verifier,
for example Harbor `--ve OPENAI_API_KEY=...` and `--ve REWARDKIT_JUDGE=...`.
Keep secrets out of task files and command history. Configure judge timeout and
cost budgets for the actual provider before large runs. A completed local test of
programmatic grading is not a claim of live judge validation.

## Contract comparisons

`tests/base-contract.test.ts` executes the real pinned CLI against the Mock and
checks projections, pagination and state reads. Existing transaction, isolation,
calendar and messaging tests remain in place.

`scripts/compare-cli-contracts.mjs` compares JSON results from the real CLI in a
test tenant and the evaluation CLI, using a manifest of corresponding commands
and an explicit ID mapping. Write scenarios require the test-tenant execution
option. Provision independent synthetic fixtures first; do not replay writes into
production. The report distinguishes matches, differences and unrun scenarios.
No live tenant parity or Astra coverage run has yet been performed in this change.

Automatic CI runs programmatic regressions and the deterministic maintenance
container task. Full 800-task native Harbor acceptance now includes live judges;
run the workflow manually with `run_model_judges=true` and verifier credentials.
Those gated checks are not reported as executed by ordinary PR CI. Astra agent
exploration uses `experiments/eval/astra-coverage.yaml` separately; judge execution
is not evidence that an Astra agent explored the environment.

Business entities are exposed as separate tables with task-owned schemas. Existing records and source IDs stay in one authoritative backend state; each API table selects only its own entity. Reference solutions use the same table APIs as agents. Lookup tables declare read-only access. This is a Feishu business adaptation, not API compatibility with the original SaaS providers.

For example, marketing-1142 retains `INFR-SUBJ-Q1` as a literal requirement:
the partnerships message explicitly requires that subject-line tag for CRM
linking. The same task's ban on the substring `renew` is deferred to semantic
review so a refusal to renew is not automatically treated as a renewal.

`literal_fields` 保留指定字段的精确/包含检查：simple-3006 要求原链接，simple-3016 和 simple-3038 明确给出写入文本。这些默认例外与 marketing-1142 的标签规则保存在 `semantic-overrides.json`。任务版本升至 0.2.0；原始业务记录与 expected.json 保持不变，语义评分只调整内存中的程序检查副本。

## User-facing context and resource discovery

Task Dockerfiles do not install per-task AGENTS files. The judge receives exactly
`instruction.md`, plus authoritative seed/state; it no longer concatenates an
execution guide. Business reference time is explicit in the request. Reviewed
request changes live in `user-request-overrides.json`; review-model proposals are
not automatically installed.

Drive file listing and title/content search derive their results from the live
Sheets and Base objects. These are an accessible root catalogue for the task
identity, not a simulation of all Drive permissions/folders. Unknown filters
remain recorded 501 gaps. CLI regression tests cover discovery, pagination,
content search after a write, and rejecting an unsupported filter. Production
parity and every possible discovery workflow remain unverified.

Task-specific grading policies preserve required identity and collateral checks:
`unordered_new_rows` accepts equivalent new rows in a different order, leaving
existing-row updates strict; `message_count: per_recipient` permits splitting a
report, while code still checks recipients and the semantic judge checks complete
coverage and absence of redundant notifications. Reviewed task-specific opt-ins
are listed in [semantic-overrides.json](semantic-overrides.json); these policies
do not change the default grading behavior of other tasks.

`optional_message_chats` permits an explicitly optional notification to be absent
for reviewed recipients (currently finance-4094's embargo-only CFO notice). When
present, the ordinary recipient, message-count and content checks still apply;
absence never waives required records or forbidden disclosures. The original
content facts and optional-recipient metadata are passed to the semantic judge.

`usd_result_columns` opts reviewed derived-result columns into deterministic USD
amount comparison. Plain numbers and numeric strings (optionally prefixed with
`$`, correctly grouped commas and up to two decimal places) compare by exact
integer cents. Other currencies, malformed strings and different amounts fail.
Only declared expected result cells qualify; unchanged source values remain
protected. Currently this covers finance 4048 remaining credit/bill balances and
4054 updated accumulated depreciation, 4081 recommended credit limits and 4098
recognized-to-date totals, not their source amounts or journal field types. It does not defer these amount checks to a language model.

`json_text_fields` compares reviewed text-backed JSON fields structurally without
changing their stored field type. `string_set` requires unique string elements
and compares the exact tag set; `structure` retains array order and all nested
values while ignoring JSON whitespace and object key order. Missing, malformed,
wrong-type or additional content fails. These fields cannot fall back to free
text grading. Enabled only for support 1465/1473/1475 tags and 1476 source_threads.

`instant_fields` preserves an explicitly required instant while accepting
RFC3339 offsets and fractional-second forms without losing submillisecond precision. Calendar dates, clock components and
offsets are validated before comparing timestamps; timezone-free strings,
invalid dates and different instants fail. Enabled only for marketing 1061
scheduled_at, whose public instruction fixes 09:00 UTC. This does not establish
fixed times for tasks asking only for a day or morning. Creation normalization
considers new records only, leaving existing source records unchanged.
