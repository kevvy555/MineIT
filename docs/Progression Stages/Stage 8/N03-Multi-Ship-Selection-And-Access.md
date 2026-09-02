# N03 — Multi-Ship Selection And Access

**Progression stage:** 8 — Logistics Bottleneck  
**Type:** Bug fix and feature  
**Status:** In Progress  
**Branch:** `feature/fleet-colony-ship-control`  
**Source:** Discovered while operating purchased Stage 8 fleet ships alongside the starter vessel.

## Original report

> When I buy a second ship the original ship becomes inaccessible. Although we have the ability to buy multiple ships, only one ship can be operated through the live UI.

## Purpose

Keep every owned player ship findable and selectable. Purchasing or activating a second ship must never hide docked vessels or block the Spaceport fleet picker.

## Approved behaviour

- Fleet truth remains `state.company.expansion.ships[]` plus `activeShipId`.
- At a colony, the player can select any player ship that is docked there or holding in orbit for that colony.
- On the star map, the player can select any non-lost player ship that has a map position and open Ship Control for that vessel.
- Selecting a ship sets `activeShipId` and opens the ship-scoped control surface for that ship.
- The colony map Spaceport tile shows a landed-ship presentation when **any** player ship is docked at the active colony, not only when `activeShipId` matches.
- Colony navigation “ship landed” markers use the same any-docked-ship rule.
- Spaceport is colony infrastructure. It remains available from the colony while viewing that colony and is not disabled merely because the active ship is travelling, orbiting or at another location.
- Spaceport lists docked and orbiting player vessels for the active colony and selecting a row opens Ship Control for that ship.

## Out of scope

- Automated logistics, recurring routes and advanced dispatch remain later Stage 8+ items (**B03b**, **B07a**).
- Operational Headquarters construction and leave-gate rules remain **A08**.
- Full **B03a** global Ships screen polish may proceed in parallel but is not required to close the accessibility bug.

## Acceptance criteria

1. After a second ship is delivered, `ships.length >= 2` and the original ship remains in the fleet with its prior cargo/crew/status.
2. When both ships are docked at the active colony, both appear in the Spaceport player-fleet list and either can be selected.
3. When the newly delivered ship is active and orbiting because berths are full, the docked original ship remains selectable from Spaceport and the colony still shows a landed-ship affordance if any ship is docked.
4. Star-map selection of a non-active ship opens controls for that ship id.
5. Regression coverage reproduces the second-ship accessibility failure and proves both vessels remain operable.

## Implementation notes

Canonical owners:

- `ExpansionService` — fleet state and `selectShip`
- `ship-preparation-ui.js` / `ship-navigation-ui.js` / `player-ship-ui.js` — selection and presentation only
- `world-view-runtime.js` — landed-ship tile visibility must use docked-fleet presence, not only the active ship accessor

## Review state

Product behaviour approved in design review on branch `feature/fleet-colony-ship-control`. Implementation authorised to start.
