# Astra player and judge acceptance

This is native Harbor execution, not the personal static-review workflow.
The player runs `codex` with `openai/gpt-6-astra`; the separate verifier invokes
RewardKit with the task's `openai/gpt-6-astra` rubric. Sharing a model is not an
independent correctness guarantee. Code checks, reference/no-op controls and
negative fixtures remain necessary; review traces before changing business rules.

Configure repository Actions secret `OPENAI_API_KEY` with access to the requested
model. Credentials are passed using Harbor environment references and never
written into generated job configuration. Existing local Codex ChatGPT login is
not a RewardKit API credential and is not uploaded to CI.

Use the existing workflow on the PR branch (no merge needed):

```sh
gh workflow run ci.yml --ref feat/task-business-and-verifier-audit \
  -f astra_scope=smoke -f run_model_judges=false
```

Smoke covers simple-3151, finance-4001, finance-4008 and maintenance. It runs each
reference solution, no-op control and Astra player, and then five controlled
post-state fixtures: reordered invoice rows, wrong vendor, split complete report,
missing report item and duplicate report item. These fixtures test judges, not
agent behavior; historical write calls are removed so they cannot masquerade as
trajectories for the altered states. Fixture failures require investigation, not
changing expected labels merely to obtain green checks.

After inspecting smoke traces and judge explanations, replace `smoke` with `full`.
Full selects exactly 800 AutomationBench tasks, in 100 disjoint shards of eight,
with at most three workers and one active Harbor trial per worker. Each shard
runs oracle, nop and Astra separately. Harbor/task timeouts bound the run; no new
turn limit is introduced. This executes 2,400 trials, but only trials with deferred
semantic checks and passing code checks invoke the judge. Maintenance is a smoke
control, not part of the 800-task success-rate denominator.

Artifacts contain the fixed selection, Harbor configurations, player trajectories,
backend snapshots/API calls, verifier result and judge explanations. Per-job
summaries distinguish valid pass/fail, environment exclusion, execution errors,
missing state/reward and missing trials. Endpoint counts describe observed traffic,
not a coverage percentage over all possible CLI commands or branches. Inspect
unimplemented operations, legitimate alternatives rejected, partial results
accepted and unexpected business modifications before proposing task changes.

Preparation and schema/unit tests do not establish real model acceptance. Until
model credentials are configured and these jobs run, there are no new Astra
exploration traces or live-judge results to report.
