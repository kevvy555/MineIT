# A08 — Operational Headquarters Departure Gate

**Progression stage:** 6 — Second Colony Establishment  
**Type:** Feature  
**Status:** Ready for Review

## Original backlog text

> [FEATURE] *Need to have to build an operational headquarters before the colony ship can leave the first planet and then the same after that for every colony, because the ship needs a nerve centre to run things and the colony ship is that at first but when it leaves it needs something to take over.

## Purpose

Make the colony ship the temporary command centre of a new settlement and require a functioning planetary command facility before that ship can leave.

## Operational definition

A Headquarters counts as operational only when it is:

- fully constructed;
- receiving its required Power;
- staffed to its defined minimum.

A higher-tier command building satisfies the requirement only when its data explicitly identifies it as an approved Headquarters replacement.

## Departure rule

- The rule applies to the first colony and every later colony established by a colony ship.
- While the colony ship is present, it provides the temporary command function.
- The colony ship cannot depart until an approved operational command facility has taken over.
- A failed gate explains which requirement is missing: construction, Power, staffing or approved building type.

## Headquarters outage after departure

When the active command facility later loses required Power or staffing:

- access to conglomerate network services is disabled immediately;
- existing scheduled conglomerate commitments continue;
- no new conglomerate orders or commitments may be created;
- colony efficiency immediately falls from 100% to 90%;
- the efficiency penalty then increases by one percentage point for every full offline day;
- the penalty is capped at 100%;
- at a 100% penalty the colony is effectively down tools and cannot function.

When Headquarters operation is restored:

- conglomerate network access returns immediately;
- the current lost efficiency is recovered evenly across ten days;
- recovery is based on the loss that exists at restoration time, not a fixed ten percentage points.

Example: a colony restored at 60% efficiency has lost 40 percentage points and therefore recovers four percentage points per day for ten days.

## Acceptance criteria

1. Construction alone does not satisfy the gate when the facility is unpowered or unstaffed.
2. The colony ship cannot leave without an operational approved command facility.
3. An unapproved advanced building does not bypass the rule.
4. An outage prevents new conglomerate orders but does not cancel existing commitments.
5. Efficiency applies the immediate ten-point loss and subsequent daily degradation.
6. A fully degraded colony performs no work.
7. Restoration recovers the actual current loss evenly over ten days.
8. Save/load preserves outage duration, penalty and recovery state.
9. Regression coverage applies the rule to both the first and later colonies.

## Review state

No unresolved product questions remain. Headquarters staffing numbers, Power demand and construction cost remain building-balance data.
