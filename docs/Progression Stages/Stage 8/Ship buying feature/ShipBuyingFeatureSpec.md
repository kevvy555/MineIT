# Stage 8 — Ship Buying Feature

Status: **Draft specification / architecture analysis — no production implementation yet**  
Date: **2026-08-31**  
Game repository: `kevvy555/MineIT`  
Canonical universe repository: `kevvy555/MineIT-Universe`

## 1. Purpose

Add a factory-new ship purchasing system to MineIT Mobile so the player can expand from the original colony ship into a real fleet before reaching the much later ship-construction capability.

The first player journey is:

**Ship Market → Manufacturer → Models → Ship Details / Comparison → Buy → Player Fleet**

This feature consumes the canonical Year-5326 factory-new ship catalogue owned by `MineIT-Universe`. MineIT owns the player's cash, purchase transaction, ship instance, operational state, delivery/availability state and all per-save gameplay state.

The initial implementation is **manufacturer-direct factory-new ships only**.

Explicitly out of scope for the first implementation:

- used ships;
- auctions;
- damaged ships;
- finance / loans;
- trade-ins;
- dynamic market pricing;
- reputation discounts;
- shortages;
- insurance;
- speculative ship-construction gameplay.

For the initial feature:

**player purchase price = canonical manufacturer list price.**

---

## 2. Existing Stage 8 Design This Must Extend

`EngineeringShipAndSpaceport.md` already establishes the Spaceport as the shared physical arrival/departure point for:

- the player's colony ship;
- the ordinary Corporate Ship;
- Engineering Ships;
- future player cargo/freight ships;
- future third-party ships.

It also establishes reusable **Orbital Holding** behaviour when a ship cannot currently obtain a compatible berth.

The document deliberately deferred berth size/capability rules until the wider freight/player-ship design existed. This ship-buying feature is now the feature that makes those deferred decisions relevant.

The new implementation must therefore extend the existing Spaceport model rather than create a separate ship-market docking system.

---

## 3. Current MineIT Ship Architecture — Findings

### 3.1 Canonical state owner

The current authoritative player-ship implementation is `js/domain/expansion-service.js`.

`GameStore` remains the mutable root-state owner. `ExpansionService` owns the gameplay rules and mutation for the player ship.

Current persisted ownership is effectively:

```text
state.company.expansion.ship
```

There is currently **one** authoritative player ship, not a fleet collection.

### 3.2 Current ship state

The current ship instance owns mutable operational state including:

- status;
- current system / colony;
- destination and transit route;
- cargo;
- dedicated fuel stores;
- dedicated food stores;
- passengers;
- launch/arrival state;
- loss state.

This is the correct domain to evolve. A second independent purchased-ship state system must not be added.

### 3.3 Current ship specifications are global constants

The original ship currently uses game constants for:

- cargo capacity;
- fuel capacity;
- food capacity;
- passenger capacity;
- minimum passengers required to launch;
- transit speed;
- fuel consumption.

All current ship helper methods assume those constants describe the one player ship.

A purchased fleet requires these calculations to become **ship-instance/class aware**.

### 3.4 Existing ship API assumes an implicit single ship

Examples include concepts equivalent to:

- `ship(state)`;
- `loadCargo(state, ...)`;
- `loadFuel(state, ...)`;
- `loadFood(state, ...)`;
- `loadPassengers(state, ...)`;
- `setTarget(state, ...)`;
- `launch(state)`;
- `processDay(state)`.

There is no `shipId` because there has never been more than one player ship.

The fleet conversion should change authoritative mutations to identify the target ship explicitly rather than rely on global implicit selection.

### 3.5 Existing loss behaviour assumes the ship is irreplaceable

The current implementation makes loss of the player ship set company game-over state.

That made sense while the company had exactly one irreplaceable colony ship. Once multiple player-owned ships exist, the intended game-over rule must be explicitly re-decided.

### 3.6 Spaceport currently knows only one player ship

`js/domain/spaceport-model.js` currently checks `state.company.expansion.ship` and creates one `player-ship` berth occupant.

