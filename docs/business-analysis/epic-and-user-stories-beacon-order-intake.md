# Epic and User Stories - Beacon Order Intake v6

## Purpose

Define the Beacon order intake epic and baseline user stories STORY-001 to STORY-007. This v6 revision starts from v5 and keeps epic scope, stories and acceptance unchanged, adding an explicit Implements line in each story that names the SRS v1 requirement it implements. All acceptance remains Proposed where not confirmed and untested. No client approval, live permission, stakeholder consultation, production behaviour, or test execution is claimed.

## Document Control

| Field | Value |
| --- | --- |
| Epic | EPIC-001 Beacon Order Intake |
| Version | v6, starting from v5 |
| Status | Proposed, no client approval claimed |
| Change in v6 | Added Implements SRS requirement naming in each story, no scope or acceptance change |
| Excluded | CR-001 partial fulfilment is deferred pending sponsor review and is not part of this baseline |
| Traceability | Linked to saved SRS v1 IDs as listed, alignment only, does not change saved versions |
| Business rules | BR-001 to BR-005 are named in the SRS only as an FRD input and are not defined there, no story claims a business rule link until the FRD is reviewed |
| Estimates | Unset |

## Epic EPIC-001

As a Beacon coordinator, I want to validate orders, avoid duplicates, submit idempotently to finance, and acknowledge only after finance confirmation, so that finance entries are correct and recoverable.

### In scope - proposed baseline

- Validate required fields before finance
- Identify suspected duplicates and assign stable order and idempotency key
- Enqueue to finance API idempotently
- Confirm import and control acknowledgement
- Show status history to order coordinator or support staff
- Triage and retry failed imports under Coordinator-only rule
- Record audit trail including retry, denial and escalation

### Out of scope

- CR-001 partial fulfilment, deferred pending sponsor review, excluded from this baseline
- Any change to saved SRS v1 or saved Process Model v4, links are alignment only
- Any claim of client approval, live behaviour, or executed tests

### Success measures - Proposed, unverified, no measured results

- Incomplete orders blocked before finance enqueue with reasons shown, baseline and target to be measured or agreed.
- Suspected duplicates flagged before finance enqueue with same stable key retained, baseline and target to be measured or agreed.
- Repeat submission with same idempotency key creates no second finance entry, baseline and target to be measured or agreed.
- Acknowledgement enabled only after Finance API confirmation, baseline and target to be measured or agreed.
- Failed, timeout, denial and escalation outcomes remain visible and audited, baseline and target to be measured or agreed.

## STORY-001 Validate required fields

As a Coordinator, I want required fields validated before finance, so that incomplete orders are stopped early.

Implements SRS FR-001: The system shall reject an intake order that lacks any required field and identify each missing field. Also implements SR-001 Single triage queue for intake orders and SRS assumption A-003 required field list.

Vertical slice: Separate slice because it blocks incomplete orders before any finance work.

Traces to: FR-001, SR-001, A-003.

Acceptance - all Proposed, untested, observable:

- Given an order missing one or more required fields, when validation runs, then the order is blocked before finance enqueue and missing fields are listed.
- Given an order with all required fields present, when validation runs, then the order proceeds to the next intake step.
- Given an incomplete order is resubmitted still incomplete or validation cannot complete, when validation runs, then the order remains blocked before finance enqueue with the reason shown and no finance enqueue occurs.

## STORY-002 Identify duplicate submissions and idempotency key

As a Coordinator, I want suspected duplicates flagged with a stable order and idempotency key, so that second finance entries are avoided.

Implements SRS FR-002: The system shall flag an intake order as duplicate when its Order ID and Sender reference match a prior intake order. Also implements SR-003 Safe API use with no duplicate imports and SRS assumption A-002 duplicate definition.

Vertical slice: Separate slice because it adds duplicate protection with stable keys before enqueue.

Traces to: FR-002, SR-003, A-002.

Acceptance - all Proposed, untested, observable:

- Given a submitted order matching a suspected duplicate rule, when duplicate check runs, then the order is flagged as suspected duplicate before finance enqueue with the stable key shown.
- Given the same order is submitted again, when duplicate check runs, then the same stable order and idempotency key is retained with no new key generated.
- Given a suspected duplicate is flagged in error or the rule cannot be evaluated, when reviewed, then the flag, key and reason remain visible with a safe follow-up or escalation path shown and no finance enqueue occurs until resolved.

## STORY-003 Idempotent finance API enqueue

As a Coordinator, I want orders enqueued to the finance API idempotently, so that retries do not create duplicates.

Implements SRS FR-003: The system shall enqueue each validated non-duplicate intake order once with a unique idempotency key. Also implements IF-001 finance API import with key and confirmation or failure, NFR-001 prevent second finance entry for same key, SR-003 Safe API use, and assumption A-001 API idempotency.

