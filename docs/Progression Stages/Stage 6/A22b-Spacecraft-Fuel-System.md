# A22b — Spacecraft Fuel System

**Progression stage:** 6 — Second Colony Establishment  
**Type:** Feature  
**Status:** Ready for Review

## Original backlog text

> [FEATURE] We shoud only be able to use specfic fuels for specfic things, u cant power a space ship with biomass.

## Purpose

Replace generic spacecraft Fuel with compatible propulsion resources while keeping travel calculation understandable and preserving the existing distance-based model.

## Approved spacecraft consumables

Ships track:

1. **Propellant** for the in-system drive.
2. **Fusion Fuel** for the Vector Exchange interstellar drive.
3. **Veyrite lattice condition**, handled by the separate N01 specification.

A ship may carry one or both drive types. Each installed drive determines the compatible tank and consumption rate it requires.

## Tank and cargo rules

- Propellant and Fusion Fuel have separate dedicated tanks.
- Tank capacity is separate from general cargo capacity.
- Coal, biomass and every other incompatible resource can be carried as cargo but can never be loaded into a propulsion tank.
- A ship without the matching drive and tank cannot consume that Fuel.
- Canonical ship-class data defines installed drives, tank capacities and consumption rates.
- Newly purchased ships arrive with full Propellant and Fusion Fuel tanks for every applicable installed drive.

## Distance-based consumption

Travel uses an averaged total rather than simulating acceleration, cruising, manoeuvring and braking separately.

- In-system journeys consume Propellant per kilometre.
- Vector Exchange journeys consume Fusion Fuel per light-year.
- Required Fuel equals journey distance multiplied by that ship’s average consumption rate.
- A journey containing different drive legs calculates each leg using its compatible Fuel.
- Route preview shows the required amount of each Fuel.

## Insufficient Fuel

- The game does not hard-block a journey with insufficient Fuel.
- Attempting to launch or select a route without enough required Fuel shows a clear warning.
- The warning states the available amount, required amount and expected shortfall.
- The player may confirm and depart.
- If a required Fuel reaches zero before arrival, the ship stops at its current position and becomes stranded.
- Food and other life-support supplies continue to be consumed while the ship waits.

## Refuelling

Before player manufacturing is available:

- a colony purchases Propellant and Fusion Fuel from a visiting conglomerate ship;
- each Fuel is stored separately in colony inventory;
- a compatible colony spaceport transfers Fuel into a docked ship;
- remote routine refuelling is not available.

A stranded ship has two recovery routes:

1. a specialist player-controlled refuelling ship reaches it and transfers the required Fuel;
2. the player pays the conglomerate a very large emergency-service fee.

The conglomerate mission is not instant. Its quoted response time depends on the stranded ship’s distance from conglomerate infrastructure.

## Resource economy

The longer-term production chain uses the following categories.

### Raw or harvested resources

- Water or Ice
- Solar-Wind-Enriched Regolith
- Atmospheric Gas Feedstock

### Refined resources

- Hydrogen
- Deuterium
- Helium-3

### Manufactured resources

- Propellant
- Fusion Fuel

Expected chains are:

- Water or Ice plus Power produces Hydrogen.
- Hydrogen is processed into Propellant.
- Isotope separation produces Deuterium from hydrogen-bearing feedstock.
- Solar-wind-enriched regolith can provide rare Helium-3.
- Gas-giant atmospheric harvesting later provides high-volume feedstock containing Hydrogen, Deuterium and Helium-3.
- Deuterium, Helium-3 and Power manufacture Fusion Fuel.

Local manufacture is not required for the first release because colonies can purchase Fuel from the conglomerate. Gas-giant production is specified separately in N02.

## Existing-save migration

For a ship with an old generic or incompatible tank:

- calculate the old tank’s filled percentage;
- initialise every applicable new propulsion tank to the same percentage;
- remove the obsolete generic tank content.

Example: an old tank at 60% produces a Propellant tank at 60% and a Fusion Fuel tank at 60% when the ship supports both drives.

## Acceptance criteria

1. Incompatible cargo can never be used for propulsion.
2. Each drive consumes only its compatible Fuel.
3. Route preview and actual consumption use the same distance-based calculation.
4. A player may confirm an under-fuelled journey after a warning.
5. Exhausting required Fuel strands the ship at its current position.
6. Spaceport refuelling transfers the correct colony stock into the correct tank.
7. Both approved rescue routes can restore a stranded ship.
8. Purchased ships begin with full applicable tanks.
9. Save migration preserves the old fill percentage and removes generic tank contents.
10. Domain and migration regression tests cover compatibility, consumption, stranding, rescue and conversion.

## Balancing still required

Tank sizes, consumption rates, Fuel prices, production recipes, production throughput, rescue fees and response-time coefficients are balance data. They do not change the approved rules and do not block final design review.
