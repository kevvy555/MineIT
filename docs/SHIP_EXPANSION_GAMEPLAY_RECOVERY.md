# Ship Expansion Gameplay — Recovery Plan

Branch: `feature/ship-expansion-gameplay`  
Base: `develop`

## Current status

The original ShipExpansion gameplay batch is complete. The **Engineering Ship / Spaceport technology-delivery foundation**, **Scanning Resurvey / Buried Resources feature**, and the **full-screen Technology package/delivery presentation** for Progression Stage 8 are now implemented and validated.

Stage 8 itself remains **In Progress** because specialised player-designed freight ships, scalable ore transport and the wider logistics network are still future work.

Latest validated gameplay commit: `15c9a10d61174b941cd1a890f96fe04886f3b7c5`  
Passing GitHub Actions run: `33293193025`  
Passing job: `99208299634`

That exact-head run passed:

- full unit / regression / domain coverage suite;
- Engineering Ship / Spaceport / Mining-Scanning delivery regression;
- Scanning resurvey / buried-resource regression;
- save-v11 migration and realistic save round-trip, including extraction-site coverage repair;
- production-collapse game-log diagnostics regression;
- long simulation soak;
- browser startup and presentation interaction probes;
- mobile/coarse-pointer ship and Corporate Ship touch-target regression guards;
- full-screen Corporate Ship trade layout and non-collapsing resource-row regression guards;
- Technology package/category/detail/delivery presentation at the supported phone and landscape browser-probe viewports;
- true app-viewport Technology coverage with the game header, map toolbar, context bar and footer removed from layout while Technology is open and restored after close.

No PR or merge to `develop` has been performed.

---

## Canonical progression tracking

Top-level progression status is maintained in:

`docs/PLAYER_PROGRESSION_STAGES.md`

Current relevant state:

- Stages 1–7: **Complete**
- Stage 8 Logistics Bottleneck: **In Progress**
- Stages 9–22: **Not Started**

Stage 8 now has physical technology delivery, Spaceport berth handling, scanning/resurvey discovery, buried-resource land-use decisions and a complete mobile capability-purchasing presentation. It must not move to Complete until the specialised freight/logistics gameplay loop exists end-to-end.

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

A colony capability upgrade follows:

**AVAILABLE → ORDERED / SAME-DAY BATCH → PREPARING → IN TRANSIT → ORBITAL HOLDING OR LANDED → COMMISSIONING → ACTIVE → COMPLETE**

Key rules:

- Same-colony upgrades ordered on the same game day share one Engineering Deployment.
- A deployment spends **5 full game days preparing** before launch.
- The first upgrade pays its package price plus one fixed Engineering Ship transport price.
- Further same-day upgrades in that deployment pay only their individual package prices.
- There is no percentage discount on technology packages; batching savings are avoided transport charges.
- Pre-launch cancellation is supported; post-launch cancellation is not.
- Engineering Ship transport price is fixed for the current feature.
- Remote colonies outside normal Corporate Ship service radius remain valid Engineering Ship destinations.

Current provisional Engineering Ship transport balance constant: **£5,000**.

---

## Mining / Scanning split

Corporate capability contains separate Mining and Scanning paths:

- Mining: 10 levels — controls extraction capability.
- Scanning: 10 levels — controls discovery capability, survey effects and which natural resources can be detected.
- Combined Mining + Scanning package progression preserves the economic scale previously carried by the single Mining path.
- Existing old saves migrate Scanning from prior Mining level where absent.

The old unresolved-anomaly model has now been superseded by the completed Scanning Resurvey feature below.

---

## Corporate access vs colony-deployed capability

This distinction is canonical:

- `company.tech` = corporation-level authorised/highest capability context.
- `colony.tech` = capability physically commissioned and active at the current colony.

Operational systems use **deployed colony capability**, including Mining, Food, Housing, Power, Industry and Scanning.

A regression pass previously found `DevelopmentService` reading `state.company.tech` for Housing/Power/Industry building gates, which could activate a building upgrade before its Engineering Ship arrived. That was fixed in:

`de0314aec4a0dec8b88e00d91e7a0582e019e265` — `Gate local buildings on deployed colony technology`

---

## Engineering Deployment implementation

Core implementation commit:

`fee3f0929ca064093284b02aa308131e64320942` — `Implement engineering-delivered colony technology`

Canonical lifecycle ownership is in `TechnologyService`; daily progression is driven from simulation/day processing.