Vertical slice: Separate slice because it delivers safe once-only handoff to finance.

Traces to: FR-003, IF-001, NFR-001, SR-003, A-001.

Acceptance - all Proposed, untested, observable:

- Given a validated non-duplicate order with a stable idempotency key, when enqueued, then the finance API receives one enqueue with that key.
- Given the same stable key is submitted again, when enqueue repeats, then no second finance entry is created and the original result is referenced.
- Given enqueue times out or fails, when the result is viewed, then the failed or timeout result remains visible with reason, key and timestamp and a safe follow-up or escalation path is shown.

## STORY-004 Confirm import and control acknowledgement

As a Coordinator, I want acknowledgement enabled only after finance confirmation, so that unconfirmed orders are not treated as accepted.

Implements SRS FR-004: The system shall send acknowledgement for an enqueued order only after receiving import confirmation from the finance API. Also implements IF-001 finance API confirmation, NFR-001 prevent second entry, and SR-004 Acknowledgement after confirmed import.

Vertical slice: Separate slice because it prevents false acceptance by gating acknowledgement on confirmation.

Traces to: FR-004, IF-001, NFR-001, SR-004.

Acceptance - all Proposed, untested, observable:

- Given Finance API confirmation for the order has appeared, when the acknowledgement control is viewed, then the order is Accepted and acknowledgement is enabled.
- Given no Finance API confirmation has appeared, when the acknowledgement control is viewed, then the order is not Accepted and the control remains disabled with guidance shown.
- Given coordinator acknowledgement or retry request alone without Finance API confirmation, when status is viewed, then status does not change to Accepted.

## STORY-005 View authorized order status

As an order coordinator or support staff per FR-005, I want to view validation, duplicate, enqueue, confirmation and acknowledgement states, so that I can track progress.

Implements SRS FR-005: The system shall display order status and failure reason to authorized order coordinators and support staff. Also implements NFR-002 status view availability, NFR-003 block and log unauthorized attempts, IF-002 role based permission, SR-001 triage queue and SR-002 visible failure reasons.

Vertical slice: Separate slice because it extends visibility beyond the core intake flow.

Traces to: FR-005, NFR-002, NFR-003, IF-002, SR-001, SR-002.

Acceptance - all Proposed, untested, observable:

- Given an order coordinator or support staff viewing an order, when viewing, then full state history for validation, duplicate, enqueue, confirmation and acknowledgement is shown.
- Given an order with pending or unknown status, when viewed by an order coordinator or support staff, then the pending or unknown state is shown with guidance to check status or escalate.
- Given an unauthorized actor attempts to view status or trigger retry visibility, when access is attempted, then access is denied, blocked from further action, and the denial is audited.

## STORY-006 Retry failed finance import - Coordinator requested

As a Coordinator, I want to request retry of a failed finance import for the same order, so that a failed import can recover without a second finance entry.

Implements SRS FR-006: The system shall retry a failed import with the original idempotency key when initiated by an authorized order coordinator. Also implements IF-001 finance API retry with original key, IF-002 role enforcement, NFR-001 no second entry, NFR-003 denial logging, SR-003 safe API use, and assumptions A-001 API idempotency and A-004 role permissions, plus Process Model v4 for alignment only.

Vertical slice: Separate slice because it adds safe recovery without duplicating finance entries, dependent on STORY-003 and STORY-005.

Dependencies: Depends on STORY-003 idempotent enqueue and STORY-005 status visibility.

Actor rule - Proposed: The Coordinator is the only proposed actor who may request a failed finance-import retry. Support may monitor, investigate and escalate but must not trigger retry in this proposed workflow.

Traces to: FR-006, IF-001, IF-002, NFR-001, NFR-003, SR-003, A-001, A-004, plus Process Model v4 for alignment only.

Acceptance - all Proposed, untested, observable, substance retained from v3:

- Given a failed finance import with terminal failed status for the same stable order and idempotency key, when an authorized Coordinator requests retry, then the retry reuses the original key with no new key generated.
- Given an original import status of pending or unknown, when retry is attempted, then the retry control is disabled with guidance to check status or escalate and no blind retry occurs.
- Given Finance API confirmation, when status is viewed, then the order is Accepted, coordinator acknowledgement or retry request alone does not change status to Accepted.
- Given a failed or timeout result, when viewed, then reason, key and timestamp remain visible with a safe follow-up or escalation path shown.
- Given an unauthorized actor, including Support, attempts to trigger retry, when the request is made, then the attempt is denied, blocked from the finance API, and the denial is audited.

## STORY-007 Record audit trail

As an order coordinator or support staff reviewing the audit trail, I want validation, duplicate, enqueue, confirmation, acknowledgement, retry request, denial and escalation events recorded, so that what happened is traceable.

