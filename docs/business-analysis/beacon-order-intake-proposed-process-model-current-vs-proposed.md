# Beacon Order Intake v4 - one intake attempt

Boundary: one intake attempt from customer send to first recorded disposition. Terminals: Accepted (only after confirmed Finance API status), Returned to customer, Pending with support follow-up, Escalated to sponsor/process owner. Correction, status check, or authorized retry is a separate follow-up process outside this diagram. CURRENT is unverified. PROPOSED is hypothetical.

### CURRENT - Manual email to finance (unverified)

```mermaid
flowchart TD
  subgraph cust_c [Customer]
    csend[Send spreadsheet by email]
  end
  subgraph coord_c [Coordinator - CURRENT unverified]
    crecv[Receive and check]
    cqueue[Copy to queue]
    cforward[Forward to Finance]
  end
  subgraph fin_c [Finance API]
    cimport[Import order]
  end
  subgraph out_c [Outcomes]
    cdone[Done - ends attempt - status unclear]
  end
  subgraph note_c [Notes - outside flow]
    ncurr[CURRENT unverified IN-001 to IN-003 only - no observation - baseline unknown]
  end
  csend --> crecv
  crecv --> cqueue
  cqueue --> cforward
  cforward --> cimport
  cimport --> cdone
```

### PROPOSED - Idempotent intake - one attempt (hypothetical)

```mermaid
flowchart TD
  subgraph cust_p [Customer]
    psend[Send order]
  end
  subgraph coord_p [Coordinator - PROPOSED hypothetical]
    pcapture[Capture + assign key]
    gdup{Duplicate key?}
    plookup[Lookup original status]
    gorig{Original status?}
    gvalid{Fields valid?}
    preturn[Return to customer]
    psubmit[Submit import - permission unverified]
  end
  subgraph fin_p [Finance API]
    gapi{API result?}
  end
  subgraph sup_p [Support]
    passign_p[Assign follow-up - pending orig]
    pexc_o[Exception review - failed orig]
    pexc_r[Exception review - rejected]
    passign_t[Assign follow-up - timeout]
  end
  subgraph owner_p [Sponsor + Process Owner]
    pesc_o[Escalate - failed orig - ends attempt]
    pesc_r[Escalate - rejected - ends attempt]
  end
  subgraph out_p [Outcomes]
    o_accept[Accepted - confirmed - ends attempt]
    o_return[Returned to customer - ends attempt]
    o_pending[Pending - support follow-up - ends attempt]
    o_esc[Escalated - ends attempt]
  end
  subgraph note_p [Notes - outside flow]
    nprop[PROPOSED hypothetical - submit permission unverified - no baseline - retry FR-006 vs STORY-006 UNRESOLVED - follow-up outside diagram]
  end
  psend --> pcapture
  pcapture --> gdup
  gdup -->|Yes| plookup
  gdup -->|No| gvalid
  plookup --> gorig
  gorig -->|Confirmed| o_accept
  gorig -->|Pending| passign_p
  gorig -->|Failed| pexc_o
  passign_p --> o_pending
  pexc_o --> pesc_o
  pesc_o --> o_esc
  gvalid -->|No| preturn
  gvalid -->|Yes| psubmit
  preturn --> o_return
  psubmit --> gapi
  gapi -->|Confirmed| o_accept
  gapi -->|Rejected| pexc_r
  gapi -->|Timeout| passign_t
  pexc_r --> pesc_r
  pesc_r --> o_esc
  passign_t --> o_pending
```

Evidence and decisions outside flow: CURRENT from synthetic IN-001 to IN-003 only, no observation or baseline. PROPOSED hypothetical, Finance API submit permission unverified, no owner approval. Retry ownership FR-006 vs STORY-006 UNRESOLVED pending sponsor/process-owner decision; no retry assigned to coordinator or support. Retries reuse same key only if authorized in separate follow-up.

| Step | Actor | Next |
| --- | --- | --- |
| Send order | Customer | Capture + assign key |
| Capture + assign key | Coordinator | Duplicate key? |
| Duplicate key? Yes / No | Coordinator | Yes: Lookup / No: Fields valid? |
| Lookup original status | Coordinator | Original status? |
| Original status? Confirmed / Pending / Failed | Coordinator | Confirmed: Accepted / Pending: Assign follow-up / Failed: Exception review |
| Fields valid? Yes / No | Coordinator | No: Return to customer / Yes: Submit import |
| Return to customer | Coordinator | Returned terminal |
| Submit import - permission unverified | Coordinator | API result? |
| API result? Confirmed / Rejected / Timeout | Finance API | Confirmed: Accepted / Rejected: Exception review / Timeout: Assign follow-up |
| Assign follow-up | Support | Pending terminal |
| Exception review | Support | Escalate |
| Escalate | Sponsor + Process Owner | Escalated terminal |

| Check | Result |
| --- | --- |
| One start, four PROPOSED terminals: Accepted, Returned, Pending, Escalated | Pass |
| Duplicate Confirmed to Accepted; Pending to Pending via Support; Failed to Escalated | Pass |
| New valid to API; Confirmed to Accepted; Rejected to Escalated; Timeout to Pending | Pass |
| Invalid to Returned terminal; no outcome routed back to work, no unbounded loop | Pass |
| CURRENT single path to Done terminal, marked unverified IN-001 to IN-003 | Pass |
| No retry assigned; FR-006 vs STORY-006 UNRESOLVED in note only | Pass |