A fleet requires berth occupancy to enumerate all player ships currently docked at the active colony and eventually apply berth compatibility by class.

### 3.7 Cash ownership

Player money is currently `state.company.cash`.

There is no independent Wallet/Cash service. Existing domain services validate a transaction and then mutate `state.company.cash` inside the owning domain operation.

The ship purchase should follow the same domain rule: the UI must never deduct cash itself.

### 3.8 Current economic scale

Current game starting cash is `32,000`.

The cheapest current factory-new retail ship in the Universe catalogue is the Asterion **Dart Courier** at **CC 3,600,000**. Large late-game catalogue ships reach hundreds of millions of CC.

This is probably appropriate for a Stage 8 fleet-expansion feature, but the market needs an intentional unlock/visibility rule so it does not appear uselessly early.

---

## 4. MineIT-Universe Catalogue — Findings

### 4.1 Canonical ownership

`MineIT-Universe` owns:

- manufacturer identity;
- model/class identity;
- ship line;
- physical/base specifications;
- manufacturer list price;
- persistent canonical identity;
- canonical image metadata.

MineIT owns:

- player funds;
- purchase/order state;
- actual player-owned ship instances;
- current operational state;
- delivery/availability;
- game-specific balance rules;
- future quote modifiers.

MineIT must not manually recreate the 30-model catalogue in `js/data` or another authored game-side dataset.

### 4.2 Current Universe publication contract

At analysis time, `MineIT-Universe/data/manifest.json` publishes:

- `schemaVersion: 5`;
- `contentVersion: 0.5.0`;
- Year 5326 canonical content;
- manifest collection mappings for organisations, facilities, ship lines, ship classes, currencies and other shared-universe data.

The integration contract is stable IDs plus manifest-driven JSON.

### 4.3 Important manifest-loader issue found

The current manifest now supports collection entries that may be **arrays of JSON files**, not only one filename.

For example, `organisations` is currently an array containing the core and commercial organisation files.

The standalone `ship-catalogue-app.js` currently assumes every manifest collection value is a single filename:

```js
fetch(`./data/${manifest.collections[key]}`)
```

That assumption is no longer safe for a general MineIT consumer.

**Requirement:** the MineIT Universe loader must support both:

- a single manifest path string;
- an array of manifest path strings, loaded and flattened in manifest order.

This should be fixed in the reusable integration layer rather than copied from the standalone catalogue implementation.

### 4.4 Retail catalogue

The Year-5326 retail set contains exactly:

- 5 manufacturers;
- 10 ship lines;
- 30 `factory-new` purchasable ship classes.

The source-canonical Pathfinder and Prospector classes are present as reference classes but have `retailStatus: not-listed` and must not appear as purchasable factory-new models.

### 4.5 Manufacturer positioning

The market should explain these differences rather than presenting 30 undifferentiated rows:

**Asterion Shipworks** — versatile specialist/frontier vessels.  
**Kestrel Aerospace Systems** — speed, acceleration and rapid turnaround.  
**Keystone Modular Fabrication** — modular cargo and network logistics.  
**Longreach Engineering** — range, fuel efficiency and reliability.  
**Crownline Heavy Works** — enormous bulk capacity and strong capacity-per-credit, at lower speed.

### 4.6 Canonical class fields relevant to gameplay

Retail classes already expose:

- cargo capacity;
- separate fuel capacity;
- separate food capacity;
- colonist/passenger capacity;
- minimum crew;
- maximum crew;
- Vector Exchange capability;
- transit weeks per light-year;
- range class;
- speed rating;
- fuel-efficiency rating;
- reliability rating;
- atmospheric capability;
- berth class;
- special traits;
- CC manufacturer list price;
- image key/status/prompt.

### 4.7 Image readiness

The canonical catalogue specification currently describes factory-class images as `not-generated` until artwork is actually committed and approved in the Universe repository.

MineIT must honour canonical image state. It should never pretend a missing image exists.

The market UI therefore needs a clean fallback card/placeholder for any class whose canonical image is unavailable. When the canonical image status becomes usable, the same stable image key can be displayed without changing the game-side class data.

---

## 5. Existing Universe Integration Direction

