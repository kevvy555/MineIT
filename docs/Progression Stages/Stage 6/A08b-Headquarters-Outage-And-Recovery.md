# A08b — Headquarters Outage and Recovery

**Progression stage:** 6 — Second Colony Establishment  
**Type:** Feature  
**Status:** Complete  
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

## Implemented lifecycle

- A08b begins only after the colony's first command handover is complete. The founding ship remains the valid pre-handover nerve centre and cannot accidentally start the outage clock.
- The shared A08a `primaryOperational` assessment is the only trigger. Missing, incomplete, understaffed or underpowered Primary Headquarters all enter the same A08b outage state.
- Emergency command from a docked, adequately crewed command-capable ship continues to supply A08a command capacity, but it does not restore the Primary Headquarters conglomerate link or stop A08b degradation.
- An outage starts immediately at a ten-percentage-point loss. Every complete corporation day since the outage began adds one further percentage point, capped at 100%.
- The continuity factor multiplies A08a command efficiency for extraction and production, synthetic Food, effective Industry and surveying progress. Consumption, prices, storage, logistics time and physical capacity remain unchanged.
- Recalculating more than once on the same corporation day cannot advance the outage or recovery clock.
- When the Primary becomes operational, conglomerate access returns immediately and the exact current loss becomes the recovery baseline. One tenth of that baseline is restored per complete day for ten days.
- If the Primary fails again during recovery, the new outage resumes from the current remaining loss, with a minimum immediate loss of ten percentage points.

## Conglomerate service restrictions

The following new network-created commitments are blocked by their authoritative domain services while the link is offline:

- new Conglomerate Buyers Service contracts;
- new Engineering Ship technology deployments;
- new dedicated colonist transports;
- new factory ship procurement orders.

Already-created buyer collections, Engineering Deployments, colonist transports and factory ship orders continue their normal schedules. Existing commitments remain viewable and resolvable. Physical actions involving an already-docked ship are not new network orders and remain governed by their existing Spaceport and cargo rules.

## Acceptance criteria preserved from A08

1. An outage prevents new conglomerate orders but does not cancel existing commitments.
2. Efficiency applies the immediate ten-point loss and subsequent daily degradation.
3. A fully degraded colony performs no work.
4. Restoration recovers the actual current loss evenly over ten days.
5. Save/load preserves outage duration, penalty and recovery state.
6. The Headquarters operational definition is shared with A08a rather than duplicated.

## Canonical implementation ownership

- `ColonyService` owns the persisted outage/recovery state machine and derives network availability from A08a's authoritative `primaryOperational` result.
- `SimulationEngine`, `ResourceService` and `SurveyService` consume the single derived continuity-efficiency factor for colony work.
- `BuyerService` owns the domain rejection for new conglomerate contracts while preserving existing contract schedules and collection actions.
- `TechnologyService`, `TransportService` and `ShipMarketService` own equivalent domain rejections for their new orders while continuing paid commitments.
- UI modules render the domain assessment and do not reconstruct Headquarters eligibility, outage duration or recovery arithmetic.

## Persistence and presentation

- Save schema version 16 persists the phase, outage start, completed offline days, current penalty, recovery start, recovery baseline and remaining recovery days for the active colony and every portfolio colony.
- Derived command, Power, network and effective-efficiency metrics are recalculated rather than duplicated as additional save authority.
- The Headquarters detail view shows command efficiency, A08b continuity efficiency, their effective combined output, network availability, offline duration and recovery time.
- Conglomerate Buyers, technology ordering, dedicated transport and fleet procurement surfaces display the domain-provided offline reason while retaining access to existing commitments.
- The field manual documents outage, degradation, down-tools, recovery and emergency-ship interaction.

## Implementation verification

- Added `tests/headquarters-outage.test.js` covering pre-handover exemption, Power/staffing/missing-Primary triggers, same-day idempotence, emergency ship interaction, 100% down-tools, exact ten-day recovery, recovery relapse, service lockouts, existing commitment progression, save/load, portfolio state and UI ownership.
- Updated existing save-version assertions for schema version 16 and retained A08a migration coverage.
- Updated package and visible application versions together to `5.13.15`.
- Passed the focused A08a/A08b, buyer, technology, transport, fleet and presentation tests.
- Passed the complete offline `npm test` suite, including the 9,000-day simulation soak.
