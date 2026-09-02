# N04 — Colony And Ship Control Surfaces

**Progression stage:** 6 — Second Colony Establishment  
**Type:** Feature  
**Status:** In Progress  
**Branch:** `feature/fleet-colony-ship-control`  
**Source:** Split from the multi-ship accessibility review and the Stage 6 ship/headquarters command design (**B03a**, **A08**).

## Original report

> Split colony management from ship management. If I am at a colony and a ship is docked, I can click that ship and decide what to do with it. If the ship is not docked, the star map lets me click any ship and open its control panel. There should be a ship-management UI listing all ships with a path into each ship’s controls. Early game a docked command ship also provides colony controls; later an Operational Headquarters provides colony controls and a docked non-command ship is ship-only.

## Purpose

Establish three composed UI surfaces with clear ownership:

1. **Colony Control** — run the active colony
2. **Ship Control** — run one selected ship
3. **Fleet Manager / global Ships list (**B03a**)** — choose a ship, then open Ship Control

Spaceport is a colony-local ship picker, not a fourth gameplay owner.

## Approved behaviour

### Surfaces

- **Ship Control** is always ship-scoped (`shipId` / `activeShipId`). It owns cargo/crew/fuel/food, route, launch, landing/orbit actions appropriate to ship state, and ship status.
- **Colony Control** is always colony-scoped. It owns technology, buyers, colony summary, local colony operations and other colony command actions.
- **Fleet Manager** is the corporation-wide ship list defined by **B03a**. Selecting a ship opens Ship Control.
- **Spaceport** lists ships docked or orbiting at the current colony and opens Ship Control for the chosen vessel.

### Command authority

- A colony is commanded by either:
  - a docked player ship that currently holds command, or
  - an Operational Headquarters once **A08** is satisfied.
- A ship that is not docked never exposes Colony Control.
- A docked ship that does not hold command exposes Ship Control only.
- A docked ship that holds command opens a hub that can reach both Colony Control and Ship Control.
- After Headquarters takes command, Colony Control is entered from the Headquarters / colony command entry point; docked ships remain ship-only unless product rules later restore temporary ship command.

### Early-game composition

Until Headquarters exists, the temporary command ship hub may present colony tiles and ship tiles together, provided each tile still dispatches to the correct surface owner rather than inventing a third ruleset.

## Relationship to existing items

- **B03a** remains the global Ships list and state-aware ship command panel.
- **A08** remains the Headquarters construction, staffing, Power and departure-gate rules.
- **N03** remains the multi-ship selection/accessibility fix required for Stage 8 fleets.
- **B03b** remains later logistics-stage fleet automation beyond the first global list.

## Acceptance criteria

1. Ship Control never mutates colony command rules; Colony Control never mutates ship inventory or travel state except by dispatching to domain services.
2. Opening a non-commanding docked ship shows ship actions only.
3. Opening a commanding docked ship provides access to both colony and ship actions.
4. Star-map and Fleet Manager entry points open Ship Control for the selected ship.
5. Domain command authority is explicit enough that **A08** can later move command from ship to Headquarters without rewriting the UI ownership model.
6. Mobile layout remains usable; async views reject stale ship/colony context.

## Review state

Product behaviour approved in design review on branch `feature/fleet-colony-ship-control`. Implementation authorised to start alongside **N03** and **B03a**.
