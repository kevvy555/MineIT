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
- Headquarters Power never participates in departure eligibility. A08a does define Headquarters operational Power demand and priority allocation for ongoing command operation, as settled by Decisions 21 and 22.
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
- Decision 7 defines the authoritative projected Power check, warning and confirmation behaviour for moving residents ashore. Decision 6 defines the existing 50 Industry baseline.
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
- A colony normally has exactly one Primary Headquarters, but may temporarily have none after the player deliberately demolishes it.
- The Primary Headquarters must be explicitly and visibly identified in the map, building details and any command-status presentation so the player never has to infer which facility owns command.
- Additional Headquarters are command-expansion facilities rather than additional primaries.
- Headquarters buildings support upgrades through the canonical building-development model.
- Every upgrade level and every additional Headquarters must provide a defined gameplay purpose; duplicate low-level buildings and a higher-level primary must represent deliberate alternatives rather than empty duplication.
- Decisions 10 through 22 define the benefit model, Primary-selection rule, departure relationship, staffing, Power and emergency-command behaviour.
- A08b must later reuse the same Primary Headquarters identity rather than inventing a second active-command selection.

### Decision 10 — Headquarters network, Primary selection and staffing

- Upgraded and additional Headquarters provide command capacity tied to the colony's building expansion.
- A larger or more developed building portfolio requires greater combined Headquarters capacity.
- Staffed Headquarters provide the colony-efficiency benefits defined by Decision 14.
- This is intended to create gameplay pressure through construction resources, land use and permanent workforce reservation.
- The first fully constructed and fully staffed Headquarters becomes Primary automatically.
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
- Decisions 12 through 14 define the facility scope, exact weights, capacities, penalty curve, bonus scope and cap.

### Decision 12 — Temporary ship command, facility scope and efficiency scope

- The docked founding colony ship provides temporary command capacity equal to an L1 Headquarters.
- Its temporary command capacity is replaced when a fully constructed and staffed Primary Headquarters becomes operational; ship and Primary capacity do not stack.
- After replacement, the ship does not normally regain or add command capacity merely because it remains docked or later returns. Decisions 16 through 18 define emergency management transfer, qualifying ship capability and the A08a/A08b boundary.
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

### Decision 14 — Command overload and positive efficiency formulas

Over-capacity penalty:

- `overloadRatio = max(0, commandLoad / commandCapacity - 1)`.
- `overloadPenalty = min(0.50, overloadRatio * 0.50)`.
- Every 10% that load exceeds capacity therefore removes 5 percentage points of efficiency.
- The penalty is capped at 50 percentage points.
- When command capacity is zero and command load is positive, the maximum 50-point overload penalty applies.

Positive Headquarters bonus:

- Each fully staffed Headquarters has a raw bonus equal to 2 percentage points per Headquarters level.
- Staffed Headquarters are ordered by raw contribution from highest to lowest for diminishing-return calculation.
- The strongest contribution counts at 100%, the second at 50%, the third at 25%, and every later contribution at 12.5%.
- The combined positive Headquarters bonus is capped at 15 percentage points.
- The temporary founding-ship command centre provides no positive Headquarters bonus.

Combined factor:

- `commandEfficiency = clamp(1 + headquartersBonus - overloadPenalty, 0, 1.15)`.
- Extraction/production output, industrial processing and survey speed consume this same factor.
- The positive bonus and overload penalty are shown separately alongside the combined effective percentage.
- Calculations use unrounded values; the UI may round percentages for display.


### Decision 15 — Economically gated Headquarters progression and placement

- Headquarters construction and upgrades have no technology gate.
- Headquarters may progress from L1 through L5 whenever the canonical placement or upgrade action's other requirements are satisfied.
- A08a introduces no Headquarters technology-tree entry and no Industry-capacity prerequisite for Headquarters construction or upgrades.
- Headquarters use the following Build and Ore costs; an upgrade pays the row for its target level:

| Target Headquarters level | Build | Ore |
|---|---:|---:|
| L1 construction | 90 | 0 |
| L2 | 170 | 25 |
| L3 | 300 | 65 |
| L4 | 510 | 130 |
| L5 | 850 | 240 |

- The canonical action consumes these resources from colony inventory and applies the existing terrain construction-cost multiplier where the normal building model applies it.
- Headquarters may be constructed on any tile that satisfies the normal local-building placement rules: revealed, empty and buildable, excluding lake tiles and the fixed Spaceport tile.
- Building over a revealed resource follows the same resource-covering behaviour and confirmation rules as other local buildings.
- Construction is immediate under Decision 4; later upgrades likewise use the current canonical building-development lifecycle.



