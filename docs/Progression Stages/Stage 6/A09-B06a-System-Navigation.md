# A09 and B06a — Star-System Navigation and Temporary Landings

**Progression stage:** 6 — Second Colony Establishment  
**Type:** Bug fix and feature  
**Status:** Ready for Review

## Original backlog text

> [BUG] *When at a starsystem, you should be able to send the ship to any planet in that system to either colonise or just land, this is so you can colonise an entire system rather than going from planet to planet.

> [FEATURE] Ability to do inter system ship transfers, we should have a system map as well as a star map, the system map will show all the planets within the system with the same navigation controls as the star map, we can access the star system from either the star map or directly from the colony.

## Scope clarification

This specification covers the system map and planet-level navigation portion of B06. The broader reusable inter-system transfer feature remains B06b in Stage 10.

## Purpose

Allow a ship to enter a star system once and then travel between its planets for colonisation, supply and temporary landing without treating each planet as a separate interstellar destination.

## Approved behaviour

- The system map is accessible from both the star map and a colony in that system.
- It displays the system’s planets, owned ships and existing colonies.
- Before a normal interstellar launch, the player selects both the destination star system and intended destination planet.
- After launch, the destination planet may be changed at any time.
- Changing destination recalculates journey time, distance and Fuel from the ship’s current position.
- If the recalculated route exceeds available Fuel, the Fuel system displays its approved warning but still allows the player to proceed.
- Travel between planets in the same system consumes both time and the appropriate Fuel.
- From the system map, a ship may:
  - enter or remain in orbit;
  - land at a valid planetary destination;
  - found a colony when requirements are met;
  - land temporarily without founding a colony.

## Temporary landing

A temporary landing permits:

- cargo transfer;
- refuelling or resupply;
- moving colonists aboard;
- moving colonists ashore.

It does not automatically create a colony or grant colony infrastructure and services.

The player may leave colonists on an uncolonised planet. This action requires an explicit warning explaining that they are being left without a founded colony, but the player may confirm it.

## Route state

Ship location and route state must distinguish:

- interstellar transit;
- arrival within a star system;
- orbit around a planet;
- landed at a colony;
- temporarily landed on an uncolonised planet.

The state must persist through save/load and remain accessible from the global Ships screen.

## Acceptance criteria

1. A ship in a system can target every valid planet in that system.
2. In-system travel advances time and consumes Fuel.
3. A destination change uses the ship’s current position for the new estimate.
4. Both the star map and colony provide access to the system map.
5. Temporary landing supports the four approved operations without founding a colony.
6. Leaving colonists without a colony warns but can be confirmed.
7. Save/load preserves the ship’s precise navigation state.
8. The cargo-bay UI is not the authoritative owner of navigation rules.

## Review state

No unresolved product questions remain. Exact orbital and interplanetary distances come from canonical universe/navigation data.
