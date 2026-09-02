# A08a — Operational Headquarters Departure Gate

**Progression stage:** 6 — Second Colony Establishment  
**Type:** Feature  
**Status:** In Discovery  
**Split from:** A08 — Operational Headquarters

## Original backlog text

> [FEATURE] *Need to have to build an operational headquarters before the colony ship can leave the first planet and then the same after that for every colony, because the ship needs a nerve centre to run things and the colony ship is that at first but when it leaves it needs something to take over.

## Scope established before discovery

A08a must prevent a colony ship from leaving a colony unless an approved Headquarters replacement is:

- fully constructed;
- receiving its required Power;
- staffed to its defined minimum.

The rule applies to the first colony and every later colony established by a colony ship. A blocked launch must explain exactly which requirement is missing.

Headquarters outage effects, conglomerate-network restrictions, progressive efficiency loss and ten-day recovery are explicitly outside A08a and are preserved in [A08b](./A08b-Headquarters-Outage-And-Recovery.md).

## Current implementation discovery

### Ship launch

- `ExpansionService.canLaunch()` is the authoritative preflight calculation for docked and home-based player ships.
- `ExpansionService.launch()` calls `canLaunch()` again before delegating the mutation to `startTravel()`.
- Both live launch presentations call `ExpansionService.launch()`; the current ship-preparation screen also calls `canLaunch()` to disable the launch button and display its reason.
- The current checks cover ship state, active colony, minimum ship crew, selected destination, route availability, Fuel and transit Food. They do not inspect Headquarters state.
- Corporate-home departures share `canLaunch()` but are not departures from a player colony and therefore require an explicit exemption from the A08a colony gate.
- In-system rerouting of a ship that is already travelling, arrived or orbiting uses `startTravel()` through `setTarget()`; it is not a departure from a colony and must not be accidentally gated.

### Buildings and construction

- `BUILDING_MODEL` and `DevelopmentService` are the canonical owners of local Housing, Power and Industry definitions, placement, upgrade costs and mutation.
- There is currently no Headquarters or command-capable building type and no metadata identifying an approved Headquarters replacement.
- Local building placement is currently immediate: resources are consumed and the finished development is written to the tile in the same action.
- Timed construction is separately backlogged as A05a. A08a must define a construction-complete predicate that remains compatible with A05a without implementing the whole timed-construction system prematurely.

### Power

- `ColonyService.demand()`, `SimulationEngine` and `syncBuildingTotals()` own the current colony-wide Power calculation.
- Power is represented as total capacity, total demand and a shared `powerFactor`; there is no per-building allocation or priority model.
- The landed ship currently contributes fixed Power and Industry through `SHIP_INFRASTRUCTURE`, and those contributions are added unconditionally rather than being derived from whether a ship is docked. This is a related implementation conflict that must be resolved or explicitly isolated when A08a is implemented.
- A08a therefore needs an agreed rule for what “receiving its required Power” means in the current aggregate Power model.

### Staffing and workforce

- `ColonyService` owns aggregate workforce availability and extraction-site workforce demand.
- Industry staffing is represented by a colony-wide population factor; Housing, Power and Industry buildings do not have individual staff allocations.
- There is no current Headquarters minimum-staff definition, assignment, reservation or operational-priority mechanism.
- A08a therefore needs an agreed staffing model that cannot be satisfied by UI-only state or a calculation different from the launch gate.

### State and persistence

- Local buildings are persisted as tile developments in each colony's local state and copied through the portfolio by `cloneColonyState()`.
- Save normalization already processes every colony's local tile state, but no Headquarters-specific state exists.
- If A08a adds stored Headquarters attributes or staffing assignments, the save schema must migrate old saves and preserve the state for both the active colony and background portfolio colonies.
- If operational status can be derived entirely from canonical building, Power and workforce state, that status should not be duplicated in the save.

## Proposed canonical ownership

- Static command-building eligibility and balance data should extend the canonical building definition rather than live in the UI.
- The authoritative Headquarters operational assessment should be a domain calculation over the active colony's canonical building, Power and staffing state.
- `ExpansionService.canLaunch()` should consume that assessment for docked colony departures and return structured missing requirements.
- The ship-preparation UI should render the same domain result and must not recreate the gate.
- `ExpansionService.launch()` must retain its second authoritative check so stale UI state cannot bypass the rule.

## Known dependencies and conflicts

1. A05a timed construction is not yet implemented, so A08a needs a future-compatible completion rule without absorbing A05a.
2. The existing aggregate Power model does not identify which facility receives limited Power.
3. The existing workforce model does not assign staff to individual non-extraction buildings.
4. Fixed ship-provided Power and Industry are currently counted even after departure; this may undermine the intended replacement handover.
5. Purchased freight ships now share the fleet and launch service, so the gate must distinguish colony-establishment ships from unrelated vessels.
6. The first colony and later colonies use the same local-state shape but are captured and switched through the portfolio; regression coverage must exercise both.
7. Launch presentation currently exposes one `reason` string. A08a may have several simultaneous missing requirements and should return a structured list plus a clear combined message.

## Product decisions

### Decision 1 — Initial command facility

- The initial approved Headquarters replacement is a dedicated Headquarters building.
- An existing Industry building cannot be nominated as Headquarters and does not satisfy the departure gate merely because it is present or upgraded.
- Headquarters identity must be canonical building data, not UI state or a player-applied label.
- Any future alternative or higher-tier command facility will qualify only if its canonical definition explicitly identifies it as an approved Headquarters replacement.

### Decision 2 — Headquarters Power priority

- Headquarters is a protected priority Power load.
- Its canonical building definition will specify a fixed required Power demand.
- Headquarters counts as powered whenever the colony's currently available generation can supply that full demand, even if remaining generation cannot satisfy every other colony load.
- A wider colony brownout therefore does not make Headquarters non-operational when its own full demand is covered.
- Headquarters is unpowered when available generation is below its required demand; a partial proportional allocation does not satisfy the departure gate.
- The authoritative calculation must allocate Headquarters Power before applying the existing shared shortage factor to remaining loads. The UI must consume the resulting operational assessment rather than interpret the general colony `powerFactor`.

## Unresolved questions

Questions will be worked through one at a time. The next question is whether the departure gate evaluates the colony's projected state after the selected ship leaves, excluding that ship's infrastructure and departing people. Later questions will cover construction completion, staffing allocation, which ships/departures are gated, balance values and presentation of multiple failures.

## Provisional acceptance criteria

These criteria contain only the scope already established by the user and will be completed after discovery.

1. A colony ship docked at the first colony cannot launch until an approved Headquarters replacement is fully constructed, powered and minimally staffed.
2. The same rule applies to every later colony established by a colony ship.
3. A failed gate identifies each missing applicable requirement.
4. Corporate-home departures and genuine in-transit reroutes are not incorrectly gated as colony departures.
5. The UI and launch mutation consume the same authoritative domain calculation.
6. Old and new saves preserve or correctly derive all state required by the gate.
7. Behavioural regression coverage includes the first colony, a later colony, each failure reason, successful launch and stale-UI/bypass protection.
