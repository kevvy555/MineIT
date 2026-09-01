# B03a — Global Ship Management

**Progression stage:** 6 — Second Colony Establishment  
**Type:** Feature  
**Status:** Ready for Review

## Original backlog text

> [FEATURE] We need to improve how the ship is controlled, we shouldn't have the launch button in the cargo bay, we need a proper control system which can be accessed anywhere, so some sort of ability to view all our ships and tell them what to do, ship manager.

## Purpose

Give the player one consistent place to inspect and command every owned ship without navigating through a colony cargo bay.

## Approved first release

- A global Ships screen lists every owned ship.
- Selecting a ship opens controls and information for that ship.
- The screen is accessible through:
  - a persistent global button;
  - relevant star-map and system-map shortcuts;
  - colony shortcuts.
- Controls are state-aware and only expose actions valid for the selected ship’s current state.
- The initial control panel includes:
  - launch;
  - land;
  - enter or remain in orbit;
  - choose a destination;
  - change a destination;
  - journey distance and time;
  - Fuel requirement and range preview;
  - crew management;
  - accommodation management.
- Cargo loading and unloading remain owned by the cargo-bay or cargo-management interface. The Ships screen may summarise cargo but does not duplicate authoritative cargo operations.
- Navigation commands use the same domain route service as the star and system maps.
- The screen remains available while ships are landed, orbiting or in transit.

## Fleet boundary

This creates the initial global fleet-management foundation. Automated routing, recurring trade routes, dispatch priorities and advanced fleet automation remain later backlog items.

## Acceptance criteria

1. Every owned ship appears once in the global list.
2. Ship state and location are visible without entering a colony.
3. Selecting ships updates the panel without stale controls or data.
4. All approved initial actions are reachable from the selected-ship panel.
5. Invalid actions are disabled or omitted with an explanation.
6. Route time, Fuel and range match the navigation domain calculation.
7. Cargo mutation remains in its canonical owner.
8. The layout is usable on the target mobile viewport.
9. Relevant async views reject stale writes when the selected ship changes.

## Review state

No unresolved product questions remain. Advanced automation remains B03b/B07 and is not part of this item.