### Decision 16 — Primary eligibility, departure responsibility and permitted demolition

- Only a fully constructed and fully staffed Headquarters is eligible to be designated Primary.
- The first Headquarters to become eligible is designated Primary automatically; later changes are explicit player actions.
- When command handover is pending, the Primary Headquarters must independently be fully constructed and fully staffed before the founding colony ship may make its first departure.
- An operational expansion Headquarters cannot substitute for an understaffed or missing Primary, and staff cannot be pooled across Headquarters to satisfy the gate.
- The player may demolish the Primary Headquarters without first designating a replacement.
- Demolishing the Primary clears its identity and does not automatically promote another Headquarters.
- If the first-departure handover is still pending, the founding ship remains the temporary command centre while docked, but its departure is blocked until another eligible Headquarters has been explicitly designated Primary.
- After handover, loss of the Primary causes major colony disruption and severe efficiency penalties.
- If a qualifying ship is docked when the Primary is lost, colony management transfers to that ship temporarily. When that ship leaves without an eligible replacement Primary, the colony returns to the same disrupted state as a Headquarters-destroyed colony.
- The outage, disruption and penalty lifecycle belongs to A08b rather than the initial A08a departure gate. A08a must preserve the canonical Primary identity and command-capability state needed by A08b.
- Decisions 17 and 18 define qualifying command-capable ships and assign immediate emergency transfer to A08a while preserving the longer outage lifecycle for A08b.



### Decision 17 — Command-capable ships and migration of existing saves

- Emergency ship management is driven by an explicit canonical ship-class command capability.
- Colony ships have this capability by default.
- Other present or future ship classes qualify only when their canonical class definition explicitly grants command capability; merely being player-owned and docked is insufficient.
- A qualifying ship must actually be docked at the affected colony to assume management.
- Pre-A08a saves migrate every existing colony with command handover already complete.
- The migration does not retroactively gate an established colony's next ship departure or require reconstructing a founding-ship identity that old saves did not preserve.
- Only colonies founded after the migrated save is loaded begin with command handover pending and record their founding colony ship.
- Save/load must preserve command handover, Primary identity and the ship/colony relationship used by the authoritative command assessment.
- A08a owns immediate emergency takeover and no-command disruption. A08b remains separate and owns conglomerate restrictions, progressive daily degradation and ten-day recovery, as settled by Decision 18.



### Decision 18 — Emergency command continuity and A08b boundary

- A08a implements the immediate management transfer after the Primary Headquarters is demolished or otherwise absent.
- If one or more command-capable ships are docked, one supplies temporary management using the same canonical command-centre contribution as the founding ship: 16 command capacity, equivalent to L1.
- A temporary command ship provides no positive Headquarters efficiency bonus.
- The ship prevents the colony from entering the immediate no-command disruption state while it remains docked.
- Temporary ship command does not reproduce the destroyed Primary's former level, capacity or bonus.
- If the ship leaves and no eligible Primary exists, temporary command is removed immediately and the colony enters no-command disruption.
- Without a Primary or docked command-capable ship, all expansion Headquarters are disconnected: they reserve no staff and contribute no command capacity or positive bonus until command is restored.
- Restoring a staffed Primary or docking a command-capable ship reconnects eligible staffed expansion Headquarters through the normal authoritative command-network calculation.
- A08a owns this immediate takeover, loss and restoration of command capacity and the resulting immediate command-efficiency effect.
- A08b remains separate and retains conglomerate-network restrictions, subsequent daily efficiency degradation and the ten-day recovery lifecycle.
- A08a must expose the canonical command-availability assessment so A08b can later begin, continue and restore its outage state without duplicating Headquarters or ship eligibility rules.



### Decision 19 — Immediate no-command effect and Primary demolition warning

- When the colony has neither an eligible Primary Headquarters nor a docked command-capable ship, command capacity is zero and the existing command formula applies its maximum 50-percentage-point overload penalty.
- Disconnected expansion Headquarters supply no capacity or positive bonus, so no separate no-command penalty is added on top of the zero-capacity result.
- The resulting command-efficiency factor continues to affect production/extraction, processing and surveying only, as defined by Decision 12.
- Demolishing the Primary remains permitted.
- Before demolition, the authoritative domain assessment calculates the post-demolition command source, available capacity, command load, Headquarters bonus, overload penalty and combined efficiency.
- The UI presents those projected consequences in a confirmation warning.
- Confirming rechecks and performs the demolition; cancelling makes no state change.
- If a command-capable ship is docked, the preview includes its temporary 16 capacity and zero positive bonus.
- Headquarters requirements still block the actual first departure; Decision 20 defines how the enabled Launch action presents the rejection.


