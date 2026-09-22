# Task business and verifier review (task version 0.2.0)

## Changes and observed problems

- Reviewed the generated packages for all 800 AutomationBench tasks (600 formal,
  200 simple), plus the maintenance example. This is a package/schema/scoring
  audit, not independent certification of every source business interpretation.
- Replaced the mixed business collection table with 1,504 entity tables across
  the 800 tasks. Table APIs select records from one authoritative state, hide the
  internal collection field, and prevent writes to declared lookup tables.
  Task-specific execution guides were subsequently removed; see the follow-up below.
- Simple-3151 previously mixed ticket/case guidance and prescribed reference
  prose. Its request now asks for a support ticket based on the customer message;
  the task exposes the ticket table and the grader still checks the business facts.
- Field projection was previously ignored; table details and group search lacked
  routes. Added scoped behavior and real-CLI checks. During review, member search
  was found to read a different field from membership writes; it now reads the
  same membership state, including after removal and across isolated runs.
- String guards such as marketing-1142's `renew` cannot distinguish a renewal
  from a refusal. Text meaning now goes to a task-owned rubric. The explicit
  `INFR-SUBJ-Q1` tag remains a code check. Simple-3006's source link and the exact
  text requested in simple-3016/3038 also remain code checks.
- Sales-703 is a text-only task: an unchanged world can pass structural checks,
  but must still reach the semantic judge. The pipeline regression exercises
  this handoff with a stubbed failing judge; it does not prove model judgment.

## Data and policy invariants checked locally

Compared all 800 seeds against base commit
`ad1f0423975ad4481dc4fa0e13ae5848e7ba8731`: after removing the newly added
`base.tables` metadata, every seed is identical to its baseline. No
`tests/expected.json` business values changed. This preserves source records,
policies, distractors and target facts; it does not certify that the earlier
migration itself was fully faithful.

All 801 environment/verifier policy and hook pairs match. The 800 semantic
support copies match their source templates. All 800 rubric TOMLs validate using
the actual installed `harbor-rewardkit==0.2.1` schema, without model calls.

Unsupported operations roll back and return 501. The task hook records the
request, reason, decision and timestamp; the agent may continue until its normal
Harbor timeout. Default penalty is zero and the sample is excluded. Policies can
change cumulative penalty cap, score floor (including negative or unbounded),
and eligibility. A hook or judge infrastructure error never becomes a model
failure score. Semantic checks only run after structural checks pass and sample
eligibility permits grading.

## Scoped contract evidence

| Scope                  | Local evidence                                                                                                                   | Not established                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Base records           | Real CLI field-name/ID projection, offset/limit, update/read/list, invalid field, batch atomicity, deletion, cross-run isolation | Real-tenant error codes and all query/filter semantics                           |
| Business tables        | Entity-local reads/writes, schema, cross-table ID rejection, single shared state                                                 | Full online Base permission model                                                |
| Chats                  | Group keyword/mode search, shared membership reads after add/remove, creation/read/messages and permission rejection             | Full visibility, manager, sorting, mute behavior and production identity mapping |
| Calendar/sheets        | Existing read/write, wrong-window/collateral, isolation and transaction regressions retained                                     | Full Feishu API coverage                                                         |
| Unsupported operations | Hook, rollback, continuation, inclusion/exclusion, penalty/floor behavior                                                        | Agent exploration coverage rate                                                  |
| Semantic grading       | Actual rubric schema validation and stubbed pass/fail/provider-error composition                                                 | Live judge accuracy, alternative-answer acceptance or false-negative rate        |

Unknown behavior remains an explicit coverage gap rather than a fabricated
success response. The comparison helper `scripts/compare-cli-contracts.mjs`
accepts paired real/Mock CLI commands and ID normalization; it has not been run
against a tenant. A match means the declared JSON observations match, not that
unobserved side effects or all API behavior match.

## Completed local validation

- `npm run check`: passed type checking, formatting, all 825 Node tests, Go tests and vet. This includes programmatic regressions for all 800 migrated tasks.
- `npm run oracle`: passed the standalone maintenance reference-solution/artifact test.
- Focused table/member and verifier-composition tests passed after final changes. Judge composition uses a stub, not a model.
- 800 actual RewardKit rubric schemas validated; 801 policy/hook pairs and shared support copies checked for consistency.

## Pending runtime acceptance

The local host has no Docker/Harbor execution surface and no configured model
credentials. Docker installation was not authorized. The following remain unrun:

1. Native Harbor builds and runtime collection for the new verifier image.
2. Full 800-task oracle/no-op acceptance with live semantic judges.
3. `gpt-6-astra` agent exploration via `experiments/eval/astra-coverage.yaml`.
4. Real Feishu test-tenant command/flag and state-transition comparisons.

Ordinary CI runs local checks and the deterministic maintenance container case.
The 800-task workflow requires explicit model execution and verifier credentials;
even no-op trials can require a judge. Astra exploration is separate from judge
execution. Historical 800-task container results apply only to their recorded
older commit, not to task version 0.2.0.

Review the shared changes first (`scripts/task-support`, Mock routes, tests, CI),
then task-owned policies and overrides. Most changed files are generated native
Harbor packages rather than separate hand-written implementations.

## Follow-up: user context and reviewed grading restrictions

The 801-task external Codex static review finished in 101 batches. Its labels are
candidate findings, not executed task acceptance. The personal scheduler and raw
review output remain outside this repository.

Confirmed problems addressed in this follow-up:

1. Removed 800 task-specific AGENTS files and their Docker COPY instructions.
   Verifiers now receive exactly the user request instead of appending execution
   and migration instructions. Business reference times remain visible.
2. Added Drive root listing and document search over the actual live Sheets/Base
   objects, so locating resources does not require the deleted catalogue. The
   real CLI test exercises pagination, finding a business table, searching after
   a write and rejecting an unsupported filter. It does not certify production
   permissions, folders, all filters or all 801 discovery paths.
3. Rewrote five reviewed user requests and removed repeated financial-system
   migration/record-ID hints. Kept business restrictions and scope (including
   record-only or rehearsal operations) rather than claiming external payments
   or publications were executed. This is not a claim that all 459 instruction
   candidates from the model have been independently resolved.
4. Finance-4001 accepts equivalent newly entered invoice rows in either order;
   wrong values and unrelated changes remain failures. Finance-4008 allows
   multiple report messages to the intended recipient; semantic completeness,
   missing details and redundant notifications still require the judge.
5. Maintenance accepts the target system in the event description and a localized
   title. Read-before-write checks cover the target's candidate windows, rather
   than requiring unrelated Server Room rows.

Paired regression cases exercise the valid alternatives and wrong vendor,
wrong recipient or missing event identity. No live semantic judge was invoked
for these cases; intermediate structural acceptance is not final reward.
Other model-suggested grading changes remain candidates until reviewed against
source intent and visible policy. No blanket relaxation of all task criteria.

Follow-up local verification: `npm run check` passed with 830 Node tests,
TypeScript checks, formatting, Go tests and vet; `npm run oracle` passed.
All 800 seeds and expected-result files equal the pre-follow-up versions.
Hosted checks for this follow-up commit are tracked separately in the PR.

## Local development with real Codex sessions

The personal SDK workflow remains outside this repository. It runs gpt-6-astra
against the real CLI and an independent Mock, then starts a fresh judge session
using the task rubric and backend snapshot. This is not Harbor container or
RewardKit HTTP transport acceptance.

Three initial exploration trials (4001, 4008, 3151) revealed message search,
mail, resource-filter and no-overwrite coverage gaps. All were excluded by the
coverage policy. 4008 and 3151 passed business/semantic checks; 4001 omitted
supplier-return notices. The follow-up implements shared-state IM search and
batch lookup, Drive document-type filtering, and atomic no-overwrite sheet
writes. Message search supports text terms, chat and time filters; unsupported
sender/attachment filters remain explicit gaps, and production ranking is not
replicated. Mail and sheet-comment discovery still need work.

Finance4001 now explicitly sends its Notes and invoice-date columns to semantic
review. Other tasks do not inherit this opt-in; supplier, invoice, money and due
date constraints remain structural. Actual independent judge sessions accepted
row reordering, complete split reports, source date spelling and supported
notes; rejected omitted/duplicate reports and an incorrect invoice date. A
wrong supplier was rejected by hard rules. Controlled alternative states are
labeled as fixtures and do not invent mutation histories.

Full reference-result semantic review of 800 frozen tasks is running locally;
this is neither complete nor 800 player trials. The local code checks passed
832 tests plus type/format/Go checks and oracle verification. The additional
Drive type-filter regression and typecheck passed separately after that run.

## Reference-result corrections after live semantic review

Five source-checked reference defects were corrected, together with their
migration definitions. Simple3077 now anchors “today” to the original February23
message; simple3165 preserves the original February21 message's next-week
interval rather than shifting it at reply time; simple3170 no longer adds a
dollar currency absent from the source. Support1431 includes all five closed
conversations. Support1472 includes all fifteen conversations, with five
uncategorized rows, including closed rows permitted by its full-snapshot scope.
The two support tasks' expected counts were corrected accordingly; no seed,
user request or semantic rubric was relaxed.

