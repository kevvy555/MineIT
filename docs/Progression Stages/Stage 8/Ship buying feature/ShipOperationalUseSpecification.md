# Stage 8 — Purchased Ship Operational Use Specification

Status: **Working specification — minimum viable fleet operation**  
Date: **2026-08-31**  
Companion feature spec: `ShipBuyingFeatureSpec.md`  
Companion UI spec: `ShipBuyingUiSpecification.md`

## 1. Purpose

Define the minimum gameplay needed so a factory-new vessel purchased through Deep Reach Fleet Procurement becomes a genuinely usable player ship rather than only a purchased asset/order record.

This is deliberately a **small fleet-enablement slice**. The current player-ship behaviour in `js/domain/expansion-service.js` already covers most of the required loop for one ship: loading, separate cargo/fuel/food storage, passenger transport, destination selection, launch, transit, mid-route rerouting, arrival and docking. The implementation should evolve that existing owner to work per `shipId` rather than replacing it.

The minimum player loop is:

**Ship delivered → select ship → load / crew / fuel → choose destination → launch → transit → arrive / orbital hold → dock → unload / reuse**

---

## 2. Canonical Ownership

`ExpansionService` remains the authoritative owner of player fleet operation and movement.

The ship-buying domain owns the commercial order until delivery. At delivery completion it creates a player ship through the canonical fleet owner. From that point the vessel is an ordinary player fleet asset.

The UI must never maintain separate operational truth for purchased ships.

Conceptual fleet state:

```text
state.company.expansion.ships[]
state.company.expansion.activeShipId
```

Every operational API that can mutate a vessel must identify the target ship explicitly.

---

## 3. Minimum Ship Status Model

The existing singular status model should be extended only as far as necessary.

Minimum statuses:

```text
docked
travelling
orbiting
arrived
home
lost
```

### `docked`

The vessel occupies one Spaceport berth at a specific owned colony and can use colony loading/unloading controls.

### `travelling`

The vessel is moving between systems using its current route, class-specific transit speed and class-specific fuel consumption.

### `orbiting`

The vessel is in the destination system and assigned to a target colony but cannot dock because that colony has no free Spaceport berth.

An orbiting ship:

- does not occupy a berth;
- remains selectable;
- can be redirected to a different destination if it has enough fuel;
- cannot use the surface cargo/fuel/food loading panel;
- should automatically dock when its assigned colony gains a free berth unless the player redirects it first.

### `arrived`

Retain only where needed for the existing uncolonised-system / choose-planet flow. For an owned-colony destination, arrival should normally resolve directly to either `docked` or `orbiting`.

---

## 4. Selecting and Controlling Ships

### 4.1 Spaceport

The Spaceport should list every player ship relevant to the active colony:

- ships docked at the colony;
- ships orbiting while waiting for a berth at the colony.

Each entry should show at minimum:

- vessel name;
- class/model;
- status;
- cargo used / capacity;
- fuel current / capacity;
- food current / capacity;
- crew / minimum crew;
- current destination where relevant.

Selecting a vessel sets `activeShipId` for the existing ship panel/actions. Selection is UI/navigation state only; the ship instance remains authoritative in the fleet collection.

### 4.2 Star map

Every player ship should be independently selectable on the star map while:

- travelling;
- orbiting;
- arrived in a system;
- docked, where the current star-map presentation already exposes the colony/system location.

Selecting a ship should open the same ship panel used from the Spaceport, adapted to the ship's current status.

---

## 5. Loading and Capacity

Reuse the existing cargo-loading experience rather than creating a new fleet cargo screen.

The current load/unload operations become ship-aware:

```text
loadCargo(state, shipId, ...)
unloadCargo(state, shipId, ...)
loadFuel(state, shipId, ...)
unloadFuel(state, shipId, ...)
loadFood(state, shipId, ...)
unloadFood(state, shipId, ...)
assignCrew(state, shipId, ...)
loadPassengers(state, shipId, ...)
unloadPassengers(state, shipId, ...)
```

Capacity rules resolve from the vessel's canonical ship class:

- general cargo capacity;
- fuel tank capacity;
- food store capacity;
- colonist/passenger capacity;
- minimum/maximum crew.

Cargo, fuel and food remain separate capacities.

Loading/unloading is permitted only while the selected ship is physically docked at the active colony.

---

## 6. Crew and Launch Readiness

The old minimum-passenger launch rule is replaced by minimum crew.

