# Ship Expansion Gameplay — Recovery Plan

Branch: `feature/ship-expansion-gameplay`  
Base: `develop`

## Current status

The original ShipExpansion gameplay batch is complete and the **Engineering Ship / Spaceport technology-delivery foundation for Progression Stage 8 is now implemented and validated**.

Stage 8 itself remains **In Progress** because specialised player-designed freight ships, scalable ore transport and the wider logistics network are still future work.

Latest gameplay-validation commit: `b66039806bc2eb0fbdde6bcfef8c3ebfdb21e40b`  
Passing GitHub Actions run: `33263915459`  
Passing job: `99130442966`

That exact-head run passed:

- full unit / regression / domain coverage suite;
- Engineering Ship / Spaceport / Mining-Scanning delivery regression;
- save-v10 migration and realistic save round-trip;
- long simulation soak;
- browser startup and presentation interaction probes;
- mobile/coarse-pointer ship and Corporate Ship touch-target regression guards;
- full-screen Corporate Ship trade layout and non-collapsing resource-row regression guards.

No PR or merge to `develop` has been performed.

---

## Canonical progression tracking

Top-level progression status is maintained in:

`docs/PLAYER_PROGRESSION_STAGES.md`

Current relevant state:

- Stages 1–7: **Complete**
- Stage 8 Logistics Bottleneck: **In Progress**
- Stages 9–22: **Not Started**

Stage 8 now has its physical technology/logistics-support foundation, but must not move to Complete until the specialised freight/logistics gameplay loop exists end-to-end.

---

## Original ShipExpansion rules already complete

- Player colony-establishment ship total physical capacity: 12,000.
  - 8,000 general hold.
  - 2,000 dedicated Food store.
  - 2,000 dedicated Fuel tank.
- Food may also occupy the general hold and supplements transit Food.
- Minimum 10 colonists before launch/interstellar continuation.
- Mid-transit reroute uses the live interpolated position; consumed supplies remain consumed and the new route must be supportable by remaining Food/Fuel.
- One colony-wide stock reserve amount applies to every resource.
- Zero Food immediately removes workforce; Food mortality begins only after 30 complete zero-Food days.
- Natural population growth is disabled; population increases only through explicit mechanics.
- Corporate colonist MAX SAFE is a convenience control; manual transfer remains allowed within hard housing/power/passenger/cash constraints.
- At least two frontier systems are generated inside Corporate Ship service range.
- Stop Production removes the relevant output, inputs, workforce and operational loads; Start Production resumes them.
- Sole-colony contract failure with an unaffordable extension produces corporation failure rather than a stuck deadline state.
- Full-screen corporation-failed report exists.
- Critical Food/Fuel warnings exist at <=10 days.
- Housing / Industry / Power building-only map filters exist.
- Ship preparation supports loading and decrement/unloading controls for cargo, Food, Fuel and colonists.
- Persistent Star Map footer action exists.
- In-transit ship is selected and rerouted through the Star Map.
- New-colony founding transfers all remaining cargo, dedicated Food, dedicated Fuel and passengers into the new colony.
- Temporary parallel `ship-gameplay-extension.js` was removed; canonical controllers own the behavior.

---

# Engineering Ship / Spaceport Foundation

Design source:

`docs/Progression Stages/Stage 8/EngineeringShipAndSpaceport.md`

Final design-rules commit:

`d06e61c13560616839652025874181ece5aa5d21` — `Finalize engineering ship dispatch and pricing rules`

## Locked delivery rules

Technology is no longer an abstract instant activation at the target colony.

A colony capability upgrade now follows this physical lifecycle:

**AVAILABLE → ORDERED / SAME-DAY BATCH → PREPARING → IN TRANSIT → ORBITAL HOLDING OR LANDED → COMMISSIONING → ACTIVE → COMPLETE**

Key rules:

- Same-colony upgrades ordered on the same game day share one Engineering Deployment.
- A deployment spends **5 full game days preparing** before launch.
- The first upgrade in a deployment pays:
  - its individual package price;
  - one fixed Engineering Ship transport price.
- Further same-day upgrades in that deployment pay only their individual package price.
- There is no percentage discount on technology packages.
- Batching savings come solely from avoiding additional Engineering Ship transport charges.
- Pre-launch cancellation is supported throughout preparation.
- Post-launch cancellation is not supported.
- Engineering Ship transport price is fixed for the current feature rather than distance-based.
- Remote colonies outside normal Corporate Ship service radius remain valid Engineering Ship destinations.
- Exact transport-price value, Engineering Ship travel-speed formula, commissioning duration and future berth classes remain balance constants/deferred design rather than hard gameplay architecture.

Current provisional balance constant for Engineering Ship transport: **£5,000**.

---

## Mining / Scanning split

Corporate capability now contains separate Mining and Scanning paths.

- Mining: 10 levels.
- Scanning: 10 levels.
- Combined Mining + Scanning package progression preserves the economic scale previously carried by the single Mining path.
- Existing saves migrate Scanning from their prior Mining level.
- Existing contract/planet Scanning requirements migrate from their prior Mining requirement where absent.