The existing integration architecture already says MineIT should:

1. consume the published Universe manifest;
2. resolve canonical records by stable ID;
3. wrap external loading behind a small read-only catalogue/loader;
4. keep a known-good bundled/cached snapshot so gameplay is not permanently network-dependent;
5. reject incompatible schema versions deliberately;
6. persist stable Universe IDs plus game-owned mutable state rather than copies of whole canonical records.

Ship buying should be the first production consumer built to that pattern.

---

## 6. Proposed Architecture

### 6.1 Do not create a parallel fleet system

The recommended sequence is to **evolve `ExpansionService` from single-ship ownership to player-fleet ownership first**, then build purchasing on top of that canonical owner.

A separate `FleetService` should not be introduced merely as a wrapper around duplicated ship behaviour. If refactoring later proves `ExpansionService` has become too broad, responsibilities can be separated deliberately, but the first change should preserve one canonical ship/fleet mutation path.

### 6.2 Proposed expansion state evolution

Conceptually:

```text
state.company.expansion.ship
```

becomes:

```text
state.company.expansion.ships[]
state.company.expansion.activeShipId   // UI/navigation convenience, not ownership
```

Every ship receives a game-owned instance ID.

Purchased ships additionally carry a stable Universe `shipClassId`.

Suggested player-owned ship instance responsibilities:

```text
id                       MineIT per-save instance ID
shipClassId              stable Universe class ID, null only for a legacy starter ship until mapped
name                     player/game-owned vessel name
source                    starter | manufacturer-direct
purchase                  game-owned purchase metadata
status                    docked | travelling | arrived | home | orbital-holding | lost ...
systemId / colonyId       current location
route                     current mutable travel state
cargo                     mutable cargo
fuelLots                  mutable fuel
foodLots                  mutable food
crew                      mutable operational crew count if separate crew is approved
passengers                mutable colonist/passenger count
loss / arrival flags      mutable game state
```

Do **not** copy canonical manufacturer descriptions, class descriptions, ship-line descriptions, image prompts, or the complete class specification into the save.

Store stable IDs and game-owned mutable facts.

It is reasonable to retain purchase-time audit facts such as:

- paid price;
- currency ID;
- purchase day;
- Universe content version used for the purchase.

Those are historical game facts, not a replacement canonical catalogue.

### 6.3 Starter-ship migration

Existing saves must migrate `company.expansion.ship` into the new `ships[]` collection.

Until explicitly decided otherwise, the current starting colony ship should remain a **legacy starter specification** rather than being silently assigned to an unrelated retail Universe class.

The migration must preserve:

- location;
- cargo;
- food;
- fuel;
- passengers;
- transit state;
- arrival state;
- loss state;
- route timing;
- save/load behaviour.

After migration, the old singular `ship` production path should be removed rather than kept as a shadow compatibility implementation.

### 6.4 Ship-aware domain APIs

Mutation APIs should become ship-specific, conceptually:

```text
ship(state, shipId)
loadCargo(state, shipId, ...)
loadFuel(state, shipId, ...)
loadFood(state, shipId, ...)
loadPassengers(state, shipId, ...)
setTarget(state, shipId, systemId)
canLaunch(state, shipId)
launch(state, shipId)
```

`processDay()` must iterate every travelling player ship and be able to return multiple arrivals/losses/events on the same day.

This is more important than the shop UI: without it, purchased ships would exist only as decorative records and the game would still actually control one ship.

### 6.5 Class specification resolution

Purchased ship behaviour should resolve physical specifications from `shipClassId` through the read-only Universe catalogue.

Recommended rule:

```text
player ship instance = mutable MineIT state
ship class = immutable/read-only Universe reference data
```

The domain needs a synchronous indexed view once Universe data has been initialised. It should not perform random network fetches during cargo loading, launch checks or daily simulation.

For the legacy starter ship, `ExpansionService` can resolve the existing built-in starter specification until a canonical mapping is agreed.

### 6.6 Universe catalogue/loader

Add one reusable read-only integration component, not ship-specific scattered fetch calls.

Responsibilities:

