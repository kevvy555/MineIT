# Stage 8 — Ship Buying Feature

Status: **Working specification — architecture and gameplay decisions approved; production implementation not started**  
Date: **2026-08-31**  
Game repository: `kevvy555/MineIT`  
Canonical universe repository: `kevvy555/MineIT-Universe`

## 1. Purpose

Add a factory-new ship procurement system to MineIT Mobile so the player can expand from the original colony ship into a real fleet before reaching the much later ship-construction capability.

The player journey is:

**Conglomerate Procurement → Fleet Acquisition → Manufacturer → Models → Ship Detail / Comparison → Select Delivery Colony → Place Order → Production / Delivery Queue → Fleet**

The market is visible from **day 1**. The player is not required to have direct relationships with the ship manufacturers because Koplin Deep Reach Corporation acts as the procurement channel while the player operates under the Deep Reach charter.

The first release covers **factory-new ships only**.

Out of scope for this release:

- used ships;
- auctions;
- damaged ships;
- finance / loans;
- trade-ins;
- dynamic market prices;
- player-negotiated manufacturer discounts;
- shortages and bidding wars;
- insurance;
- direct ship construction by the player;
- berth-size enforcement;
- orbital-only docking restrictions.

---

## 2. Ownership and Procurement Model

### 2.1 Player company owns purchased ships

Purchased ships are assets of the player's operating company.

Koplin Deep Reach does **not** retain legal ownership of a ship that the player has paid to acquire. This avoids a later independence transition in which the player could lose a fleet they funded.

While the player is under the Deep Reach charter, Koplin Deep Reach brokers the purchase using its large-scale corporate procurement agreements and established manufacturer relationships.

The resulting fiction is:

**Manufacturer → Deep Reach corporate procurement framework → player operating company**

The player receives full operational control and owns the resulting ship instance.

### 2.2 Deep Reach procurement discount

The canonical Universe catalogue owns the **manufacturer list price**.

MineIT owns the player's actual transaction price.

While the player is operating under the Deep Reach charter, the procurement UI must visibly show that Koplin Deep Reach receives a substantial negotiated fleet discount and passes that charter purchasing rate to the player's operation.

Initial calculation:

```text
Manufacturer List Price = canonical Universe price
Deep Reach Charter Discount = game-owned percentage
Player Purchase Price = List Price - Charter Discount
```

A **35% charter fleet discount** is the initial design value for the mock/spec and should be treated as a balance constant rather than canonical Universe data.

Example:

```text
Manufacturer list price      cc 10,000,000
Deep Reach charter discount  -cc 3,500,000 (35%)
Your charter price           cc 6,500,000
```

When the player later becomes independent and buys directly, the corporate procurement discount disappears unless a future direct relationship or reputation system earns another discount.

This creates a meaningful but understandable charter benefit without modifying the permanent canonical list price.

### 2.3 Future independence consequence

Ships already purchased remain owned by the player's company after independence.

Future independent purchases may use:

- full manufacturer list price;
- direct-manufacturer relationship discounts;
- finance;
- used markets;
- brokerage;
- other later commercial systems.

Those systems are out of scope here but the initial design must not prevent them.

---

## 3. Existing Architecture This Feature Must Extend

### 3.1 Canonical player ship owner

The current authoritative player ship implementation is `js/domain/expansion-service.js`.

`GameStore` owns the mutable root state and `ExpansionService` owns the current player ship gameplay rules and mutation.

Current state is effectively:

```text
state.company.expansion.ship
```

There is currently one authoritative player ship, not a fleet.

The new feature must **evolve this owner** rather than create a second ship system.

### 3.2 Existing ship state already models

- location;
- cargo;
- dedicated fuel stores;
- dedicated food stores;
- passengers;
- destination;
- interstellar transit;
- star-map interaction;
- launch rules;
- arrival;
- docking;
- ship loss.

These behaviours remain canonical and must become ship-instance-aware.

### 3.3 Existing specifications are one-ship constants

The current original ship uses global constants for cargo, fuel, food, passengers, speed and fuel burn.

Those calculations must resolve from the selected ship's canonical class instead.

### 3.4 Existing Spaceport model

`EngineeringShipAndSpaceport.md` already establishes the Spaceport as the common arrival/departure point for player, corporate, engineering and third-party vessels.