Implements SRS FR-007: The system shall log actor, role, action, timestamp, and idempotency key for each intake, enqueue, acknowledgement, and retry event. Also implements NFR-003 denial logging and SR-004 acknowledgement traceability.

Vertical slice: Separate slice because it makes the core flow auditable without changing intake behaviour.

Traces to: FR-007, NFR-003, SR-004.

Acceptance - all Proposed, untested, observable:

- Given validation, duplicate, enqueue, confirmation and acknowledgement events occur, when the audit is viewed, then who did what and when is shown.
- Given a STORY-006 retry request, denial or escalation occurs, when the audit is viewed, then the retry, denial and escalation events are shown with actor and timestamp.
- Given an unauthorized access or failed recording is attempted, when the audit is viewed, then the denial is audited and any missing audit coverage is flagged with a follow-up path, with no test execution claimed.

## Trace table to saved SRS v1

| Story | Saved SRS links |
| --- | --- |
| STORY-001 | FR-001, SR-001, A-003 |
| STORY-002 | FR-002, SR-003, A-002 |
| STORY-003 | FR-003, IF-001, NFR-001, SR-003, A-001 |
| STORY-004 | FR-004, IF-001, NFR-001, SR-004 |
| STORY-005 | FR-005, NFR-002, NFR-003, IF-002, SR-001, SR-002 |
| STORY-006 | FR-006, IF-001, IF-002, NFR-001, NFR-003, SR-003, A-001, A-004, plus Process Model v4 for alignment only |
| STORY-007 | FR-007, NFR-003, SR-004 |

No story claims a business rule link, BR-001 to BR-005 are named in the SRS only as an FRD input and are not defined there.

## Proposed priority ranking and first release slice

All linked SRS items are Must, so this ranking is order of delivery, not scope. Estimates remain unset.

| Order | Story | One-line reason |
| --- | --- | --- |
| 1 | STORY-001 | Blocks incomplete orders earliest and prevents downstream finance errors. |
| 2 | STORY-002 | Prevents duplicate finance entries, addressing high duplicate risk. |
| 3 | STORY-003 | Provides idempotent enqueue that safe retry depends on. |
| 4 | STORY-004 | Prevents false acceptance by confirming only on Finance API confirmation. |
| 5 | STORY-007 | Makes the first flow auditable for correct, confirmed entries. |
| 6 | STORY-005 | Extends status visibility to support after the core flow works. |
| 7 | STORY-006 | Adds safe recovery last, after status and idempotent enqueue are in place. |

Proposed first release slice is STORY-001 to STORY-004 plus STORY-007, reaching the first outcome of correct, confirmed, auditable finance entries. STORY-005 and STORY-006 follow, with STORY-006 after status and idempotent enqueue.

## Assumptions

| ID | Assumption | Follow-up and proposed owner | Effect if wrong |
| --- | --- | --- | --- |
| A-001 | SRS assumption linked to STORY-003 and STORY-006, finance API idempotency and retry permission are proposed only | Follow-up: idempotent import spike, proposed owner: Finance Systems Team | If not confirmed, STORY-003 and STORY-006 enqueue and retry expectations must be revised |
| A-002 | SRS assumption linked to STORY-002 | Follow-up: review, proposed owner: Beacon Analysis Team | If rule differs, STORY-002 must be revised |
| A-003 | SRS assumption linked to STORY-001 | Follow-up: review, proposed owner: Beacon Analysis Team | If fields differ, STORY-001 validation must be revised |
| A-004 | SRS assumption linked to STORY-006 | Follow-up: review, proposed owner: Beacon Analysis Team | If not confirmed, STORY-006 must be reworked |
| A-06-01 | Synthetic working assumption: Coordinator authority to request failed finance-import retry is proposed only, pending confirmation by the fictional sponsor and process owner and finance API owner, no live permission or consultation is claimed | Confirm with sponsor, process owner and finance API owner | If not confirmed, STORY-006 actor and acceptance must be reworked |
| A-04-01 | Synthetic working assumption: EPIC-001 success measures and any KPI targets are proposed only and unverified, baselines and targets to be measured or agreed | Measure or agree baselines and targets | If not agreed, success cannot be assessed |

## Risks and dependencies

- Duplicate rule, authorized roles, and finance API idempotency contract remain to be confirmed before commitment.
- STORY-006 depends on STORY-003 enqueue behavior and STORY-005 status visibility.
- CR-001 partial fulfilment remains outside the accepted baseline pending sponsor review.

## Outputs

Reconciled baseline STORY-001 to STORY-007 with Coordinator-only retry, v6 SRS naming, roles, priority ranking and first slice, ready for sponsor and finance owner review. No approval or test execution claimed.