Persisted states include `batching`, `preparing`, `in-transit`, `orbital-holding`, `landed`, `commissioning`, `complete`, and `cancelled`.

Engineering specialists remain ship-based and do not consume colony population, Housing or player-ship passenger capacity.

---

## Spaceport foundation

A Basic Spaceport is persistent colony infrastructure at canonical tile `(0,0)`.

Shared berth accounting is owned by:

`js/domain/spaceport-model.js`

The same berth model counts:

- landed player colony ship;
- docked Corporate Ship;
- landed/commissioning Engineering Ships.

If no berth is available, arriving Corporate or Engineering Ships enter Orbital Holding rather than bypassing the Spaceport.

The Basic Spaceport is supplied as startup infrastructure and future freight ships must reuse this same berth model rather than create a second landing-capacity system.

---

# Scanning Resurvey / Buried Resources — Complete

Design and implementation source:

`docs/Progression Stages/Stage 8/ScanningResurveyAndBuriedResources.md`

This feature replaces the earlier behaviour where insufficient Scanning visibly produced an unresolved anomaly and therefore leaked that a resource existed.

## Discovery rules

- Every natural resource now has an explicit `scanningLevel` from L1–L10 based on **physical detectability in its natural location**, not Mining/extraction difficulty.
- Clearly visible biology and exposed materials are L1.
- Shallow beds/materials are L2.
- conventional buried seams/ore bodies are L3.
- deeper/weaker metallic and precious signatures are L4.
- deep fluid reservoirs are L5.
- specialist/high-value mineral signatures are L6.
- extreme-pressure deposits are L7.
- unusual deep-core deposits are L8.
- exotic matter/crystals are L9.
- Advanced Element Deposit is L10.
- Manufactured Synthetic Nutrient does not participate in natural discovery.

Canonical mapping is in `js/data/resources.js` and documented in the feature spec.

## No hidden-resource information leak

If the current scanner cannot detect the deterministic resource truth for a tile, the scan resolves as ordinary clear land / no deposit detected.

The player is **not** shown:

- a locked deposit;
- an unresolved anomaly;
- the hidden required Scanning level;
- any marker that distinguishes a genuinely empty tile from a richer tile beyond current detection.

World truth remains deterministic from the world seed. Rescanning never rerolls resource type, quality or deposit size.

## Scan history and resurvey

Each surveyed tile persists:

`lastScannedAtLevel`

A non-Spaceport tile is resurveyable when:

`lastScannedAtLevel < colony.tech.scanning`

Important anti-leak rule: **all** previously scanned eligible tiles become resurveyable after better Scanning is commissioned, including genuinely empty tiles.

The normal colony map shows a **yellow `?`** for a resurvey opportunity. No additional Scanning filter was added.

Tapping a resurveyable tile queues it through the existing survey queue/slot system.

Resurvey duration is **50% of the equivalent first-survey duration**, rounded to whole days with minimum 1 day.

## Developed-tile scanning

Housing, Industry and Power can be scanned/rescanned while continuing to operate.

If a better scan discovers a resource underneath one of those buildings:

- the building remains in place and operational;
- the deterministic resource becomes permanently known;
- `resourceCovered` marks exploitation as blocked by the development;
- normal demolition removes the building and exposes the same known resource;
- no resource reroll occurs.

Known resources may also deliberately be built over with Housing, Industry or Power. Building over a known Food/resource tile no longer destroys the resource truth.

The existing building details communicate `RESOURCE COVERED` and the map keeps the building as the primary visual with a secondary resource indicator.

The Basic Spaceport remains excluded until relocation/resurvey rules are designed.

## Save v11 migration

Runtime save schema is now **v11**.

Migration preserves existing games by:

- maintaining the earlier Mining→Scanning technology migration where needed;
- maintaining colony-deployed capability state;
- adding/preserving `lastScannedAtLevel` for existing surveyed tiles;
- converting old unresolved-anomaly tiles into ordinary completed clear scans at the colony's deployed Scanning level so old saves do not leak hidden-resource locations;
- removing obsolete per-tile legacy hidden-deep/anomaly fields;
- preserving known resources beneath normal buildings;
- marking a known resource as `resourceCovered` only when the occupying development is a non-extraction building;
- explicitly clearing `resourceCovered` from `development.kind === "extract"` sites, which also repairs already-affected v11 saves on load;
- preserving active survey Scanning level through save/load;
- retaining Engineering Deployment and Basic Spaceport state.

