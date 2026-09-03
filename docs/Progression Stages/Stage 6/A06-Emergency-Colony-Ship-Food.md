# A06 — Emergency Use of Landed Colony-Ship Food

**Progression stage:** 6 — Second Colony Establishment  
**Type:** Bug fix and rule clarification  
**Status:** Complete

## Original backlog text

> [BUG] After landing on a planet to establish a new colony, food is going up when there is no food production. This shouldn't happen, they will use ship food and then colony food.

## Purpose

Prevent a newly founded colony from generating phantom Food and define exactly when colonists may consume supplies held by a landed player-owned colony ship.

The approved ordering below supersedes the ambiguous ordering in the original report.

## Approved behaviour

- Colony Food and ship Food remain separate inventories.
- A colony with no operational Food production never gains Food merely because a ship is landed.
- Colonists consume stored colony Food first.
- When colony Food reaches zero, the game checks for Food aboard a landed local player-owned ship.
- If ship Food is available, the player receives a popup asking whether the colony may consume it.
- Ship Food is never consumed automatically and is not silently treated as colony stock.
- Approving emergency use authorises continued consumption from the landed ship until colony Food becomes available again.
- When colony Food returns, emergency ship consumption ends and any future emergency requires a new approval.
- Declining the request leaves ship Food untouched and the colony experiences the normal Food-deficit consequences.
- The player may authorise consumption of all Food aboard the ship; the system does not protect an automatic journey reserve.
- The interface shows colony Food and ship Food separately so the source of current consumption is clear.

## State requirements

The authoritative state must record:

- Food held by each colony;
- Food held by each ship;
- which ship is landed at the colony;
- whether emergency use is currently authorised;
- which ship the authorisation applies to.

The authorisation must survive save/load while its conditions remain valid and must be cleared when colony Food becomes available again or the supplying ship is no longer landed.

## Acceptance criteria

1. Founding a colony with zero production never increases colony Food.
2. Colony Food is consumed before eligible ship Food.
3. Ship Food cannot be consumed before explicit approval.
4. Approval continues until colony Food returns.
5. Declining leaves the ship inventory unchanged.
6. Ship departure or loss of availability ends access to its Food.
7. Save/load preserves a valid active authorisation.
8. Regression coverage proves there is no phantom production.

## Implementation

- Founding a colony now preserves Food aboard the colony ship instead of transferring or generating it as colony stock.
- When colony Food is exhausted, the simulation creates a persisted corporate event and waits for explicit approval before consuming the selected landed ship's Food.
- Approval, decline, colony-Food recovery, ship departure and save/load all reconcile the authorisation through the domain service.
- Behavioural regression coverage is provided by `tests/priority-colony-bug-fixes.test.js` and the strengthened expansion/save tests.
- [N05](../Stage%201/N05-Ship-To-Colony-Establishment-Transition.md) now places all founding Food aboard the ship. Normal ship-resident consumption remains distinct from A06: A06 applies only when planetary residents request explicit emergency access to that separate ship inventory.
