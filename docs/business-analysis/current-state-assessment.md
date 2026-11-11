# Current State Assessment

## Purpose
Understand the business need for Beacon Supplies order intake in the context of the enterprise as it is today, so the change has enough context to define a sensible future state and change strategy. This assessment describes only as much of the current state as the intake improvement requires.

## Document Control

| Field | Value |
| --- | --- |
| Initiative | Beacon Supplies order intake improvement |
| Sponsor | To be confirmed |
| Business analyst | To be confirmed |
| Version | 0.1.0 |
| Status | Draft |
| Last updated | 2026-11-01 |

## Scope
State which part of the enterprise this assessment describes and why that boundary is enough for the change.

| In scope | Out of scope | Reason |
| --- | --- | --- |
| Order intake from receipt of approved spreadsheet or email-derived input through manual validation, manual entry into the existing order queue, sender acknowledgement, and failure handling | Payment processing, fulfilment and dispatch, customer records and master data, replacement of or change to the existing downstream order system | Not affected by the intake need; downstream remains unchanged by constraint |
| Work of operations coordinators and support staff, plus intake senders, sales lead, operations sponsor, and finance-system owner as constrainer | Direct order entry portal for senders | Proposed exclusion, intake remains via approved spreadsheet or email-derived input |

## Inputs

| ID | Input | Source | Date |
| --- | --- | --- | --- |
| IN-001 | Synthetic canary scenario based on fictional Beacon Office Supplies brief, assertion for analysis not observed customer evidence | Operator supplied scenario | 2026-11-01 |
| IN-002 | Solution Scope v1, SC-001 to SC-006 and proposed exclusions OS-001 to OS-005 | Scope definition | 2026-11-01 |
| IN-003 | Business Objectives v1, OBJ-001 to OBJ-003, baselines need to be measured and targets and dates need to be agreed | Objectives definition | 2026-11-01 |
| IN-004 | Stakeholder Register v1, STK-001 to STK-007 | Stakeholder analysis | 2026-11-01 |

## Business need

| Item | Detail |
| --- | --- |
| Business need | Beacon Supplies receives orders through email and spreadsheets. Staff copy them into the existing order queue, producing duplicate orders, slow acknowledgement and opaque failures |
| How it was triggered | Bottom-up operational pain in order intake, assessed before any change |
| Adverse impact today | Rework from duplicate entries, sender chasing and resubmission from slow acknowledgement, and recovery by customer follow-up when failures are not visible. Volume, error rate and timing impact is not yet quantified and needs to be measured |
| Cost of doing nothing | Continued rework for coordinators and support staff, reduced sender confidence, and risk of duplicate orders reaching fulfilment and finance |
| Root cause | Intake sits outside any bounded triage workflow. Validation, duplicate checking and failure surfacing depend on manual checking and copying, with no shared retry queue and no agreed duplicate rule |

## Capabilities and processes

| ID | Capability or process | What it does today | Performance and pain points | Evidence |
| --- | --- | --- | --- | --- |
| CAP-001 | Intake receipt and manual entry | Order coordinator checks fields manually, copies line items from spreadsheet or email into the existing finance and order system | Manual copying is slow and error prone, duplicate submissions can be entered twice | IN-001 |
| CAP-002 | Validation | Manual check of required fields and format before entry | No consistent validation feedback, invalid intake proceeds to entry or stalls | IN-001 |
| CAP-003 | Duplicate checking | Manual judgement whether an intake was already entered | Definition of duplicate is unclear across coordinators and support staff, duplicates enter the queue | IN-001, IN-003 |
| CAP-004 | Sender acknowledgement | Coordinator emails acknowledgement or status after entry | Acknowledgement is slow, senders chase and resubmit | IN-001 |
| CAP-005 | Failure handling | Failed manual entry or API failure has no shared retry queue, support learns of issues through customer follow-up | Failures are opaque and not recoverable in a visible path | IN-001 |

## Organisational structure and culture
Operations coordinators perform daily intake and copying. Support staff handle failures when surfaced by senders. The sales lead sends intake and receives acknowledgement. The operations lead owns intake performance and the operations sponsor is accountable for scope, budget and go-live. The finance-system owner controls API access to the order queue and guards downstream stability. Ways of working are manual and inbox driven, with recovery dependent on individual follow-up.

## Technology and infrastructure

| System | Role today | Limitation |
| --- | --- | --- |
| Email and spreadsheets | Intake channel for approved spreadsheet or email-derived input | No validation, duplicate control, or tracking |
| Existing finance and order system queue | Holds queued orders after manual entry | Accepts manual entry only in current state, API throughput for triaged intake is unknown and needs to be confirmed |
| No shared retry queue or triage log | None in current state | Failures have no visible record for human recovery |