### Decision 20 — Enabled Launch action with authoritative Headquarters rejection

- A missing, incomplete or understaffed Primary Headquarters continues to block the founding colony ship's first actual departure.
- Missing Headquarters requirements alone do not disable the Launch control.
- When the player presses Launch, the authoritative domain action rechecks the complete launch assessment and rejects the departure without mutating ship, colony, Fuel, Food or handover state.
- The rejection presents every applicable Headquarters failure rather than only the first one.
- Structured Headquarters failures distinguish at least: no eligible Primary selected, Primary construction incomplete, and Primary staff below its level-specific minimum.
- An understaffed failure displays the required and currently reserved staff values.
- Headquarters Power is never included in the A08a launch failures.
- There is no confirmation override for a failed Headquarters handover.
- Existing non-Headquarters launch rules retain their current authoritative checks and presentation unless implementation requires a shared structured-reason model to avoid duplicated eligibility logic.
- `ExpansionService.launch()` remains the final authority even if the UI's earlier assessment becomes stale.


### Decision 21 — Deterministic Headquarters staffing and operational takeover

- Headquarters workforce allocation is deterministic and all-or-nothing per facility because a partially staffed Headquarters contributes nothing.
- The Primary Headquarters receives the first opportunity to reserve its full level-specific minimum.
- Eligible expansion Headquarters are then considered from highest level to lowest level; an expansion that cannot be fully staffed is skipped.
- Equal-level expansions use stable tile identity/order as the tie-breaker, so save/load and portfolio switching cannot change allocation.
- Headquarters staffing is assessed before ordinary extraction, production and processing workforce.
- A docked command-capable ship must carry at least its canonical ship-class minimum crew before it can manage the colony.
- An empty or under-crewed ship provides no temporary command capacity and does not prevent no-command disruption.
- A qualifying crewed ship automatically takes over whenever the Primary is non-operational because it is missing, incomplete, understaffed or not receiving its required operational Power.
- Power remains excluded from first-departure eligibility: an unpowered but fully constructed and fully staffed Primary does not block launch.
- If launch removes the only qualifying command ship while the Primary remains non-operational, the colony immediately loses ship command and applies the no-command state.
- Decision 22 defines the Headquarters operational Power-demand progression and allocation priority.


### Decision 22 — Light Headquarters operational Power curve and priority

- Headquarters operational Power demand uses the existing light site curve:

| Headquarters level | Required operational Power |
|---|---:|
| L1 | 1 |
| L2 | 2 |
| L3 | 4 |
| L4 | 7 |
| L5 | 11 |

- Power remains excluded from A08a's first-departure gate.
- During a colony-wide shortage, the Primary Headquarters receives Power before expansion Headquarters and ordinary colony demand.
- Expansion Headquarters then receive Power from highest level to lowest level, with stable tile identity/order breaking equal-level ties.
- A Headquarters contributes only when its complete level-specific Power demand is met; partial Power supplies no command capacity or positive bonus.
- A docked command-capable ship uses ship support rather than colony Power and may take over when the Primary is unpowered.
- After Headquarters priority demand is allocated, remaining generation feeds the colony's ordinary aggregate Power calculation.

## Power-consumption and generation audit

### Canonical curves on `develop`

| Level | Power Plant generation | Housing capacity | Full Housing life support (temperate) | Industry capacity | Full Industry demand | Extraction-site demand | Approved HQ demand |
|---|---:|---:|---:|---:|---:|---:|---:|
| L1 | 30 | 160 | 11.2 | 100 | 4.0 | 1 | 1 |
| L2 | 75 | 360 | 25.2 | 230 | 9.2 | 2 | 2 |
| L3 | 160 | 650 | 45.5 | 420 | 16.8 | 4 | 4 |
| L4 | 330 | 1,050 | 73.5 | 700 | 28.0 | 7 | 7 |
| L5 | 650 | 1,600 | 112.0 | 1,100 | 44.0 | 11 | 11 |

Current formulas and omissions:

