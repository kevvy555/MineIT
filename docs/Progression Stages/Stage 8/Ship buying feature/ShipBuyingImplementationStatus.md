# Stage 8 — Ship Buying Implementation Status

Status: **Implemented on `feature/ship-buying`; unit/regression and browser CI green before final version/documentation bump**  
Date: **2026-08-31**  
Target completed game version: **5.13.11**  
Approved proof mock: `ShipBuyingMock.html` (V14 direction)

> This file supersedes the older `production implementation not started` / `working specification` status banners in `ShipBuyingFeatureSpec.md`, `ShipBuyingUiSpecification.md`, and `ShipOperationalUseSpecification.md`. Those documents remain the design specifications; this document records the implemented state and recovery information.

## 1. Implemented User Journey

The Stage 8 factory-new fleet flow is implemented as:

**Fleet Procurement → Manufacturer → Models → Dossier / Compare → Delivery Colony → Signed Purchase Contract → Production Queue → Delivery → Player Fleet → Load / Crew / Route / Launch / Reroute / Dock or Orbital Hold**

The market is available from day 1. All factory-new retail catalogue classes remain visible; current interstellar gameplay restricts purchase execution to Vector Exchange capable classes until local-system-only ship operation exists.

## 2. Canonical Ownership

Production ownership is intentionally split by responsibility:

- `js/domain/expansion-service.js` — canonical mutable player fleet operation, travel, cargo/fuel/food, crew/passengers, rerouting, arrival, orbital holding, docking and loss.
- `js/domain/ship-market-service.js` — MineIT-specific quote, charter discount, cash validation/deduction, order lifecycle, cancellation, delivery and commissioning.
- `js/data/universe-ship-catalogue.js` — read-only Universe catalogue consumer with schema validation and bundled fallback.
- `js/data/universe-ship-catalogue-fallback.js` — known-good schema-v6 fallback generated from the canonical Universe procurement branch; not an independently authored gameplay catalogue.
- `js/domain/spaceport-model.js` — berth capacity/occupancy for player, corporate, engineering and buyer vessels.
- `js/domain/simulation-engine.js` — authoritative daily progression hook for procurement orders and fleet travel.
- `js/ui/ship-preparation-ui.js` — active fleet/procurement presentation controller. It renders and dispatches only; domain services own gameplay/economy truth.
- `views/ship-market*.html`, `views/ship-purchase-contract.html`, `views/player-fleet-spaceport.html` — external reusable markup.

No parallel player-ship or procurement gameplay owner was introduced.

## 3. Persisted State

Fleet state is now conceptually:

```text
state.company.expansion.ships[]
state.company.expansion.activeShipId
```

The old singular ship is retained only as a non-enumerable compatibility accessor and is not duplicate save truth.

Procurement state is:

```text
state.company.shipProcurement.orders[]
state.company.shipProcurement.nextOrderSequence
state.company.shipProcurement.lastProcessedAbsoluteDay
```

Save state version is **13**.

## 4. Canonical Universe Dependency

Canonical procurement data is authored in:

- repository: `kevvy555/MineIT-Universe`
- branch: `feature/ship-procurement-catalogue`
- implementation commit: `90710802630354b2e05e68ed4921b01b0d80000e`
- schema version: **6**
- content version: **0.6.0**

That branch provides:

- the canonical Asterion `Pioneer Colony Transport` starter class;
- factory-new retail ship classes;
- manufacturer list prices;
- factory lead times;
- absolute `fuelUsePerLightYear` values;
- canonical ship image metadata;
- runtime profiles required by MineIT.

MineIT attempts a non-blocking remote refresh from the published Universe manifest and supports manifest collection entries that are either a string or an array of shard paths. If compatible schema-v6 data is unavailable, MineIT continues with the bundled known-good snapshot derived from the Universe branch above.

## 5. Procurement Rules Implemented

- Manufacturer list price remains canonical Universe data.
- MineIT applies the initial **35% Koplin Deep Reach charter framework discount**.
- Currency presentation uses lowercase `cc`.
- A living owned delivery colony is required.
- The authoritative quote is recalculated immediately before order placement.
- Cash deduction and order creation are owned by `ShipMarketService`.
- The purchase contract requires a drawn signature before order execution; the signature image itself is intentionally not persisted in this release.
- Normal canonical factory lead time drives order progress.
- Cancellation is currently allowed before the production lock, with a **5% administration fee**.
- Production lock currently occurs at **25% of the normal lead period**.
- Delivered ships are player-company assets.
- Delivered ships arrive with empty player-usable cargo, fuel and food stores and no assigned player crew/passengers.
- A free destination berth commissions the ship directly as `docked`.
- A full destination Spaceport commissions the ship into `orbiting` with the selected target colony retained.