- configurable canonical base URL;
- fetch `data/manifest.json`;
- validate supported schema version;
- understand string and array collection mappings;
- load/merge requested collections;
- index records by stable ID;
- expose synchronous lookup/query after initialisation;
- cache a compatible online snapshot;
- fall back to a bundled known-good snapshot when offline or when remote loading fails;
- expose content/schema version for diagnostics/save metadata;
- fail clearly if no compatible source is available.

The bundled fallback must be **generated/synchronised from MineIT-Universe**, not manually authored as a second catalogue.

A small sync/update script or documented asset-refresh process should make the provenance explicit.

### 6.7 Ship market domain service

A focused `ShipMarketService` is justified because purchase/quote rules are a different responsibility from travel/cargo simulation.

It should depend on:

- the read-only Universe catalogue;
- the existing/evolved `ExpansionService` fleet owner.

It should own game-specific purchase rules such as:

- retail availability filtering;
- current unlock requirements;
- affordability;
- purchase validation;
- game-owned delivery destination/state;
- purchase transaction;
- creation of a new player-owned ship instance through `ExpansionService`.

The UI must only request quotes/actions and render results.

### 6.8 Purchase transaction

Initial quote:

```text
purchasePrice = shipClass.pricing.manufacturerListPrice
currencyId = currency-commonwealth-credit
```

Validation should complete before mutation:

- class exists;
- `retailStatus === factory-new`;
- manufacturer and line resolve;
- price/currency are valid;
- feature is unlocked;
- model is currently permitted by game infrastructure rules;
- player has enough cash;
- delivery target is valid.

Only then should the transaction:

1. deduct player cash;
2. create the new ship through the canonical fleet owner;
3. store game-owned purchase metadata;
4. create any approved delivery/placement state;
5. surface a single success result to the UI.

A failed creation must not leave the player charged without a ship.

---

## 7. Important Gameplay Mismatches That Need Decisions

### 7.1 Crew versus passengers

Current MineIT tracks one `passengers` count and requires a minimum number of colonists aboard before launch.

Universe classes separately define:

- `minimumCrew`;
- `maximumCrew`;
- `colonistCapacity`.

These are not the same concept.

**Recommended direction:** introduce simple numeric `crew` and `passengers` counts per player ship. Both are drawn from colony population, but crew is operational staff and passengers are transported colonists. Food consumption uses total people aboard. Launch requires at least `minimumCrew`; passenger loading is limited by `colonistCapacity`; crew is limited by `maximumCrew`.

This preserves the meaning of the canonical catalogue and avoids redefining `minimumCrew` as a passenger rule.

This decision needs approval because it adds a small but real crew-management step to the ship preparation UI.

### 7.2 Transit speed

Current MineIT uses one global ship speed.

Universe classes expose an actual `transitWeeksPerLightYear` for Vector Exchange capable ships.

**Recommended direction:** use that canonical value directly for interstellar transit duration. `vectorExchangeCapable: false` ships cannot perform interstellar routes.

This gives the catalogue's speed differences immediate gameplay value.

### 7.3 Fuel consumption

Current MineIT uses one global fuel-per-light-year constant.

Universe currently exposes:

- fuel tank capacity;
- a 1–5 fuel-efficiency rating;
- range class;

but not an explicit absolute `fuelUsePerLightYear` value.

Because physical/base ship specification ownership belongs to the Universe repository, the cleanest option is to add an explicit canonical fuel-consumption field to the ship class schema rather than invent 30 independent physical fuel rates inside MineIT.

If the design intentionally wants fuel burn to be a game balance formula instead of canon, then MineIT can derive it from the canonical efficiency rating using one documented formula. That ownership choice must be made before implementation.

### 7.4 Atmospheric capability

A large part of the retail catalogue is `orbital only`.

Current MineIT player-ship cargo/passenger interaction is based on being `docked` at a colony Spaceport. There is not yet a full orbital freight transfer/shuttle layer.

Therefore we must not simply allow an orbital-only megafreighter to behave as if it landed on a surface pad.

