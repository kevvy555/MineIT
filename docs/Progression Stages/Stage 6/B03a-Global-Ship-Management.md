# B03a — Global Ship Management

**Progression stage:** 6 — Second Colony Establishment  
**Type:** Feature  
**Status:** Ready for Testing  
**Branch:** `feature/fleet-colony-ship-control`  
**Proof mockup:** [B03a-Fleet-Manager-Mockup.html](./B03a-Fleet-Manager-Mockup.html)

Mockup approved. Implementation and regression coverage ready for player testing.

## Original backlog text

> [FEATURE] We need to improve how the ship is controlled, we shouldn't have the launch button in the cargo bay, we need a proper control system which can be accessed anywhere, so some sort of ability to view all our ships and tell them what to do, ship manager.

## Purpose

Give the player one consistent place to inspect every owned ship and open Ship Control without navigating through a colony cargo bay.

## Approved first release — Fleet Manager

Fleet Manager is the corporation-wide list surface described with **N04**. It is **not** Colony Control and does not embed launch/cargo editors.

### List contents

Every owned ship appears once and shows:

- vessel name;
- class / model;
- status (`docked`, `travelling`, `orbiting`, `arrived`, `home`, `lost`);
- location summary (colony name, system, transit target, orbital hold target, corporate home, or lost reason);
- cargo used/capacity, fuel used/capacity, food used/capacity, crew / minimum crew;
- whether the ship is the current `activeShipId`;
- optional command badge when `commandStatus.source` is that ship (informational only; includes A08b emergency takeover).

### List controls

- Column headers (**Vessel**, **Status**, **Location / stocks**) are sortable on tap; tap again reverses direction.
- A multi-select **status filter** above the list lets the player show any combination of statuses present in the fleet (Show All clears the filter).
- The Fleet Manager panel does not include persistent world/colony/corp footer chrome; those remain app chrome outside this panel.

### Actions on the list

- **OPEN SHIP CONTROLS** selects the ship (`activeShipId`) and opens Ship Control.
- Lost ships remain listed; opening them shows the existing lost-ship Ship Control / status path.
- The list may summarise cargo; it does not mutate cargo, Fuel, Food, crew or routes.
- A08b conglomerate-network lockouts do not hide ships or block opening Ship Control.

### Accessibility

Fleet Manager is available from:

- a persistent global footer control (**FLEET**);
- star-map shortcut;
- Spaceport shortcut;
- Ship Control tile / CSM path.

It remains available while ships are landed, orbiting or in transit and does not depend on which colony is active.

### Ship Control (selected vessel)

State-aware Ship Control (opened from Fleet Manager, Spaceport, map or star map) owns:

- launch / land / orbit as valid for state;
- destination set / change;
- journey distance, time, Fuel and Food preview;
- crew and accommodation management;
- path into the cargo-bay loader;
- ship Star Map navigation;
- Fleet Manager entry (in-panel).

When **N04** says the ship holds command, Ship Control shows a linked Colony Support Module that opens Colony Control. It does not embed colony service tiles or Koplin OS actions.

## Fleet boundary

This creates the initial global fleet-management foundation. Automated routing, recurring trade routes, dispatch priorities and advanced fleet automation remain later backlog items (**B03b**, **B07a**).

## Acceptance criteria

1. Every owned ship appears once in the global list.
2. Ship state and location are visible without entering a colony.
2b. Column headers sort the list; status multi-filter narrows visible rows.
3. Selecting ships / Open Ship Controls updates the active ship without stale controls or data.
4. Approved Ship Control actions are reachable after opening the selected ship.
5. Invalid Ship Control actions are disabled or omitted with an explanation.
6. Route time, Fuel and range match the navigation domain calculation.
7. Cargo mutation remains in its canonical owner (not the Fleet Manager list).
8. The layout is usable on the target mobile viewport.
9. Relevant async views reject stale writes when the selected ship changes.
10. Fleet Manager never presents Colony Control actions.

## Review state

Discovery completed with A08a/A08b Complete and a standalone Fleet Manager mockup for review. Ready for final review before implementation.