All five corrected task-owned reference solutions were executed through the
real CLI and independently accepted by gpt-6-astra using the unchanged rubrics.
These results supersede their rejected baseline outputs; they do not resolve
other rejected cases or environment coverage exclusions.

Four financial reference notices were subsequently corrected and independently
rejudged successfully: finance4048 labels original credit and applied amount;
finance4061 explicitly distinguishes completed ledger entry from a bank
payment; finance4062 renders the derived NY taxable sales with two decimal
places; finance4075 asks each mismatched supplier to verify the discrepancy.
Migration definitions and the affected numeric-format reference facts were
synchronized. Business data, task requests and rubrics remain unchanged.
Six further references now pass independent live rejudging: hr5059 includes the
orientation start time in the director notice; hr5113 preserves the exact subject
line; hr5126 limits the safety announcement to status counts; sales808 reports
pending invitation records without claiming invitations were sent; support1413
labels its full-state snapshot; support1573 removes an unsupported future promise.
Migration definitions are synchronized without changing requests, seed or rubrics.
The remaining eighteen references also passed independent live rejudging.
Corrections preserve source wording, subject-line placement, UTC windows,
operation status, offboarding authorization context and signature requests.
Marketing1074 now includes the additional blackout-date campaign; marketing1115
preserves source attribution and the relationships between competitive facts.
Support1415 names skipped contacts and support1425 includes expired/denied
amount subtotals. Hr5072 now actually reads the requested standup, roster, leave
and announcement sources before reporting the review; its migration recipe
preserves these reference read commands.

All 33 rejected reference results from the frozen 800-case baseline have now
been corrected and individually accepted by the unchanged live semantic judge.
This combines the frozen baseline's 767 passes with subsequent corrected-case
rejudges, not a new 800-case run on the latest commit. Player exploration still
has environment coverage exclusions; container/model transport and real-tenant
parity are separate, incomplete acceptance items.

## Record-query coverage follow-up

The actual CLI's record-search request and scalar list-filter protocol now read
the same table state as mutations, before projection and pagination. Real-CLI
regression exercises updates followed by search, numeric filtering, equality,
filtered pagination and explicit rejection of unsupported operators/options.
Keyword matching is case-insensitive substring matching; numeric/text values
are not implicitly coerced. Complex filters, sorting and view semantics remain
outside this implemented subset, pending real-tenant contract comparison.

A fresh gpt-6-astra player run of simple3016 completed 21 backend requests with
no unsupported calls, passed programmatic and independent semantic checks, and
was a valid successful sample. Its earlier excluded run remains retained; this
single rerun does not establish broad environment coverage.

## Document-comment read coverage

Accessible sheet/base resources now expose scoped comment lists, batch reads
and reply pagination from shared optional `drive_comments` fixture state.
An absent comments fixture means an initially empty comment set. Solved/whole
filters apply before pagination; unknown resources and cross-document comment
IDs fail. Writes, reactions and relation expansion remain explicit coverage
exclusions. Real-CLI regression verifies nonempty fixtures, filters, pagination,
consistent list/batch reads, empty state and independent trial copies.

A fresh finance4008 Astra run completed 23 requests, no 501 responses and both
hard/semantic checks passed. That run did not call comments, so it proves a
valid successful trial, not replay of the former comment-read path. The comment
path itself was exercised by the real-CLI integration regression.

## Contact and membership coverage

The simulator now derives stable `ou_mock_` aliases from existing user records
and email-addressed P2P recipients. Search, basic/profile reads, membership
read/write and member-filtered chat search use the same identity mapping;
memberships retain canonical source IDs. Missing business names/departments
are not invented. Activation/tenant metadata describes simulator accounts only,
with a response notice; employment/organization filters remain unsupported.
Real-CLI regression covers ID round-trips, email recipients, mutation/readback,
failed-write atomicity and independent trials.

Fresh Astra runs for hr5029 and finance4005 both had zero unsupported calls.
Hr5029 passed hard and semantic verification after 79 requests. Finance4005
was a valid failure after 52 requests: the player did not read the billing-group
10% Meridian discount and invoiced 14,625 rather than 13,162.5. Source review
confirmed the discount; hard and semantic graders rejected the result. No
scoring rule was relaxed to make that player attempt pass.

### Further local review: mail boundary and finance4010

