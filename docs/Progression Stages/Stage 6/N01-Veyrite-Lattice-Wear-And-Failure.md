# N01 — Veyrite Lattice Wear, Failure and Servicing

**Progression stage:** 6 — Second Colony Establishment  
**Type:** New feature split from A22b  
**Status:** Ready for Review

## Source

This item was created while defining A22b spacecraft Fuel compatibility. Veyrite is not a consumable Fuel: it is the engineered lattice medium used by a Vector Exchange Drive and requires its own wear and failure model.

## Purpose

Make interstellar-drive condition a strategic maintenance decision. A neglected drive becomes increasingly unreliable, slows journeys through repeated failures and eventually strands the ship without causing arbitrary instant destruction.

## Wear model

- Lattice condition is represented as wear from 0% to 100%.
- Engaging the Vector Exchange Drive adds a fixed wear cost.
- Travel adds additional distance-based wear.
- Above 50% wear, subsequent wear accrues faster using:

  **Wear-rate multiplier = 2^((wear − 50) / 15)**

- Servicing is recommended once wear exceeds 50%.
- At 100% wear the lattice collapses.

## Daily failure risk

The failure check is made for each active Vector Exchange travel day.

- 0% through 25% wear: 1% daily failure chance.
- Above 25% through 50% wear: 3% daily failure chance.
- Above 50% wear:

  **Daily failure chance = 3 × 2^((wear − 50) / 10)%**

Approved reference values:

| Wear | Wear-rate multiplier | Daily failure chance |
|---:|---:|---:|
| 55% | 1.26× | 4.2% |
| 60% | 1.59× | 6.0% |
| 65% | 2.00× | 8.5% |
| 70% | 2.52× | 12.0% |
| 75% | 3.17× | 17.0% |
| 80% | 4.00× | 24.0% |
| 85% | 5.04× | 33.9% |
| 90% | 6.35× | 48.0% |
| 95% | 8.00× | 67.9% |
| 99% | 9.61× | 89.6% |
| 100% | Lattice collapse | 100% |

## Recoverable drive failure

When a failure occurs during travel:

- the ship makes no journey progress on the failure day;
- engineering then requires one full day to reinitialise the drive;
- the next engagement adds its normal engagement wear;
- the journey resumes after successful reinitialisation;
- repeated failures can make a badly worn drive take dramatically longer to reach its destination.

A recoverable failure does not destroy the ship.

## Lattice collapse

At 100% wear:

- the Veyrite lattice collapses;
- the ship can no longer engage its Vector Exchange Drive;
- the ship is stranded at its current location.

The approved recovery options are:

1. an extremely expensive conglomerate on-site drive service;
2. a later player-owned engineering ship capable of performing the same work.

## Servicing availability

- Initial servicing is purchased from the conglomerate or a compatible shipyard.
- Local corporation servicing becomes available later through suitable engineering infrastructure.
- A successful service restores lattice condition according to the selected service package.
- Service cost, time and restored condition are balance data.

## Data and user interface

Each Vector Exchange Drive records:

- current lattice wear;
- current travel/reinitialisation state;
- next permitted engagement time;
- whether collapse has occurred.

Route and ship-management interfaces display:

- current wear;
- current risk band;
- calculated daily failure chance;
- servicing recommendation above 50%;
- collapse warning as wear approaches 100%.

## Acceptance criteria

1. Engagement and distance both add wear.
2. Risk follows the approved bands and exponential formula.
3. Wear accrual accelerates above 50%.
4. A recoverable failure causes the approved lost travel and reinitialisation time.
5. Re-engagement adds wear and allows repeated failures.
6. At 100% the drive cannot re-engage.
7. Both approved collapse-recovery routes can restore operation.
8. Save/load preserves wear, failure, reinitialisation and collapse state.
9. Deterministic tests can inject random results to verify every risk band.

## Review state

No unresolved product questions remain. Base engagement wear, base distance wear, service prices and service durations remain balance data.