- Planetary life support uses `population × 0.07 × scenario support load`; support load ranges from 0.9 to 2.0.
- Industry uses four Power per 100 operational Industry capacity.
- Every active extraction/production site uses the same 1/2/4/7/11 curve regardless of resource family.
- Housing has no fixed building draw beyond resident life support.
- Power Plants have no parasitic demand.
- The fixed Basic Spaceport has no Power demand.
- Power technology reduces Fuel intensity from 0.10 at L1 to 0.035 at L5; it does not multiply generation.
- Extraction upgrades also require installed generation capacity, separately from runtime demand: Food sites require 45/90/160/260 Power for L2-L5, and industrial sites require 60/120/220/360.

### Representative same-level colony

This comparison uses one full Housing building, one fully staffed Industry building, one Headquarters and either one or five extraction sites at the same level.

| Level | Generation | Demand with one site | Utilisation | Demand with five sites | Utilisation | Five sites at maximum 2.0 support load | Utilisation |
|---|---:|---:|---:|---:|---:|---:|---:|
| L1 | 30 | 17.2 | 57.3% | 21.2 | 70.7% | 32.4 | 108.0% |
| L2 | 75 | 38.4 | 51.2% | 46.4 | 61.9% | 71.6 | 95.5% |
| L3 | 160 | 70.3 | 43.9% | 86.3 | 53.9% | 131.8 | 82.4% |
| L4 | 330 | 115.5 | 35.0% | 143.5 | 43.5% | 217.0 | 65.8% |
| L5 | 650 | 178.0 | 27.4% | 222.0 | 34.2% | 334.0 | 51.4% |

### Findings

1. The light Headquarters curve is small relative to same-level generation and does not materially distort the existing economy. Its principal pressure remains workforce, construction cost, land and command capacity.
2. Same-level Power Plant generation grows faster than the representative Housing, Industry and extraction demand bundle. High-level colonies therefore gain increasing headroom, although multiple buildings and sites can consume it.
3. Extraction sites become less Power-efficient as upgraded: output rises 10/18/30/48/72 while demand rises 1/2/4/7/11. Output per Power falls from 10.0 at L1 to about 6.55 at L5, partly countering the generous generator curve.
4. Installed-Power upgrade gates are much larger than individual runtime site demand. Power currently acts more strongly as an upgrade prerequisite than as an operating constraint.
5. The current shortage calculation produces a colony `powerFactor`, but `ResourceService.collectionRate()` does not consume it. Extraction, including mines, can therefore continue producing with zero generation. This is a correctness defect and conflicts with the agreed establishment rule.
6. Current life-support demand uses total colony population rather than planetary residents, so colonists assigned to docked ship accommodation incorrectly consume colony Power. A08a already requires this ownership error to be corrected.
7. The current 30 ship Power and 50 ship Industry are unconditional static baselines. A08a removes ship Power and makes the founding ship's Industry conditional on docking.

### Initial audit recommendation — superseded

The initial recommendation was to preserve non-Headquarters values and fix correctness only. Decision 23 explicitly supersedes that recommendation and expands A08a to a complete Power-economy rebalance. The identified correctness defects and required regression coverage remain applicable.


### Decision 23 — Expand A08a to rebalance the complete Power economy

- A08a will not preserve the existing non-Headquarters generation and demand values by default.
- Discovery expands to analyse and rebalance the complete authoritative Power economy before final review.
- The balance pass includes Power Plant generation, planetary life-support demand, Industry demand, extraction/production-site demand, Headquarters priority demand, installed-Power upgrade gates, Fuel consumption and shortage allocation.
- The approved light Headquarters curve remains the starting point and will change only through another explicit decision.
- The pass must retain the establishment rules: ships provide no colony Power, ship residents use ship support, and planetary facilities cannot operate without delivered colony Power.
- Gameplay values will not be modified until the rebalanced tables and their economic consequences have been presented and approved as part of the complete A08a specification.
- The implementation must replace disconnected scalar approximations with one authoritative domain Power assessment consumed by production, processing, survival, upgrade checks and UI presentation.


### Decision 24 — Realistic demand hierarchy, survival-first allocation and online-capacity Fuel burn