**Recommended first-release choice:** show the complete 30-model market, but only make ships operationally purchasable when the player's current infrastructure supports their atmospheric/berth requirements. Unsupported models remain visible and explain what infrastructure is missing. This makes the catalogue aspirational without violating its physical specifications.

Alternative: implement orbital cargo/passenger transfer as part of this feature. That is substantially larger and should be an explicit scope decision.

### 7.5 Berth classes

Universe uses berth classes such as:

- small;
- medium;
- large;
- very-large;
- mega.

Current MineIT Spaceport only has a berth **count**, not berth-size capability.

`EngineeringShipAndSpaceport.md` deliberately deferred size rules until the player freight-ship feature. That time has now arrived.

A compatible berth-capability model should be added to the existing Spaceport owner if we want larger purchased ships to land/dock.

Exact level-to-berth-class progression requires a gameplay decision rather than an arbitrary implementation assumption.

### 7.6 Ship loss and game over

Current rule: loss of the sole player colony ship causes game over.

With a fleet, possible rules include:

- any player ship loss is still game over;
- only loss of the original colony ship is game over;
- ship loss is an economic/crew/cargo disaster but not game over while the company still has viable colonies/ships;
- game over only when no viable colony/fleet recovery path remains.

**Recommended fleet-era rule:** an individual purchased ship loss should not automatically end the company. The special original-ship rule can be retained if desired, but it should be explicit rather than accidentally inherited from the singular implementation.

### 7.7 Manufacturer yard geography versus current star map

Canonical manufacturer yards live in named Universe systems such as Aster Vale, Solace, Meridian, Damaris and Caldera.

The current MineIT expansion star map is procedurally generated and does not yet consume the canonical Universe star-system geography.

Therefore physically simulating a newly purchased ship flying from its exact canonical factory yard would require a larger world-map integration.

**Recommended first release:** keep the manufacturer/factory location as canonical catalogue/lore information, while MineIT owns a simplified delivery rule. Do not invent fake coordinates for canonical yards in the procedural map.

### 7.8 Currency presentation

The canonical ship market uses Commonwealth Credit (`CC`).

Existing MineIT Stage 8 documents and UI conventions have historically used `£` in places while the underlying game state is simply numeric `company.cash`.

Before the market ships, decide whether:

- the entire game currency is now formally CC and existing money presentation should migrate to CC; or
- ship purchasing is a separate CC-denominated market requiring conversion (not recommended for this initial feature because no exchange system exists).

**Recommended direction:** formally treat existing `company.cash` as CC and migrate presentation consistently, avoiding a second currency/accounting system.

---

## 8. Proposed Mobile-First UX

### 8.1 Entry point

Recommended entry point: the player-owned **Ships / Fleet** interface gets a clear **Ship Market** action.

This keeps acquisition next to the thing being acquired rather than burying it in general resource trading.

The final navigation placement should match the current mobile shell once the fleet UI is refactored.

### 8.2 Manufacturer screen

Each manufacturer should be a large touch-friendly card showing:

- manufacturer name;
- specialisation summary;
- product-line summary;
- approximate price/capacity positioning;
- flagship yard as flavour/context;
- View Models action.

The purpose of this screen is to make the five brands understandable before the player sees 30 models.

### 8.3 Models screen

Compact model cards should prioritise information that affects a purchase decision:

- image or canonical missing-image fallback;
- model name;
- role;
- CC price;
- cargo;
- fuel;
- food;
- passengers;
- minimum crew;
- transit speed / Vector Exchange capability;
- landing capability;
- berth class;
- speed / efficiency / reliability ratings.

Suggested filters/sorts for the first version:

- manufacturer;
- affordable only;
- Vector Exchange capable;
- atmospheric capability;
- berth class;
- role/capacity class;
- sort by price;
- sort by cargo;
- sort by transit speed;
- sort by efficiency.

Do not overbuild a desktop-style spreadsheet filter panel. Mobile interaction should remain fast and touch friendly.

### 8.4 Comparison

Recommended first version: compare **up to two ships** at once on mobile.

A full-screen comparison view can place model names/prices at the top and show aligned specification rows beneath them.

Difference highlighting should make trade-offs obvious:

- better cargo;
- lower price;
- faster transit;
- better efficiency;
- larger passenger capacity;
- lower crew requirement;
- better landing/berth compatibility.

### 8.5 Ship detail

The detail screen should explain the ship as a gameplay choice, not just dump fields.

Recommended sections:

- hero/image;
- manufacturer + line;
- role and description;
- price and affordability;
- primary capacities;
- crew/passengers;
- performance;
- landing/berth compatibility;
- special traits;
- current infrastructure compatibility;
- Buy action.

### 8.6 Buy confirmation

Before final purchase, show:

- exact model;
- manufacturer;
- list price;
- current balance;
- balance after purchase;
- delivery/location rule;
- any berth/landing warning;
- ship name, if naming at purchase is approved.

The confirmation should make it impossible to misunderstand the cash impact.

---

## 9. Recommended Initial Delivery Rule

This remains an open design decision, but the simplest coherent first implementation is:

- manufacturer-direct order;
- list price only;
- no freight surcharge;
- no shortage/production queue;
- no finance;
- no used-market state;
- one game-owned delivery destination selected from eligible player colonies;
- if a ship can physically use the target Spaceport and a berth is free, it becomes delivered/docked;
- if compatible but the port is temporarily full, reuse Orbital Holding;
- if the vessel fundamentally cannot use that colony's infrastructure, purchase/delivery should be blocked with an explanatory requirement rather than silently violating the ship specification.

Whether delivery is immediate or includes a fixed time delay still needs approval.

A later feature can replace the simple availability rule with factory production queues, freight charges, yard pickup, reputation modifiers and shortages without changing the canonical `shipClassId` identity.

---

## 10. Save / Persistence Rules

Save changes are substantial and require migration coverage.

Recommended rules:

- increment `EXPANSION_VERSION` for the fleet-state schema change;
- migrate one legacy `expansion.ship` into `expansion.ships[]` once;
- assign a deterministic/persisted MineIT instance ID during migration;
- retain all in-flight route state exactly;
- purchased ships save `shipClassId` plus mutable game state;
- record Universe schema/content version where useful for diagnostics/reproducibility;
- never save complete canonical class/organisation/line records;
- if a referenced class cannot be resolved from current/cached compatible Universe content, fail safely and preserve the save rather than deleting the ship.

The fallback snapshot makes a missing network connection a recoverable condition rather than a save-breaking condition.

---

## 11. Universe Compatibility / Caching Requirements

The loader should support this order:

1. load bundled known-good manifest/catalogue;
2. initialise an indexed synchronous catalogue from that known-good data;
3. optionally check the published Universe manifest online without blocking game startup;
4. if the remote schema is supported and content is newer, fetch/validate/cache the compatible collections;
5. switch to the validated cached version at a safe boundary;
6. retain the bundled fallback permanently.

Do not let a GitHub Pages outage prevent a saved game from loading.

Do not use module-scope blocking `await` that delays the entire game bootstrap.

External async loading must also follow the repository stale-write safety rule: a late catalogue response must not repaint a market/detail screen that the user has already closed or changed.

---

## 12. Proposed Implementation Order

### Phase A — Fleet foundation

- convert `ExpansionService` from singular ship to fleet collection;
- migrate existing saves;
- make ship operations explicit by `shipId`;
- update daily processing for multiple simultaneous ships;
- update star-map/player-ship UI selection;
- update Spaceport occupants for multiple player ships;
- settle fleet-era ship-loss/game-over behaviour;
- add focused domain/save/UI regression tests.

### Phase B — Universe consumer foundation

- add reusable manifest loader/catalogue;
- support string and array manifest collection entries;
- add schema compatibility checks;
- add bundled generated fallback;
- add cache/update behaviour;
- index manufacturers, lines, classes, facilities and currencies by stable ID;
- add diagnostics for source/content version;
- test online/fallback/incompatible-schema behaviour.

### Phase C — Per-class ship behaviour

- resolve class specifications by `shipClassId`;
- convert capacities from global constants to class-aware values;
- implement approved crew/passenger model;
- implement per-class transit duration;
- implement approved fuel-consumption rule;
- enforce Vector Exchange capability;
- integrate atmospheric/berth capability;
- preserve legacy starter ship behaviour.

