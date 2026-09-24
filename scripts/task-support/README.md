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

The default policy aborts on the first 501 and excludes the sample. The backend
seals subsequent operations, persists evidence, then writes an abort signal to a
trial-local volume mounted read-only in the agent container. The task keepalive
runs as PID 1 in the private Docker PID namespace and terminates its current
agent processes once; the separate backend survives for independent grading.
Native Harbor remains the entrypoint; neither CLI nor agent is wrapped.
The hook runs after rollback. Every call retains its sequence, timestamp, request,
original error, mutations and hook decision in the exported backend state.

Task `environment/unsupported-policy.json` controls:

- `execution`: `abort` (default) or `continue`. Continue returns feedback and
  permits subsequent operations; scoring/exclusion settings remain independent.
- `penalty_per_call`: nonnegative, default 0.
- `max_penalty`: nonnegative cumulative cap, or null for no cap.
- `score_floor`: default 0; a negative value or null allows negative reward.
- `exclude_from_valid_samples`: default true. False retains a reward even though
  the coverage gap remains recorded.
- `feedback`: factual text, without solution hints.

After editing policy, run `install.py` to copy the same configuration to the
separate verifier. A hook failure is an infrastructure error. This lifecycle actuator applies to installed agents in the Docker main
container, not host-side agents or other environment providers. Keep the task
PID namespace private and `init: false`. Do not mount the Docker socket or
backend state into main. Fresh trials require fresh control volumes; Harbor
cleanup removes them. Agent exit 137 is an environment abort, not a business
failure; the verifier still records exclusion and preserves its diagnostics.

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
`$`, correctly grouped commas and cent-exact decimals, including trailing zeros) compare by exact
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
text grading. Enabled for support 1465/1473/1475 tags, 1476 source_threads, and finance 4093 payment_ids (exact unique payment ID set).

`instant_fields` preserves an explicitly required instant while accepting
RFC3339 offsets and fractional-second forms without losing submillisecond precision. Calendar dates, clock components and
offsets are validated before comparing timestamps; timezone-free strings,
invalid dates and different instants fail. Enabled only for marketing 1061
scheduled_at, whose public instruction fixes 09:00 UTC. This does not establish
fixed times for tasks asking only for a day or morning. Creation normalization
considers new records only, leaving existing source records unchanged.

`numeric_result_columns` 仅用于经业务复核的派生比率列，以精确十进制值比较数值及字符串（允许科学计数法），不接受币种、非法数值或浮点舍入后的近似等价。与 `unordered_new_rows` 同用时，行匹配使用同一比率规则；来源金额仍按原值比较。

`schedule_fields` 用于只指定日期/时段的排期：程序要求严格有效且带时区的时间戳，业务日期/时段交给带 `schedule_window` 标记的独立评审；参考具体小时不是固定值。simple 3051–3060 明示相对排期按 UTC，这是适配约定而非上游原文规则；活动正文中原有 EST 等时区不改变。固定时刻任务仍用 `instant_fields`。

`literal_creation_terms` 为指定创建项的文本字段保留明确要求的字面内容检查，同时将周围叙述转交语义真实性评审。仅在该字段已列入 `text_fields` 时使用；必须按来源确认字面义务，不得从参考措辞推导。

`usd_result_columns.require_grouping` 仅在来源明确要求千分位时启用：绝对金额达到 1,000 美元必须使用含逗号的字符串；精确到分的等价写法及额外小数尾零可接受，非零的分以下数位不可接受。该规则同时用于新行匹配和最终单元格验收，不扩展到来源金额。

`creation_one_of` 为指定创建项的字段声明经来源确认的有限别名。替代值只在其余业务字段完全匹配时归一化；既有记录、错客户 ID、错业务单号和未列出的名称不受放宽。

`literal_terms_in_one_message_chat` 保留明确的同一正文要求：指定收件人至少有一条新消息同时包含全部字面值，与 `message_count=per_recipient` 共用时可以追加相关补充说明，但不能把该组值完全拆散。每个收件人只支持一组；消息检查先匹配这条完整正文，再匹配其他消息，补充说明先发也不误拒。所有消息仍接受完整性、关联和无冗余语义评审。

`literal_message_groups_chat` 保留一个收件人的多项原始正文断言，每组词必须同时出现在某一条新消息中；不同组可共用一条消息，也可分别出现在多条消息中。`semantic.literalMessageChecks` 给出逐组结果，安装脚本将其接入程序通过条件，独立于参考报告条数。不得仅复制配置而遗漏该验收条件。

`literal_forbidden_message_indices` 对经完整来源核对的正文禁词断言保留程序检查，同时仍做语义禁止事项评审。仅为明确的字面禁止启用，不从一般禁止动作推导禁词；例如 4060 原断言禁止税务正文包含被排除供应商名称。

`usd_result_columns.rows` 可进一步限定指定结果行（与 expected 的零基行号一致）。4100 仅对 C10/C11 两个更正后的计算余额比较精确金额，C3 直接给出的来源余额仍按原值检查；同列不等于都可数值化。

`utc_clock_result_columns` 只比较经审查的派生UTC时刻，支持12小时制（AM/PM）和24小时制，可带秒及UTC/Z/+00:00标识，按秒精确比较。无AM/PM的写法必须包含分钟；非法时分秒、数值类型、含糊的单个小时和非UTC偏移均不接受。5095仅启用Eve的Break Time结果格，来源Shift和其他单元格仍按原规则保护。

`usd_text_fields` 仅对任务配置的台账文本字段比较精确美元金额；实际与参考值均须为字符串，币种由经审查的USD字段上下文确定，可省略美元符号，仍拒绝错误币种、非法分组、非零分以下精度与类型变化。5101仅用于new_salary，通知中原始断言要求的金额字面值单独保留，不放宽来源表。

`event_utc_date_windows` 按原expected.events索引选择可变时刻的会议：硬性核对参考UTC日期和精确时长，其他会议保留原固定时刻。通知中写出的时间必须与实际日程一致；题面仅要求日期时不额外要求小时。5108仅用于三个正常面谈，明确要求当天15:00的补排会议不适用。