For this release:

- every landed player ship consumes one berth slot;
- **any player ship can use any free berth**, regardless of its canonical berth class;
- canonical berth class remains visible/reference data;
- canonical atmospheric/orbital capability remains visible/reference data;
- berth-size compatibility and orbital-only handling are deliberately deferred.

This means the existing Spaceport berth count matters, but berth **type** does not yet.

---

## 4. Fleet State Evolution

### 4.1 Required state direction

Conceptually:

```text
state.company.expansion.ship
```

becomes:

```text
state.company.expansion.ships[]
state.company.expansion.activeShipId
```

`activeShipId` is selection/navigation state, not a second source of truth.

Every player ship gets a MineIT per-save instance ID.

Every canonical ship gets a stable Universe `shipClassId`.

### 4.2 Suggested ship instance data

A player ship instance should own only mutable per-save state and historical transaction facts:

```text
id
shipClassId
name
source
status
systemId
colonyId
targetSystemId
route state
cargo
fuelLots
foodLots
crew
passengers
purchase metadata
arrival / loss flags
```

Do not persist copied manufacturer biographies, ship-line descriptions, full class specifications or image prompts in the save.

### 4.3 Original starter ship

The original MineIT colony ship must no longer remain a permanent game-only anonymous special case.

As part of this development, add a canonical starter ship class to `MineIT-Universe` with:

- stable ship-class ID;
- manufacturer;
- ship line;
- canonical name/model;
- description and role;
- cargo capacity;
- fuel capacity;
- food capacity;
- colonist capacity;
- minimum/maximum crew;
- speed/transit characteristics;
- fuel-use specification;
- atmospheric capability;
- berth class;
- canonical image metadata;
- appropriate retail/procurement status.

The exact manufacturer and model lore should be authored in the Universe repo rather than silently mapped to an unrelated existing class. Asterion is a plausible fit because its canonical specialisation includes frontier and adaptable vessels, but this remains an authoring decision to make when the Universe record is created.

Existing saves migrate their current ship into `ships[]` and point it at the new canonical starter class while preserving all mutable operational state.

The old singular production path must then be removed rather than retained as a compatibility shadow.

### 4.4 Ship-specific domain operations

Ship mutations must explicitly identify the ship being acted upon, conceptually:

```text
ship(state, shipId)
loadCargo(state, shipId, ...)
loadFuel(state, shipId, ...)
loadFood(state, shipId, ...)
assignCrew(state, shipId, ...)
loadPassengers(state, shipId, ...)
setTarget(state, shipId, systemId)
canLaunch(state, shipId)
launch(state, shipId)
```

`processDay()` must process all travelling ships and support multiple arrivals/losses on the same day.

---

## 5. Crew and Passenger Model

Crew and transported colonists are now separate concepts.

Canonical ship classes expose:

- `minimumCrew`;
- `maximumCrew`;
- `colonistCapacity`.

MineIT should therefore store per ship:

```text
crew
passengers
```

Rules:

- crew are drawn from colony population;
- passengers are also drawn from colony population but represent transported colonists;
- launch requires at least the class `minimumCrew`;
- crew cannot exceed `maximumCrew`;
- passengers cannot exceed `colonistCapacity`;
- transit food demand is based on **crew + passengers**;
- crew return to population when unloaded/reassigned under future crew-management rules;
- the existing minimum-passenger launch rule is replaced by minimum crew.

The first implementation can keep crew as a numeric count rather than individual named specialists.

---

## 6. Canonical Universe Ship Data

`MineIT-Universe` continues to own:

- manufacturer identity;
- ship line;
- class/model identity;
- base physical specification;
- manufacturer list price;
- canonical image identity;
- stable IDs.

MineIT owns:

- charter discount;
- player cash;
- affordability;
- actual purchase transaction;
- destination colony;
- order date;
- delivery state;
- purchased ship instance;
- future reputation/finance/used-market logic.

MineIT must not maintain a second hand-authored copy of the 30-model catalogue.

### 6.1 Current retail market

The current Year-5326 Universe catalogue contains:

- 5 manufacturers;
- 10 ship lines;
- 30 factory-new retail classes.

Retail manufacturer identities are:

- Asterion Shipworks — versatile specialist/frontier craft;
- Kestrel Aerospace Systems — speed and rapid turnaround;
- Keystone Modular Fabrication — modular cargo/logistics;
- Longreach Engineering — range, efficiency and reliability;
- Crownline Heavy Works — extreme bulk capacity and low capacity cost.

The source-canonical Pathfinder and Prospector reference classes are not currently retail listings and should not appear in the factory-new market unless their canonical retail status changes.

---

## 7. New Canonical Fields Required

### 7.1 Factory production lead time

Manufacturers do not hold finished ships in stock for this gameplay model. Ordering starts production/allocation and the player waits for completion and delivery.

Each retail class therefore needs a canonical factory lead-time field in `MineIT-Universe`.

Recommended representation:

```json
"production": {
  "factoryLeadTimeDays": 180
}
```

This value represents normal Year-5326 manufacturer production/allocation lead time, not player-specific market congestion.

Rough target progression:

- smallest craft: several months;
- small/medium ships: months to around a year;
- large/very-large ships: around one to several years;
- largest strategic/mega ships: multiple years.

Exact values should be authored across the catalogue during implementation so larger/more complex ships generally take longer.

MineIT may later add temporary shortages, rush production or reputation modifiers, but the class's normal factory lead time remains canonical.

### 7.2 Fuel consumption

Canonical classes need an absolute fuel-use figure so the game can simulate travel without reverse-engineering consumption from a 1–5 rating.

Recommended canonical field:

```json
"specifications": {
  "fuelUsePerLightYear": 260
}
```

MineIT then treats fuel consumption proportionally by actual route distance:

```text
fuelRequired = distanceLy × fuelUsePerLightYear
```

This naturally supports journeys shorter than one light year because the value is continuous/granular rather than rounded to whole light years.

The 1–5 fuel-efficiency rating remains useful presentation data; absolute burn is the simulation value.

### 7.3 Transit speed

For Vector Exchange capable ships, use canonical `transitWeeksPerLightYear` directly for interstellar transit timing.

For a route:

```text
travelWeeks = distanceLy × transitWeeksPerLightYear
```

Shorter routes therefore scale proportionally as well.

In-system movement can later have its own model if needed; this feature does not need to invent a second detailed propulsion simulation.

---

## 8. Universe Integration Layer

Ship buying should become the first production consumer of the existing MineIT Universe integration design.

The game should add one reusable read-only Universe loader/catalogue that:

- loads `data/manifest.json`;
- validates supported `schemaVersion`;
- understands both single-string and array manifest collection entries;
- loads and flattens requested collections in manifest order;
- indexes records by stable ID;
- exposes synchronous lookups after initialisation;
- records `schemaVersion` and `contentVersion`;
- caches a compatible online snapshot;
- falls back to a bundled known-good snapshot when necessary;
- never scatters direct Universe fetch calls throughout UI/domain code.

The bundled fallback must be generated/synchronised from `MineIT-Universe`, not independently authored.

---

## 9. Ship Market Domain Service

A focused `ShipMarketService` is appropriate because commercial purchase/order rules differ from ship operation/travel rules.

It should depend on:

- the read-only Universe catalogue;
- the evolved `ExpansionService` fleet owner.

Responsibilities:

- expose factory-new catalogue views;
- resolve manufacturer and line data;
- calculate list price;
- calculate charter discount;
- calculate final player price;
- expose factory lead time;
- validate affordability;
- validate selected delivery colony;
- place order;
- deduct cash atomically with order creation;
- create/update delivery state;
- create the actual ship instance through `ExpansionService` when delivery completes.

The UI must not directly mutate cash, order state or fleet state.

---

## 10. Purchase Quote and Transaction

Initial charter quote:

```text
listPrice = shipClass.pricing.manufacturerListPrice
charterDiscountRate = 0.35
charterDiscount = listPrice × charterDiscountRate
purchasePrice = listPrice - charterDiscount
currency = cc
```

The UI must show all three monetary figures rather than showing only the discounted price.

This is important to communicate the real value of the Deep Reach corporate relationship.

The order cannot be placed until the player selects an owned delivery colony.

Validation must include:

- class exists;
- class is factory-new retail;
- manufacturer and ship line resolve;
- canonical price is valid;
- canonical lead time is valid;
- chosen delivery colony exists and is operational;
- player has sufficient `company.cash`;
- no incompatible schema/data condition exists.

For this release, berth class and orbital-only capability do **not** block purchase or delivery.

The transaction should atomically:

1. calculate a fresh authoritative quote;
2. validate cash and target colony;
3. deduct the discounted purchase price;
4. create the order with canonical class ID and immutable purchase audit data;
5. calculate expected completion/delivery day from class lead time;
6. return success to the UI.

If order creation fails, cash must not remain deducted.

---

## 11. Order and Delivery Lifecycle

Initial lifecycle:

**AVAILABLE → ORDERED → IN PRODUCTION → DELIVERY TRANSIT → ARRIVED / COMMISSIONED INTO FLEET**

For the first implementation we do not know/track real manufacturer shipyard coordinates, so delivery does not physically travel across the procedural MineIT star map.

The ship instead has a time-until-arrival based primarily on canonical factory lead time.

The order stores:

```text
orderId
shipClassId
manufacturerOrganisationId
deliveryColonyId
orderAbsoluteDay
factoryLeadTimeDays
expectedArrivalAbsoluteDay
listPrice
charterDiscountRate
charterDiscountAmount
paidPrice
currencyId
status
universeContentVersion
```

The delivery queue must survive save/load.

When the due day arrives:

- a player ship instance is created through the canonical fleet domain;
- it is assigned an automatically generated unique vessel name;
- it appears at the selected colony;
- it consumes one Spaceport berth under current simple berth rules;
- if the physical berth is occupied and later Orbital Holding is reused for player deliveries, it may wait; exact arrival-slot behaviour can be finalised during implementation without adding berth-class restrictions.

Player rename is allowed after acquisition; forced naming during checkout is not required.

---

## 12. Currency Presentation

The game should migrate presentation away from `£` and use Commonwealth Credits consistently.

Initial textual notation:

```text
cc 3.6m
cc 18,250
```

`cc` is deliberately lowercase for the current UI language.

The underlying canonical currency ID remains:

```text
currency-commonwealth-credit
```

A bespoke visual credit icon can be introduced later, but logic/data should remain readable without a special font glyph.

Existing money-format helpers and buyer/corporate UI using `£` will eventually need to be updated as part of the wider currency presentation pass.

---

## 13. Market Visibility and Affordability

The market is available from day 1.

All factory-new retail ships remain visible regardless of affordability.

Unaffordable ships should:

- show full manufacturer list price;
- show Deep Reach discount;
- show final charter price;
- show lead time;
- show full specifications;
- clearly state `INSUFFICIENT FUNDS` rather than hiding the model.

This makes the market aspirational and teaches the player what future fleet progression looks like.

---

## 14. Delivery Colony Selection

The player must explicitly choose an owned colony for every order.

The order flow therefore contains a required:

**Delivery Assignment → Colony** selector.

The target cannot silently default to whichever colony happens to be active at the moment the final button is pressed.

The UI may preselect the active colony for convenience, but the chosen value must remain visible in the confirmation summary.

Future systems may add delivery eligibility constraints, but the first release only requires that the target is an owned operational colony.

---

## 15. Game Over Rule Revision

Loss of one ship must no longer automatically end the game.

The existing `company.gameOver` coupling to loss of the sole colony ship must be redesigned during the fleet conversion.

New principle:

**A ship loss is a severe operational/economic loss, not automatically company game over while the player still has a credible recovery path.**

A recovery path can include:

- another existing player ship;
- enough cash and access to order a replacement ship;
- another colony/operational base capable of continuing the company.

The final total-collapse rules should be reviewed as a dedicated part of the fleet implementation because the old assumption of one irreplaceable colony ship is no longer valid.

---

## 16. UI Direction

This feature is the first major **Conglomerate Procurement** interface and should establish a reusable visual/interaction language for future corporate purchasing systems.

It must not be a plain table of ships.

The intended experience is a premium industrial/corporate procurement terminal operated through Koplin Deep Reach.

Primary flow:

**Fleet Acquisition → Manufacturer Gallery → Model Gallery → Ship Profile → Compare → Procurement Quote → Delivery Colony → Place Order → Order Queue**

The UI must visibly communicate:

- Deep Reach is the procurement channel;
- the manufacturer is still the canonical builder;
- Deep Reach has negotiated privileged pricing;
- the player owns the acquired vessel;
- production takes significant time;
- larger ships can take years;
- all models are browsable from day 1.

Detailed UI rules live in `ShipBuyingUiSpecification.md`.

Shared corporate visual language lives in `ConglomerateProcurementUiLanguage.md`.

The proof-of-concept interaction lives in `ShipBuyingMock.html`.

---

## 17. Initial Implementation Sequence

Recommended implementation order:

### Phase A — Universe catalogue additions

1. author the canonical starter colony ship class;
2. add canonical factory lead times to factory-new ship classes;
3. add canonical absolute fuel use per light year;
4. validate catalogue and manifest;
5. keep manufacturer list prices canonical and unchanged by Deep Reach discount.

### Phase B — Reusable Universe integration

1. implement manifest loader;
2. support string/array collection mappings;
3. add schema-version validation;
4. add indexed read-only catalogue;
5. add bundled/cached known-good fallback;
6. add tests for online/fallback/version cases.

### Phase C — Fleet foundation

1. migrate singular ship to `ships[]`;
2. migrate starter ship to canonical class ID;
3. separate crew from passengers;
4. make capacities/specs class-aware;
5. make travel speed/fuel class-aware;
6. make daily processing multi-ship aware;
7. make Spaceport enumerate all docked player ships;
8. revise ship-loss/game-over behaviour;
9. add save/load migration/regression coverage.

### Phase D — Ship market domain

1. implement `ShipMarketService`;
2. calculate Deep Reach discount;
3. validate selected delivery colony;
4. create persistent orders;
5. process lead-time countdown;
6. instantiate delivered ships through `ExpansionService`;
7. add transaction/order/save tests.

### Phase E — UI

1. implement shared conglomerate procurement shell;
2. manufacturer gallery;
3. model gallery and filters;
4. full ship profile;
5. 2–3 ship comparison;
6. list price / discount / charter price presentation;
7. colony delivery selection;
8. production/delivery queue;
9. mobile browser interaction coverage.

---

## 18. Testing Requirements

At minimum implementation must cover:

- old single-ship save migration;
- starter ship canonical mapping;
- multiple simultaneous ships;
- ship-specific cargo/fuel/food capacities;
- minimum/max crew rules;
- passenger capacity rules;
- travel duration from class values;
- fractional-distance fuel consumption;
- multiple ships processed on one day;
- one ship loss not automatically ending a recoverable company;
- Universe string/array manifest collections;
- compatible cache fallback;
- incompatible schema rejection;
- retail filtering;
- 35% charter discount calculation;
- insufficient funds;
- delivery colony required;
- lead-time persistence;
- delivery after save/load;
- delivered ship routed through canonical fleet creation;
- all player ships consuming Spaceport slots without berth-class enforcement;
- mobile manufacturer/model/detail/compare/order interactions.

---

## 19. Locked Decisions

1. Ship market is visible from day 1.
2. While under charter, purchases are brokered through Koplin Deep Reach.
3. Purchased ships are owned by the player's operating company.
4. Deep Reach's negotiated discount is visibly shown; initial design value is 35%.
5. Independent future purchases do not automatically receive the charter discount.
6. All 30 factory-new ships remain visible even when unaffordable.
7. Manufacturers do not keep finished stock for this model; ships have substantial class-specific factory lead times.
8. Larger ships generally take longer, up to multiple years for the largest vessels.
9. Player must choose the delivery colony.
10. Crew and passengers are separate.
11. Transit speed uses canonical class values.
12. Absolute fuel burn is stored canonically per light year and scales proportionally for shorter distances.
13. For now every player ship can use any free Spaceport berth.
14. Berth-size and orbital-only restrictions remain deferred.
15. Losing one ship is not automatically game over.
16. Overall game-over/recovery criteria must be revised for replaceable fleets.
17. Commonwealth Credits are displayed as lowercase `cc` for now.
18. The original starter colony ship becomes a proper canonical Universe class with manufacturer/line/specification/image metadata.
19. Purchased vessels receive an automatic unique name and can be renamed later.
20. This feature establishes the shared Conglomerate Procurement UI pattern for future corporate purchasing systems.