Scanning now controls discovery fidelity independently from Mining exploitation capability.

Higher-tier resources may appear as unresolved anomalies when colony Scanning is insufficient. Once the required Scanning capability is physically deployed, the tile can be surveyed again and resolves to the same deterministic hidden resource.

---

## Corporate access vs colony-deployed capability

This distinction is now canonical and important:

- `company.tech` = corporation-level authorised/highest capability context.
- `colony.tech` = capability physically commissioned and active at the current colony.

Operational systems must use **deployed colony capability**, not merely corporate access.

This is enforced for:

- Mining/extraction capability;
- Food production capability;
- Housing building upgrades;
- Power building upgrades;
- Industry building upgrades;
- Scanning/discovery capability;
- local operational technology effects.

Corporate access remains appropriate for corporation-level eligibility such as expansion/prospect requirements where the corporation is deciding whether it has access to the required package.

### Important bug found during implementation

A regression pass found that `DevelopmentService` was still reading `state.company.tech` for Housing/Power/Industry building gates. This meant purchasing/authorising a package could unlock a local building before its Engineering Ship physically arrived.

Fixed in:

`de0314aec4a0dec8b88e00d91e7a0582e019e265` — `Gate local buildings on deployed colony technology`

`DevelopmentService` now reads `state.colony.tech`, and regression coverage proves company access alone does not activate local building upgrades.

---

## Engineering Deployment implementation

Core implementation commit:

`fee3f0929ca064093284b02aa308131e64320942` — `Implement engineering-delivered colony technology`

Canonical lifecycle ownership lives in `TechnologyService` and daily progression is driven from the simulation/day-processing path.

Persisted deployment states include:

- `batching`
- `preparing`
- `in-transit`
- `orbital-holding`
- `landed`
- `commissioning`
- `complete`
- `cancelled`

Deployment records preserve the upgrade packages, costs, timing and lifecycle state through save/load.

Engineering specialists remain ship-based:

- they do not join colony population;
- they do not consume colony Housing;
- they do not consume player-ship passenger capacity.

---

## Spaceport foundation

A Basic Spaceport is now persistent colony infrastructure at canonical tile `(0,0)`.

Shared berth accounting is owned by:

`js/domain/spaceport-model.js`

The same berth model counts:

- landed player colony ship;
- docked Corporate Ship;
- landed/commissioning Engineering Ships.

If no berth is available:

- an arriving Engineering Ship enters Orbital Holding;
- an arriving Corporate Ship enters Orbital Holding rather than bypassing the Spaceport.

The Basic Spaceport state is added during save-v10 migration without resetting existing colony progress.

The player-ship presentation now identifies the persistent Spaceport even when the player ship is elsewhere, and the landed player-ship menu exposes the Spaceport berth/orbital-holding panel.

Future freight ships should reuse this same berth model rather than adding a second landing-capacity system.

---

## Save migration

Runtime save schema is now **v10**.

Migration preserves existing games by:

- adding `scanning` from previous Mining level when missing;
- giving existing colonies deployed capability equivalent to their prior technology state;
- migrating missing Scanning requirements from Mining requirements;
- adding Basic Spaceport state;
- preserving Engineering Deployment lifecycle state through round-trip serialization.

Relevant save/regression coverage includes `tests/save-roundtrip.test.js` and `tests/technology-delivery.test.js`.

---

## Presentation work

Engineering Ship / Scanning presentation commit:

`bf4c6d1d89546e8917947de649b25548733c5a38` — `Add Engineering Ship and Scanning presentation`

Implemented presentation includes:

- separate Scanning technology path;
- deployed/current/ordered capability states;
- Engineering Deployment list;
- included upgrade packages;
- package subtotal;
- fixed Engineering Ship transport cost;
- paid total;
- shared-transport saving;
- preparation/transit/orbital-holding/commissioning state;
- pre-launch cancellation action;
- unresolved-anomaly Scanning requirement and re-survey path;
- Spaceport berth/landed/orbital-holding panel.

Spaceport/player-ship navigation polish is covered by:

`1da0182adfb76682cced262921f7f399f142e7c0` — `Protect Spaceport player ship navigation`

---

## Mobile touchscreen reliability fix

A pre-existing Android/touchscreen issue was reported where ship-panel buttons and Corporate Ship colonist controls sometimes required many taps before a click registered.

The affected controls were using normal browser `click` handlers correctly, but several touch targets were only around 25–38px high and were embedded in touch-scrollable panels. Small involuntary finger movement can therefore be interpreted as scrolling rather than activation, cancelling the click.

The fix deliberately keeps standard semantic button/click behaviour rather than introducing `touchstart` or `pointerdown` action handlers that could double-fire or conflict with gestures.

Implemented changes:

- all buttons opt into `touch-action: manipulation`;
- coarse-pointer devices receive minimum 44px targets for Player Ship, ship-preparation, Star Map, Corporate Ship and Spaceport actions;
- Corporate Ship colonist +/- controls use 44px columns and 44px minimum button dimensions;
- compact ship CSS cannot shrink these coarse-pointer targets below the mobile minimum because the touch-target rule is explicitly authoritative;
- regression guards in `tests/map-first-ux.test.js` protect the shared tap policy and Corporate Ship colonist target sizing.