- The existing Power economy is too easy and must increase overall facility usage rather than only trimming generation.
- Demand curves should express a clear relative hierarchy: Housing uses comparatively little facility Power; Headquarters is small-to-medium; the Basic Spaceport is medium; production and extraction rise by resource type; Ore extraction is high; and Industry is the dominant consumer.
- Every upgrade level must materially increase the facility's operational Power demand.
- Planetary resident life support remains separate from the Housing building's own facility demand.
- After Headquarters priority, limited delivered Power is allocated to planetary life support, then Food/Fuel operations and their required Industry support, then commercial Industry and Build/Ore operations.
- Power is not shared proportionally across all consumers before those priority bands are satisfied.
- Every online Power Plant consumes Fuel for its complete available generation capacity, even when colony demand is lower.
- Players may stop Power Plant production through the existing canonical control to remove both its generation and Fuel burn.
- Fuel shortage reduces the generation actually available from the online fleet; unserved generation capacity cannot supply downstream consumers.
- Fuel consumption must be zero when no Power Plant is online, correcting the current behaviour that can burn Fuel against demand with zero generation.
- Decisions 26 and 27 define and approve the facility curves, generator capacities, Spaceport consequences and installed-generation upgrade gates.


### Decision 25 — Occupancy-aware Housing, hybrid Industry and facility-family extraction demand

- Housing has a small fixed facility demand by building level plus separate life-support demand for the planetary residents actually assigned ashore.
- Ship residents remain excluded from both components: they do not occupy Housing and their support comes from ship supplies.
- Industry has a small online idle demand plus a much larger variable demand based on its staffed operational capacity.
- Stopped Industry contributes no installed operational capacity and consumes neither idle nor variable Power.
- Understaffed Industry retains its online idle demand but its variable demand falls with staffed capacity.
- Extraction and production Power demand is defined by canonical facility family rather than one shared curve or only the broad resource category.
- Required facility families are Farm, Ranch, Bio facility, Algae facility, Quarry, Rig, Mine and Deep Mine.
- Facility-family identity already exists canonically through extraction development metadata and must remain a domain concern, not be inferred by the UI.
- Every family curve increases materially from L1 to L5.
- Decision 27 approves the fixed Housing, Industry, facility-family and Power Plant tables.


### Decision 26 — Spaceport priority and proportional partial-Power operation

- The fixed Basic Spaceport has a medium Power demand.
- Its demand is allocated after Headquarters, planetary life support and Food/Fuel survival operations, but before commercial Industry and Build/Ore extraction.
- When the Spaceport is not fully powered, trade services, cargo loading/unloading, passenger and accommodation transfers, and Engineering Ship services are unavailable.
- Lack of Spaceport Power never blocks a ship from arriving or making an emergency departure and therefore cannot trap a ship or override A08a's defined first-handover gate.
- Spaceport service rejection is authoritative domain behaviour with a clear missing-Power reason, not a UI-only disabled state.
- Ordinary facilities receiving partial Power scale throughput by their delivered fraction; zero delivered Power means zero output.
- Within each ordinary priority band, available Power is shared proportionally across every active consumer in that band.
- Tile order does not decide which same-priority facility operates.
- Headquarters remain all-or-nothing under Decision 22 because partial command Power contributes nothing.
- The Spaceport is also a binary service consumer: if its complete fixed demand cannot be met, its restricted services remain offline and the unused partial allocation is released to the next band.

## Approved rebalanced Power tables

These values are approved A08a balance decisions. They do not change gameplay until the complete A08a specification is approved and implemented.

### Decision 27a — Generation and non-extraction demand

| Level | Power Plant generation | Housing fixed demand | Full-Housing resident support at 0.07 each | HQ demand | Industry idle demand | Industry variable demand at full staffed capacity | Total full Industry demand |
|---|---:|---:|---:|---:|---:|---:|---:|
| L1 | 75 | 1 | 11.2 | 1 | 3 | 25.0 | 28.0 |
| L2 | 165 | 2 | 25.2 | 2 | 7 | 57.5 | 64.5 |
| L3 | 300 | 4 | 45.5 | 4 | 14 | 105.0 | 119.0 |
| L4 | 500 | 7 | 73.5 | 7 | 24 | 175.0 | 199.0 |
| L5 | 800 | 11 | 112.0 | 11 | 38 | 275.0 | 313.0 |

- Planetary resident support remains `0.07 × scenario support load` per resident.
- Industry variable demand is 0.25 Power per unit of staffed operational Industry capacity.
- The Basic Spaceport has a fixed demand of 10 Power.
- Power Plants have no parasitic electrical demand because their Fuel burn is charged against complete online generation capacity.

### Decision 27b — Facility-family demand