Primary coverage is in `tests/technology-delivery.test.js`, `tests/save-roundtrip.test.js`, and `tests/map-first-ux.test.js`.

---

## Scanning v11 extraction-coverage production regression — fixed

A real game log exported at Y3 D225 exposed a severe regression introduced with the buried-resource Scanning/save-v11 work.

Observed failure chain:

- the colony still had healthy Food/Fuel/Ore production and large stocks near the end of Year 2;
- after the affected state was normalized, all developed extraction sites remained present but production fell to zero;
- Food then reached zero, which correctly removed normal workforce under the survival rules;
- with extraction already disabled, the colony could not recover Food and the 30-day starvation mortality sequence began;
- population eventually reached zero and the colony was lost.

Root cause was in `normalizeSurveyHistory()` in `js/domain/game-state-runtime.js`. The migration previously treated **any** tile with both `resourceId` and `development` as a resource covered by another development. Extraction facilities themselves are represented by `development.kind === "extract"`, so working farms/mines/quarries/fuel sites were incorrectly changed to `resourceCovered=true`. `ResourceService.collectionRate()` intentionally returns zero for a covered resource, so this disabled the entire extraction economy.

Canonical invariant now preserved:

- `development.kind === "extract"` => `resourceCovered=false`;
- a known resource beneath Housing/Industry/Power => `resourceCovered=true`;
- no development => stale coverage is cleared.

The normalization fix is deliberately reparative: loading an existing v11 save that contains the erroneous flag clears it from extraction sites automatically. It does **not** resurrect a colony whose population has already reached zero; a pre-collapse save can recover when loaded under the fixed build.

Fix/regression commits:

- `4106815300c56ff265e8786254db6e1cd8d3baf3` — `Fix scanning migration covering extraction sites`
- `1bd49141de0d3a4e27b60c80c454b157e3dafbd0` — `Protect extraction sites from scanning coverage migration`
- `0eaf1500b8321a12ea05159d594a42bca5efdaa8` — `Add production-collapse diagnostics to game logs`
- `15c9a10d61174b941cd1a890f96fe04886f3b7c5` — `Protect game-log production-collapse diagnostics`

Game-log colony snapshots now also include:

- `extractionSites`;
- `coveredExtractionSites`;
- `coveredResourceSites`;
- `productionStoppedSites`;
- `foodStarvationDays`;
- `emergencyMode`;
- `tradeReserve`.

Those fields make a future “sites exist but production is zero” report directly distinguish resource coverage, manual production stops and starvation state without relying on inference from aggregate production values.

Exact fixed gameplay-head validation:

- Commit: `15c9a10d61174b941cd1a890f96fe04886f3b7c5`
- Workflow run: `33293193025`
- Job: `99208299634`
- Unit / regression / domain coverage: **SUCCESS**
- Browser startup / presentation interaction: **SUCCESS**

---

## Mobile touchscreen reliability fix

A pre-existing Android/touchscreen issue caused ship-panel buttons and Corporate Ship colonist controls to sometimes require many taps.

The fix keeps browser-standard semantic `click` handling and does not add parallel `touchstart`/`pointerdown` action handlers.

Implemented:

- all buttons use `touch-action: manipulation`;
- coarse-pointer devices get minimum 44px targets for Player Ship, ship-preparation, Star Map, Corporate Ship and Spaceport actions;
- Corporate Ship colonist +/- controls use 44px columns/targets;
- compact layouts cannot shrink those mobile targets below the minimum.

Commits:

- `ef1d920a53810b8f4d144b88f06860bc9e1958b4` — `Improve mobile tap reliability for ship controls`
- `eb4e362ae83c16c2e81cf3dcc5af9f0d1cab6f88` — `Protect coarse-pointer ship touch targets`

---

## Corporate Trade Ship full-screen layout fix

The Corporate Trade Ship is a full-screen mobile workflow after a real-phone screenshot showed resource BUY rows collapsing/overlapping in the former partial-height modal.

Preserved rules:

- dynamic mobile viewport (`100dvh`) with safe-area padding;
- trade shell owns available vertical space;
- buy/sell rows have a 48px minimum height;
- constrained screens scroll the resource-list region instead of collapsing rows;
- mobile action columns preserve 44px touch targets.

Commits:

- `0c22baf6f6476420f6411618ea75144658b6de9c` — `Make corporate trade ship full screen`
- `b66039806bc2eb0fbdde6bcfef8c3ebfdb21e40b` — `Protect full-screen corporate trade layout`

---

## Full-screen Technology package workspace

The former vertically stacked technology roadmap has been replaced by the approved single-screen mobile design.

Presentation rules now preserved:

- Technology is a true full-screen workflow with no outer technology-page vertical scrolling at supported mobile viewports.
- All six capability paths remain visible as compact selectors: Housing, Power, Food, Industry, Mining and Scanning.
- Each category selector shows the colony's currently deployed capability level.
- The selected path shows compact L1–L5 or L1–L10 level selectors with visually distinct owned/current/next/future/ordered states.
- Only the selected technology level uses the main detail workspace, avoiding a long stack of repeated cards.
- The detail area shows the complete gameplay effect for the selected capability, including relevant capacity, efficiency, extraction, detection, survey-slot, scan-speed and resurvey effects.
- The package presentation explains that the purchase is a physical colony capability deployment rather than ownership of conglomerate intellectual property.
- Every package explains the real-world-style contents appropriate to its category, such as machinery/sensors, specialist tooling or calibration equipment, control/analysis systems, commissioning engineers, training/certification and initial specialist spares or consumables.
- The component cost allocation is **presentation/explanation only**. It always sums back to the canonical `tech.cost`; `TechnologyService` remains the authoritative owner of package price, transport charge and order behavior.
- The cost panel shows component allocations, package subtotal, Engineering Ship transport, shared-transport saving when applicable and the actual amount charged if ordered now.
- Same-day batching still uses the canonical Engineering Deployment order; the UI does not invent a parallel discount or purchase model.
- The bottom Engineering Ship delivery ledger shows **all persisted deployments**, including completed/cancelled history as well as active deliveries.
- Each delivery row shows a stable presentation order number, included upgrades and their package prices, order date, package subtotal, ship transport, lifecycle status and net paid amount.
- Pre-launch deployments retain the canonical Cancel action; post-launch/history rows cannot be cancelled.
- Package/cost/delivery regions may scroll internally on constrained screens while the overall Technology workflow remains bounded to the viewport.
- Category, order and close controls preserve mobile/coarse-pointer touch sizing.

A real Android screenshot exposed that the first implementation only filled `#overlayRoot`, which itself was bounded to the map region. That left the HUD, map toolbar, context bar and footer visible and reduced the vertical space available to the approved mockup. The canonical fix makes Technology an **app-level** full-screen workflow while it is open:

- the app header/HUD, map toolbar, context bar and footer are removed from layout;
- `#worldShell` expands to the full `100dvh` app area;
- `#overlayRoot` expands from the map-only region to the full world shell;
- closing Technology restores all normal game chrome automatically;
- the mobile browser probe compares the Technology screen rectangle against the full `#app` rectangle and fails if any game chrome remains visible.

Implementation/presentation commits:

- `2883e9d77cd0f0ba245a04d2f3df3a1b6b39ee3b` — `Implement full-screen technology package presentation`
- `d60cf41920d84fd3067974832fac25f0be91cfda` — `Replace technology roadmap with full-screen package workspace`
- `75607bbb05524c9038ddbd4dc22467b5236e3304` — `Style technology as full-screen package workspace`
- `d6e6b887f06592b12961aee721141986160c71ac` — `Protect full-screen technology package presentation`
- `126f3644142868057048beff457894521838883b` — `Exercise full-screen technology layout on mobile viewports`
- `f24bf9fc84ff3edce643290dbe2a048abbb7f17d`, `277be1cd2af3d6d7ac6e6355269aa69d9742870d`, `099237fbff4f9158af0a6c79ccc7ab7da72e6218` — compatibility guards updated to protect the new presentation rather than obsolete roadmap markup.
- `079b752834eb2551b48000362589b4f8eb1ded2f` — `Make technology workspace app fullscreen`
- `0fd0613293e7ad384f2489efe6615a0180127978` — `Protect true fullscreen technology viewport`

Exact gameplay-head validation:

- Commit: `0fd0613293e7ad384f2489efe6615a0180127978`
- Workflow run: `33274594553`
- Job: `99158988423`
- Unit / regression / domain coverage: **SUCCESS**
- Browser startup / presentation interaction: **SUCCESS**

---

## Validation state

Passing exact gameplay head before this documentation refresh:

- Commit: `15c9a10d61174b941cd1a890f96fe04886f3b7c5`
- Workflow run: `33293193025`
- Job: `99208299634`
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
- [x] Mining/Scanning split and deployed capability gates;
- [x] explicit L1–L10 resource Scanning detection mapping;
- [x] insufficient scans do not reveal hidden deposit existence/required level;
- [x] truly empty and secretly richer tiles both become resurveyable after a Scanning upgrade;
- [x] yellow `?` resurvey marker on the normal map with no new filter;
- [x] 50%-duration resurvey through existing queue/slots;
- [x] Housing/Industry/Power resurvey while operating;
- [x] buried known resource remains blocked under development until normal demolition;
- [x] known resources can deliberately be built over without erasing resource truth;
- [x] extraction developments can never be normalized into `resourceCovered` state;
- [x] already-affected v11 extraction coverage flags repair automatically on load;
- [x] game logs expose extraction/coverage/starvation/trade-reserve production-collapse diagnostics;
- [x] Spaceport excluded from buried-resource/resurvey decisions;
- [x] save-v11 migration and realistic save round-trip;
- [x] legacy unresolved anomalies migrate without information leakage;
- [x] original ShipExpansion capacity/reroute/new-colony transfer rules;
- [x] mobile touch target policy;
- [x] full-screen Corporate Trade Ship workflow;
- [x] non-collapsing/scrollable buy and sell rows on constrained viewports;
- [x] full-screen six-category Technology selector and compact L1–L5/L1–L10 progression;
- [x] selected Technology package gameplay effects and physical-package explanation;
- [x] package component cost breakdown tied back to canonical `tech.cost`;
- [x] Engineering Ship transport/shared-saving/amount-charged presentation;
- [x] active and historical Engineering Ship delivery ledger;
- [x] Technology workspace fills the complete app viewport rather than only the map overlay region;
- [x] app header/HUD, map toolbar, context bar and footer are hidden while Technology is open and restored after close;
- [x] full-screen Technology outer-scroll and category interaction checks across mobile/landscape browser viewports;
- [x] long simulation soak;
- [x] browser startup and presentation interaction tests.

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
The intended economic pressure remains:

**Production Rate → Transport Capacity → Buyer Demand**

There should be no permanent hard ceiling on profit. Expansion should move the current constraint rather than create a final fixed capacity limit.

---

## Recovery / handoff

If another chat/session resumes this work:

1. start from the head of `feature/ship-expansion-gameplay`;
2. read this file;
3. read `docs/PLAYER_PROGRESSION_STAGES.md`;
4. read `docs/Progression Stages/Stage 8/EngineeringShipAndSpaceport.md`;
5. read `docs/Progression Stages/Stage 8/ScanningResurveyAndBuriedResources.md`;
6. preserve `TechnologyService` as canonical owner of capability deployment, package prices, batching, lifecycle and cancellation;
7. preserve the full-screen Technology workspace as a presentation over `TechnologyService` rather than adding a second technology-purchase model;
8. preserve Technology as an app-level full-screen workflow: while open it must replace the normal HUD/map-toolbar/context/footer layout rather than merely fill `#overlayRoot`'s normal map bounds;
9. treat Technology component cost allocations as explanatory presentation values that must sum to canonical `tech.cost`, not as separate domain prices;
10. preserve the Engineering Ship delivery ledger as a view of persisted deployment history, including completed/cancelled deliveries;
11. preserve `spaceport-model.js` as canonical berth accounting;
12. keep operational technology gates on `colony.tech`, not `company.tech`;
13. preserve `lastScannedAtLevel` as canonical scan-history input and derive resurvey eligibility rather than storing a UI flag;
14. never make the yellow resurvey marker conditional on hidden resource presence;
15. preserve deterministic resource truth across scans, building coverage and demolition;
16. preserve the coverage invariant: extraction developments are never `resourceCovered`; only a separate non-extraction development may cover a known resource;
17. keep the production-collapse diagnostic fields in exported game logs so future site/production failures remain diagnosable from a single export;
18. preserve standard `click` activation for buttons and the coarse-pointer target policy;
19. preserve Corporate Trade Ship as a full-screen workflow with scrollable resource rows;
20. keep Stage 8 **In Progress** until specialised freight/logistics is playable end-to-end;
21. update this recovery file and progression tracker whenever meaningful Stage 8 progress is committed.

No PR or merge should be created automatically without an explicit user request.