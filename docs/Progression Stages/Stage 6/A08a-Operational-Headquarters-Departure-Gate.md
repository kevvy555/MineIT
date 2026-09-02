# A08a — Operational Headquarters Departure Gate

**Progression stage:** 6 — Second Colony Establishment  
**Type:** Feature  
**Status:** In Discovery  
**Split from:** A08 — Operational Headquarters

## Original backlog text

> [FEATURE] *Need to have to build an operational headquarters before the colony ship can leave the first planet and then the same after that for every colony, because the ship needs a nerve centre to run things and the colony ship is that at first but when it leaves it needs something to take over.

## Scope established before discovery

The initial A08a scope required an approved Headquarters replacement to be fully constructed, receiving required Power and staffed to its defined minimum.

Decision 2 below supersedes the initial Power condition. The final A08a departure gate requires the dedicated Headquarters to be:

- fully constructed;
- staffed to its defined minimum.

A colony ship supplies no colony Power. It supplies 50 Industry only while it remains docked at that colony.

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
- Decision 2 removes Power from the A08a departure gate.
- Ships must contribute zero colony Power. A08a implementation must remove the current unconditional fixed ship Power contribution. The existing 50 Industry contribution must become conditional on the colony-establishment ship actually being docked at that colony.

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
- The authoritative Headquarters departure assessment should be a domain calculation over the active colony's canonical construction and staffing state.
- `ExpansionService.canLaunch()` should consume that assessment for docked colony departures and return structured missing requirements.
- The ship-preparation UI should render the same domain result and must not recreate the gate.
- `ExpansionService.launch()` must retain its second authoritative check so stale UI state cannot bypass the rule.

## Known dependencies and conflicts

1. A05a timed construction is not yet implemented, so A08a needs a future-compatible completion rule without absorbing A05a.
2. The existing workforce model does not assign staff to individual non-extraction buildings.
3. Fixed ship-provided Power and Industry are currently counted unconditionally. A08a must remove the Power contribution and make the 50 Industry contribution conditional on the colony-establishment ship being docked at the evaluated colony.
4. Purchased freight ships now share the fleet and launch service, so the gate must distinguish colony-establishment ships from unrelated vessels.
5. The first colony and later colonies use the same local-state shape but are captured and switched through the portfolio; regression coverage must exercise both.
6. Launch presentation currently exposes one `reason` string. A08a may have several simultaneous missing requirements and should return a structured list plus a clear combined message.
7. A08b still treats Headquarters Power loss as a later outage condition. Because A08a now allows an unpowered Headquarters at launch, that interaction must be reviewed when A08b enters discovery or final review; it is not part of A08a implementation.

## Product decisions

### Decision 1 — Initial command facility

- The initial approved Headquarters replacement is a dedicated Headquarters building.
- An existing Industry building cannot be nominated as Headquarters and does not satisfy the departure gate merely because it is present or upgraded.
- Headquarters identity must be canonical building data, not UI state or a player-applied label.
- Any future alternative or higher-tier command facility will qualify only if its canonical definition explicitly identifies it as an approved Headquarters replacement.

### Decision 2 — Power is not an A08a launch requirement

- Headquarters Power state does not block colony-ship launch.
- A08a will not add a Headquarters Power demand, priority allocation or `powerFactor` threshold to departure eligibility.
- Ships contribute zero Power to a colony. The current unconditional `SHIP_INFRASTRUCTURE.power` contribution must be removed from canonical colony totals. The existing 50 Industry contribution is handled by Decision 6.
- Launch eligibility therefore does not need a projected “without ship Power” calculation: no ship provides colony Power before or after departure.
- This decision intentionally overrides the Power condition in the initial A08a scope. The original backlog wording remains preserved above.
- A08b remains separate and retains its previously documented post-departure Power-outage rules pending its own later review.

### Decision 3 — Automatic priority Headquarters staffing

- Headquarters has a fixed minimum workforce requirement in its canonical building definition.
- The workforce network automatically reserves that minimum for Headquarters before allocating workforce to extraction and other production.
- Reserved Headquarters workers cannot simultaneously satisfy another workforce requirement.
- If total available workforce is below the Headquarters minimum, the facility is understaffed and the departure gate blocks launch.
- Headquarters staffing is derived from canonical available workforce and priority, not stored as a separate manual assignment.
- Crew and passengers are removed from colony population when loaded, so the staffing assessment naturally uses only people remaining at the colony.
- Conditions that reduce available workforce to zero, including colony loss or the existing starvation rule, also leave Headquarters understaffed.
- The reserved minimum reduces free workforce and may reduce lower-priority production capacity through the existing workforce-network calculation.

### Decision 4 — Immediate construction under the current lifecycle

- Headquarters uses the same immediate construction lifecycle as current Housing, Power and Industry buildings.
- Placement consumes the approved construction resources and immediately creates a fully constructed Headquarters.
- A08a will not add a Headquarters-only timer or commissioning delay.
- The departure assessment will use an explicit construction-complete predicate rather than assuming that any future placed building is complete.
- When A05a later introduces timed construction generally, it can change the canonical building completion state without rewriting or duplicating the A08a launch gate.