| Level | Farm | Ranch | Bio facility | Algae facility | Quarry | Rig | Mine | Deep Mine |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| L1 | 2 | 2 | 3 | 3 | 4 | 4 | 5 | 7 |
| L2 | 5 | 5 | 7 | 7 | 9 | 10 | 12 | 16 |
| L3 | 10 | 9 | 13 | 13 | 17 | 19 | 23 | 31 |
| L4 | 18 | 16 | 22 | 22 | 29 | 33 | 40 | 54 |
| L5 | 30 | 26 | 35 | 35 | 46 | 52 | 64 | 86 |

### Decision 27c — Installed-generation upgrade gates

The value is the required online installed generation before upgrading that family to the target level. L1 construction remains permitted without generation but cannot operate until Power is delivered.

| Target level | Farm/Ranch | Bio/Algae | Quarry | Rig | Mine | Deep Mine |
|---|---:|---:|---:|---:|---:|---:|
| L2 | 90 | 100 | 110 | 115 | 125 | 140 |
| L3 | 190 | 210 | 225 | 235 | 250 | 280 |
| L4 | 340 | 370 | 400 | 420 | 440 | 470 |
| L5 | 550 | 600 | 650 | 680 | 710 | 750 |

Every target exceeds one previous-level Power Plant but fits within one same-level plant. Players may instead combine multiple lower-level plants, trading tiles, construction resources, Fuel burn and Headquarters command load for capacity.

### Approved balance evidence

The representative colony contains one full same-level Housing building, one fully staffed same-level Industry building, one same-level Headquarters, the Basic Spaceport and five same-level facilities: Farm, Bio, Quarry, Rig and Mine.

| Level | Proposed generation | Temperate demand | Utilisation | Maximum-support demand | Utilisation | Full-capacity Fuel burn per day | Base same-level Fuel-site output |
|---|---:|---:|---:|---:|---:|---:|---:|
| L1 | 75 | 69.2 | 92.3% | 80.4 | 107.2% | 7.5 | 10 |
| L2 | 165 | 146.7 | 88.9% | 171.9 | 104.2% | 14.0 | 18 |
| L3 | 300 | 264.5 | 88.2% | 310.0 | 103.3% | 21.0 | 30 |
| L4 | 500 | 438.5 | 87.7% | 512.0 | 102.4% | 25.0 | 48 |
| L5 | 800 | 684.0 | 85.5% | 796.0 | 99.5% | 28.0 | 72 |

Fuel burn uses the deployed Power technology's existing intensity curve of 0.10/0.085/0.070/0.050/0.035 multiplied by complete online generation capacity. One baseline same-level Fuel site can therefore sustain one same-level Power Plant before resource quality, terrain, workforce, Industry and Power-delivery effects.


### Decision 28 — Fuel-day sequencing, existing-save transition and visible Power network

- Daily available generation is calculated from online Power Plant capacity and Fuel stored at the beginning of that simulation day.
- Required Fuel equals complete online generation capacity multiplied by the colony's deployed Power-technology Fuel intensity.
- When beginning-of-day Fuel is insufficient, the available-generation factor equals stored Fuel divided by required Fuel; delivered generation capacity is reduced by that factor and the available Fuel is consumed.
- When Fuel is sufficient, every online plant burns for its complete capacity even if colony demand is lower; unused generated capacity is wasted.
- With no online Power Plant, Fuel burn and colony generation are both zero.
- Fuel produced during the current day is added after generation Fuel has been resolved and becomes available from the next day. A colony with no stored Fuel therefore cannot self-start a Fuel facility without importing or otherwise obtaining Fuel.
- Forecasts and UI values must use the same day-sequencing rules and clearly distinguish beginning-of-day stored Fuel from projected new production.
- Existing saves adopt every new generation and demand curve immediately at their saved game speed.
- Existing colonies receive no grace period, free Power, free Fuel or grandfathered building values.
- Save migration still marks all pre-A08a colony command handovers complete under Decision 17.
- The normal Power presentation always shows online capacity, Fuel-limited available generation, total requested demand, delivered Power and shortage by priority band, full-capacity Fuel burn, actual Fuel consumed and unused generation.
- Each facility detail shows requested Power, delivered Power, priority band and resulting operating factor.
- Warnings identify the exact limiting cause: no online generation, insufficient Fuel, insufficient capacity, or a higher-priority band consuming the available supply.

## Discovery outcome

Discovery is complete. No product questions remain open. The item remains **In Discovery** until the user explicitly approves this complete specification. Approval will change the detailed file and master backlog to **Approved**; implementation will begin only after that approval and a subsequent **In Progress** update.

## Canonical implementation ownership

