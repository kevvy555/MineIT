# A07 — Ship and Colony Accommodation Allocation

**Progression stage:** 6 — Second Colony Establishment  
**Type:** Bug fix and feature clarification  
**Status:** Ready for Review

## Original backlog text

> [BUG] *When a ship lands on a new colony, they can live on the ship but ATM we aren't using the accomodation volume of the ship just a standard 180, so we should have a clear operation between colonists living on the ship and colonists living in accomodation on the planet

## Purpose

Replace the fixed accommodation assumption with real ship capabilities and give the player explicit control over where colonists live while a ship is landed.

## Approved behaviour

- Every ship uses the accommodation capacity defined by its ship class; the fixed value of 180 is removed.
- Ship accommodation and planetary accommodation are distinct capacity pools.
- Colonists arriving aboard a ship remain resident aboard that ship until the player moves them into colony accommodation.
- Allocation is fully manual. The game does not automatically fill planetary housing or move residents between accommodation pools.
- Colonists may be moved back into ship accommodation while the ship is landed and spare capacity exists.
- The interface displays:
  - ship accommodation capacity and occupancy;
  - planetary accommodation capacity and occupancy;
  - homeless colonists;
  - the colonists assigned to each pool.
- A ship cannot accept more residents than its accommodation capacity.
- Attempting to launch a ship while colony residents still depend on its accommodation produces a clear warning.
- The player may confirm the launch despite the warning.
- Colonists who lose ship accommodation because of the confirmed launch remain at the colony and become homeless. They do not automatically become passengers.
- Existing homelessness consequences continue to apply.

## Data and ownership

Ship-class accommodation capacity must come from canonical ship data rather than a UI constant. Colonist accommodation assignment is authoritative gameplay state and must be mutated through the relevant domain service.

A resident assignment must remain valid across:

- landing and takeoff;
- moving colonists ashore or aboard;
- ship changes;
- save/load;
- ship-capacity changes caused by canonical data migration.

## Acceptance criteria

1. Two ship classes with different accommodation capacities expose their real values.
2. Landing does not automatically move colonists ashore.
3. Manual moves in both directions enforce available capacity.
4. Planetary and ship occupancy are visible separately.
5. Launching while accommodation is still relied upon warns but can be confirmed.
6. Confirmed launch leaves affected colonists homeless at the colony.
7. No production code retains the fixed 180-person assumption.
8. Save/load preserves valid accommodation assignments.

## Review state

No unresolved product questions remain. Crew requirements and passenger transport rules outside accommodation allocation remain separate features.