### Decision 5 — Unpowered colony establishment and ship-supported residents

- A newly founded colony starts with zero colony Power generation.
- The colony does not function until the player constructs a colony Power building.
- Colonists who remain assigned to landed ship accommodation are supported by the ship and consume the ship's supplies; they do not consume colony Power and are not available as colony workforce.
- A colonist cannot be transferred from ship accommodation into planetary accommodation unless a habitat exists and the colony can Power the resulting planetary population.
- A deployed mine or other colony production site produces nothing when no colony Power is available.
- The current demand, Food-consumption, accommodation-transfer and production calculations must be aligned with these ownership rules rather than treating all `state.pop` as planetary residents.
- Existing A06 emergency ship-Food behaviour remains relevant for planetary residents seeking access to ship Food. Normal ship-resident consumption must be distinguished from that emergency transfer path.
- The exact Power-capacity check for moving residents ashore remains unresolved. Decision 6 defines the existing 50 Industry baseline.
- Because these rules are required to establish the staff who operate Headquarters, they are currently treated as an A08a dependency. Final discovery will determine whether their implementation remains a coherent prerequisite within A08a or is captured as a linked independent backlog item.

### Decision 6 — Docked colony-ship Industry support

- The colony-establishment ship supplies 50 Industry to the colony only while that ship is docked there.
- The contribution is derived from the live ship/colony relationship and is not an unconditional colony baseline.
- The 50 Industry contribution is removed immediately when the ship launches, is lost or otherwise ceases to be docked at that colony.
- A newly founded colony may use this temporary Industry after it constructs colony Power.
- A08a does not require the colony to replace that 50 Industry before launch. Launch may reduce operational Industry and stop or throttle affected production under the normal Industry rules.
- Purchased freight or other non-colony-establishment ships do not automatically qualify as the startup Industry source unless their canonical class capability explicitly introduces that feature in future work.
- The ship-preparation UI should make any post-launch Industry reduction visible as information or warning, but it is not an A08a blocking requirement.

### Decision 7 — Explicit resident transfer with warned Power shortage

- Colonists are never moved automatically between ship and planetary accommodation.
- The player explicitly chooses the quantity to transfer, preserving A07's manual accommodation-allocation rule.
- Moving residents ashore is blocked when the colony has zero available Power generation, even when completed habitat capacity exists.
- When the colony has some available Power but cannot fully support the requested post-transfer planetary population, the game presents a clear warning showing the projected Power demand, available generation and shortage.
- If the player confirms, the full requested quantity is transferred subject to available habitat capacity. The game does not silently clamp the transfer to the fully powered population.
- The confirmed transfer creates a real colony Power shortage and existing shortage consequences apply.
- Cancelling the warning leaves accommodation assignments unchanged.
- The authoritative domain action must calculate and recheck the post-transfer Power position; the UI displays that result but does not independently decide eligibility.
- Residents remaining aboard continue using ship support and are excluded from colony Power demand and workforce.

### Decision 8 — One-time founding-ship command handover

- Each newly founded colony records the identity of the colony ship that established it and begins with command handover pending.
- A08a gates only that founding colony ship's first departure from that colony.
- The first successful gated launch persists command handover as complete for the colony.
- Once complete, later visits and departures by the founding ship are not gated by A08a, even if Headquarters later becomes understaffed.
- A08b will own later Headquarters outage consequences rather than using A08a to trap a visiting ship.
- Purchased freight ships and other non-founding ships are not subject to the gate.
- Corporate-home departures, arrivals, orbiting actions and in-transit reroutes are not colony command handovers and remain outside the gate.
- The authoritative state belongs to the colony and must survive portfolio switching and save/load.
- Migration must avoid retroactively trapping ships or invalidating colonies that were established before the handover field existed; the exact migration rule will be specified before final review.

### Decision 9 — Multiple Headquarters with one explicit Primary Headquarters

- A colony may construct multiple Headquarters buildings.
- Exactly one Headquarters is the colony's Primary Headquarters.
- The Primary Headquarters must be explicitly and visibly identified in the map, building details and any command-status presentation so the player never has to infer which facility owns command.
- Additional Headquarters are command-expansion facilities rather than additional primaries.
- Headquarters buildings support upgrades through the canonical building-development model.
- Every upgrade level and every additional Headquarters must provide a defined gameplay purpose; duplicate low-level buildings and a higher-level primary must represent deliberate alternatives rather than empty duplication.
- The benefit model, primary-selection rule, departure-gate relationship and staffing behaviour of expansion Headquarters remain to be decided.
- A08b must later reuse the same Primary Headquarters identity rather than inventing a second active-command selection.

### Decision 10 — Headquarters network, Primary selection and staffing