Launch requires:

- ship is docked/home and otherwise launchable;
- valid destination exists;
- crew >= canonical `minimumCrew`;
- crew <= canonical `maximumCrew`;
- passengers <= canonical `colonistCapacity`;
- sufficient fuel for the proposed route;
- sufficient food for crew + passengers for the proposed route;
- all stores are within their class-specific capacities.

The first implementation keeps crew as a simple numeric count.

---

## 7. Destination and Route Model

### 7.1 Docked launch

A docked vessel can select a surveyed destination system using the existing star-map flow and then launch.

For travel to an already owned colony, the route should also retain an optional `targetColonyId` so arrival can resolve to that colony's Spaceport rather than requiring an unnecessary second selection.

For uncolonised systems, preserve the existing system-arrival / choose-planet flow.

### 7.2 Mid-transit rerouting

Existing reroute behaviour is retained and made ship-specific.

While a ship is travelling, the player may select another valid destination system.

The route is recalculated from the ship's **current interpolated position**, not from the original departure system.

Rerouting must:

1. calculate the ship's current position;
2. calculate distance from that position to the new destination;
3. calculate remaining fuel required using the selected clas's `fuelUsePerLightYear`;
4. calculate food required for crew + passengers for the new remaining duration;
5. reject the reroute if current onboard resources cannot supply the route;
6. preserve all fuel/food already consumed on the previous route;
7. replace the remaining route/ETA only after validation succeeds.

No fuel is refunded when a route is changed.

### 7.3 Rerouting from orbit

An orbiting vessel may be redirected to another system under the same fuel/food validation rules.

An orbiting vessel may also target another owned colony in the same system. That local reassignment does not require an interstellar route; if a berth is free it can dock there, otherwise it becomes assigned to that colony's orbital holding queue.

---

## 8. Arrival, Berths and Orbital Holding

The first fleet release keeps berth handling intentionally simple:

- every docked player ship consumes exactly one berth;
- any ship can use any berth regardless of canonical berth class;
- canonical berth class and orbital-only capability remain reference data only;
- no existing occupant is displaced to make room for an arriving player ship.

When a ship reaches an owned colony:

```text
if free berth exists:
    dock ship
else:
    status = orbiting
    targetColonyId = destination colony
```

### 8.1 Automatic docking

An orbiting ship should automatically claim a berth when one becomes available at its assigned colony.

This should happen through deterministic domain processing rather than requiring the player to repeatedly press a Dock button.

If multiple player ships are waiting for the same berth, use a stable queue order such as:

1. earliest orbital-hold start day;
2. stable ship instance ID as tie-breaker.

This prevents save/load or render order from changing which vessel docks first.

### 8.2 Orbital resource consumption — initial recommendation

For the first implementation, **orbital holding should not consume interstellar fuel or transit food**.

Reason: berth contention is currently a simplified infrastructure rule. Allowing a ship to starve or be destroyed solely because a buyer/corporate vessel occupies the final berth would add a new orbital-support simulation before the game has tools to manage it.

Later orbital logistics can introduce life-support/fuel/fees if desired.

---

## 9. Fuel Validation

Fuel calculations are continuous and granular:

```text
fuelRequired = distanceLy × shipClass.specifications.fuelUsePerLightYear
```

This applies to:

- normal launch;
- shorter-than-one-light-year routes;
- mid-route rerouting;
- leaving orbital holding for another system.

The UI should always show the reason when a route cannot be accepted, for example:

```text
Need 1,840 Fuel for this route; 1,290 remains.
```

A destination button should be disabled or return a clear validation result when fuel is insufficient.

---

## 10. Daily Processing

`ExpansionService.processDay()` must iterate every travelling/orbiting player ship.

It must support on the same game day:

- multiple ships consuming transit resources;
- multiple independent arrivals;
- multiple lossess;
- one or more ships entering orbital holding;
- one or more orbiting ships auto-docking when berths become free.

The result should no longer be singular `shipArrived` / `shipLost` booleans only. Prefer collections/events that identify `shipId`.

Example direction:

```text
shipArrivals[]
shipLosses[]
shipDockings[]
shipOrbitalHolds[]
```

---

## 11. Ship Loss and Recovery

Loss of an individual vessel does not automatically trigger game over.

A lost ship loses:

- the vessel;
- its cargo;
- onboard fuel/food;
- crew/passengers aboard it.

The wider company only fails when the revised company-collapse rule determines there is no credible recovery path.