A fresh marketing1142 Astra player made 65 requests and passed programmatic
and independent semantic checks, but two native-mail requests (list and search)
returned 501. It remains excluded, not a valid pass. Contact improvements do not
establish native-mail coverage.

A source inventory at `10a051b9` found 386 of 800 tasks with 8,746 original mail
messages in the migrated IM archive; 357 tasks contain multiple recipients.
There is no explicit native mailbox identity or permission model. Six tasks also
have 333 mutable `mail_messages` ledger rows, whereas `oc_mail` preserves the
historical snapshot. Projecting that archive into mailbox `me` would invent
ownership and could return stale read/label state. Native-mail support therefore
remains unimplemented; the declared IM/ledger migration is unchanged.

Finance4010's original request explicitly allows message(s), and its close
procedure specifies complete balanced entries, not an exact message count.
Its previous verifier rejected a complete summary split into entries and totals.
A task-specific `per_recipient` override now checks destination and delegates
completeness and redundancy to the existing semantic rubric. Wrong recipients
still fail structural checks. Independent gpt-6-astra judges accepted the complete
split and rejected missing totals and a duplicate report. These three are
controlled post-state fixtures derived from a recorded reference run, not player
traces. Task instructions, seed, expected facts and reference solution are unchanged.

### Reviewed notification granularity: seven more finance tasks

Finance4009 and finance4011–4016 were individually checked against their original
requests, current instructions and supplied business policies. They require the
correct recipients, content and business actions, but do not prescribe a fixed
number of transport messages. Each now explicitly opts into per-recipient
completeness and redundancy checks; no global grading default changed. Task data,
expected facts, reference solutions and semantic rubrics are unchanged.

Controlled complete splits failed the previous programmatic checks for all seven.
The real-CLI/reference integration tests now accept those structural alternatives
and still reject wrong recipients. Fresh independent gpt-6-astra judges accepted
all seven complete splits. Three separate negative fixtures were rejected:
finance4009 without the required `[PRIORITY]` marker, finance4012 with a duplicated
invoice notification, and finance4016 omitting Operations from the variance report
and alert. These are labeled controlled post-states retaining reference history as
provenance, not model-generated trajectories or new reference executions.

A fresh finance4015 player on the initial split-policy revision made 55 requests,
failed to deliver the report and triggered eight native-mail coverage gaps. The
instruction only said to send a report to an email address, while verification
expected Feishu IM. The delivery channel is now explicitly stated as Feishu
private messages in finance4011, 4012, 4014 and 4015, their judge-visible copies and
migration definitions. This clarifies the existing business destination; it adds
no CLI commands, resource IDs or expected report content. Native mail remains
unsupported and coverage exclusions are unchanged.

After that clarification, a fresh finance4015 Astra player made 32 requests with
zero 501 responses, delivered the report to the expected private chat, and passed
both programmatic and independent semantic checks (valid reward 1). It sent one
report, so the controlled fixtures remain the evidence for split-report handling.
Four affected positive fixtures and the finance4012 duplicate negative were also
independently rejudged after the instruction change, with the same expected
verdicts. Full local checks passed 843 tests plus type/format/Go checks and the
reference entrypoint check; task-input and changed-file format checks passed
again after the delivery-channel edits.

### Further financial notification checks

Finance4021, 4058, 4061–4064 and 4072–4073 were individually reviewed against the
original requests and supplied policies before enabling per-recipient message
checks. All eight complete-split fixtures failed the previous verifier and passed
independent gpt-6-astra semantic review after the change. The corrected reference
states from the earlier finance4061/4062 fixes were used for those two tasks;
other fixtures use the recorded baseline references. Seeds were checked against
the current tasks. Controlled post-state edits are labeled separately from the
original reference call history.

Three negative fixtures were independently rejected: claiming a bank payment was
initiated in finance4061, changing finance4063's repayment deadline from February
24 to February 21, and reporting finance4072's over-receipt as a shortage. Wrong
recipients remain rejected by the real-CLI/reference structural regressions.
The opt-ins leave all other business checks and the semantic rubrics intact.

Finance4021 and 4072 now explicitly name Feishu private messages as the delivery
channel, including in their judge copies and migration definitions. No commands,
resource IDs or answer content were added. A fresh finance4072 Astra player made
51 requests with zero 501 responses, completed the ledger changes and procurement
notification, and passed both programmatic and independent semantic checks (valid
reward 1). It sent a combined report; split handling is established by the
controlled alternatives. Seeds, expected facts and reference solutions were not
changed in this batch.