Implementation commits:

- `ef1d920a53810b8f4d144b88f06860bc9e1958b4` — `Improve mobile tap reliability for ship controls`
- `eb4e362ae83c16c2e81cf3dcc5af9f0d1cab6f88` — `Protect coarse-pointer ship touch targets`

---

## Corporate Trade Ship full-screen layout fix

A real-phone screenshot showed the Corporate Trade Ship buy screen rendering inside a partial-height modal. With the new 44px touch targets, the available vertical space was too small and the four buy rows collapsed, causing resource labels and BUY controls to overlap.

The Corporate Trade Ship presentation is now explicitly a **full-screen workflow**, matching the Player Ship/Star Map philosophy.

Implemented in:

- `0c22baf6f6476420f6411618ea75144658b6de9c` — `Make corporate trade ship full screen`
- `b66039806bc2eb0fbdde6bcfef8c3ebfdb21e40b` — `Protect full-screen corporate trade layout`

Layout rules now preserved:

- Corporate Trade Ship fills the dynamic mobile viewport (`100dvh`) with safe-area padding;
- modal border/radius are removed for the full-screen workflow;
- the trade shell owns all available vertical space;
- buy/sell resource lists have a 48px minimum row height;
- resource lists scroll internally when a short viewport cannot display all four rows;
- rows are no longer allowed to shrink to zero and visually overlap;
- mobile resource action columns are widened slightly while retaining the 44px coarse-pointer target policy.

Exact-head validation:

- Commit: `b66039806bc2eb0fbdde6bcfef8c3ebfdb21e40b`
- Workflow run: `33263915459`
- Job: `99130442966`
- Unit / regression / domain coverage: **SUCCESS**
- Browser startup / presentation interaction: **SUCCESS**

---

## Validation state

Passing exact gameplay head before this documentation refresh:

- Commit: `b66039806bc2eb0fbdde6bcfef8c3ebfdb21e40b`
- Workflow run: `33263915459`
- Job: `99130442966`
- Result: **SUCCESS**

Validated:

- [x] architecture baseline and ownership guards;
- [x] controller mutation-boundary guards;
- [x] zero versioned-JS/query-import/large-template architecture debt;
- [x] CSS ownership/orphan checks;
- [x] Engineering Ship five-day preparation;
- [x] fixed transport + package pricing;
- [x] same-day batching and shared-transport saving;
- [x] pre-launch cancellation and post-launch lockout;
- [x] Engineering Ship orbital holding and berth release;
- [x] Corporate Ship orbital holding through the same Spaceport model;
- [x] commissioning before capability activation;
- [x] specialists do not consume population/Housing;
- [x] Mining/Scanning split and migrated economic guards;
- [x] unresolved-resource re-survey after Scanning deployment;
- [x] local buildings require deployed colony technology;
- [x] save-v10 migration and realistic save round-trip;
- [x] original ShipExpansion capacity/reroute/new-colony transfer rules;
- [x] coarse-pointer ship and Corporate Ship control sizing/touch policy;
- [x] full-screen Corporate Trade Ship workflow;
- [x] non-collapsing/scrollable buy and sell rows on constrained viewports;
- [x] long simulation soak;
- [x] browser startup;
- [x] browser/presentation interaction tests.

---

## Next logical Stage 8 work

Do **not** redesign the colony-establishment ship into an ore hauler.

The next major gameplay loop is the actual logistics bottleneck solution:

1. player-designed/built freight ships;
2. ship size/hull and cargo capacity choices;
3. engines/range/Fuel/speed trade-offs;
4. freight operating/build costs;
5. scalable ore/resource hauling independent of the Corporate Ship;
6. routes between colonies, buyers and future logistics hubs;
7. later planets/moons/stations as refuelling/storage/transfer hubs;
8. eventual buyer/contract/refining systems described in Progression Stages 9–12.

The intended economic pressure remains a rotating bottleneck:

**Production Rate → Transport Capacity → Buyer Demand**

There should be no permanent hard ceiling on profit. Expansion should move the current constraint rather than create a final fixed capacity limit.

---

## Recovery / handoff

If another chat/session resumes this work:

1. start from the head of `feature/ship-expansion-gameplay`;
2. read this file;
3. read `docs/PLAYER_PROGRESSION_STAGES.md`;
4. read `docs/Progression Stages/Stage 8/EngineeringShipAndSpaceport.md`;
5. preserve `TechnologyService` as canonical owner of capability deployment;
6. preserve `spaceport-model.js` as canonical berth accounting;
7. keep operational technology gates on `colony.tech`, not `company.tech`;
8. preserve standard `click` activation for buttons; use coarse-pointer sizing/touch CSS rather than parallel touch handlers;
9. preserve Corporate Trade Ship as a full-screen workflow and let resource rows scroll instead of collapsing;
10. keep Stage 8 **In Progress** until specialised freight/logistics is playable end-to-end;
11. update this recovery file and the progression tracker whenever meaningful Stage 8 progress is committed.

No PR or merge should be created automatically without an explicit user request.