Access to Fleet Procurement and enough cash to buy a replacement colony-capable ship is a valid recovery path and therefore must be considered by the game-over redesign.

---

## 12. Purchase Delivery Handoff

A completed manufacturer order creates a normal player ship instance.

Initial purchased-ship commissioning state:

- unique generated vessel name;
- canonical `shipClassId`;
- owner = player company;
- selected delivery colony/system;
- empty general cargo;
- no assigned player passengers;
- no assigned player crew until commissioned/loaded;
- status resolves to `docked` when a berth is free, otherwise `orbiting`.

Manufacturer transfer logistics are abstracted by the order system; they must not be simulated as a normal player-controlled route from a fictional procedural shipyard.

A newly delivered ship that is waiting in orbital holding may be selected, but without player-usable fuel it cannot be redirected until it docks and is fuelled. This is acceptable for the first implementation.

---

## 13. Save / Load Requirements

Persist for every ship:

- instance ID;
- canonical class ID;
- current status;
- current system/colony;
- orbital target colony and hold start day;
- route start/current route data;
- target system/colony;
- arrival day;
- cargo/fuel/food;
- crew/passengers;
- purchase metadata;
- loss state.

Persist:

- `activeShipId` where useful for UI continuity;
- order queue independently from delivered fleet;
- orbital holding queue deterministically through ship state, not DOM order.

Save/load must preserve a mid-route reroute exactly.

---

## 14. Minimal UI Changes

### Spaceport ship selector

Add a compact player-fleet selector/list to the existing Spaceport interaction rather than creating a separate fleet management application.

### Existing ship panel

Reuse the current ship panel for the selected `shipId` and adapt labels/capacity/readiness to canonical class data.

### Existing cargo load panel

Reuse it with the selected `shipId` and class-specific capacities.

### Star map

Allow selection of any player ship and expose:

- current status;
- current position;
- destination;
- fuel remaining;
- route fuel requirement;
- ETA;
- reroute action where valid.

### Orbit state

Show clearly:

```text
ORBITAL HOLDING
Haven Ridge Spaceport full — waiting for next free berth.
```

The player can either wait for automatic docking or select a new valid destination.

---

## 15. Tests Required

At minimum:

- select correct ship from multi-ship fleet;
- loading one ship does not mutate another;
- class-specific cargo/fuel/food capacity enforcement;
- crew minimum launch rule;
- docked launch with sufficient resources;
- launch blocked by insufficient fuel;
- launch blocked by insufficient food;
- reroute from current transit position;
- reroute does not refund fuel already consumed;
- reroute rejected when remaining fuel is insufficient;
- orbiting reroute accepted/rejected correctly;
- full Spaceport causes orbital holding rather than failed/lost arrival;
- orbiting ship consumes no berth;
- orbiting ship auto-docks when a berth becomes available;
- deterministic order when multiple ships wait for one berth;
- same-system colony reassignment;
- multiple ships processed on same day;
- save/load preserves travelling and orbiting states;
- ship loss only affects target ship and no longer automatically ends a recoverable company.

---

## 16. Deferred Functionality

Do not add in this minimum slice:

- berth size classes;
- orbital-only ship restrictions;
- orbital fuel/life-support fees;
- detailed orbital transfer/shuttle logistics;
- fleet formations;
- escorts;
- autonomous trade routes;
- crew professions/officer skills;
- ship maintenance/condition;
- insurance;
- repair yards;
- refuelling while in orbit;
- manual docking priority management;
- physical manufacturer shipyard travel.

---

## 17. Decisions / Questions to Lock Before Production Code

The minimum design is otherwise implementable. These are the few points worth settling explicitly:

1. **Automatic docking from orbital holding** — recommendation: **yes**, first free berth is claimed automatically using deterministic queue order.
2. **Resource burn while orbiting** — recommendation: **none for the first release**; berth waiting should not create a hidden starvation/fuel-death system before orbital logistics exists.
3. **Newly purchased ship fuel on commissioning** — recommendation: arrive with **no player-usable fuel**; manufacturer delivery is abstract and the player fuels it after docking. If it arrives to a full Spaceport it waits in orbit until a berth frees rather than receiving exploitable free fuel.
4. **Owned-colony routes** — recommendation: retain both `targetSystemId` and optional `targetColonyId`, so existing exploration/system arrival stays intact while known-colony travel can automatically dock/orbit at the chosen colony.