## Policies and business rules

| ID | Policy or rule | Source | Must the solution keep it? |
| --- | --- | --- | --- |
| BR-001 | Intake remains via approved spreadsheet or email-derived input, no sender portal | Solution Scope OS-005, proposed | Yes, unless sponsor agrees a future initiative |
| BR-002 | Existing downstream order system remains unchanged | Constraint, Solution Scope OS-001 | Yes |
| BR-003 | Definition of duplicate for intake | To be agreed with operations lead before detailed requirements | To be defined, then kept |

## Business architecture
The order to cash value stream runs from sender submission by email or spreadsheet to intake receipt to manual validation to manual entry into the existing order queue to acknowledgement to downstream fulfilment and finance. The break is between receipt and enqueue. Validation, duplicate checking, acknowledgement and failure routing all sit in manual handoffs with no bounded workflow, so duplicates and invisible failures pass into the queue and recovery starts only after sender follow-up.

## Internal assets
Experienced operations coordinators who know sender patterns and common errors, support staff who recover failures today by direct follow-up, and the existing order system which holds the queue that triaged intake will use. Availability and capacity during baseline measurement need to be confirmed with the operations lead.

## External influencers

| Influencer | Current effect on the enterprise |
| --- | --- |
| Senders | Expect receipt confirmation, chase when acknowledgement is slow and resubmit which adds duplicates |
| Downstream fulfilment and finance receivers | Receive queued orders after enqueue, absorb rework from duplicates |

## Current performance baseline

| Measure | Current value | Period | Source |
| --- | --- | --- | --- |
| Share of submitted orders that create a duplicate entry in the order queue | Unknown, baseline needs to be measured from current workflow assessment | To be agreed | Order queue log, to be confirmed |
| Elapsed time from order submission receipt to sender acknowledgement | Unknown, baseline needs to be measured from current workflow assessment | To be agreed | Email and entry timestamps, to be confirmed |
| Share of import and triage failures surfaced to operations, and elapsed time to surface them | Unknown, baseline needs to be measured from current workflow assessment | To be agreed | Failure and recovery record, to be confirmed once logging is agreed |

No live customer data is available. Budget, go-live date and API throughput are unknown.

## Current state description
Beacon Supplies takes orders by email and spreadsheet and relies on coordinators to check, copy and acknowledge each one by hand. The existing order system holds the queue but provides no intake triage, so validation is inconsistent, duplicates depend on memory, acknowledgement lags entry, and failures surface only when senders chase. The gap is a bounded intake and triage workflow with duplicate control, prompt acknowledgement and visible recovery, within the retained system, not new downstream processing.

## Assumptions

| ID | Assumption | Effect if wrong | Confirm with |
| --- | --- | --- | --- |
| A-001 | Email and spreadsheet remain the intake channel during baseline measurement | Baseline comparison will be weak if channels change before measurement | Operations lead |
| A-002 | Existing downstream order system can accept triaged intake without change | Objectives and scope need revising if downstream change is required | Finance-system owner |
| A-003 | Listed coordinators, support staff, sales lead, sponsor and finance-system owner cover all intake roles | Pain points or constraints may be missed | Each stakeholder, by asking who else is affected until no new names appear |
| A-004 | Order volume stays within current coordinator capacity during baseline measurement | Baselines may need rebasing if volume shifts materially | Operations lead |

## Risks

| Risk | Response | Owner |
| --- | --- | --- |
| Documented process differs from practice | Observe work in current workflow assessment rather than rely on assumed procedure | Business analyst, to be confirmed |
| Staff keep copying manually alongside any new workflow, preserving duplicates | Agree a single intake route and monitor manual entries | Operations lead, to be confirmed |
| Duplicate rule stays unclear across coordinators and support | Agree and document the rule before detailed requirements | Operations lead, to be confirmed |
| Throughput or budget limits block prompt acknowledgement and failure surfacing | Revisit priority once budget and throughput are known | Sponsor, to be confirmed |

## Outputs
A current state description with a named but unmeasured baseline, stated business need and root cause, and the constraints the future state must respect, ready for Define Future State and gap analysis.

## Review criteria
- The business need is stated from the enterprise perspective and root cause is explored without prescribing a solution.
- Scope is limited to what the change requires, and exclusions are stated as proposed where confirmation is needed.
- Capabilities and processes are described with their performance and pain points.
- Structure, culture, technology, policies, and external influences are covered to the depth the change needs.
- The performance baseline names each measure with period and source, and states plainly where the baseline needs to be measured.
- Claims cite evidence or are recorded as assumptions.
- The description gives a clear baseline for future-state work and respects the retained-system constraint.