- Upgraded and additional Headquarters provide command capacity tied to the colony's building expansion.
- A larger or more developed building portfolio requires greater combined Headquarters capacity.
- Staffed Headquarters also provide colony-efficiency benefits; the exact formula, stacking rule and cap remain to be decided.
- This is intended to create gameplay pressure through construction resources, technology progression, land use and permanent workforce reservation.
- The first Headquarters constructed becomes Primary automatically.
- The player can explicitly designate a different eligible Headquarters as Primary later.
- Primary identity is persisted per colony and must be visibly marked wherever Headquarters are shown.
- Every Headquarters reserves its own minimum workforce.
- An understaffed Headquarters contributes no expansion capacity or efficiency benefit.
- The Primary Headquarters must independently satisfy A08a's minimum staffing departure gate; expansion staffing cannot be pooled to make an understaffed Primary operational.
- The model must make one upgraded Headquarters and several low-level expansions meaningful alternatives without allowing cheap Headquarters spam to dominate.

### Decision 11 — Soft command-capacity pressure and capped network bonuses

- Command load is weighted by both facility type and facility level.
- Exceeding total staffed Headquarters command capacity does not block construction or upgrades.
- Before a command that would exceed capacity is confirmed, the game warns the player and previews the resulting capacity shortfall and efficiency effect.
- While over capacity, the colony receives a progressive efficiency penalty that becomes more severe as load exceeds capacity.
- Every staffed Headquarters contributes to the positive Headquarters-network efficiency bonus.
- Positive contributions use diminishing returns and a global cap.
- An understaffed Headquarters contributes neither capacity nor positive efficiency.
- Over-capacity penalty and positive Headquarters bonus are separately visible and combine through one authoritative domain calculation.
- Exact facility weights, capacity values, penalty curve, bonus scope and bonus cap remain to be balanced.

### Decision 12 — Temporary ship command, facility scope and efficiency scope

- The docked founding colony ship provides temporary command capacity equal to an L1 Headquarters.
- Its temporary command capacity is replaced when a fully constructed and staffed Primary Headquarters becomes operational; ship and Primary capacity do not stack.
- After replacement, the ship does not regain or add command capacity merely because it remains docked or later returns.
- Every player-built operational facility consumes command capacity except Headquarters buildings and the fixed Basic Spaceport.
- Command load is differentiated by facility type and level: Housing is lighter, while Industry and advanced production/extraction are heavier.
- Headquarters efficiency applies to extraction and Food/Fuel/Build production, industrial processing and surveying speed.
- Headquarters efficiency does not change survival consumption, resource sale prices, storage capacity, physical building/ship capacity, transport time or ship travel.
- The same authoritative command-efficiency factor must be consumed by each affected domain calculation rather than separately approximated by UI or individual systems.

### Decision 13 — Command-load, capacity and minimum-staff tables

Facility command load equals the facility's current level multiplied by its type weight:

| Facility type | Command points per level |
|---|---:|
| Housing | 1 |
| Power | 2 |
| Food extraction/production | 2 |
| Fuel extraction/production | 2 |
| Build extraction/production | 2 |
| Industry | 3 |
| Ore extraction/mining | 3 |
| Headquarters | Excluded |
| Basic Spaceport | Excluded |

Headquarters progression is:

| Headquarters level | Command capacity | Minimum reserved staff |
|---|---:|---:|
| L1 | 16 | 5 |
| L2 | 36 | 10 |
| L3 | 64 | 18 |
| L4 | 100 | 28 |
| L5 | 150 | 40 |

Additional rules:

- Only fully constructed and fully staffed Headquarters contribute their level's command capacity.
- Capacity from multiple staffed Headquarters is additive.
- Every staffed Headquarters reserves its full level-specific workforce before ordinary production allocation.
- The temporary founding-ship command centre supplies 16 command capacity, matching L1.
- Command load follows the current facility level immediately after placement, upgrade, demolition, depletion or other canonical level/state change.
- Stopped but intact facilities continue to create administrative command load; demolished facilities do not. Depleted extraction sites stop contributing when their developed facility ceases to operate under the canonical depletion lifecycle.

## Unresolved questions

Discovery questions may now be asked in batches of up to three at the user's request. The current batch defines the over-capacity penalty curve, positive Headquarters bonus formula and whether temporary ship command grants a positive bonus. Later questions will cover construction and upgrade costs, technology gates, placement, Primary change restrictions, migration, scope split and failure presentation.

## Provisional acceptance criteria

These criteria contain only the scope already established by the user and will be completed after discovery.

1. A colony ship docked at the first colony cannot launch until the dedicated Headquarters is fully constructed and minimally staffed.
2. The same rule applies to every later colony established by a colony ship.
3. A failed gate identifies each missing applicable requirement.
4. Corporate-home departures and genuine in-transit reroutes are not incorrectly gated as colony departures.
5. The UI and launch mutation consume the same authoritative domain calculation.
6. Ships contribute no colony Power in old or new saves, while all state required by the construction and staffing gate is preserved or correctly derived.
7. Behavioural regression coverage includes the first colony, a later colony, each failure reason, successful launch and stale-UI/bypass protection.