- `BUILDING_MODEL` and `DevelopmentService` own Headquarters, Housing, Power and Industry static definitions, placement, costs, levels and normal building mutation.
- Canonical extraction-family metadata and `SiteService` own facility-family Power demand and installed-generation upgrade requirements.
- `ColonyService` owns Headquarters staffing, command load/capacity/efficiency and the complete priority-band Power assessment.
- `SimulationEngine` consumes the authoritative Power assessment, sequences beginning-of-day Fuel burn before same-day production, and applies delivered factors to survival, production and processing.
- `ExpansionService` owns founding-ship identity, one-time command handover, command-capable ship assessment and the authoritative launch rejection.
- Save normalization owns migration defaults for Primary identity, command handover and ship capability/state without persisting values that can be derived from canonical buildings, residents, crew and inventory.
- UI modules render the canonical Headquarters, command and Power assessments and dispatch domain actions. They must not reconstruct eligibility, allocation, forecasts or penalties.

## Final acceptance criteria

### Headquarters construction, progression and identity

1. Headquarters is a dedicated canonical building type with L1-L5 costs, capacities, staff, Power and bonuses exactly as approved in Decisions 13-15, 22 and 27.
2. Headquarters has no technology gate and uses normal revealed, empty, buildable tile placement, terrain cost and resource-covering rules.
3. Headquarters construction and upgrades use the current immediate canonical lifecycle while exposing an explicit construction-complete predicate compatible with future A05a work.
4. A colony may build multiple Headquarters but has at most one explicitly stored Primary identity.
5. The first fully constructed and fully staffed Headquarters becomes Primary automatically; later Primary changes require an explicit action and an eligible target.
6. Primary identity is visibly marked on the map, in building details and in command status.

### Staffing and command network

7. Headquarters staffing is allocated before ordinary workforce and is all-or-nothing per facility.
8. Staffing order is Primary first, then highest-level eligible expansions, with stable tile identity/order breaking ties and insufficient expansions skipped.
9. Staff reserved for Headquarters cannot satisfy production or another Headquarters simultaneously.
10. Facility command load, Headquarters capacity and minimum staffing use the exact Decision 13 tables.
11. Stopped intact facilities continue to consume command load; demolished or canonically exhausted facilities do not.
12. Command overload and positive Headquarters bonus use the exact Decision 14 formulas, diminishing returns and caps.
13. Production/extraction, Industry processing and surveying consume the same authoritative command-efficiency factor; excluded systems remain unaffected.

### Colony establishment, residents and temporary ship infrastructure

14. Ships contribute zero colony Power in new and migrated saves.
15. The colony-establishment ship contributes 50 Industry only while it is actually docked at the colony it founded; unrelated ships contribute none unless future canonical class metadata explicitly says otherwise.
16. Residents assigned to ship accommodation consume ship supplies and are excluded from planetary Housing, life-support Power and workforce calculations.
17. Resident transfer ashore is always explicit, requires Housing and a fully powered Spaceport service, blocks at zero colony generation, and warns before a confirmed transfer that creates a projected shortage.
18. A confirmed warned transfer moves the requested residents subject to Housing capacity and creates the real projected shortage; cancellation changes nothing.

### First-departure gate

19. Every newly founded colony records its founding colony ship and begins with command handover pending.
20. Only that founding ship's first departure from that colony is gated; unrelated ships, corporate-home departures, arrivals, orbit actions and in-transit reroutes are exempt.
21. The gated departure requires the explicitly selected Primary Headquarters to be fully constructed and fully staffed independently; expansion Headquarters cannot substitute or pool staff.
22. Headquarters Power and Spaceport Power do not block the gated departure.
23. Missing Headquarters requirements alone leave Launch enabled. The authoritative launch action rejects without mutation and returns all applicable structured failures, including missing Primary, incomplete construction and required/current staff.
24. A successful first gated departure persists handover complete. Later visits and departures are not retrapped by A08a.
25. `ExpansionService.launch()` rechecks the complete authoritative assessment so stale UI state or direct action cannot bypass the gate.

### Primary loss and emergency ship command

26. Primary demolition is allowed only after a confirmation previews the resulting command source, capacity, load, bonus, overload and efficiency.
27. Only a docked ship with explicit command capability and at least its class minimum crew can provide emergency management; colony ships have the capability by default.
28. A qualifying ship automatically takes over whenever the Primary is missing, incomplete, understaffed or lacks its required operational Power.
29. Temporary ship management provides 16 command capacity, no positive bonus and no colony Power; it does not copy the lost Primary's level.
30. Without an operational Primary or qualifying ship, expansion Headquarters disconnect, reserve no staff and provide no capacity or bonus; zero capacity applies the maximum 50-point command penalty.
31. Immediate takeover, disconnection and command-efficiency effects belong to A08a. Conglomerate restrictions, daily degradation and ten-day recovery remain A08b.