### Phase D — Ship market domain

- add `ShipMarketService`;
- expose only `factory-new` retail classes;
- use canonical CC list price directly;
- validate affordability/unlock/infrastructure;
- perform atomic cash + fleet purchase;
- store purchase metadata;
- implement approved delivery rule;
- test insufficient funds, duplicate purchases, invalid IDs, delivery and save/load.

### Phase E — Mobile market UI

- Ship Market entry point;
- manufacturer browser;
- models list;
- filters/sorts;
- two-ship comparison;
- model detail;
- purchase confirmation;
- success/new-ship handoff to Fleet;
- touch/mobile/browser coverage.

### Phase F — Final integration

- full regression suite;
- multi-colony/multi-ship simulation coverage;
- offline Universe fallback test;
- version bump and visible header version sync;
- update this specification/recovery notes with implemented decisions and exact files changed.

---

## 13. Required Test Coverage

At minimum, implementation should cover:

### Fleet migration/domain

- legacy singular ship migrates once with all mutable state preserved;
- multiple ships can coexist at different colonies/systems;
- operations target the intended `shipId`;
- simultaneous ship transit is processed independently;
- multiple same-day arrivals/losses cannot overwrite one another;
- save/load preserves all ship instances and routes;
- approved fleet-era loss/game-over rule is protected by regression tests.

### Capacities and movement

- cargo/fuel/food capacity are resolved per ship class;
- fuel does not consume cargo capacity;
- transit food does not consume cargo capacity except explicit food carried as general cargo;
- crew/passenger limits follow the approved model;
- non-Vector ships cannot start interstellar travel;
- transit time uses canonical class performance;
- fuel burn uses the approved canonical/game formula.

### Spaceport

- every docked player ship consumes a berth;
- berth status counts multiple player ships plus Corporate/Engineering/Buyer ships;
- incompatible berth class is rejected or held according to the approved rule;
- temporary capacity shortage uses Orbital Holding rather than deleting/failing a ship.

### Universe integration

- manifest string collection loads;
- manifest array collection loads and flattens correctly;
- only `factory-new` classes are offered;
- reference `not-listed` classes are excluded;
- incompatible schema is rejected explicitly;
- compatible cached/bundled fallback works offline;
- stable-ID lookup returns the expected canonical record;
- missing canonical image state uses a safe placeholder.

### Purchase

- list price equals canonical manufacturer list price;
- insufficient cash cannot mutate fleet or cash;
- successful purchase deducts exactly once;
- successful purchase creates exactly one player-owned ship instance;
- purchase stores stable `shipClassId`, not a copied canonical record;
- delivery/placement follows the approved rule;
- save/load retains the purchase and mutable ship state.

### UI/mobile

- manufacturer → model → detail → buy flow works by touch/click;
- filters do not change domain truth;
- compare handles two models correctly;
- stale async catalogue responses cannot overwrite a changed/closed view;
- unaffordable/incompatible ships explain why Buy is disabled;
- purchase confirmation shows correct balance impact.

---

## 14. Decisions Needed Before Production Coding

### Decision 1 — When does Ship Market unlock?

Options include:

- automatically at the start of Stage 8;
- after first Spaceport upgrade;
- after a specific Industry/Corporate capability level;
- after the player reaches a cash/reputation milestone.

**Recommendation:** unlock at the point Stage 8 first introduces real fleet/logistics expansion, not based purely on current cash. Keep the market visible once unlocked even if most ships are unaffordable.

### Decision 2 — Delivery timing and destination

Should a purchase be:

- delivered immediately to a selected compatible player colony;
- delivered after a fixed manufacturer preparation/transit delay;
- collected from Corporate Home;
- physically collected from the canonical manufacturer yard later?

**Recommendation for first version:** selected compatible colony, with a simple game-owned delivery rule and no extra fee. Avoid manufacturer-yard travel until canonical star-system geography is integrated with the game map.

### Decision 3 — Separate crew from passengers?

