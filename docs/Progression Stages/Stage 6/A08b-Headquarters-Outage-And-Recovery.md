# A08b — Headquarters Outage and Recovery

**Progression stage:** 6 — Second Colony Establishment  
**Type:** Feature  
**Status:** Ready for Review  
**Split from:** A08 — Operational Headquarters  
**Depends on:** A08a — Operational Headquarters Departure Gate

## Original backlog text

> [FEATURE] *Need to have to build an operational headquarters before the colony ship can leave the first planet and then the same after that for every colony, because the ship needs a nerve centre to run things and the colony ship is that at first but when it leaves it needs something to take over.

## Purpose

Preserve the post-departure Headquarters outage consequences that were previously combined with the departure gate, while allowing A08a to be discovered and implemented as a smaller independent feature.

## Preserved agreed decisions

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

## Scope boundary

A08b does not own the initial colony-ship departure gate. A08a owns the operational Headquarters definition used at departure and provides the canonical command-availability assessment that A08b reuses.

A08a also owns immediate emergency management transfer to a docked command-capable ship, loss and restoration of command capacity, and the resulting immediate command-efficiency effect when neither a Primary nor a command ship is available.

A08b begins from that shared canonical no-command or Headquarters-outage state and owns conglomerate-network restrictions, subsequent daily degradation and the ten-day recovery lifecycle. Those A08b behaviours are not part of the current A08a implementation scope.

## Acceptance criteria preserved from A08

1. An outage prevents new conglomerate orders but does not cancel existing commitments.
2. Efficiency applies the immediate ten-point loss and subsequent daily degradation.
3. A fully degraded colony performs no work.
4. Restoration recovers the actual current loss evenly over ten days.
5. Save/load preserves outage duration, penalty and recovery state.
6. The Headquarters operational definition is shared with A08a rather than duplicated.