### Rebalanced Power economy

32. Power Plant generation, Housing fixed demand, planetary support, Headquarters demand, Spaceport demand, Industry idle/variable demand and every facility-family demand use the exact approved Decision 27 tables and formulas.
33. Industry variable demand is based on staffed operational capacity; stopped Industry consumes no idle or variable Power.
34. Installed-generation extraction upgrade gates use the exact family-specific Decision 27c table and the same authoritative online-capacity calculation used by the Power network.
35. Power allocation order is Headquarters, planetary Housing/life support, Food/Fuel operations and their Industry support, Spaceport services, then commercial Industry and Build/Ore operations.
36. Ordinary consumers share shortages proportionally inside their band and scale throughput by delivered fraction; zero delivered Power produces zero output.
37. Headquarters and Spaceport binary requirements release unusable partial allocation to the next band.
38. An unpowered mine or other planetary facility produces and processes nothing, correcting the current extraction bypass.
39. The Spaceport requires its full 10 Power for trade, cargo, passenger/accommodation transfer and Engineering Ship services, but never blocks arrival or emergency departure.
40. Online generation burns Fuel against complete capacity using the deployed 0.10/0.085/0.070/0.050/0.035 intensity curve, regardless of lower demand.
41. Fuel shortage proportionally reduces available generation; no online plant means no generation and no Fuel burn.
42. Only beginning-of-day stored Fuel powers that day's generation; same-day production becomes available next day.

### Persistence, migration and presentation

43. Pre-A08a colonies migrate with handover complete; only subsequently founded colonies begin pending.
44. Existing saves immediately use the new curves at their saved speed without grace resources or grandfathered values.
45. Primary identity, handover and ship capability/crew/location state survive save/load and portfolio switching; derived allocation and efficiency are recomputed rather than duplicated.
46. The always-visible Power status exposes capacity, Fuel-limited generation, demand/delivery/shortage by band, Fuel burn/consumption and unused generation.
47. Headquarters and facility details expose Primary/expansion state, construction, required/reserved staff, required/delivered Power, command contribution, priority and operating factor.
48. Every rejection and warning names the precise missing or limiting condition and displays current versus required/projected values.

## Required behavioural regression coverage

- First colony and later-colony first departures: missing Primary, incomplete Primary, understaffed Primary, unpowered but otherwise eligible Primary, success, persisted completion and stale-assessment recheck.
- Exempt ship actions: unrelated freight ship, corporate-home launch, arrival/orbit and in-transit reroute.
- Primary selection, reassignment, demolition confirmation/cancellation and save/load.
- Deterministic Headquarters staff and Power priority with multiple levels, ties, shortages and portfolio switching.
- Command load/capacity, diminishing bonuses, overload curve, zero-capacity penalty and affected/excluded operations.
- Emergency takeover for eligible/ineligible, crewed/under-crewed and docked/non-docked ships, including removal on departure.
- Removal of ship Power, conditional founding-ship Industry and correct ship-resident exclusion from planetary consumption/workforce.
- Resident transfer: manual-only, Housing failure, Spaceport failure, zero generation, warned shortage confirm/cancel and authoritative projected values.
- Every approved generation/demand/facility/gate value at L1-L5.
- Priority-band allocation, proportional partial throughput, zero-Power production shutdown and binary Headquarters/Spaceport release behaviour.
- Full online-capacity Fuel burn, unused-capacity waste, Fuel shortage scaling, no-generator zero burn and next-day availability of same-day Fuel production.
- Existing-save migration at saved speed and new-colony pending handover.
- UI/domain ownership tests proving presentations consume structured domain assessments rather than duplicating formulas.
- Focused relevant test commands and the complete suite required by `AGENTS.md`.
- Package and visible application versions incremented together only during approved implementation.

## Implementation gate

No source code, gameplay values, tests or versions may be changed until the user explicitly approves this complete A08a specification. After approval, status changes to **Approved**, then to **In Progress** immediately before implementation. **Complete** requires implementation, focused and full-suite verification, save/migration coverage, version increments, documentation updates, commit and push on `feature/next-priority-items`.
