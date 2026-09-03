# N05 — Ship-to-Colony Establishment Transition

**Progression stage:** 1 — Initial Survival  
**Type:** Bug fix and establishment-system alignment  
**Status:** Complete  
**Related items:** [A06](../Stage%206/A06-Emergency-Colony-Ship-Food.md), [A07](../Stage%206/A07-Ship-Accommodation-Allocation.md), [A08a](../Stage%206/A08a-Operational-Headquarters-Departure-Gate.md)

## Original report

> On starting a new game its impossible to get the colony going as people just start dying after 30 days no matter what i do, can you check the logic of how the initial 3 months play out and identify any bugs or things we need to tune to get the game to work again.

## Diagnosis

- All 120 initial colonists are assigned to founding-ship accommodation.
- The old starter state placed Food in colony inventory while the occupied ship had no Food.
- Ship residents consume ship Food, so they starved from day one despite the colony HUD presenting planetary Food as safe.
- The 30-day starvation grace then caused the reported deaths around day 31.
- Starter Fuel, crew and the HUD also failed to present a coherent ship-supported establishment phase.

## Approved behaviour

### Establishment model

- Apply this model to Colony 01 and every later colony founded by a player ship. Leave the direct non-ship legacy contract path unchanged.
- Establishment is derived per subsystem rather than represented by a single global switch. Residents, Food, Fuel, storage, Power, Industry and command may move at different times.
- Ship and colony inventories remain separate. Each population consumes from its own inventory, transfers are explicit, and A06 emergency Food approval remains the only cross-inventory consumption exception.
- Ship residents are excluded from planetary Power demand and colony workforce until explicitly moved ashore.
- Ship Power is self-contained. It supplies no colony Power.
- The docked founding ship supplies its own self-powered 50 Industry contribution to colony operations. Built planetary facilities still require colony Power.

### Founding state

- Colony 01 starts with 120 residents assigned to founding-ship accommodation and the ship's required 10 crew.
- All starter stock begins aboard that ship: 1,300 Food, 675 Fuel, 520 Build and 260 Ore. Colony inventory begins empty.
- Later expedition founding preserves the loaded ship manifest and crew. Passengers become colony residents assigned to that ship; crew remain ship crew and are not colony population.
- Before first command handover, the docked founding ship may unload Food, Fuel, Build and Ore without powered Spaceport infrastructure. This bootstrap exception is outbound only.
- Existing developed saves retain their allocations. Clearly pristine or at-risk pre-N05 Colony 01 saves receive enough ship Food and crew to avoid continuing the day-31 failure.

### Establishment guidance

- Landing a ship-founded colony pauses time and presents a one-time establishment panel.
- `BEGIN OPERATIONS` acknowledges the panel and starts time at 1×. Starting time before acknowledgement reopens it.
- The panel presents live, non-blocking guidance to:
  1. deploy Build and Fuel;
  2. survey buildable land;
  3. construct external Power and Housing;
  4. move a chosen number of residents ashore;
  5. establish Food and Fuel production/runway;
  6. replace ship-supported Industry;
  7. establish an operational Primary Headquarters before releasing the founding ship.
- Each subsystem is labelled `SHIP`, `HYBRID`, `COLONY` or `READY`. Survival alerts take precedence over checklist prompts.
- Existing Ship Preparation transfer controls remain the canonical transfer surface and must explain which consumers use ship versus colony stock.

## Approved dual HUD

The approved and authoritative visual implementation reference is:

**[N05 dual HUD flow mock](./N05-Dual-HUD-Flow-Mockup.html)**

The production HUD must follow that mock's stacked layout, field order, information density, S/C labels, days chips, responsive compactness, tint rules and represented establishment states. It is an acceptance reference, not merely an illustrative concept.

- Every operational and resource card simultaneously shows `S` then `C` rows while the relevant player ship is docked. The `S` row collapses when no player ship is docked.
- Resource rows preserve the current compact encoding: `stock +production −use S±surplus`, plus `∞d`, `0d` or remaining days.
- Colony resource rows are green when increasing/stable and red when declining.
- Ship resource rows are green while runway is at least 10 days (or there is no drain) and red below 10 days.
- The card shell stays neutral so opposing ship and colony states remain simultaneously visible.
- Operational rows retain good/warn/bad text-state encoding:
  - Housing: ship and planetary occupancy/capacity.
  - Power: ship `SELF` and colony delivered/available/requested Power.
  - Industry: ship contribution and built/effective colony Industry.
  - Workforce: ship crew and free planetary workforce.
- During establishment the HUD prefers the founding ship. Afterwards it uses the locally selected docked ship.
- Safety checks inspect all occupied ships and warn from the shortest Food runway.

## Warning thresholds

- At 30 ship-Food days, show a scoped attention warning.
- Below 10 days, show the ship row red, pause once and present the critical panel.
- At zero Food, show the starvation-grace countdown.
- After the grace period, show deaths active.
- Never allow safe colony Food presentation to conceal an occupied starving ship.

## Acceptance criteria

1. A real new Colony 01 survives at least 90 days when following the ship-supported establishment path.
2. Starter and expedition manifests conserve every Food, Fuel, Build and Ore unit across explicit transfers.
3. Crew and passengers retain distinct ownership and capacities.
4. Ship Industry is additive while docked, self-powered and removed on departure.
5. Planetary facilities remain disabled at zero colony Power.
6. Bootstrap unloading works before Spaceport Power; reverse and ordinary visiting-ship transfers remain gated.
7. Save/load preserves manifests, accommodation, crew, establishment acknowledgement and command handover.
8. The production HUD matches the approved mock in all-aboard, hybrid, ship-Food-critical and independent states.
9. Resource rows expose stock, production, use, surplus direction and runway without opening another surface.
10. Mobile browser coverage verifies the establishment panel, transfer path, dual HUD and Headquarters handover.

## Explicitly deferred

- Nutritional quality and calorie redesign remain A03a/A03b.
- Separate spacecraft propellant/fusion tanks remain A22b.
- Timed construction remains A05a.