**Recommendation:** yes. Add a simple numeric crew count separate from colonist/passenger cargo. Minimum crew becomes the launch requirement; passengers remain transported colonists.

### Decision 4 — What happens with orbital-only ships?

**Recommendation:** show all 30 ships, but do not let unsupported orbital-only/oversized ships masquerade as surface-landable ships. Either lock purchase/use until suitable infrastructure exists, or explicitly add orbital logistics to this feature.

### Decision 5 — What berth classes can each Spaceport level support?

This was intentionally deferred in the earlier Stage 8 Spaceport design and now needs a concrete progression.

### Decision 6 — What is the fleet-era ship-loss rule?

**Recommendation:** losing a purchased ship is a major economic/crew/cargo loss, not automatic company game over. Decide separately whether the original colony ship retains a special game-over rule.

### Decision 7 — Fuel consumption ownership

Should absolute ship fuel burn be:

- a new canonical Universe physical specification; or
- a MineIT balancing formula derived from the canonical fuel-efficiency rating?

**Recommendation:** add an explicit canonical `fuelUsePerLightYear` physical specification if the value is intended to be a real property of the class.

### Decision 8 — Is all MineIT money formally Commonwealth Credits?

**Recommendation:** yes. Treat existing numeric `company.cash` as CC and make money presentation consistent rather than introduce currency conversion in this feature.

### Decision 9 — Does the existing starter ship map to a canonical Universe class?

**Recommendation:** preserve it as the existing legacy starter specification for this feature unless a deliberate lore decision identifies its exact canonical class.

### Decision 10 — Ship naming

Should the player name a purchased ship during purchase, or should MineIT generate a default name and allow rename later?

**Recommendation:** generate a sensible default immediately and make naming/renaming optional, so a text-entry step never blocks a fast mobile purchase.

---

## 15. Suggested First Approved Scope

If the recommendations above are accepted, the clean first release would be:

- Stage 8 Ship Market unlock;
- all five manufacturers and all 30 factory-new models visible;
- manifest-driven canonical catalogue with bundled/cached fallback;
- two-model mobile comparison;
- exact canonical CC list price;
- real multi-ship player fleet in `ExpansionService`;
- stable `shipClassId` references;
- separate crew/passenger counts;
- canonical class cargo/fuel/food/passenger capacities;
- canonical interstellar transit time;
- approved fuel-burn model;
- landing/berth compatibility enforced;
- selected-colony manufacturer delivery with no added fee;
- purchased ship enters the normal player fleet and uses existing cargo/star-map/transit mechanics;
- no used market, finance, dynamic pricing or trade-ins.

This gives the player a meaningful new progression path without pre-building the later second-hand/finance/shipyard economy.

---

## 16. Architecture Rules for Implementation

When implementation begins:

1. `GameStore` remains the mutable root-state owner.
2. `ExpansionService` remains the canonical player ship/fleet mutation owner unless a deliberate refactor proves a cleaner single owner.
3. Do not create a second ship/fleet implementation for purchased vessels.
4. `MineIT-Universe` remains the only authored owner of manufacturer/model/line/base-spec/list-price content.
5. MineIT saves stable IDs and game-owned mutable facts, not copied canonical records.
6. The market UI performs no authoritative cash, price, delivery or ship-state mutation.
7. Existing Spaceport and Orbital Holding concepts are extended rather than duplicated.
8. No version-suffixed/replacement production modules.
9. Static/repeated market markup belongs in `views/`, not giant JS strings.
10. Async Universe loading must reject stale UI writes and must not block game startup unnecessarily.
11. Every fleet/save/domain behaviour change requires regression coverage.
12. The completed implementation must increment the package/header game version together.

---

## 17. Current Recommendation

Do **not** start with the Ship Market screen.

The first production implementation step should be the fleet-domain migration in `ExpansionService` and `spaceport-model.js` with save/regression coverage. Once two player-owned ship instances can genuinely coexist and use the current star-map/cargo/transit mechanics, the Universe catalogue and purchasing UI can be added on a stable foundation.

That sequence avoids building an attractive catalogue which can only create records that the rest of the game cannot actually operate.