## 6. Fleet Operation Implemented

- Multiple player ship instances are supported.
- Spaceport lists docked player vessels and ships holding in orbit for the active colony.
- Selecting a vessel updates `activeShipId` and reuses the existing ship preparation/navigation surfaces.
- Cargo, fuel, food, crew and passenger operations are ship-ID aware.
- Capacity comes from each ship class rather than starter-ship constants.
- Crew and colonist passengers are separate numeric populations.
- Launch requires class-specific minimum crew plus sufficient route fuel and food.
- Transit speed and fuel burn are class-specific.
- A travelling ship can be rerouted from its interpolated current position if remaining onboard fuel and food can support the replacement route.
- Fuel/food already consumed before a reroute is not refunded.
- Owned-colony routes may retain a target colony for arrival resolution.
- A full Spaceport causes orbital holding rather than failed/lost arrival.
- Orbital holding consumes **no interstellar fuel or transit food** in this first fleet release.
- Orbiting ships automatically dock when a berth becomes available.
- Orbiting/travelling ships remain selectable from fleet/star-map workflows and can be redirected subject to route validation.
- Losing an individual ship no longer automatically ends the corporation.

## 7. UI Implemented

The production Fleet Procurement UI follows the approved V14 direction:

- Deep Reach corporate procurement shell;
- horizontally scrolling manufacturer cards;
- custom Role popup rather than browser-native `<select>` styling;
- horizontal model strip;
- same-screen selected-vessel dossier;
- `+ Compare` immediately above the hero image on the right;
- compact one-line `LIST | RATE | PRICE | LEAD | STATUS` procurement row;
- custom delivery-colony picker showing free Spaceport berths;
- bottom `COMPARE | REVIEW PURCHASE CONTRACT | ORDERS` actions in 25% / 50% / 25% proportions;
- dedicated full-page side-by-side comparison;
- dedicated full-page production/delivery queue;
- single white purchase-contract document with drawable signature.

The main market remains mobile-first and targets a single phone screen wherever the available viewport permits.

## 8. Verification

The implementation is covered by the existing full suite plus new/strengthened fleet/procurement regressions including:

- `tests/ship-fleet-foundation.test.js`
- `tests/ship-market.test.js`
- `tests/ship-procurement-ui.test.js`
- `tests/ship-expansion.test.js`
- save/load migration and round-trip tests
- architecture, CSS ownership and controller-mutation guards
- browser startup and presentation interaction probes

Green implementation checkpoint before the final documentation/version commit:

- MineIT commit: `5047a514d9245940436b1f077db41834b9949d2d`
- GitHub Actions run: `33425943717`
- unit/regression/domain coverage: **passed**
- browser startup/presentation interaction tests: **passed**

The final `5.13.11` documentation/version commit must also pass the same workflow before this feature is considered complete.

## 9. Deliberately Deferred

The first release does **not** implement:

- used ships, auctions, damaged ships or trade-ins;
- loans/finance/insurance;
- independent/direct-manufacturer pricing after charter exit;
- dynamic shortages or market bidding;
- player ship construction;
- berth-size enforcement;
- orbital-only docking restrictions;
- orbital life-support/fuel fees;
- detailed local-system propulsion for non-VE ships;
- refuelling/reloading while orbiting;
- maintenance/condition/repair yards;
- crew professions/officers;
- autonomous trade routes or fleet automation;
- manual docking priority management.

## 10. Recovery / Continuation Notes

If this work is resumed later:

1. Continue from `feature/ship-buying`; do not recreate the fleet/procurement systems.
2. Read root `AGENTS.md` before changes.
3. Treat `ExpansionService`, `ShipMarketService`, `UniverseShipCatalogue`, `SpaceportModel` and `SimulationEngine` as the canonical owners listed above.
4. Do not reintroduce starter-only capacity constants into fleet-aware UI.
5. Do not make UI mutate company cash, procurement orders or fleet state directly.
6. Do not hand-edit the bundled 30-class catalogue independently of Universe. Refresh it from canonical Universe data when schema/content changes.
7. The Universe procurement branch is still a separate dependency until merged/published; the bundled fallback intentionally keeps MineIT operational meanwhile.
8. Preserve the no-resource-burn orbital-hold rule until a later orbital-logistics design explicitly replaces it.
9. Preserve ship loss as a fleet-asset loss rather than automatic game-over; any future company-collapse rule must evaluate genuine recovery paths.
10. Run the complete GitHub Actions workflow, including browser probes, before calling further changes complete.
